import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { query, context } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set.");
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    // We use gemini-2.5-flash as requested by the user
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Sen Beiwe Clarity Engine isimli yeni nesil, gizlilik odaklı, "netlik" (clarity) amaçlayan bir arama motorusun. Kullanıcının sorusuna doğrudan, net ve kesin bir cevap vermelisin.
    
Kullanıcının Sorusu: "${query}"

Aşağıdaki bilgiler, kullanıcının cihazındaki yerel veritabanından (IndexedDB) %100 gizlilikle çekilmiş bağlamdır (Context).
Sadece bu bağlamdaki bilgileri kullanarak doğru cevabı üret. Eğer bağlam soruyu cevaplamak için yeterli değilse, kendi genel bilginle doğrudan ve net bir şekilde yanıt ver.

--- YEREL BAĞLAM ---
${context || 'Kullanıcının yerel veritabanında bu konuya dair bir bilgi bulunamadı.'}
--------------------

Ayrıca kullanıcının sorusunu daha da netleştirebilmek için ona sorulabilecek en fazla 3 adet kısa "Netleştirme Sorusu" üret. (Örneğin hava durumu soruyorsa: "Hangi şehir için?", "Saat kaç için?" gibi).

Ek olarak, YEREL BAĞLAM bilgisini incele. Kullanıcının aynı aramayı kaç kez yaptığını (aynı sorguların sayısını) tespit et ve kullanıcıyla ilgili elle tutulur bilgiler (örn. "Ben yazları Antalya'da tatil yapmayı çok severim") varsa bunları birleştir. 
Amacın tek, kısa ve çok doğal bir "Bağlam Sentezi" cümlesi oluşturmak. Örnek: "Antalya'da tatil yapmayı sevdiğinizi belirtmiştiniz, ayrıca bu aramayı son zamanlarda 5 kez yaptınız."
Eğer bağlamda sadece eski aramalar varsa (elle tutulur bilgi yoksa) sadece şunu yaz: "Bu aramayı son zamanlarda X kez yaptınız."
Eğer bağlam tamamen boşsa, bu alanı boş bırak ("").

YENİ GÖREV - NETLİK SKORU (Clarity Score):
Kullanıcının sorduğu sorunun (ve sağlanan bağlamın) "ne kadar net ve kesin cevaplanabilir" olduğunu analiz et.
- Soru çok net, nesnel ve doğrudan cevaplanabilirse (örneğin "Dolar kuru ne kadar?"): Yüksek skor ver (80-100).
- Soru çok muğlak, öznel veya çok genişse (örneğin "Bana araba öner") VE bağlamda detay yoksa: Düşük skor ver (10-30).
- Soru muğlak OLSA BİLE bağlamda kullanıcının istekleri/durumuyla ilgili (örneğin "bütçesi, ailesi, sevdiği şeyler") destekleyici bilgiler varsa, bu bilgiler soruyu netleştirdiği için skoru yükselt (60-90).
Buna göre 0 ile 100 arasında bir tamsayı olarak 'clarityScore' hesapla.

YENİ GÖREV - KONU (Topic):
Kullanıcının sorgusundan yola çıkarak aramayı gruplamak için 1 veya 2 kelimelik, İngilizce harflerden oluşan kısa ve öz bir "topic" belirle. (Örn: "macbook", "tatil", "finans", "yazilim"). Bu etiket, Terminal'de benzer konuları aynı klasöre (pakete) gruplamak için kullanılacak.

DİKKAT: Yanıtını SADECE aşağıdaki formatta geçerli bir JSON olarak dön. Başka hiçbir metin ekleme:
{
  "answer": "Buraya net cevabını yaz...",
  "synthesizedContext": "Buraya doğal bağlam sentezini yaz (veya boş bırak)",
  "clarificationQuestions": ["Soru 1", "Soru 2", "Soru 3"],
  "clarityScore": 85,
  "topic": "macbook"
}`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean up potential markdown formatting from Gemini response
    if (responseText.startsWith('\`\`\`json')) {
      responseText = responseText.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    }
    
    const data = JSON.parse(responseText);

    return NextResponse.json({ 
      answer: data.answer,
      clarificationQuestions: data.clarificationQuestions || [],
      synthesizedContext: data.synthesizedContext || "",
      clarityScore: data.clarityScore || 30,
      topic: data.topic || "genel"
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
  }
}
