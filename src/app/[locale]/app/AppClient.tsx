'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, Search, Mic, ArrowRight, Bookmark, Globe, X, Maximize2, Minimize2, ShieldCheck, MonitorDown, Star } from 'lucide-react';
import { ClarityResponse, ingestMemory, recallContext, getVerifiedSolutions } from '@/lib/saule-core-client';
import { db } from '@/lib/firebase';
import { collection, query as firestoreQuery, where, getDocs, addDoc } from 'firebase/firestore';
import { LogoIcon } from '@/components/Logo';
import { subscribeToClarityContext, formatClarityContextForLLM } from '@/lib/clarity-context';

import { AuthModal } from '@/components/AuthModal';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchWithGoogleAuth } from '@/lib/google-api';
import { CLARITY_ACTIONS } from '@/lib/clarity-actions/registry';

import AppointmentsClient from './appointments/AppointmentsClient';
import CustomersClient from './customers/CustomersClient';
import CustomerDetailClient from './customers/[id]/CustomerDetailClient';
import InboxClient from './inbox/InboxClient';
import DocsClient from './docs/DocsClient';
import DailyPanel from './DailyPanel';

export default function AppClient({ dict }: { dict: any }) {
  const router = useRouter();
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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

  // Multi-Tab Workspace State
  type AppTab = {
    id: string;
    title: string;
    type: 'customer' | 'customers' | 'appointments' | 'notes' | 'docs' | 'inbox';
    payload?: any;
  };
  const [tabs, setTabs] = useState<AppTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Clarity Engine — Konuşma Geçmişi
  type ChatMessage = { role: 'user' | 'model'; content: string };
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  // Kullanıcının baktığı ekranın bağlamı (clarity-context store'dan)
  const [activeContextString, setActiveContextString] = useState<string>('');

  // Live Support (Human-in-the-Loop) State
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [liveMessages, setLiveMessages] = useState<any[]>([]);

  const openTab = (tab: AppTab) => {
    setTabs(prev => {
      if (!prev.find(t => t.id === tab.id)) {
        return [...prev, tab];
      }
      return prev;
    });
    setActiveTabId(tab.id);
  };

  const closeTab = (tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });
  };

  const closeAllTabs = () => {
    setTabs([]);
    setActiveTabId(null);
  };

  // Subscribe to ClarityContext — sayfa motordan bağlamını gönderir
  useEffect(() => {
    const unsub = subscribeToClarityContext(() => {
      setActiveContextString(formatClarityContextForLLM());
    });
    return unsub;
  }, []);

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

  // Listen to Active Live Support Ticket
  useEffect(() => {
    if (!activeTicketId) {
      setLiveMessages([]);
      return;
    }
    
    // Listen to ticket status
    const { onSnapshot, doc, collection, query, orderBy } = require('firebase/firestore');
    const unsubTicket = onSnapshot(doc(db, 'saule_support_tickets', activeTicketId), (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'resolved') {
          // 1. Fetch transcript and ingest into Semantic Memory
          const { getDocs } = require('firebase/firestore');
          getDocs(query(collection(db, `saule_support_tickets/${activeTicketId}/messages`), orderBy('createdAt', 'asc')))
            .then(async (snap: any) => {
              let transcript = `[CANLI DESTEK GÖRÜŞMESİ - Bilet: ${activeTicketId}]\n`;
              snap.forEach((docSnap: any) => {
                 const msgData = docSnap.data();
                 const sender = msgData.senderName || (msgData.sender === 'user' ? 'Müşteri' : 'Destek');
                 transcript += `${sender}: ${msgData.text}\n`;
              });
              
              if (user) {
                const token = await user.getIdToken();
                await ingestMemory(
                  transcript,
                  'knowledge',
                  { source: 'human_handoff', author: user.uid, createdAt: Date.now(), ticketId: activeTicketId },
                  'fact',
                  'personal',
                  user.uid,
                  token
                );
              }
            })
            .catch((err: any) => console.error("Transcript save error:", err));

          // 2. Clear UI state
          setActiveTicketId(null);
          setAiSynthesis("Destek talebiniz başarıyla çözüldü ve sistem hafızasına kaydedildi.");
        }
      }
    });

    // Listen to messages
    const q = query(
      collection(db, `saule_support_tickets/${activeTicketId}/messages`),
      orderBy('createdAt', 'asc')
    );
    const unsubMessages = onSnapshot(q, (snapshot: any) => {
      const msgs: any[] = [];
      snapshot.forEach((d: any) => msgs.push({ id: d.id, ...d.data() }));
      setLiveMessages(msgs);
    });

    return () => {
      unsubTicket();
      unsubMessages();
    };
  }, [activeTicketId]);

  // Read URL query parameter
  useEffect(() => {
    const q = searchParams.get('q');
    const queryParam = searchParams.get('query');
    const isRestore = searchParams.get('restore');
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
          setCustomersList(userNodes.filter((n: any) => n.content.includes('/customer ') || n.content.includes('/müşteri ')).sort((a: any, b: any) => b.createdAt - a.createdAt));
        }
      } catch (err) {
        console.error("Failed to fetch nodes for live search", err);
      }
    };
    fetchNodes();

    if (isRestore) {
      try {
        const noteData = localStorage.getItem('clarity_restore_note');
        if (noteData) {
          const parsed = JSON.parse(noteData);
          setQuery(parsed.originalQuery || '');
          setResults({
            actionProposal: undefined,
            context: { id: 'history', query: parsed.originalQuery || '', chips: [], score: 100 },
            clarificationChips: [],
            collectiveResults: [],
            contextResults: [],
            registeredProducts: [],
            webResults: [],
            memories: []
          });
          setAiSynthesis(parsed.synthesis || null);
          setAiResponse(parsed.actionResult ? `✅ Geçmiş İşlem Sonucu:\n- ${parsed.actionResult}` : (parsed.synthesis || 'Geçmiş işlem geri yüklendi.'));
          setIsSearching(true);
          hasAutoSearched.current = true;
          // Clean up URL without triggering re-render loop
          router.replace('/tr/app');
        }
      } catch (err) {
        console.error("Restore failed:", err);
      }
    } else if (queryParam) {
      setQuery(queryParam);
      setTimeout(() => {
        handleSearch(undefined, queryParam);
      }, 500);
      router.replace('/tr/app');
    } else if (q && !hasAutoSearched.current) {
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

  // History ve Route paneli toggle dinleyicisi
  useEffect(() => {
    const handleToggleHistory = () => {
      setIsHistoryOpen(prev => !prev);
    };
    const handleRouteUI = (e: any) => {
      const module = e.detail?.module;
      if (module) {
        if (module.startsWith('docs-')) {
           const docId = module.replace('docs-', '');
           openTab({ id: `docs-${docId}`, title: 'Doküman', type: 'docs', payload: { docId } });
        } else if (module === 'docs') {
           openTab({ id: 'docs-module', title: 'Dokümanlar', type: 'docs' });
        }
      }
    };
    
    window.addEventListener('toggleHistoryPanel', handleToggleHistory);
    window.addEventListener('routeUI', handleRouteUI as any);
    return () => {
      window.removeEventListener('toggleHistoryPanel', handleToggleHistory);
      window.removeEventListener('routeUI', handleRouteUI as any);
    };
  }, []);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) {
      e.preventDefault();
      // Brand new search from the top input bar, reset the session memory ID
      currentMemoryDocId.current = null;
    }
    const currentQuery = overrideQuery || query;
    if (!currentQuery.trim()) return;

    if (activeTicketId) {
      // Live Support Mode: Send message to Firestore ticket instead of Gemini
      setQuery('');
      try {
        const { addDoc, collection, serverTimestamp } = require('firebase/firestore');
        await addDoc(collection(db, `saule_support_tickets/${activeTicketId}/messages`), {
          text: currentQuery.trim(),
          sender: 'user',
          senderId: user?.uid || 'unknown',
          senderName: user?.displayName || user?.email || 'Müşteri',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error sending live support message:", err);
      }
      return;
    }
    
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
    if (finalQuery.startsWith('/customer ')) {
       const customerName = finalQuery.replace('/customer ', '').trim();
       const matchedNode = allNodes.find(n => n.content === finalQuery || n.content.includes(customerName));
       if (matchedNode) {
         openTab({
           id: `customer-${matchedNode.id}`,
           title: customerName,
           type: 'customer'
         });
       } else {
         // Fallback if ID is not immediately known, try to find it from context or just open a generic customer tab
         openTab({
           id: `customer-search-${Date.now()}`,
           title: customerName,
           type: 'customer'
         });
       }
       setQuery('');
       setResults(null);
       setIsSearching(false);
       return; 
    }

    if (finalQuery.startsWith('/appointments') || finalQuery.startsWith('/randevular')) {
       openTab({
         id: `appointments-module`,
         title: `Randevular`,
         type: 'appointments'
       });
       setQuery('');
       setResults(null);
       setIsSearching(false);
       return;
    }
    
    if (finalQuery.startsWith('/new-customer ')) {
       if (!user) {
         setIsAuthModalOpen(true);
         setIsSearching(false);
         return;
       }
       const customerName = finalQuery.replace('/new-customer ', '').trim();
       try {
         const token = await user.getIdToken();
         await ingestMemory(
           `/customer ${customerName}`,
           'action',
           { source: 'search_bar_auto', author: user.uid, createdAt: Date.now() },
           'fact',
           'personal',
           user.uid,
           token
         );
         setQuery('');
         setIsSearching(false);
         // Refresh customers list
         const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
         const res = await fetch(`${apiUrl}/api/smi/nodes`);
         if (res.ok) {
           const data = await res.json();
           const userNodes = data.nodes.filter((n: any) => n.spaceId === user.uid);
           setAllNodes(userNodes);
           setCustomersList(userNodes.filter((n: any) => n.content.includes('/customer ') || n.content.includes('/müşteri ')).sort((a: any, b: any) => b.createdAt - a.createdAt));
         }
       } catch (err) {
         console.error(err);
       }
       return;
    }

    if (finalQuery.startsWith('/customer-note ')) {
       if (!user) {
         setIsAuthModalOpen(true);
         setIsSearching(false);
         return;
       }
       const noteText = finalQuery.replace('/customer-note ', '').trim();
       setPendingNoteText(noteText);
       setShowCustomerSelectModal(true);
       setQuery('');
       setIsSearching(false);
       return;
    }
    
    if (finalQuery.startsWith('/task ')) {
       finalType = 'task';
       finalCategory = 'action';
       finalQuery = finalQuery.replace('/task ', '').trim();
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
      let composition = await recallContext(finalQuery, 'default', activeWorkspace);

      // FALLBACK: If embedding/semantic search fails or returns empty, fetch all nodes and let local filtering handle it
      if (!composition.nodes || composition.nodes.length === 0) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
          const nodesRes = await fetch(`${apiUrl}/api/smi/nodes`);
          if (nodesRes.ok) {
            const nodesData = await nodesRes.json();
            if (user) {
              composition.nodes = (nodesData.nodes || []).filter((n: any) => n.spaceId === user.uid);
            }
          }
        } catch (e) {
          console.error("Fallback nodes fetch error", e);
        }
      }

      // 3. Get Verified Solutions
      const verified = await getVerifiedSolutions(composition);

      // ── Tüm Saule node'larını filtre OLMADAN Gemini'ye gönder ──────────────
      // JS keyword filtresi kaldırıldı — Saule'nin semantik aramasına güveniyoruz
      const allContextNodes = composition.nodes || [];

      // Firebase memories (eski Terminal 2.0 uyumluluğu için)
      let firebaseMemories: any[] = [];
      if (user && db) {
        try {
          const q = firestoreQuery(
            collection(db, 'memories'),
            where('userId', '==', user.uid)
          );
          const snapshot = await getDocs(q);
          snapshot.forEach(doc => {
            firebaseMemories.push({ content: doc.data().content, category: doc.data().category || 'knowledge' });
          });
        } catch (err) {
          console.error("Firebase fetch error:", err);
        }
      }

      const combinedNodes = [...allContextNodes, ...firebaseMemories];

      // Call Gemini API in the background to get synthesized context and answer
      setIsGenerating(true);
      
      let token;
      if (user) {
        try {
          token = await user.getIdToken();
        } catch (e) {
          console.error("Failed to get user token", e);
        }
      }

      // Kullanıcının bu sorguyu chatHistory'ye ekle
      const userMessage = { role: 'user' as const, content: currentQuery };
      
      fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: currentQuery, 
          context: combinedNodes.map(n => {
            const text = n.content || '';
            const idTag = n.id ? ` [ID: ${n.id}]` : '';
            if (text.startsWith('/customer')) return `[KAYITLI MÜŞTERİ${idTag}]: ${text.replace(/^\/customer/i, '').trim()}`;
            if (text.startsWith('/appointment')) return `[KAYITLI RANDEVU${idTag}]: ${text.replace(/^\/appointment/i, '').trim()}`;
            if (text.startsWith('/note')) return `[KAYITLI NOT${idTag}]: ${text.replace(/^\/note/i, '').trim()}`;
            return text;
          }).join('\n'),
          chatHistory,         // ← Konuşma geçmişi
          activeContext: activeContextString, // ← Kullanıcının baktığı ekran
          pendingAction: results?.actionProposal || null,
          localTime: new Date().toLocaleString('tr-TR', { timeZoneName: 'short' }),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          userId: user?.uid,
          token: token,
          activeWorkspace: activeWorkspace
        })
      }).then(res => res.json())
        .then(async data => {
          if (data.answer && data.answer.includes('[ESCALATE_TO_HUMAN]')) {
             try {
               const { addDoc, collection, serverTimestamp } = require('firebase/firestore');
               
               let contextData = null;
               try {
                 if (activeContextString) {
                   contextData = JSON.parse(activeContextString);
                 }
               } catch (e) { console.error("Context parse error", e); }

               const docRef = await addDoc(collection(db, 'saule_support_tickets'), {
                 userId: user?.uid || 'unknown',
                 userEmail: user?.email || 'Bilinmiyor',
                 status: 'open',
                 source: 'beiwe_os',
                 createdAt: Date.now(),
                 updatedAt: serverTimestamp(),
                 ticketNumber: `TKT-${Math.floor(Math.random() * 900000) + 100000}`,
                 contextSnapshot: contextData,
                 preHandoffHistory: [
                   ...chatHistory.slice(-5),
                   { role: 'user', content: currentQuery }
                 ]
               });
               
               setActiveTicketId(docRef.id);
               setAiResponse("Müşteri destek ekibine aktarılıyorsunuz. Lütfen bekleyin...");
               setIsGenerating(false);
             } catch (err) {
               console.error("Failed to escalate to human", err);
               setAiResponse("Destek ekibine aktarılırken bir hata oluştu.");
               setIsGenerating(false);
             }
             return;
          }

          if (data.answer) setAiResponse(data.answer);
          
          // Konuşma geçmişini güncelle
          if (data.answer) {
            setChatHistory(prev => [
              ...prev.slice(-20), // Son 20 mesajı tut (token tasarrufu)
              { role: 'user', content: currentQuery },
              { role: 'model', content: data.answer }
            ]);
          }
          
          // Handle AI-driven UI Routing (route_ui tool or topic field)
          // data.uiRoute gelirse o önceliklidir, yoksa data.topic'e bakılır
          const routeTarget = data.uiRoute || data.topic;
          const moduleTabMap: Record<string, { id: string; title: string; type: AppTab['type'] }> = {
            customers:    { id: 'customers-module',    title: 'Müşteriler',    type: 'customers' },
            appointments: { id: 'appointments-module', title: 'Randevular',    type: 'appointments' },
            notes:        { id: 'notes-module',        title: 'Notlar',        type: 'notes' },
            docs:         { id: 'docs-module',         title: 'Dökümanlar',    type: 'docs' },
          };
          if (routeTarget && moduleTabMap[routeTarget]) {
            openTab(moduleTabMap[routeTarget]);
          }

          
          if (data.clarificationQuestions || data.clarityScore !== undefined) {
             setResults(prev => {
               if (!prev) return prev;
               const score = data.clarityScore !== undefined ? data.clarityScore : prev.context.score;
               let questions = data.clarificationQuestions || [];
               
               const newProposal = data.actionProposal || null;
              if (newProposal) {
                if (newProposal.type === 'create_customer') {
                  openTab({
                    id: `customer-pending`,
                    title: newProposal.payload?.name || 'Yeni Müşteri (Taslak)',
                    type: 'customer'
                  });
                } else if (newProposal.type === 'create_appointment' || newProposal.type === 'update_appointment' || newProposal.type === 'delete_appointment') {
                  openTab({
                    id: `appointments-module`,
                    title: `Randevular`,
                    type: 'appointments'
                  });
                } else if (newProposal.type === 'add_note' || newProposal.type === 'delete_note') {
                  const customerName = newProposal.payload?.customer;
                  if (customerName) {
                    const targetNode = combinedNodes.find((n: any) => n.content?.toLowerCase().startsWith('/customer') && n.content?.toLowerCase().includes(customerName.toLowerCase()));
                    if (targetNode) {
                      openTab({
                        id: `customer-${targetNode.id}`,
                        title: customerName,
                        type: 'customer'
                      });
                    }
                  }
                }
              }

              return { 
                ...prev, 
                actionProposal: newProposal,
                context: {
                  ...prev.context,
                  score
                },
                clarificationChips: [...questions, "Eklemek istediğiniz başka bir detay var mı?"] 
              };
            });
          } else if (data.actionProposal) {
             if (data.actionProposal.type === 'create_customer') {
               openTab({
                 id: `customer-pending`,
                 title: data.actionProposal.payload?.name || 'Yeni Müşteri (Taslak)',
                 type: 'customer'
               });
             } else if (data.actionProposal.type === 'create_appointment' || data.actionProposal.type === 'update_appointment' || data.actionProposal.type === 'delete_appointment') {
               openTab({
                 id: `appointments-module`,
                 title: `Randevular`,
                 type: 'appointments'
               });
             } else if (data.actionProposal.type === 'add_note' || data.actionProposal.type === 'delete_note') {
               const customerName = data.actionProposal.payload?.customer;
               if (customerName) {
                 const targetNode = combinedNodes.find((n: any) => n.content?.toLowerCase().startsWith('/customer') && n.content?.toLowerCase().includes(customerName.toLowerCase()));
                 if (targetNode) {
                   openTab({
                     id: `customer-${targetNode.id}`,
                     title: customerName,
                     type: 'customer'
                   });
                 }
               }
             } else if (data.actionProposal.type === 'send_email') {
               const email = data.actionProposal.payload?.to;
               if (email) {
                 const targetNode = combinedNodes.find((n: any) => n.content?.toLowerCase().startsWith('/customer') && n.content?.toLowerCase().includes(email.toLowerCase()));
                 if (targetNode) {
                   const match = targetNode.content.match(/\/(?:customer|müşteri)\s+([^-]+)/i);
                   const customerName = match ? match[1].trim() : email;
                   openTab({
                     id: `customer-${targetNode.id}`,
                     title: customerName,
                     type: 'customer'
                   });
                 }
               }
             }
             setResults(prev => prev ? { ...prev, actionProposal: data.actionProposal } : prev);
          }

          if (data.uiRoute) {
            const customerMatch = data.uiRoute.match(/customer-(.+)/);
            const docsMatch = data.uiRoute.match(/docs-(.+)/);
            
            if (customerMatch) {
              const targetNode = combinedNodes.find((n: any) => n.id === customerMatch[1]);
              if (targetNode) {
                const match = targetNode.content.match(/\/(?:customer|müşteri)\s+([^-]+)/i);
                const customerName = match ? match[1].trim() : 'Müşteri';
                openTab({ id: `customer-${targetNode.id}`, title: customerName, type: 'customer' });
              }
            } else if (docsMatch) {
              openTab({ id: `docs-${docsMatch[1]}`, title: 'Doküman', type: 'docs', payload: { docId: docsMatch[1] } });
            } else if (data.uiRoute === 'customers') {
              openTab({ id: 'customers-module', title: 'Müşteriler', type: 'customers' });
            } else if (data.uiRoute === 'inbox') {
              openTab({ id: 'inbox-module', title: 'İletişim Merkezi', type: 'inbox' });
            } else if (data.uiRoute === 'docs') {
              openTab({ id: 'docs-module', title: 'Dokümanlar', type: 'docs' });
            } else if (data.uiRoute === 'appointments') {
              openTab({ id: 'appointments-module', title: 'Randevular', type: 'appointments' });
            } else if (data.uiRoute === 'notes') {
              openTab({ id: 'notes-module', title: 'Notlar', type: 'notes' });
            }

            // Eğer eylem teklifi yoksa ve sadece yönlendirme yapıldıysa arama ekranını kapat
            if (!data.actionProposal) {
              setTimeout(() => {
                setIsSearching(false);
                setQuery('');
              }, 1500); // Kullanıcının yönlendiriliyor mesajını okuması için kısa bir gecikme
            }
          }

          if (data.actionProposal?.isApproved) {
            handleExecuteAction(data.actionProposal);
          }
          if (data.synthesizedContext) {
            setAiSynthesis(data.synthesizedContext);
          }

          // If Clarity Score is high (>=80), the intent is very clear.
          // Delegate the semantic ingestion to the Saule SML core layer.
          if (data.clarityScore && data.clarityScore >= 80 && user && db) {
             const memoryContent = data.synthesizedContext 
                ? `[ORIGINAL_QUERY] ${finalQuery}\n[SYNTHESIS] ${data.synthesizedContext}`
                : `[ORIGINAL_QUERY] ${finalQuery}`;

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
          setAiResponse("İşlem sırasında bir hata oluştu veya bağlantı zaman aşımına uğradı.");
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
          score: 0
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

  const handleExecuteAction = async (overrideProposal?: any) => {
    const actionProposal = overrideProposal || results?.actionProposal;
    const currentQuery = query || "Manuel Onay";
    if (!user || !actionProposal) return;
    try {
      const token = await user.getIdToken();
      
      // Update UI to show loading on button
      setResults(prev => prev ? { 
        ...prev, 
        actionProposal: { ...prev.actionProposal!, buttonText: dict?.processing || "İşleniyor..." } 
      } : prev);

      const actionDef = CLARITY_ACTIONS[actionProposal.type];
      
      if (actionDef) {
        const result = await actionDef.execute(actionProposal.payload, { 
          user, 
          token, 
          activeWorkspace, 
          currentQuery 
        });
        
        // Update Results to show success or error
        setResults(prev => prev ? { 
          ...prev, 
          actionProposal: { 
            ...prev.actionProposal!, 
            buttonText: result.success ? "✅ İşlem Başarıyla Tamamlandı" : "❌ Bir Hata Oluştu" 
          } 
        } : prev);
        
        // Refresh context slightly
        setTimeout(() => {
          setResults(prev => prev ? { ...prev, actionProposal: undefined } : prev);
          
          if (result.success) {
            setAiResponse(`✅ Harika! İşlemleri başarıyla tamamladım:\n- ${result.message}`);
            
            // Auto-open Tab Workspace based on action type
            if (actionProposal.type === 'create_customer') {
               const customerId = result.data?.id || `new-customer-${Date.now()}`;
               closeTab('customer-pending');
               setTimeout(() => {
                 openTab({
                   id: `customer-${customerId}`,
                   title: actionProposal.payload.name || 'Yeni Müşteri',
                   type: 'customer'
                 });
               }, 50);
            } else if (actionProposal.type === 'create_appointment' || actionProposal.type === 'update_appointment' || actionProposal.type === 'delete_appointment') {
               closeTab('appointments-module');
               setTimeout(() => {
                 openTab({
                   id: `appointments-module`,
                   title: `Randevular`,
                   type: 'appointments'
                 });
               }, 100);
            } else if (actionProposal.type === 'add_note' || actionProposal.type === 'delete_note') {
               const customerName = actionProposal.payload?.customer;
               if (customerName) {
                 const targetNode = allNodes.find((n: any) => n.content?.toLowerCase().startsWith('/customer') && n.content?.toLowerCase().includes(customerName.toLowerCase()));
                 if (targetNode) {
                   closeTab(`customer-${targetNode.id}`);
                   setTimeout(() => {
                     openTab({
                       id: `customer-${targetNode.id}`,
                       title: customerName,
                       type: 'customer'
                     });
                   }, 100);
                 }
               }
             } else if (actionProposal.type === 'send_email') {
               closeTab('inbox-module');
               setTimeout(() => {
                 openTab({
                   id: `inbox-module`,
                   title: `İletişim Merkezi`,
                   type: 'inbox'
                 });
               }, 100);
             }
          } else {
            setAiResponse(`❌ Üzgünüm, bir hata oluştu:\n- ${result.message}`);
          }
        }, 1500);
      } else {
        console.error("Unknown action type:", actionProposal.type);
      }
      
      setQuery('');
      
    } catch (err) {
      console.error("Execute action error", err);
      setResults(prev => prev ? { 
        ...prev, 
        actionProposal: { ...prev.actionProposal!, buttonText: "❌ Hata Oluştu" } 
      } : prev);
    }
  };

  const getActionName = (q: string) => {
    if (q.startsWith('/note ')) return 'Not Ekle';
    if (q.startsWith('/task ')) return 'Görev Ekle';
    if (q.startsWith('/customer ')) return 'Müşteri Ekle';
    if (q.startsWith('/fatura ')) return 'Fatura Ekle';
    return 'Kaydet';
  };
  const isCommand = query.startsWith('/');

  return (
    <div className="flex-1 w-full flex bg-[var(--color-paper)] h-screen overflow-hidden">
      
      {/* Left Sidebar for History (Transactions) */}
      <AnimatePresence>
        {!activeIframeUrl && isHistoryOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white border-r border-[var(--color-ink)]/10 h-full flex flex-col shrink-0 z-10 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-[var(--color-ink)]/5 shrink-0 bg-[var(--color-paper)]/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-[var(--color-ink-light)] tracking-widest uppercase">İşlem Geçmişi</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="p-1 hover:bg-[var(--color-ink)]/5 rounded-md text-[var(--color-ink)]/40 hover:text-[var(--color-ink)]">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 w-80">
              {allNodes.slice(0, 30).map(node => (
                <div 
                  key={node.id} 
                  className="p-4 bg-[var(--color-ink)]/5 rounded-2xl text-sm text-[var(--color-ink)] hover:bg-[var(--color-ink)]/10 cursor-pointer transition-colors border border-transparent hover:border-[var(--color-ink)]/10 group"
                  onClick={() => { setQuery(node.content); setIsHistoryOpen(false); }}
                >
                  <div className="font-semibold line-clamp-2 leading-snug">{node.content}</div>
                  <div className="text-[10px] text-[var(--color-ink)]/40 mt-3 font-bold uppercase tracking-wider">
                    {new Date(node.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {allNodes.length === 0 && (
                <div className="text-sm font-medium text-[var(--color-ink)]/40 text-center mt-10">
                  Henüz kayıt yok.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

            {/* Live Search Suggestions for /note */}
            {query.startsWith('/note ') && query.replace('/note ', '').trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[var(--color-ink)]/10 z-50 overflow-hidden max-h-60 overflow-y-auto">
                {allNodes
                  .filter(n => n.content.toLowerCase().includes(query.replace('/note ', '').trim().toLowerCase()))
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
                      <p className="text-sm text-[var(--color-ink)] line-clamp-2">{n.content.replace(/^\/note\s+/i, '')}</p>
                    </div>
                  ))}
                {allNodes.filter(n => n.content.toLowerCase().includes(query.replace('/note ', '').trim().toLowerCase())).length === 0 && (
                  <div className="p-4 text-sm text-[var(--color-ink-light)] text-center">
                    Böyle bir not bulunamadı, Enter'a basarak yeni kaydedebilirsiniz.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Commands below search bar */}
          <div className={`w-full flex flex-wrap justify-center gap-2 mt-4 transition-all duration-300 ${isSearching || activeIframeUrl ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
             <span onClick={() => setQuery('/new-customer ')} className="px-4 py-2 bg-white border border-[var(--color-ink)]/10 rounded-full text-xs font-bold tracking-wide text-[var(--color-ink-light)] shadow-sm cursor-pointer hover:border-[var(--color-burnt-orange)] hover:text-[var(--color-burnt-orange)] transition-colors">/new-customer</span>
             <span onClick={() => setQuery('/customer ')} className="px-4 py-2 bg-white border border-[var(--color-ink)]/10 rounded-full text-xs font-bold tracking-wide text-[var(--color-ink-light)] shadow-sm cursor-pointer hover:border-[var(--color-burnt-orange)] hover:text-[var(--color-burnt-orange)] transition-colors">/customer</span>
             <span onClick={() => setQuery('/appointment ')} className="px-4 py-2 bg-white border border-[var(--color-ink)]/10 rounded-full text-xs font-bold tracking-wide text-[var(--color-ink-light)] shadow-sm cursor-pointer hover:border-[var(--color-burnt-orange)] hover:text-[var(--color-burnt-orange)] transition-colors">/appointment</span>
             <span onClick={() => setQuery('/task ')} className="px-4 py-2 bg-white border border-[var(--color-ink)]/10 rounded-full text-xs font-bold tracking-wide text-[var(--color-ink-light)] shadow-sm cursor-pointer hover:border-[var(--color-burnt-orange)] hover:text-[var(--color-burnt-orange)] transition-colors">/task</span>
             <span onClick={() => setQuery('/note ')} className="px-4 py-2 bg-white border border-[var(--color-ink)]/10 rounded-full text-xs font-bold tracking-wide text-[var(--color-ink-light)] shadow-sm cursor-pointer hover:border-[var(--color-burnt-orange)] hover:text-[var(--color-burnt-orange)] transition-colors">/note</span>
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
        </motion.div>

        {/* Results Area */}
        <AnimatePresence>
          {((isSearching && results) || activeTicketId) && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="w-full max-w-3xl flex flex-col pb-24"
            >
              <div className="flex flex-col gap-6 mb-8 mt-4">
                
                {activeTicketId ? (
                  <section className="mb-8">
                    <div className="bg-white rounded-3xl border border-blue-500/30 shadow-sm relative overflow-hidden flex flex-col h-[500px]">
                      <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="font-bold text-blue-900">Müşteri Destek Merkezi (Canlı)</span>
                        </div>
                        <span className="text-xs text-blue-600/70 font-mono">{activeTicketId}</span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {liveMessages.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">
                            Destek ekibine bağlanılıyor, lütfen bekleyin...
                          </div>
                        ) : (
                          liveMessages.map(msg => {
                            const isUser = msg.sender === 'user';
                            return (
                              <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                  isUser 
                                    ? 'bg-[var(--color-burnt-orange)] text-white rounded-br-sm' 
                                    : 'bg-blue-500 text-white rounded-bl-sm'
                                }`}>
                                  {!isUser && <p className="text-[10px] font-bold text-blue-200 mb-1">{msg.senderName || 'Destek'}</p>}
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </section>
                ) : (
                /* Unified AI Response Section at the Top */
                (aiResponse || aiSynthesis || isGenerating) && (
                  <section className="mb-8">
                    <div className="bg-white rounded-3xl border border-[var(--color-burnt-orange)]/30 shadow-sm relative overflow-hidden">
                      {/* Decorative Background */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--color-burnt-orange)]/10 to-transparent rounded-bl-full pointer-events-none" />
                      
                      {/* Clarity Score Background Indicator (Subtle) */}
                      {(results?.context?.score ?? 0) > 0 && (
                        <div className="absolute top-4 right-6 flex items-center gap-2 text-[var(--color-ink)]/30">
                          <div className="text-[10px] font-bold tracking-widest uppercase">Netlik</div>
                          <div className="font-serif text-lg font-bold">%{results?.context?.score}</div>
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
                              ) : isGenerating ? (
                                <div className="flex items-center gap-3 text-[var(--color-burnt-orange)] font-semibold py-2">
                                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                  <span>Düşünce bulutu oluşturuluyor...</span>
                                </div>
                              ) : (
                                <div className="text-[var(--color-ink-light)] italic">İşlem tamamlandı.</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 3. Action Proposal Card */}
                        {results?.actionProposal && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 p-5 bg-white border-2 border-[var(--color-burnt-orange)]/40 rounded-2xl shadow-sm flex flex-col gap-4 relative z-10"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-[var(--color-burnt-orange)]/10 text-[var(--color-burnt-orange)] rounded-lg">
                                {results.actionProposal.type === 'create_appointment' ? (
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-[var(--color-ink)] mb-1">
                                  {dict?.awaiting_approval || "Onay Bekleniyor"}
                                </h5>
                                <div className="text-sm text-[var(--color-ink-light)] mb-3">
                                  {CLARITY_ACTIONS[results.actionProposal.type] ? (
                                    CLARITY_ACTIONS[results.actionProposal.type].renderUI(results.actionProposal.payload)
                                  ) : (
                                    <span>Tanımlanamayan eylem: {results.actionProposal.type}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleExecuteAction()}
                                  disabled={results.actionProposal.buttonText.includes('İşleniyor') || results.actionProposal.buttonText.includes('Başarıyla')}
                                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                    results.actionProposal.buttonText.includes('Başarıyla')
                                      ? 'bg-green-500 text-white shadow-green-500/30'
                                      : results.actionProposal.buttonText.includes('Hata')
                                      ? 'bg-red-500 text-white'
                                      : 'bg-[var(--color-burnt-orange)] hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                                  }`}
                                >
                                  {results.actionProposal.buttonText}
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-[var(--color-ink)]/50 mt-1 flex items-center gap-1 border-t border-[var(--color-ink)]/5 pt-3">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Değiştirmek istediğiniz bir detay varsa arama çubuğuna yazarak asistanı yönlendirebilirsiniz.
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </section>
                ))}

                {/* Chat Input for Continuous Conversation */}
                <div className="pt-4 mt-6 border-t border-[var(--color-ink)]/5">
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!questionAnswer.trim()) return;
                      
                      if (activeTicketId) {
                        handleSearch(undefined, questionAnswer);
                        setQuestionAnswer('');
                        return;
                      }

                      // Hafızaya yaz
                      if (user) {
                         const token = await user.getIdToken();
                         await ingestMemory(
                           `[GEÇMİŞ İŞLEM]: ${query}\n[KULLANICI TALEBİ]: ${questionAnswer}`,
                           'action',
                           { source: 'clarification', author: 'user', createdAt: Date.now() },
                           'clarification',
                           'personal',
                           user.uid,
                           token
                         );
                      }

                      const combinedQuery = `ÖNCEKİ BAĞLAM: ${query} | YENİ İSTEK: ${questionAnswer}`;
                      setQuery(combinedQuery);
                      handleSearch(undefined, combinedQuery);
                      setQuestionAnswer('');
                    }}
                    className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-[var(--color-ink)]/10 shadow-sm focus-within:border-[var(--color-burnt-orange)]/50 focus-within:ring-4 focus-within:ring-[var(--color-burnt-orange)]/10 transition-all"
                  >
                    <div className="flex-1 px-3">
                      <input 
                        type="text"
                        autoFocus
                        placeholder={dict.chat_input_placeholder || "Asistana cevap verin, bir detay ekleyin ya da yeni bir soru sorun..."}
                        value={questionAnswer}
                        onChange={(e) => setQuestionAnswer(e.target.value)}
                        className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-light)] focus:outline-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={!questionAnswer.trim() || isGenerating}
                      className="bg-[var(--color-burnt-orange)] text-white p-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center shrink-0"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </form>
                </div>
              </div>


              <div className={`space-y-10 ${tabs.length > 0 ? 'hidden' : ''}`}>
                {/* 2. Collective Results */}
                {(results?.collectiveResults?.length ?? 0) > 0 && (
                  <section className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-serif font-bold text-sm tracking-widest text-[var(--color-ink-light)]">{dict.collective_results}</h3>
                    </div>
                    
                    {results?.collectiveResults?.map(item => (
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
                {(results?.registeredProducts?.length ?? 0) > 0 && (
                  <section className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="space-y-0.5">
                        <h3 className="font-serif font-bold text-sm tracking-widest text-[var(--color-ink-light)]">{dict.registered_products}</h3>
                        <p className="text-xs text-[var(--color-ink)]/40">{dict.registered_desc}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {results?.registeredProducts?.map(item => (
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

        {/* ── GÜNLÜK PANEL (BUGÜN) ─────────────────────────────────────────
            Hiç sekme açık değilse (tabs.length === 0) gösterilir.
        ──────────────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {tabs.length === 0 && !isSearching && !results && (
            <DailyPanel dict={dict} openTab={openTab} />
          )}
        </AnimatePresence>

        {/* ── MODÜL PANELİ ─────────────────────────────────────────────────
            Clarity Engine bir modülü tanıdığında bu alan açılır.
            isSearching'e bağlı değil — her zaman çalışır.
        ──────────────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {tabs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 24, stiffness: 200 }}
              className="w-full max-w-3xl flex flex-col mb-8 mt-4"
            >
              {/* Tab Bar */}
              <div className="flex items-center bg-[#f5f5f5] border border-b-0 border-[var(--color-ink)]/10 rounded-t-2xl px-2 pt-2 gap-1 overflow-x-auto">
                {tabs.map(tab => (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl cursor-pointer select-none min-w-[140px] max-w-[240px] border border-b-0 transition-colors
                      ${activeTabId === tab.id
                        ? 'bg-white border-[var(--color-ink)]/10 text-[var(--color-ink)] z-10 before:absolute before:-bottom-[1px] before:left-0 before:right-0 before:h-[1px] before:bg-white'
                        : 'bg-transparent border-transparent text-[var(--color-ink-light)] hover:bg-white/70 hover:text-[var(--color-ink)]'
                      }`}
                  >
                    <div className="truncate flex-1 text-sm font-medium">{tab.title}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                      className={`p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-black/5 transition-all ${activeTabId === tab.id ? 'opacity-60' : ''}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <div className="flex-1" />
                <button
                  onClick={closeAllTabs}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--color-ink-light)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mr-2 mb-1 shrink-0"
                >
                  Kapat
                </button>
              </div>

              {/* Tab Content */}
              <div className="relative bg-white border border-[var(--color-ink)]/10 rounded-b-2xl overflow-hidden" style={{ minHeight: 520 }}>
                {tabs.map(tab => (
                  <div
                    key={tab.id}
                    className={`absolute inset-0 overflow-y-auto transition-opacity duration-300 ${activeTabId === tab.id ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                  >
                    {tab.type === 'customer' && <CustomerDetailClient dict={dict} id={tab.id.replace('customer-', '')} />}
                    {tab.type === 'customers' && <CustomersClient dict={dict} />}
                    {tab.type === 'appointments' && <AppointmentsClient dict={dict} />}
                    {tab.type === 'notes' && <div className="p-8 text-center text-gray-400 text-sm">Not modülü yakında.</div>}
                    {tab.type === 'docs' && <DocsClient dict={dict} />}
                    {tab.type === 'inbox' && <InboxClient dict={dict} />}
                  </div>
                ))}
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
                    const match = customer.content.match(/\/(?:customer|müşteri)\s+(.*)/);
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
