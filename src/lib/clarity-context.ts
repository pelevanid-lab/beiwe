/**
 * Clarity Context Store
 * 
 * Her modül sayfası kendi aktif verisini buraya yazar.
 * Clarity Engine bu store'u okuyarak kullanıcının şu an baktığı ekranı anlar.
 * 
 * Mimari: "Sayfa motora gelir, motor sayfaya gitmez"
 */

type ClarityModuleContext = {
  module: 'customers' | 'appointments' | 'notes' | 'docs' | 'inbox' | 'integrations';
  title?: string;
  /** Ekrandaki önemli veri (müşteri listesi, randevu detayı, vb.) */
  data: Record<string, any>;
  /** Kullanıcının aktif olarak baktığı tekil kayıt (varsa) */
  activeRecord?: {
    id: string;
    type: string;
    summary: string; // LLM'e gidecek kısa özet
  };
  updatedAt: number;
};

// Basit in-memory store (session boyunca yaşar)
let _store: ClarityModuleContext | null = null;
const _listeners: Array<(ctx: ClarityModuleContext | null) => void> = [];

export function setClarityContext(ctx: Omit<ClarityModuleContext, 'updatedAt'>) {
  _store = { ...ctx, updatedAt: Date.now() };
  _listeners.forEach(fn => fn(_store));
}

export function getClarityContext(): ClarityModuleContext | null {
  return _store;
}

export function clearClarityContext() {
  _store = null;
  _listeners.forEach(fn => fn(null));
}

export function subscribeToClarityContext(
  fn: (ctx: ClarityModuleContext | null) => void
): () => void {
  _listeners.push(fn);
  // Return unsubscribe
  return () => {
    const idx = _listeners.indexOf(fn);
    if (idx > -1) _listeners.splice(idx, 1);
  };
}

/**
 * Clarity Engine'e gönderilmek üzere aktif bağlamı metin formatına dönüştürür
 */
export function formatClarityContextForLLM(): string {
  if (!_store) return '';
  
  const lines: string[] = [
    `\n--- KULLANICININ ŞU AN BAKTIGI EKRAN ---`,
    `Modül: ${_store.module}${_store.title ? ` (${_store.title})` : ''}`,
  ];

  if (_store.activeRecord) {
    lines.push(`Aktif Kayıt: [${_store.activeRecord.type.toUpperCase()}] ${_store.activeRecord.summary} (ID: ${_store.activeRecord.id})`);
  }

  if (_store.data) {
    // Sadece önemli özet bilgileri ekle, token tasarrufu için
    const { customers, appointments, docs, totalCount, upcomingCount } = _store.data;
    if (customers && Array.isArray(customers)) {
      lines.push(`Ekrandaki Müşteri Sayısı: ${customers.length}`);
      const names = customers.slice(0, 10).map((c: any) => c.name || c.content?.replace('/customer ', '') || '?').join(', ');
      lines.push(`Müşteriler: ${names}${customers.length > 10 ? '...' : ''}`);
    }
    if (appointments && Array.isArray(appointments)) {
      lines.push(`Ekrandaki Randevu Sayısı: ${appointments.length}`);
    }
    if (docs && Array.isArray(docs)) {
      lines.push(`Ekrandaki Doküman Sayısı: ${docs.length}`);
      const docNames = docs.slice(0, 10).map((d: any) => d.name || d.title || '?').join(', ');
      lines.push(`Dokümanlar: ${docNames}${docs.length > 10 ? '...' : ''}`);
    }
    if (totalCount !== undefined) lines.push(`Toplam kayıt: ${totalCount}`);
    if (upcomingCount !== undefined) lines.push(`Yaklaşan: ${upcomingCount}`);
  }

  lines.push('---');
  return lines.join('\n');
}
