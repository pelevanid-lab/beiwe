'use client';

import React, { useState, useEffect } from 'react';
import { Brain, FileText, CheckSquare, Plus, ArrowRight, Table, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { LogoIcon } from '@/components/Logo';

interface Workspace {
  id: string;
  name: string;
  type: string;
  goals: string;
}

interface Task {
  id: string;
  title: string;
  roomId?: string;
  shelfId?: string;
}

interface Document {
  id: string;
  name: string;
  type: string; // 'document' | 'spreadsheet'
  roomId?: string;
  shelfId?: string;
  isNative?: boolean;
}

export default function DailyPanel({ dict, openTab }: { dict: any, openTab: (tab: any) => void }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [shelves, setShelves] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'tr';

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch Workspaces (Rooms)
        const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
        const res = await fetch(`${apiUrl}/api/smi/nodes`);
        let parsedWorkspaces: Workspace[] = [];
        if (res.ok) {
          const data = await res.json();
          const allNodes = data.nodes || [];
          const userWorkspaces = allNodes.filter((n: any) => 
            n.spaceId === user.uid && 
            n.type === 'workspace' &&
            n.content.includes('Kullanıcı İşletme Bilgisi')
          );
          
          parsedWorkspaces = userWorkspaces.map((w: any) => {
            const content = w.content;
            const nameMatch = content.match(/Oda İsmi:\s*(.*?)\./) || content.match(/İşletme Adı:\s*(.*?)\./);
            const typeMatch = content.match(/Odadaki Rolünüz:\s*(.*?)\./) || content.match(/İşletme Türü:\s*(.*?)\./);
            return {
              id: w.id,
              name: nameMatch ? nameMatch[1].trim() : (dict?.app?.workspace?.btn_new_room || 'Zihin Odası'),
              type: typeMatch ? typeMatch[1].trim() : '',
              goals: ''
            };
          });

          // Shelves will be fetched from Firebase directly below
        }
        
        // Always include a "Genel / Hol" default room for items with no roomId
        parsedWorkspaces.push({
          id: 'hol',
          name: dict?.app?.workspace?.shelf_hall || 'Hol (Genel)',
          type: 'Uncategorized',
          goals: ''
        });

        setWorkspaces(parsedWorkspaces);

        // Fetch Shelves from Firebase
        const qShelves = query(
          collection(db, 'beiwe_shelves'),
          where('ownerId', '==', user.uid)
        );
        const shelfSnap = await getDocs(qShelves);
        const fetchedShelves = shelfSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setShelves(fetchedShelves);

        // Fetch Tasks
        const qTasks = query(
          collection(db, 'beiwe_tasks'),
          where('ownerId', '==', user.uid),
          where('isCompleted', '==', false)
        );
        const taskSnap = await getDocs(qTasks);
        const fetchedTasks = taskSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];
        setTasks(fetchedTasks);

        // Fetch Docs (Native only for dashboard clarity, or all)
        const qDocs = query(
          collection(db, 'beiwe_docs'),
          where('ownerId', '==', user.uid)
        );
        const docSnap = await getDocs(qDocs);
        const fetchedDocs = docSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          isNative: true
        })) as Document[];
        setDocs(fetchedDocs);

      } catch (err) {
        console.error("DailyPanel fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, dict]);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-[var(--color-burnt-orange)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full mt-10 mb-20 relative flex flex-col items-center min-h-[700px]">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-burnt-orange)]/5 to-transparent pointer-events-none rounded-3xl" />
      
      {/* Clean Tree Layout for Workspaces and Shelves */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center gap-24">
        {(() => {
          const activeWorkspaces = workspaces.filter(w => {
            if (w.id === 'hol') return tasks.some(t => !t.roomId);
            return tasks.some(t => t.roomId === w.id);
          });

          if (activeWorkspaces.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 w-full">
                <Brain size={48} className="mb-4 opacity-20" />
                <p>Henüz aktif bir görev bulunmuyor.</p>
              </div>
            );
          }

          return activeWorkspaces.map(w => {
            const roomTasks = tasks.filter(t => t.roomId === w.id || (w.id === 'hol' && !t.roomId));
            const roomShelvesData = shelves.filter(s => s.roomId === w.id);
            
            // Tasks in this room without a shelf
            const unassignedTasks = roomTasks.filter(t => !t.shelfId);

            // Filter shelves to ONLY show those with active tasks
            const activeShelves = roomShelvesData.filter(shelf => {
              const shelfTasks = roomTasks.filter(t => t.shelfId === shelf.id);
              return shelfTasks.length > 0;
            });

            return (
              <div key={w.id} className="flex flex-col items-center w-full relative">
                
                {/* ROOM CARD */}
                <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-[var(--color-ink)]/10 z-20 relative">
                  <div 
                    className="flex items-center gap-3 mb-6 cursor-pointer group"
                    onClick={() => router.push(`/${locale}/app/workspaces/${w.id === 'hol' ? '' : w.id}`)}
                  >
                    <div className={`p-3 rounded-2xl transition-colors ${w.id === 'hol' ? 'bg-gray-100 text-gray-500' : 'bg-indigo-50 text-indigo-600'}`}>
                      <Brain size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--color-ink)] text-xl group-hover:text-[var(--color-burnt-orange)] transition-colors">{w.name}</h3>
                      {w.type && <p className="text-sm text-[var(--color-ink-light)] mt-0.5">{w.type}</p>}
                    </div>
                  </div>

                  {/* Unassigned Tasks (General / In Room but no Shelf) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Genel (Rafa Eklenmemiş)</h4>
                    {unassignedTasks.length > 0 ? (
                      <div className="flex flex-col gap-2">
                         {unassignedTasks.map(task => (
                           <div 
                             key={task.id} 
                             className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-3 cursor-pointer hover:border-[var(--color-burnt-orange)]/40 transition-colors group/task"
                             onClick={() => router.push(`/${locale}/app/workspaces/${w.id === 'hol' ? '' : w.id}`)}
                           >
                             <div className="mt-0.5 w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0 group-hover/task:border-[var(--color-burnt-orange)] transition-colors" />
                             <span className="text-sm font-medium text-gray-700 leading-snug">{task.title}</span>
                           </div>
                         ))}
                      </div>
                    ) : (
                       <p className="text-sm text-gray-400 italic pl-1">Bu alanda direkt görev yok.</p>
                    )}
                  </div>
                </div>

                {/* SHELVES (Drawers) below */}
                {activeShelves.length > 0 && (
                  <div className="w-full mt-10 relative">
                    <div className="flex flex-wrap justify-center w-full gap-6">
                      {activeShelves.map((shelf) => {
                        const shelfTasks = roomTasks.filter(t => t.shelfId === shelf.id);
                        return (
                          <div key={shelf.id} className="flex flex-col items-center w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm relative mt-4">
                             
                             {/* Visual connecting stem up to the room */}
                             <div className="absolute -top-14 left-1/2 w-0.5 h-14 bg-gradient-to-b from-[var(--color-ink)]/5 to-[var(--color-burnt-orange)]/40 -translate-x-1/2 z-0" />
                             <div className="absolute -top-1 w-2 h-2 rounded-full bg-[var(--color-burnt-orange)]/60 left-1/2 -translate-x-1/2 z-10" />

                             <div className="w-full bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-[var(--color-ink)]/10 shadow-sm hover:bg-white/90 hover:shadow-md transition-all relative z-10">
                               <h4 className="font-bold text-sm text-[var(--color-ink)] mb-4 text-center">{shelf.name}</h4>
                               
                               <div className="flex flex-col gap-2">
                                 {shelfTasks.length > 0 ? shelfTasks.map(task => (
                                   <div 
                                     key={task.id} 
                                     className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-3 cursor-pointer hover:border-[var(--color-burnt-orange)]/40 hover:shadow-sm transition-all group/task"
                                     onClick={() => router.push(`/${locale}/app/workspaces/${w.id === 'hol' ? '' : w.id}`)}
                                   >
                                     <div className="mt-0.5 w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0 group-hover/task:border-[var(--color-burnt-orange)] transition-colors" />
                                     <span className="text-sm font-medium text-gray-700 leading-snug">{task.title}</span>
                                   </div>
                                 )) : (
                                   <p className="text-sm text-gray-400 italic text-center w-full">Görev yok</p>
                                 )}
                               </div>
                             </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
