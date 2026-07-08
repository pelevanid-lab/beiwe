import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, FunctionDeclaration } from '@google/generative-ai';
import { recallContext } from '@/lib/saule-core-client';
import { CLARITY_ACTIONS } from '@/lib/clarity-actions/registry';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { query, context, pendingAction, localTime, timeZone, userId, activeWorkspace } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set.");
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    // Map Action Registry to Gemini Tools dynamically
    const dynamicTools: FunctionDeclaration[] = Object.values(CLARITY_ACTIONS).map(action => ({
      name: action.name,
      description: action.description,
      parameters: action.parameters
    }));

    // Define the recall_saule_memory tool (System tool)
    const recallSauleMemoryTool: FunctionDeclaration = {
      name: 'recall_saule_memory',
      description: 'Search the user\'s past notes, memories, and system context in Saule Core for a specific topic. Use this to remember things the user told you before if they are not in the current context.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          searchQuery: {
            type: SchemaType.STRING,
            description: 'The search term to look for in the user\'s memory.',
          }
        },
        required: ['searchQuery']
      }
    };

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      tools: [
        { functionDeclarations: [...dynamicTools, recallSauleMemoryTool] }
      ],
      systemInstruction: `Sen Beiwe isimli, kullanıcının çalışma alanında (CRM, randevular, notlar) çalışan zeki bir 'Kişisel Asistan' ve 'Clarity Engine'sin.
Bugünün Tarihi ve Saati: ${localTime || new Date().toLocaleString('tr-TR')}
Zaman Dilimi: ${timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone}

Kullanıcının Sistemindeki Mevcut Bağlam (Veritabanı / Saule Hafızası):
${context || 'Bağlam boş.'}

${pendingAction ? `Bekleyen Eylem: ${JSON.stringify(pendingAction)}\nEğer kullanıcı bu eylemi onaylıyorsa (örn: 'evet', 'yap'), işlemi onaylanmış kabul et ve kullanıcıya işlemin yapıldığını söyle.` : ''}

KURALLAR:
1. Kullanıcı yeni bir randevu, görev, müşteri eklemek veya güncellemek istiyorsa sana sağlanan DİNAMİK ARAÇLARDAN (Tools) en uygun olanını KESİNLİKLE çağır. Doğrudan cevap verme, aracı kullan.
2. Saat hesaplamalarını yerel zamana göre yap (sonuna Z ekleme).
3. Çakışma kontrolünü mevcut bağlamdan yap. Eğer kullanıcının sorduğu bir bilgi (örn: "ahmetin numarası neydi?") mevcut bağlamda yoksa, KESİNLİKLE 'recall_saule_memory' aracını (tool) çağırarak geçmiş hafızaları ara.
4. Kullanıcı bekleyen bir işlemi açıkça onaylıyorsa (örn: 'tamam', 'onaylıyorum'), sadece işlemi yapacağını söyle.
5. NEDENSELLİK VE PROAKTİF BAĞLAM: Sadece iptal veya silme değil; kullanıcı mevcut bir veride değişiklik (güncelleme, silme, iptal vb.) yapmak istediğinde, işlemin ARKASINDAKİ NEDENİ sana sağlanan mevcut bağlamdan (Saule hafızasından) analiz et. Bağlamda herhangi bir mantıksal neden (örn: hastalık, fiyat, zaman uyuşmazlığı, öncelik değişimi vb.) bulursan, eylem teklifinde bunu zekice dahil et ("X nedeniyle işlemi gerçekleştirip, bu nedeni de tarihe/notlara ekleyeyim mi?"). Eğer bağlamda hiçbir ipucu bulamazsan, işlemi yapmayı teklif ederken aynı zamanda "Bunun nedenine dair sisteme bir not bırakmamı ister misin?" diye sor.`
    });

    const chat = model.startChat();
    let result = await chat.sendMessage(query);
    let response = result.response;

    let finalAnswer = response.text();
    let actionProposal = null;
    let keepRunning = true;
    let maxLoops = 3; // Prevent infinite loops

    while (keepRunning && maxLoops > 0) {
      maxLoops--;
      keepRunning = false;
      const functionCalls = response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0) {
        
        // Handle Dynamic Action Tools from Registry
        const actionCall = functionCalls.find(c => CLARITY_ACTIONS[c.name]);
        if (actionCall) {
          const actionDef = CLARITY_ACTIONS[actionCall.name];
          actionProposal = {
            type: actionCall.name,
            payload: actionCall.args,
            buttonText: actionDef.buttonText,
            isApproved: false
          };
          if (!finalAnswer) {
             finalAnswer = "Sizin için aşağıdaki işlemi hazırladım. Lütfen detayları kontrol edip onaylayın.";
          }
          break; // Stop loop, we proposed an action
        }

        // Handle recall_saule_memory
        const recallCall = functionCalls.find(c => c.name === 'recall_saule_memory');
        if (recallCall && userId) {
          const searchQuery = (recallCall.args as { searchQuery: string }).searchQuery;
          console.log(`[Agent] Calling recallContext for: ${searchQuery}`);
          try {
            const spaceId = activeWorkspace?.id || userId;
            const composition = await recallContext(searchQuery, spaceId, 'workspace');
            
            // Format memory results to send back to model
            let memoryString = "Sonuç bulunamadı.";
            if (composition && composition.nodes && composition.nodes.length > 0) {
              memoryString = composition.nodes.map((n: any) => n.content).join('\\n');
            }
            
            // Send the function response back to Gemini to continue
            result = await chat.sendMessage([{
              functionResponse: {
                name: 'recall_saule_memory',
                response: { result: memoryString }
              }
            }]);
            response = result.response;
            finalAnswer = response.text();
            keepRunning = true; // Continue the loop
          } catch (e) {
            console.error("Failed to recall memory", e);
            result = await chat.sendMessage([{
              functionResponse: {
                name: 'recall_saule_memory',
                response: { error: 'Hafıza çekilirken bir hata oluştu.' }
              }
            }]);
            response = result.response;
            finalAnswer = response.text();
            keepRunning = true;
          }
        } else if (recallCall && !userId) {
          // If no user ID is available, return error to model
          result = await chat.sendMessage([{
            functionResponse: {
              name: 'recall_saule_memory',
              response: { error: 'Kullanıcı oturumu bulunamadı.' }
            }
          }]);
          response = result.response;
          finalAnswer = response.text();
          keepRunning = true;
        }
      }
    }
    
    return NextResponse.json({ 
      answer: finalAnswer,
      actionProposal: actionProposal,
      clarificationQuestions: [],
      synthesizedContext: "SML bağlamı kullanıldı.",
      clarityScore: actionProposal ? 90 : 60,
      topic: actionProposal ? "action" : "chat"
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
  }
}
