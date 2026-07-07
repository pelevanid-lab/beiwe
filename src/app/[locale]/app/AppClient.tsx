'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, Search, Mic, ArrowRight, Bookmark, Globe, X, Maximize2, Minimize2, ShieldCheck, MonitorDown, Star } from 'lucide-react';
import { ClarityResponse, ingestMemory, recallContext, getVerifiedSolutions } from '@/lib/saule-core-client';
import { db } from '@/lib/firebase';
import { collection, query as firestoreQuery, where, getDocs, addDoc } from 'firebase/firestore';
import { LogoIcon } from '@/components/Logo';

import { AuthModal } from '@/components/AuthModal';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AppClient({ dict }: { dict: any }) {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ClarityResponse | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const currentMemoryDocId = useRef<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiSynthesis, setAiSynthesis] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [questionAnswer, setQuestionAnswer] = useState<string>('');
  const [workspaces, setWorkspaces] = useState<string[]>(['Kişisel', 'Takım Çalışması', 'Genel']);
  const [activeWorkspace, setActiveWorkspace] = useState<string>('Kişisel');
  const [showWebSearch, setShowWebSearch] = useState<boolean>(false);
  const [allNodes, setAllNodes] = useState<any[]>([]);
  const [activeIframeUrl, setActiveIframeUrl] = useState<string | null>(null);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);
  const [isIframeBlocked, setIsIframeBlocked] = useState(false);
  const hasAutoSearched = useRef(false);

  // Customer Linking State
  const [showCustomerSelectModal, setShowCustomerSelectModal] = useState(false);
  const [pendingNoteText, setPendingNoteText] = useState('');
  const [customersList, setCustomersList] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
      if (!u) {
        setIsAuthModalOpen(true);
      } else {
        setIsAuthModalOpen(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Read URL query parameter
  useEffect(() => {
    const q = searchParams.get('q');
    if (!user) return;
    
    // Fetch all nodes for live search
    const fetchNodes = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
        const res = await fetch(`${apiUrl}/api/smi/nodes`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.nodes) {
          const userNodes = data.nodes.filter((n: any) => n.spaceId === user.uid);
          setAllNodes(userNodes);
          setCustomersList(userNodes.filter((n: any) => n.content.includes('/müşteri ')).sort((a: any, b: any) => b.createdAt - a.createdAt));
        }
      } catch (err) {
        console.error("Failed to fetch nodes for live search", err);
      }
    };
    fetchNodes();

    if (q && !hasAutoSearched.current) {
      setQuery(q);
      hasAutoSearched.current = true;
    }
  }, [searchParams, user]);

  // Check if Iframe URL is blocked by X-Frame-Options
  useEffect(() => {
    if (!activeIframeUrl) {
      setIsIframeBlocked(false);
      return;
    }
    const checkIframe = async () => {
      // In Desktop app (Electron), framing is always allowed
      const isElectron = typeof window !== 'undefined' && (window.navigator.userAgent.indexOf('Electron') > -1 || window.navigator.userAgent.indexOf('BeiweOS') > -1);
      if (isElectron) {
        setIsIframeBlocked(false);
        return;
      }
      try {
        const res = await fetch(`/api/check-iframe?url=${encodeURIComponent(activeIframeUrl)}`);
        const data = await res.json();
        setIsIframeBlocked(data.blocked);
      } catch {
        setIsIframeBlocked(true);
      }
    };
    checkIframe();
  }, [activeIframeUrl]);

  // Auto-trigger search when query is loaded from URL
  useEffect(() => {
    if (query && hasAutoSearched.current && !isSearching && !results) {
      // Small timeout to let UI settle before triggering search
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [query, isSearching, results]);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) {
      e.preventDefault();
      // Brand new search from the top input bar, reset the session memory ID
      currentMemoryDocId.current = null;
    }
    const currentQuery = overrideQuery || query;
    if (!currentQuery.trim()) return;
    
    setIsSearching(true);
    setAiResponse(null);
    setAiSynthesis(null);
    
    let finalQuery = currentQuery;
    let finalType = 'query';
    let finalCategory = 'action';

    // URL Algılama (Browser özelliği)
    const isUrl = (str: string) => {
      const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
      return !!pattern.test(str.trim());
    };

    if (isUrl(finalQuery)) {
       let url = finalQuery.trim();
       if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
       }
       setActiveIframeUrl(url);
       setIsSearching(false);
       setQuery('');
       return;
    }
    
    // Command Parsing
    setActiveIframeUrl(null);
    if (finalQuery.startsWith('/müşteri ')) {
       // Müşteri eklendiğinde workspace'i DEĞİŞTİRMİYORUZ. 
       // Workspace (Çalışma alanı) sadece takım/kişisel ayrımı içindir.
       setQuery('');
       setResults(null);
       setIsSearching(false);
       return; 
    }
    
    if (finalQuery.startsWith('/yeni-musteri ')) {
       if (!user) {
         setIsAuthModalOpen(true);
         setIsSearching(false);
         return;
       }
       const customerName = finalQuery.replace('/yeni-musteri ', '').trim();
       try {
         const token = await user.getIdToken();
         await ingestMemory(`/müşteri ${customerName}`, token, activeWorkspace);
         setQuery('');
         setIsSearching(false);
         // Refresh customers list
         const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
         const res = await fetch(`${apiUrl}/api/smi/nodes`);
         if (res.ok) {
           const data = await res.json();
           const userNodes = data.nodes.filter((n: any) => n.spaceId === user.uid);
           setAllNodes(userNodes);
           setCustomersList(userNodes.filter((n: any) => n.content.includes('/müşteri ')).sort((a: any, b: any) => b.createdAt - a.createdAt));
         }
       } catch (err) {
         console.error(err);
       }
       return;
    }

    if (finalQuery.startsWith('/musteriye-not ')) {
       if (!user) {
         setIsAuthModalOpen(true);
         setIsSearching(false);
         return;
       }
       const noteText = finalQuery.replace('/musteriye-not ', '').trim();
       setPendingNoteText(noteText);
       setShowCustomerSelectModal(true);
       setQuery('');
       setIsSearching(false);
       return;
    }
    
    if (finalQuery.startsWith('/görev ')) {
       finalType = 'task';
       finalCategory = 'action';
       finalQuery = finalQuery.replace('/görev ', '').trim();
    }

    try {
      // 1. Core Ingest (Save the query)
      await ingestMemory(
        finalQuery, 
        finalCategory, 
        { source: 'search_bar', author: 'user', createdAt: Date.now() }, 
        finalType,
        activeWorkspace
      );

      // 2. Core Recall (Get context)
      const composition = await recallContext(finalQuery, 'default', activeWorkspace);

      // 3. Get Verified Solutions
      const verified = await getVerifiedSolutions(composition);



      // Get significant words for matching (length > 3) to avoid false positives with common short words
      const queryWords = currentQuery.toLowerCase().split(' ').filter(w => w.length > 3);

      // 4. Fetch Terminal 2.0 Memories from Firebase
      let firebaseMemories: any[] = [];
      if (user && db) {
        try {
          const q = firestoreQuery(
            collection(db, 'memories'),
            where('userId', '==', user.uid)
          );
          const snapshot = await getDocs(q);
          
          snapshot.forEach(doc => {
            const data = doc.data();
            const content = (data.content || '').toLowerCase();
            // Stricter matching: require at least one significant word to match, or exact match if query is very short
            const matches = queryWords.length > 0 
              ? queryWords.some(w => content.includes(w))
              : content.includes(currentQuery.toLowerCase());
              
            if (matches) {
              firebaseMemories.push({
                content: data.content,
                category: data.category || 'knowledge'
              });
            }
          });
        } catch (err) {
          console.error("Firebase fetch error:", err);
        }
      }

      // 5. Filter local composition nodes using the same stricter logic
      const validLocalNodes = composition.nodes.filter((n: any) => {
        const content = (n.content || '').toLowerCase();
        return queryWords.length > 0 
          ? queryWords.some(w => content.includes(w))
          : content.includes(currentQuery.toLowerCase());
      });

      const combinedNodes = [...validLocalNodes, ...firebaseMemories];

      // Calculate Local Clarity Score based on SML Context
      let localClarityScore = 0; // Start at 0, let Gemini decide the final score

      // Call Gemini API in the background to get synthesized context and answer
      setIsGenerating(true);
      fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery, context: combinedNodes.map(n => n.content).join('\n') })
      }).then(res => res.json())
        .then(data => {
          if (data.answer) setAiResponse(data.answer);
          if (data.clarificationQuestions || data.clarityScore !== undefined) {
            setResults(prev => {
              if (!prev) return prev;
              const score = data.clarityScore !== undefined ? data.clarityScore : prev.context.score;
              let questions = data.clarificationQuestions || [];
              
              if (score >= 80) {
                 questions = [];
              } else if (score >= 60) {
                 questions = questions.slice(0, 1);
              } else if (score >= 40) {
                 questions = questions.slice(0, 2);
              }
              
              return { 
                ...prev, 
                context: {
                  ...prev.context,
                  score
                },
                clarificationChips: [...questions, "Eklemek istediğiniz başka bir detay var mı?"] 
              };
            });
          }
          if (data.synthesizedContext) {
            setAiSynthesis(data.synthesizedContext);
          }

          // If Clarity Score is high (>=80), the intent is very clear.
          // Delegate the semantic ingestion to the Saule SML core layer.
          if (data.clarityScore && data.clarityScore >= 80 && user && db) {
             const memoryContent = data.synthesizedContext 
                ? `${finalQuery} - ${data.synthesizedContext}`
                : finalQuery;

             // Direkt Firebase veritabanına kayıt yapmak yerine (Çünkü Saule Core kriptolu tutuyor)
             // Mevcut ingestMemory çağrısına kullanıcının gerçek UID'sini author olarak gönderiyoruz.
             user.getIdToken().then((token: string) => {
               ingestMemory(
                 memoryContent, 
                 'knowledge', 
                 { source: 'beiwe_os_auto', author: user.uid, createdAt: Date.now(), workspaceId: activeWorkspace }, 
                 'fact', 
                 'personal', 
                 user.uid, // This is what getsaule.com filters by (n.spaceId === user.uid)
                 token
               ).catch(err => console.error("Failed to ingest high clarity memory via SML", err));
             });
          }

          setIsGenerating(false);
        })
        .catch(err => {
          console.error("Gemini API Error:", err);
          setIsGenerating(false);
        });

      // Create structured context results (used initially while Gemini generates the synthesized version)
      const pastSearches = combinedNodes.filter(n => n.category !== 'knowledge');
      const memories = combinedNodes.filter(n => n.category === 'knowledge');
      
      let fallbackText = '';
      if (pastSearches.length > 0) fallbackText += `Bu aramayı son zamanlarda ${pastSearches.length} kez yaptınız. `;
      if (memories.length > 0) fallbackText += `Terminal hafızanızda bu konuyla ilgili ${memories.length} bilgi bulunuyor.`;

      const structuredContextResults = memories.length > 0 ? [{
        id: `ctx-fallback`,
        title: 'Geçmiş Arama ve Hafıza',
        description: fallbackText.trim() || 'Geçmiş bağlantılar taranıyor...',
        tags: ['knowledge']
      }] : [];

      // Map to UI format
      const res: ClarityResponse = {
        context: {
          id: 'ctx-local',
          query: currentQuery,
          chips: ['Local WASM', 'Encrypted', 'Fast'],
          score: localClarityScore
        },
        clarificationChips: [], // Initially empty, will be updated by Gemini
        collectiveResults: [],
        contextResults: structuredContextResults,
        registeredProducts: verified.map((v: any) => ({
          id: v.id,
          brand: v.brand,
          model: v.model,
          type: 'Verified',
          score: v.rating,
          ratingCount: v.reviewCount
        })),
        webResults: [
          {
            id: 'wr-1',
            title: `"${currentQuery}" Hakkında En Güncel Bilgiler`,
            url: `www.google.com/search?q=${encodeURIComponent(currentQuery)}`,
            description: `Arama motorlarından derlenen "${currentQuery}" ile ilgili anlık sonuçlar ve analizler. İlgili konudaki son gelişmeleri buradan takip edebilirsiniz.`
          },
          {
            id: 'wr-2',
            title: `Uzmanlardan "${currentQuery}" Değerlendirmesi`,
            url: `www.teknolojioku.com/haber/${encodeURIComponent(currentQuery.split(' ').join('-'))}`,
            description: `Sektör uzmanlarının "${currentQuery}" üzerine yaptığı detaylı incelemeler, raporlar ve kullanıcı deneyimleri.`
          },
          {
            id: 'wr-3',
            title: `Popüler Forumlarda "${currentQuery}"`,
            url: `www.donanimhaber.com/forum/${encodeURIComponent(currentQuery.split(' ').join('-'))}`,
            description: `Topluluk tarafından "${currentQuery}" konusu hakkında açılan güncel tartışmalar ve farklı perspektiflerden yorumlar.`
          }
        ],
        memories: []
      };

      setResults(res);

      // Frictionless-First: Show Auth Modal after 3 seconds if not logged in
      if (!auth.currentUser) {
        setTimeout(() => {
          setIsAuthModalOpen(true);
        }, 3000);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const handleLinkNoteToCustomer = async (customerId: string, customerName: string) => {
    if (!user || !pendingNoteText) return;
    try {
      const token = await user.getIdToken();
      // Ingest memory with reference to the customer
      await ingestMemory(`Müşteri: ${customerName}\n\nNot/Görüşme:\n${pendingNoteText}`, token, activeWorkspace);
      setShowCustomerSelectModal(false);
      setPendingNoteText('');
    } catch (err) {
      console.error("Failed to link note:", err);
    }
  };

  const handleRefinedSearch = async (e: React.FormEvent, question: string) => {
    e.preventDefault();
    if (!questionAnswer.trim()) return;
    
    const refinedQuery = `${query} - Ek Bilgi: ${questionAnswer}`;
    
    // Ingest the clarification answer into local memory
    await ingestMemory(
      `Soru: ${question} | Cevap: ${questionAnswer}`,
      'action',
      { source: 'clarification', author: 'user', createdAt: Date.now() },
      'clarification'
    );

    // Reset interaction state and update main query
    setActiveQuestion(null);
    setQuestionAnswer('');
    setQuery(refinedQuery);

    // Call search directly with the new combined query
    await handleSearch(undefined, refinedQuery);
  };

  const getActionName = (q: string) => {
    if (q.startsWith('/not ')) return 'Not Ekle';
    if (q.startsWith('/görev ')) return 'Görev Ekle';
    if (q.startsWith('/müşteri ')) return 'Müşteri Ekle';
    if (q.startsWith('/fatura ')) return 'Fatura Ekle';
    return 'Kaydet';
  };
  const isCommand = query.startsWith('/');

  return (
    <div className="flex-1 w-full flex flex-col bg-[var(--color-paper)] h-screen overflow-hidden">
      
      {/* Main Column */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto px-4 md:px-8 relative pt-4">
        

        <motion.div 
          initial={false}
          animate={{ 
            marginTop: (isSearching || activeIframeUrl) ? '1rem' : '10vh',
            marginBottom: (isSearching || activeIframeUrl) ? '0' : '0'
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`w-full flex flex-col items-center transition-all duration-500 ${activeIframeUrl ? 'max-w-full px-4 h-full flex-1' : 'max-w-3xl'}`}
        >
          {/* Logo / Header */}
          <motion.div 
            animate={{ scale: (isSearching || activeIframeUrl) ? 0.8 : 1, opacity: (isSearching || activeIframeUrl) ? 0 : 1 }}
            className={`flex items-center gap-4 mb-8 ${(isSearching || activeIframeUrl) ? 'h-0 overflow-hidden mb-0' : ''}`}
          >
            <LogoIcon className="w-14 h-14 text-[var(--color-ink)]" />
            <div className="flex flex-col">
              <span className="font-serif text-5xl font-bold tracking-tight">Beiwe</span>
              <span className="text-xs font-bold text-[var(--color-burnt-orange)] tracking-widest uppercase mt-1">Clarity Engine</span>
            </div>
          </motion.div>

          {/* Active Workspace Selector (Flow Integrated) */}
          {(!isSearching && !activeIframeUrl) && (
            <div className="flex flex-col items-center mb-8 relative group">
              <span className="text-[10px] font-bold text-[var(--color-ink)]/40 tracking-widest uppercase mb-1">
                Aktif Çalışma Alanı
              </span>
              <div className="flex items-center relative">
                <select 
                  value={activeWorkspace}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                       setQuery('/müşteri ');
                       const input = document.getElementById('main-search-input');
                       if (input) input.focus();
                    } else {
                       setActiveWorkspace(e.target.value);
                    }
                  }}
                  className="appearance-none font-serif text-4xl md:text-5xl font-bold text-[var(--color-burnt-orange)] bg-transparent outline-none cursor-pointer text-center pr-10"
                >
                  {workspaces.map(ws => <option key={ws} value={ws} className="text-lg">{ws}</option>)}
                  <option value="new" className="text-lg">+ Yeni Ekle</option>
                </select>
                <div className="absolute right-0 pointer-events-none text-[var(--color-burnt-orange)] opacity-50">
                  ▼
                </div>
              </div>
            </div>
          )}

          {/* Search Bar Container */}
          <div className="w-full relative group">
            <form onSubmit={handleSearch} className="w-full relative">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="text-[var(--color-ink)]/40" size={20} />
              </div>
              <input 
                id="main-search-input"
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={dict.search_placeholder}
                className="w-full bg-white border border-[var(--color-ink)]/10 rounded-full py-4 pl-14 pr-24 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-burnt-orange)]/50 focus:border-[var(--color-burnt-orange)] shadow-sm transition-all text-[var(--color-ink)]"
              />
              <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                <button type="button" className="p-2 text-[var(--color-ink)]/40 hover:text-[var(--color-ink)] transition-colors">
                  <Mic size={20} />
                </button>
                <button type="submit" className="bg-[var(--color-burnt-orange)] text-white p-2.5 rounded-full hover:bg-orange-600 transition-colors shadow-md">
                  <ArrowRight size={20} />
                </button>
              </div>
            </form>

            {/* Live Search Suggestions for /not */}
            {query.startsWith('/not ') && query.replace('/not ', '').trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[var(--color-ink)]/10 z-50 overflow-hidden max-h-60 overflow-y-auto">
                {allNodes
                  .filter(n => n.content.toLowerCase().includes(query.replace('/not ', '').trim().toLowerCase()))
                  .map(n => (
                    <div 
                      key={n.id} 
                      className="p-4 border-b border-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/5 cursor-pointer flex items-start gap-3 transition-colors"
                      onClick={() => {
                        setQuery(n.content);
                        const input = document.getElementById('main-search-input');
                        if (input) input.focus();
                      }}
                    >
                      <Bookmark className="w-5 h-5 text-[var(--color-burnt-orange)] shrink-0 mt-0.5" />
                      <p className="text-sm text-[var(--color-ink)] line-clamp-2">{n.content.replace(/^\/not\s+/i, '')}</p>
                    </div>
                  ))}
                {allNodes.filter(n => n.content.toLowerCase().includes(query.replace('/not ', '').trim().toLowerCase())).length === 0 && (
                  <div className="p-4 text-sm text-[var(--color-ink-light)] text-center">
                    Böyle bir not bulunamadı, Enter'a basarak yeni kaydedebilirsiniz.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Internal Browser (Iframe) */}
          {activeIframeUrl && (
            <div className={
              isIframeFullscreen 
                ? "fixed inset-0 z-[100] bg-white flex flex-col" 
                : "w-full mt-6 rounded-2xl overflow-hidden border border-[var(--color-ink)]/10 shadow-2xl relative flex-1 flex flex-col mb-4"
            }>
              <div className="bg-[var(--color-ink)]/5 h-12 flex items-center px-4 justify-between border-b border-[var(--color-ink)]/10 shrink-0">
                <div className="flex items-center gap-3">
                  <LogoIcon className="w-5 h-5 text-[var(--color-ink)]" />
                  <span className="text-sm font-medium text-[var(--color-ink-light)] truncate max-w-sm">{activeIframeUrl}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setIsIframeFullscreen(!isIframeFullscreen)} className="p-2 hover:bg-[var(--color-ink)]/10 rounded-full transition-colors text-[var(--color-ink-light)] hover:text-[var(--color-ink)]">
                    {isIframeFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button onClick={() => { setActiveIframeUrl(null); setIsIframeFullscreen(false); }} className="p-2 hover:bg-[var(--color-ink)]/10 rounded-full transition-colors text-[var(--color-ink-light)] hover:text-red-500">
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              {isIframeBlocked ? (
                <div className="w-full flex-1 bg-[var(--color-paper)] border-none flex flex-col items-center justify-center p-8 text-center">
                  <div className="p-6 bg-[var(--color-burnt-orange)]/10 rounded-3xl text-[var(--color-burnt-orange)] mb-6">
                    <ShieldCheck size={56} />
                  </div>
                  <h2 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight mb-4">Tarayıcı Güvenliği</h2>
                  <p className="text-[var(--color-ink-light)] text-lg max-w-xl leading-relaxed mb-8">
                    Girdiğiniz web sitesi, güvenlik kısıtlamaları (X-Frame-Options) nedeniyle başka bir sayfa içerisinde açılmayı reddediyor.
                    <br /><br />
                    Beiwe browser'ı sorunsuz kullanmak ve <strong>Sağ Tık Menüsü</strong> gibi tüm OS avantajlarından yararlanmak için Masaüstü uygulamasını indirin.
                  </p>
                  <a 
                    href="/tr/app/download" 
                    className="px-8 py-4 bg-[var(--color-burnt-orange)] text-white rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-xl hover:shadow-orange-500/20 hover:-translate-y-1 flex items-center gap-3"
                  >
                    <MonitorDown size={24} />
                    Masaüstü Sürümünü İndir
                  </a>
                </div>
              ) : (
                <iframe 
                  src={activeIframeUrl} 
                  className="w-full flex-1 bg-white border-none"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              )}
            </div>
          )}

          {/* Initial State Dashboard */}
          {!isSearching && !activeIframeUrl && (
            <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--color-ink-light)]">Bugünün Görevleri</h3>
                <div className="flex flex-col gap-2">
                  <div className="bg-white p-3 rounded-xl border border-[var(--color-ink)]/5 shadow-sm flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-[var(--color-burnt-orange)] rounded border-gray-300 focus:ring-[var(--color-burnt-orange)]" />
                    <span className="text-sm font-medium">Ahmet Bey'e teklif hazırla</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[var(--color-ink)]/5 shadow-sm flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-[var(--color-burnt-orange)] rounded border-gray-300 focus:ring-[var(--color-burnt-orange)]" />
                    <span className="text-sm font-medium">Ofis kirasını yatır</span>
                  </div>
                </div>
                
                <h3 className="text-sm font-semibold text-[var(--color-ink-light)] mt-6">Hızlı Komutlar</h3>
                <div className="flex flex-wrap gap-2">
                  <span onClick={() => setQuery('/görev ')} className="px-4 py-2 bg-white border border-[var(--color-ink)]/10 rounded-full text-sm font-medium text-[var(--color-ink-light)] shadow-sm cursor-pointer hover:border-[var(--color-burnt-orange)] hover:text-[var(--color-burnt-orange)]">
                    /görev
                  </span>
                  <span onClick={() => setQuery('/not ')} className="px-4 py-2 bg-white border border-[var(--color-ink)]/10 rounded-full text-sm font-medium text-[var(--color-ink-light)] shadow-sm cursor-pointer hover:border-[var(--color-burnt-orange)] hover:text-[var(--color-burnt-orange)] transition-colors">
                    /not
                  </span>
                  <span onClick={() => setQuery('/müşteri ')} className="px-4 py-2 bg-white border border-[var(--color-ink)]/10 rounded-full text-sm font-medium text-[var(--color-ink-light)] shadow-sm cursor-pointer hover:border-[var(--color-burnt-orange)] hover:text-[var(--color-burnt-orange)] transition-colors">
                    /müşteri
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[var(--color-ink-light)] mt-6">Kısa Yollar</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-2 bg-white border border-[var(--color-ink)]/10 rounded-full text-sm font-medium text-green-600 shadow-sm cursor-pointer hover:border-green-500 flex items-center gap-2 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> WhatsApp
                  </span>
                  <span className="px-4 py-2 bg-white border border-[var(--color-ink)]/10 rounded-full text-sm font-medium text-pink-600 shadow-sm cursor-pointer hover:border-pink-500 flex items-center gap-2 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div> Instagram
                  </span>
                  <span className="px-4 py-2 bg-white border border-[var(--color-ink)]/10 rounded-full text-sm font-medium text-blue-600 shadow-sm cursor-pointer hover:border-blue-500 flex items-center gap-2 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Outlook
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-[var(--color-ink-light)]">Aktif Çalışma Alanı ({activeWorkspace})</h3>
                  <span className="text-xs text-[var(--color-burnt-orange)] font-medium cursor-pointer">{dict.view_all}</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { title: 'Son Görüşme', desc: 'Fiyat konusunda anlaşıldı.', time: '2s' },
                    { title: 'Bekleyen Ödeme', desc: '5.000 TL', time: '1g' },
                  ].map((ctx, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-[var(--color-ink)]/5 shadow-sm space-y-1">
                      <div className="font-semibold text-sm">{ctx.title}</div>
                      <div className="text-xs text-[var(--color-ink-light)]">{ctx.desc}</div>
                      <div className="text-[10px] text-[var(--color-ink)]/40 mt-2">{ctx.time} önce güncellendi</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Results Area */}
        <AnimatePresence>
          {isSearching && results && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="w-full max-w-3xl flex flex-col pb-24"
            >
              <div className="flex flex-col gap-6 mb-8 mt-4">
                {/* Unified AI Response Section at the Top */}
                {(aiResponse || aiSynthesis || isGenerating) && (
                  <section className="mb-8">
                    <div className="bg-white rounded-3xl border border-[var(--color-burnt-orange)]/30 shadow-sm relative overflow-hidden">
                      {/* Decorative Background */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--color-burnt-orange)]/10 to-transparent rounded-bl-full pointer-events-none" />
                      
                      {/* Clarity Score Background Indicator (Subtle) */}
                      {results.context.score > 0 && (
                        <div className="absolute top-4 right-6 flex items-center gap-2 text-[var(--color-ink)]/30">
                          <div className="text-[10px] font-bold tracking-widest uppercase">Netlik</div>
                          <div className="font-serif text-lg font-bold">%{results.context.score}</div>
                        </div>
                      )}

                      <div className="p-6 md:p-8 relative z-10 flex flex-col gap-6">
                        {/* 1. Synthesis (If available) */}
                        {aiSynthesis && (
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-burnt-orange)]/10 flex items-center justify-center shrink-0 mt-1">
                              <Star size={14} className="text-[var(--color-burnt-orange)]" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold tracking-widest text-[var(--color-burnt-orange)] mb-2 uppercase">Bağlam Sentezi</h4>
                              <p className="text-sm font-medium text-[var(--color-ink)] italic leading-relaxed">
                                "{aiSynthesis}"
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 2. Main AI Answer (Clarity Card) */}
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-ink)] flex items-center justify-center shrink-0 mt-1">
                            <LogoIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-bold tracking-widest text-[var(--color-ink-light)] mb-2 uppercase">Netlik Kartı</h4>
                            <div className="text-sm md:text-base text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">
                              {aiResponse ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                  {aiResponse}
                                </motion.div>
                              ) : (
                                <div className="flex items-center gap-3 text-[var(--color-burnt-orange)] font-semibold py-2">
                                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                  <span>Düşünce bulutu oluşturuluyor...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Clarification Questions */}
                {results.clarificationChips && results.clarificationChips.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold tracking-widest text-[var(--color-ink-light)] uppercase">
                      {results.context.score >= 80 ? 'HAZIR' : 'NETLEŞTİRME SORULARI'}
                    </span>
                    <div className="flex flex-col gap-2">
                      {results.clarificationChips.map((chip, i) => (
                        <div key={i} className="flex flex-col gap-2">
                          <div 
                            onClick={() => setActiveQuestion(activeQuestion === chip ? null : chip)}
                            className={`border p-3 rounded-xl cursor-pointer transition-colors group ${
                              activeQuestion === chip 
                                ? 'bg-[var(--color-burnt-orange)]/10 border-[var(--color-burnt-orange)]/40' 
                                : 'bg-[var(--color-burnt-orange)]/5 border-[var(--color-burnt-orange)]/20 hover:bg-[var(--color-burnt-orange)]/10'
                            }`}
                          >
                            <p className={`text-xs font-semibold transition-colors ${
                              activeQuestion === chip ? 'text-[var(--color-burnt-orange)]' : 'text-[var(--color-ink)] group-hover:text-[var(--color-burnt-orange)]'
                            }`}>
                              {chip}
                            </p>
                          </div>
                          
                          {/* Interactive Answer Input */}
                          <AnimatePresence>
                            {activeQuestion === chip && (
                              <motion.form 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                                onSubmit={(e) => handleRefinedSearch(e, chip)}
                              >
                                <div className="flex items-center gap-2 mt-1 mb-2">
                                  <input 
                                    autoFocus
                                    type="text"
                                    placeholder="Cevabınızı yazın..."
                                    value={questionAnswer}
                                    onChange={(e) => setQuestionAnswer(e.target.value)}
                                    className="flex-1 bg-white border border-[var(--color-ink)]/10 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--color-burnt-orange)]/50 transition-colors"
                                  />
                                  <button 
                                    type="submit"
                                    disabled={!questionAnswer.trim()}
                                    className="bg-[var(--color-burnt-orange)] text-white p-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                                  >
                                    <ArrowRight size={14} />
                                  </button>
                                </div>
                              </motion.form>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Action Button if Score >= 80 */}
                    {results.context.score >= 80 && isCommand && (
                       <div className="mt-4 pt-4">
                         <button 
                           onClick={() => {
                             // Sadece arayüzü sıfırlar, veri zaten skor 80'i geçtiğinde arka planda kaydedildi.
                             setQuery('');
                             setIsSearching(false);
                             setResults(null);
                           }}
                           className="w-full py-3.5 bg-[var(--color-burnt-orange)] text-white text-sm font-bold rounded-xl shadow-md hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                         >
                           {getActionName(query)} <ArrowRight size={16} />
                         </button>
                       </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-10">
                {/* 2. Collective Results */}
                {results.collectiveResults.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-serif font-bold text-sm tracking-widest text-[var(--color-ink-light)]">{dict.collective_results}</h3>
                    </div>
                    
                    {results.collectiveResults.map(item => (
                      <div key={item.id} className="bg-white p-6 rounded-2xl border border-[var(--color-ink)]/10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--color-consensus)]/10 to-transparent rounded-bl-full pointer-events-none" />
                        
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-consensus)]/10 text-[var(--color-consensus)] rounded-full text-xs font-bold mb-4">
                          <ShieldCheck size={14} />
                          {dict.collective_consensus.replace('{percent}', item.consensus.toString())}
                        </div>

                        <div className="flex justify-between items-start">
                          <div className="max-w-[60%]">
                            <h4 className="font-serif text-2xl font-bold mb-2">{item.title}</h4>
                            <div className="text-sm text-[var(--color-ink-light)] mb-4 leading-relaxed whitespace-pre-wrap">
                              {item.description}
                            </div>
                            <ul className="space-y-2">
                              {item.features.map((feat, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs font-medium text-[var(--color-ink)]">
                                  <span className="text-[var(--color-consensus)]">✓</span> {feat}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="w-[30%] aspect-[4/3] bg-gray-100 rounded-xl relative overflow-hidden flex items-center justify-center border border-gray-200">
                             <div className="text-gray-400 text-xs">Image</div>
                          </div>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-xs text-[var(--color-ink-light)] font-medium bg-[var(--color-paper)] inline-flex px-3 py-1.5 rounded-lg border border-[var(--color-ink)]/5">
                          <div className="flex -space-x-2">
                            <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white"></div>
                            <div className="w-5 h-5 rounded-full bg-gray-400 border-2 border-white"></div>
                            <div className="w-5 h-5 rounded-full bg-gray-500 border-2 border-white"></div>
                          </div>
                          {dict.similar_views.replace('{count}', item.similarCount.toLocaleString())}
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {/* 3. Registered Products */}
                {results.registeredProducts.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="space-y-0.5">
                        <h3 className="font-serif font-bold text-sm tracking-widest text-[var(--color-ink-light)]">{dict.registered_products}</h3>
                        <p className="text-xs text-[var(--color-ink)]/40">{dict.registered_desc}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {results.registeredProducts.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-[var(--color-ink)]/10 shadow-sm flex flex-col">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase mb-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div> {item.brand}
                          </div>
                          <h4 className="font-bold text-sm mb-1">{item.model}</h4>
                          <span className="text-xs text-[var(--color-ink-light)] mb-4">{item.type}</span>
                          
                          <div className="w-full aspect-video bg-gray-50 rounded-lg mb-4 border border-gray-100 flex items-center justify-center">
                             <div className="text-gray-300 text-[10px]">Product</div>
                          </div>

                          <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                            <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-burnt-orange)]">
                              <Star size={12} fill="currentColor" /> {item.score} <span className="text-gray-400 font-normal">({item.ratingCount})</span>
                            </div>
                            <div className="text-[10px] font-bold text-gray-500">Beiwe Score</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Removed redundant AI block from bottom */}


                
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Customer Select Modal for Linking Notes */}
      <AnimatePresence>
        {showCustomerSelectModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--color-ink)] font-serif tracking-tight">Müşteri Seçin</h2>
                <button onClick={() => setShowCustomerSelectModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-[var(--color-ink-light)] mb-4 bg-[var(--color-paper)] p-3 rounded-xl border border-[var(--color-ink)]/10 truncate">
                Eklenecek not: <span className="font-medium italic">{pendingNoteText}</span>
              </p>
              
              <div className="overflow-y-auto flex-1 space-y-2 -mx-2 px-2">
                {customersList.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Henüz kayıtlı müşteriniz yok.
                  </div>
                ) : (
                  customersList.map(customer => {
                    const match = customer.content.match(/\/müşteri\s+(.*)/);
                    const name = match ? match[1] : 'İsimsiz Müşteri';
                    return (
                      <button 
                        key={customer.id}
                        onClick={() => handleLinkNoteToCustomer(customer.id, name)}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-[var(--color-burnt-orange)]/10 hover:text-[var(--color-burnt-orange)] transition-colors border border-transparent hover:border-[var(--color-burnt-orange)]/20 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-[var(--color-ink)]/5 flex items-center justify-center">
                          <Globe size={14} className="opacity-50" />
                        </div>
                        <span className="font-semibold">{name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal - Forced if not logged in */}
      <AuthModal 
        isOpen={isAuthModalOpen || (!isAuthLoading && !user)} 
        onClose={() => {
          if (user) setIsAuthModalOpen(false);
        }} 
        dict={dict} 
        forceLogin={!user}
      />

    </div>
  );
}
