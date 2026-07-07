'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

// This file serves as the "nerve ending" connection to saule-core.
// It uses Server Actions to directly execute core logic, bypassing HTTP latency.
// In a production workspace setup, "saule-core" would be an npm workspace dependency.
// For now, we simulate the interface based on the Clarity Model.

export type ClarityContext = {
  id: string;
  query: string;
  chips: string[];
  score: number;
};

export type CollectiveResult = {
  id: string;
  title: string;
  description: string;
  features: string[];
  consensus: number;
  similarCount: number;
  imageUrl?: string;
};

export type ContextResult = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl?: string;
};

export type RegisteredProduct = {
  id: string;
  brand: string;
  model: string;
  type: string;
  score: number;
  ratingCount: number;
  imageUrl?: string;
};

export type WebResult = {
  id: string;
  title: string;
  url: string;
  description: string;
  imageUrl?: string;
};

export type ActionStep = {
  title: string;
  description: string;
};

export type ActionProposal = {
  type: 'create_customer' | 'create_appointment' | 'multi_step_plan' | 'update_appointment' | 'delete_appointment';
  steps?: ActionStep[];
  payload: any;
  buttonText: string;
  isApproved?: boolean;
};

export type ClarityResponse = {
  actionProposal?: ActionProposal;
  context: ClarityContext;
  clarificationChips: string[];
  collectiveResults: CollectiveResult[];
  contextResults: ContextResult[];
  registeredProducts: RegisteredProduct[];
  webResults: WebResult[];
  memories: any[];
};

