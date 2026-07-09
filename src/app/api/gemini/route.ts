import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, FunctionDeclaration, Content } from '@google/generative-ai';
import { recallContext, ingestMemory } from '@/lib/saule-core-client';
import { CLARITY_ACTIONS } from '@/lib/clarity-actions/registry';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ─── GENERIC TOOLS ────────────────────────────────────────────────────────────

const readBeiweDataTool: FunctionDeclaration = {
  name: 'read_beiwe_data',
  description: 'Read data from any Beiwe module. Use this to answer questions about customers, appointments, notes, etc. Always use this before trying to delete or update something — verify it exists first.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      module: {
        type: SchemaType.STRING,
        description: 'Which module to read from: customers, appointments, notes, inbox',
      },
      searchQuery: {
        type: SchemaType.STRING,
        description: 'What to search for. Can be a name, date, keyword, or empty string to get all.',
      },
      filters: {
        type: SchemaType.STRING,
        description: 'Optional JSON string with filter criteria, e.g. {"dateRange": "thisWeek"}',
      }
    },
    required: ['module', 'searchQuery']
  }
};

const writeBeiweDataTool: FunctionDeclaration = {
  name: 'write_beiwe_data',
  description: 'Create, update or delete data in any Beiwe module. Use this for CRUD operations.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      module: {
        type: SchemaType.STRING,
        description: 'Module name to write data to. Must be one of: customers, appointments, notes, docs',
      },
      operation: {
        type: SchemaType.STRING,
        description: 'Operation to perform: create, update, delete',
      },
      payload: {
        type: SchemaType.STRING,
        description: 'JSON string with the data to write. For appointments: {title, customer, start, end}. For customers: {name, details}. For notes: {content, customerId}. For docs: {title, content, docId?}.',
      }
    },
    required: ['module', 'operation', 'payload']
  }
};

const routeUiTool: FunctionDeclaration = {
  name: 'route_ui',
  description: 'Navigate the user interface to show a specific module or record. Use when the user wants to see a specific page, open a module, or view a particular record.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      module: {
        type: SchemaType.STRING,
        description: 'Module to navigate to: customers, appointments, notes, docs, inbox, integrations',
      },
      recordId: {
        type: SchemaType.STRING,
        description: 'Optional: specific record ID to open within the module',
      },
      recordName: {
        type: SchemaType.STRING,
        description: 'Optional: human-readable name of the record for the tab title',
      }
    },
    required: ['module']
  }
};

// ─── LEGACY TOOLS (specific actions kept for backward compat) ─────────────────

const recallSauleMemoryTool: FunctionDeclaration = {
  name: 'recall_saule_memory',
  description: 'Deep search in long-term Saule memory for a specific topic or past event. Use when the current context doesn\'t have the answer and you need to dig deeper into history.',
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

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { 
      query, 
      context,         // Saule'den gelen semantik bağlam (string)
      pendingAction, 
      localTime, 
      timeZone, 
      userId, 
      activeWorkspace,
      chatHistory,     // YENİ: Önceki konuşma mesajları [{role, content}]
      activeContext,   // YENİ: Kullanıcının baktığı ekranın bağlamı (string)
      token            // YENİ: Firebase auth token for write operations
    } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set.");
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    // Map Action Registry to Gemini Tools dynamically (legacy specific actions)
    const legacyTools: FunctionDeclaration[] = Object.values(CLARITY_ACTIONS).map(action => ({
      name: action.name,
      description: action.description,
      parameters: action.parameters
    }));

    // All tools: generic first, then legacy specific, then recall
    const allTools: FunctionDeclaration[] = [
      readBeiweDataTool,
      writeBeiweDataTool,
      routeUiTool,
      ...legacyTools,
      recallSauleMemoryTool
    ];

    const systemInstruction = `Sen Beiwe'nin 'Clarity Engine'isin — kullanıcının tek muhatabı olan akıllı kişisel asistanı.
Bugünün Tarihi ve Saati: ${localTime || new Date().toLocaleString('tr-TR')}
Zaman Dilimi: ${timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone}

KULLANICININ BEIWE SİSTEMİNDEKİ VERİLER (Saule Hafızası):
${context || 'Henüz kayıt yok.'}

${activeContext ? `KULLANICININ ŞU AN BAKTIĞI EKRAN:\n${activeContext}` : ''}

${pendingAction ? `BEKLEYEN EYLEM: ${JSON.stringify(pendingAction)}\nEğer kullanıcı onaylıyorsa (örn: 'evet', 'tamam', 'yap'), işlemi onaylanmış say.` : ''}

ARAÇ KULLANIM REHBERİ:
- Kullanıcı bir modülü görmek istiyorsa → 'route_ui' kullan
- Bilgi sormak veya var mı yok mu kontrol etmek için → 'read_beiwe_data' kullan
- Kayıt oluştur/güncelle/sil için → 'write_beiwe_data' kullan (önce read ile kontrol et)
- Geçmişte söylediği bir şeyi hatırlamak için → 'recall_saule_memory' kullan
- Spesifik işlemler için legacy araçları da kullanabilirsin (create_appointment, add_note vb.)

KURALLAR:
1. İşlem yapmadan önce KESİNLİKLE önce 'read_beiwe_data' ile kaydın var olduğunu doğrula. Yoksa işlemi KESİNLİKLE yapma.
2. "Bunu", "onu", "şunu" gibi zamirlerde KULLANICININ ŞU AN BAKTIĞI EKRAN bağlamını kullan.
3. Çakışma, eksik bilgi veya belirsizlik varsa kullanıcıya sor, tahmin etme.
4. Eğer kullanıcının bahsettiği bir müşterinin veya kaydın ID'sini biliyorsan (örn: Context'ten veya read_beiwe_data'dan), yanıtının sonuna KESİNLİKLE [UI_ROUTE: customer-ID] (veya ilgili modül/ID) etiketini ekle. Bu sayede arayüz otomatik olarak o sayfaya yönlenecektir.
5. Saat hesaplamalarını yerel zamana göre yap (sonuna Z ekleme).
6. UI yönlendirmesi isteklerinde [UI_ROUTE: moduleName] etiketi kullanmak yerine 'route_ui' aracını çağır.
7. Cevaplarını Türkçe ver. Kısa ve öz ol.`;

    // ─── Convert chatHistory to Gemini Content format ────────────────────────
    const geminiHistory: Content[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory.slice(-12)) { // Son 12 mesajı al (token tasarrufu)
        if (msg.role === 'user' || msg.role === 'model') {
          geminiHistory.push({
            role: msg.role,
            parts: [{ text: msg.content }]
          });
        }
      }
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      tools: [{ functionDeclarations: allTools }],
      systemInstruction
    });

    const chat = model.startChat({ history: geminiHistory });
    let result = await chat.sendMessage(query);
    let response = result.response;

    let finalAnswer = response.text();
    let actionProposal = null;
    let uiRoute: string | null = null;
    let keepRunning = true;
    let maxLoops = 5;

    while (keepRunning && maxLoops > 0) {
      maxLoops--;
      keepRunning = false;
      const functionCalls = response.functionCalls();
      
      if (!functionCalls || functionCalls.length === 0) break;

      // ── route_ui ──────────────────────────────────────────────────────────
      const routeCall = functionCalls.find(c => c.name === 'route_ui');
      if (routeCall) {
        const args = routeCall.args as { module: string; recordId?: string; recordName?: string };
        uiRoute = args.module;
        const routeResult = {
          module: args.module,
          recordId: args.recordId,
          recordName: args.recordName
        };
        result = await chat.sendMessage([{
          functionResponse: { name: 'route_ui', response: routeResult }
        }]);
        response = result.response;
        finalAnswer = response.text();
        keepRunning = true;
        continue;
      }

      // ── read_beiwe_data ───────────────────────────────────────────────────
      const readCall = functionCalls.find(c => c.name === 'read_beiwe_data');
      if (readCall && userId) {
        const args = readCall.args as { module: string; searchQuery: string; filters?: string };
        console.log(`[Clarity] read_beiwe_data: module=${args.module} query=${args.searchQuery}`);
        try {
          const spaceId = (activeWorkspace as any)?.id || userId;
          const composition = await recallContext(
            args.searchQuery || args.module, 
            spaceId, 
            'workspace'
          );
          
          // Filter by module type
          const modulePrefix: Record<string, string> = {
            customers: '/customer',
            appointments: '/appointment',
            notes: '/note',
            docs: '/doc', // Assuming docs might be stored with /doc prefix in memory, though we read docs from Firestore directly mostly
          };
          const prefix = modulePrefix[args.module];
          
          let nodes = composition?.nodes || [];
          
          if (args.module === 'customers') {
            try {
              const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
              const res = await fetch(`${apiUrl}/api/smi/nodes`);
              if (res.ok) {
                const data = await res.json();
                const allNodes = data.nodes || [];
                const userCustomers = allNodes.filter((n: any) => 
                  n.spaceId === spaceId && 
                  (n.content.includes('/customer ') || n.content.includes('/müşteri '))
                );
                
                if (args.searchQuery) {
                  const q = args.searchQuery.toLowerCase();
                  nodes = userCustomers.filter((n: any) => n.content.toLowerCase().includes(q));
                } else {
                  nodes = userCustomers;
                }
              }
            } catch (err) {
              console.error("Direct customer fetch failed", err);
              if (prefix) nodes = nodes.filter((n: any) => n.content?.toLowerCase().startsWith(prefix));
            }
          } else if (prefix) {
            nodes = nodes.filter((n: any) => n.content?.toLowerCase().startsWith(prefix));
          }
          
          if (args.module === 'customers' && nodes.length > 0) {
            uiRoute = 'customer-' + nodes[0].id;
          }

          const dataStr = nodes.length > 0
            ? nodes.map((n: any) => `[ID:${n.id}] ${n.content}`).join('\n')
            : `${args.module} modülünde "${args.searchQuery}" ile ilgili kayıt bulunamadı.`;
          
          result = await chat.sendMessage([{
            functionResponse: { name: 'read_beiwe_data', response: { result: dataStr, count: nodes.length } }
          }]);
          response = result.response;
          finalAnswer = response.text();
          keepRunning = true;
        } catch (e) {
          console.error('read_beiwe_data error', e);
          result = await chat.sendMessage([{
            functionResponse: { name: 'read_beiwe_data', response: { error: 'Veri okunamadı.' } }
          }]);
          response = result.response;
          finalAnswer = response.text();
          keepRunning = true;
        }
        continue;
      }

      // ── write_beiwe_data ──────────────────────────────────────────────────
      const writeCall = functionCalls.find(c => c.name === 'write_beiwe_data');
      if (writeCall) {
        const args = writeCall.args as { module: string; operation: string; payload: string };
        console.log(`[Clarity] write_beiwe_data: ${args.operation} on ${args.module}`);
        
        // Parse payload
        let payload: any = {};
        try { payload = JSON.parse(args.payload); } catch {}
        
        // For write operations, we create an action proposal (user must confirm)
        // Map to legacy action names for UI consistency
        const actionMap: Record<string, string> = {
          'customers-create': 'create_customer',
          'appointments-create': 'create_appointment',
          'appointments-update': 'update_appointment',
          'appointments-delete': 'delete_appointment',
          'notes-create': 'add_note',
          'notes-delete': 'delete_note',
          'docs-create': 'create_doc',
          'docs-update': 'update_doc',
        };
        const actionKey = `${args.module}-${args.operation}`;
        const legacyActionName = actionMap[actionKey];
        
        if (legacyActionName && CLARITY_ACTIONS[legacyActionName]) {
          const actionDef = CLARITY_ACTIONS[legacyActionName];
          actionProposal = {
            type: legacyActionName,
            payload,
            buttonText: actionDef.buttonText,
            isApproved: false
          };
          if (!finalAnswer) finalAnswer = 'Sizin için aşağıdaki işlemi hazırladım. Lütfen kontrol edip onaylayın.';
          break;
        } else {
          // Fallback: execute via ingestMemory directly for simple writes
          result = await chat.sendMessage([{
            functionResponse: { name: 'write_beiwe_data', response: { result: 'İşlem onay bekliyor.' } }
          }]);
          response = result.response;
          finalAnswer = response.text();
          keepRunning = true;
        }
        continue;
      }

      // ── Legacy Action Tools from Registry ─────────────────────────────────
      const actionCall = functionCalls.find(c => CLARITY_ACTIONS[c.name]);
      if (actionCall) {
        const actionDef = CLARITY_ACTIONS[actionCall.name];
        actionProposal = {
          type: actionCall.name,
          payload: actionCall.args,
          buttonText: actionDef.buttonText,
          isApproved: false
        };
        if (!finalAnswer) finalAnswer = 'Sizin için aşağıdaki işlemi hazırladım. Lütfen detayları kontrol edip onaylayın.';
        break;
      }

      // ── recall_saule_memory ───────────────────────────────────────────────
      const recallCall = functionCalls.find(c => c.name === 'recall_saule_memory');
      if (recallCall && userId) {
        const searchQuery = (recallCall.args as { searchQuery: string }).searchQuery;
        console.log(`[Clarity] recall_saule_memory: ${searchQuery}`);
        try {
          const spaceId = (activeWorkspace as any)?.id || userId;
          const composition = await recallContext(searchQuery, spaceId, 'workspace');
          
          let memoryString = 'Geçmiş hafızada bu konuyla ilgili kayıt bulunamadı.';
          if (composition?.nodes?.length > 0) {
            memoryString = composition.nodes.map((n: any) => n.content).join('\n');
          }
          
          result = await chat.sendMessage([{
            functionResponse: { name: 'recall_saule_memory', response: { result: memoryString } }
          }]);
          response = result.response;
          finalAnswer = response.text();
          keepRunning = true;
        } catch (e) {
          console.error('recall_saule_memory error', e);
          result = await chat.sendMessage([{
            functionResponse: { name: 'recall_saule_memory', response: { error: 'Hafıza çekilirken hata oluştu.' } }
          }]);
          response = result.response;
          finalAnswer = response.text();
          keepRunning = true;
        }
        continue;
      }
    }
    
    // Parse legacy [UI_ROUTE] tag fallback
    let parsedTopic = actionProposal ? 'action' : 'chat';
    if (uiRoute) {
      parsedTopic = uiRoute;
    } else {
      const routeMatch = finalAnswer?.match(/\[UI_ROUTE:\s*([a-zA-Z0-9_-]+)\]/);
      if (routeMatch) {
        uiRoute = routeMatch[1];
        parsedTopic = routeMatch[1].toLowerCase();
        finalAnswer = finalAnswer.replace(routeMatch[0], '').trim();
      }
    }
    
    return NextResponse.json({ 
      answer: finalAnswer,
      actionProposal,
      uiRoute: uiRoute || null,
      clarificationQuestions: [],
      synthesizedContext: actionProposal 
        ? 'Saule hafızası doğrulanarak işlem hazırlandı.' 
        : 'Saule bağlamı ve konuşma geçmişi kullanıldı.',
      clarityScore: actionProposal ? 90 : 65,
      topic: parsedTopic
    });
  } catch (error: any) {
    console.error('Clarity Engine Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
  }
}