export async function processClarityQuery(query: string, contextChips: string[] = []): Promise<ClarityResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL;
  if (!apiUrl) throw new Error("NEXT_PUBLIC_SAULE_API_URL is not defined");

  console.log(`[Saule Core] SML sinir ucu merkezi core'a bağlanıyor... Sorgu: "${query}"`);

  let realClarityScore = 76; // Varsayılan mockup skoru

  try {
    // Merkezi Saule Core'a bağlantı noktası.
    const response = await fetch(`${apiUrl}/api/smi/clarity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // saule-core /api/smi/clarity endpoint'i "individualContext" ve "collectiveContext" bekliyor
      body: JSON.stringify({ 
        individualContext: query + " " + contextChips.join(" "),
        collectiveContext: "Mock collective context for scoring"
      }),
      cache: 'no-store'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.clarityScore !== undefined) {
         console.log(`[Saule Core] Başarılı! Gerçek Clarity Score: ${data.clarityScore}%`);
         realClarityScore = data.clarityScore;
      }
    } else {
      console.warn(`[Saule Core] Merkez sunucu ${response.status} hatası döndürdü. Route veya payload uyuşmazlığı olabilir.`);
    }
  } catch (error) {
    console.warn(`[Saule Core] Merkez sunucuya ulaşılamadı. Sunucu kapalı olabilir.`);
  }

  // YENİ SİSTEME KADAR GEÇİCİ STATİK TEST VERİSİ
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('hava') || queryLower.includes('derece') || queryLower.includes('sıcaklık')) {
    return {
      context: {
        id: 'ctx-weather',
        query: query,
        chips: contextChips.length > 0 ? contextChips : ['İstanbul', 'Bugün', 'Haftalık', 'Saatlik', 'Yağış'],
        score: realClarityScore
      },
      clarificationChips: ['Hangi şehir?', 'Bugün mü?', 'Hafta sonu mu?', 'Yağış durumu?', 'Rüzgar?'],
      collectiveResults: [
        {
          id: 'cr-w1',
          title: 'Açık ve Güneşli, 28°C',
          description: 'İstanbul için güncel hava durumu. Nem %45.',
          features: ['Yağış beklenmiyor', 'Rüzgar: 12 km/s KD', 'UV İndeksi: Yüksek'],
          consensus: 98,
          similarCount: 5430
        }
      ],
      contextResults: [
        {
          id: 'cx-w1',
          title: 'Geçen hafta bu saatlerde hava daha serindi (22°C).',
          description: '',
          tags: ['İstanbul', 'Karşılaştırma', 'Güneşli']
        }
      ],
      registeredProducts: [],
      webResults: [
        {
          id: 'wr-w1',
          title: 'İstanbul Hava Durumu - Meteoroloji Genel Müdürlüğü',
          url: 'www.mgm.gov.tr',
          description: 'İstanbul ili için 5 günlük hava tahmini...'
        }
      ],
      memories: [
        { id: 'm-w1', title: 'Geçen ayki tatil planı notların', time: '1 not' }
      ]
    };
  }

  return {
    context: {
      id: 'ctx-1',
      query: query || '120m2 ev için klima seçimi',
      chips: contextChips.length > 0 ? contextChips : ['120m²', 'Living Room', 'Istanbul', '3 kişi', 'Bütçe: 25-40k TL'],
      score: realClarityScore
    },
    clarificationChips: ['Kaç m2?', 'Hangi bölge?', 'Kullanım amacı?', 'Bütçe?', 'Daha fazla...'],
    collectiveResults: [
      {
        id: 'cr-1',
        title: '24.000 BTU Inverter klima',
        description: '120m² İstanbul için en dengeli seçim.',
        features: ['Yeterli soğutma kapasitesi', 'Enerji verimliliği yüksek', 'Sessiz çalışma', 'Uzun vadede tasarruf sağlar'],
        consensus: 92,
        similarCount: 1842
      }
    ],
    contextResults: [
      {
        id: 'cx-1',
        title: 'Geçen yaz 110m² eviniz için incelediğiniz klimalar bu seçenekle eşleşiyor.',
        description: '',
        tags: ['Istanbul', '110-120 m²', 'Inverter', 'Sessiz mod']
      }
    ],
    registeredProducts: [
      {
        id: 'rp-1',
        brand: 'Daikin',
        model: '24.000 BTU Inverter Klima',
        type: 'Inverter',
        score: 9.1,
        ratingCount: 124
      }
    ],
    webResults: [
      {
        id: 'wr-1',
        title: '120m² için klima seçimi nasıl yapılır? | Klima Rehberi',
        url: 'www.klimarehberi.com',
        description: 'Uzmanlar, eviniz için klima seçerken metrekare ve yalıtım değerlerinin...'
      }
    ],
    memories: [
      { id: 'm-1', title: 'Geçen yaz baktığınız klimalar', time: '5 ürün' }
    ]
  };
}

export async function ingestMemory(
  content: string, 
  category: string, 
  provenance: any, 
  type: string = 'fact', 
  spaceType: string = 'personal', 
  spaceId?: string,
  token?: string
) {
  const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL;
  if (!apiUrl) throw new Error("NEXT_PUBLIC_SAULE_API_URL is not defined");

  const headers: any = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${apiUrl}/api/smi/ingest`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content, category, type, spaceType, spaceId, provenance })
  });
  if (!response.ok) throw new Error("Failed to ingest memory");
  return response.json();
}

export async function recallContext(query: string, spaceId: string, spaceType: string) {
  const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL;
  if (!apiUrl) throw new Error("NEXT_PUBLIC_SAULE_API_URL is not defined");

  const response = await fetch(`${apiUrl}/api/smi/recall`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, spaceId, spaceType })
  });
  if (!response.ok) throw new Error("Failed to recall context");
  const data = await response.json();
  return data.composition;
}

export async function getVerifiedSolutions(composition: any) {
  const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL;
  if (!apiUrl) throw new Error("NEXT_PUBLIC_SAULE_API_URL is not defined");

  const response = await fetch(`${apiUrl}/api/smi/verified-solutions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(composition)
  });
  if (!response.ok) throw new Error("Failed to fetch verified solutions");
  const data = await response.json();
  return data.solutions;
}
