'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Brain, ArrowLeft, Plus, Check, Trash2, Loader2, Sparkles, Edit2, Users, UserPlus, FileText, Table } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { ingestMemory, deleteNode } from '@/lib/saule-core-client';
import { motion, AnimatePresence } from 'framer-motion';
import NativeDocEditor from '../../docs/NativeDocEditor';
import NativeSheetEditor from '../../docs/NativeSheetEditor';

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: any;
  ownerId: string;
  roomId?: string;
  roomName?: string;
  shelfId?: string;
  shelfName?: string;
  smiNodeId?: string;
}

export default function RoomClient({ dict, roomId }: { dict: any, roomId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'tr';
  
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');

  // Contacts state
  const [contacts, setContacts] = useState<any[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Shelves state
  const [shelves, setShelves] = useState<any[]>([]);
  const [activeShelfId, setActiveShelfId] = useState<string>('hol');
  const [showAddShelfModal, setShowAddShelfModal] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [isAddingShelf, setIsAddingShelf] = useState(false);

  // Docs state
  const [docsList, setDocsList] = useState<any[]>([]);
  const [showNewDocEditor, setShowNewDocEditor] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [showNewSheetEditor, setShowNewSheetEditor] = useState(false);
  const [editingSheet, setEditingSheet] = useState<any>(null);

  const fetchDocs = async () => {
    if (!user || !roomId) return;
    try {
      const dq = query(
        collection(db, 'beiwe_docs'),
        where('roomId', '==', roomId),
        where('ownerId', '==', user.uid)
      );
      const dsnap = await getDocs(dq);
      const docsData = dsnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDocsList(docsData);
    } catch (e) {
      console.error("Error fetching docs", e);
    }
  };

  useEffect(() => {
    const fetchRoomAndTasks = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch Room
        const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
        const res = await fetch(`${apiUrl}/api/smi/nodes`);
        if (res.ok) {
          const data = await res.json();
          const allNodes = data.nodes || [];
          const w = allNodes.find((n: any) => n.id === roomId && n.spaceId === user.uid);
          
          if (w) {
            const content = w.content || '';
            const nameMatch = content.match(/Oda İsmi:\s*(.*?)\./) || content.match(/İşletme Adı:\s*(.*?)\./);
            const typeMatch = content.match(/Odadaki Rolünüz:\s*(.*?)\./) || content.match(/İşletme Türü:\s*(.*?)\./);
            const goalsMatch = content.match(/Amaçlar ve Hedefler:\s*(.*?)\./);
            
            setRoom({
              id: w.id,
              name: nameMatch ? nameMatch[1].trim() : 'İsimsiz Zihin Odası',
              type: typeMatch ? typeMatch[1].trim() : '',
              goals: goalsMatch ? goalsMatch[1].trim() : ''
            });
          }
          
          // Fetch Contacts
          const userContacts = allNodes.filter((n: any) => 
            n.spaceId === user.uid && 
            (n.content.includes('/customer ') || n.content.includes('/müşteri '))
          ).sort((a: any, b: any) => b.createdAt - a.createdAt);
          
          const uniqueContacts: any[] = [];
          const seenNames = new Set();
          userContacts.forEach((c: any) => {
            const match = c.content.match(/\/(?:customer|müşteri)\s+([^-]+)/i);
            const name = match ? match[1].trim().toLowerCase() : '';
            if (name && !seenNames.has(name)) {
              seenNames.add(name);
              uniqueContacts.push(c);
            }
          });
          
          setAllContacts(uniqueContacts);
          
          const currentRoomName = w ? (w.content.match(/Oda İsmi:\s*(.*?)\./) || w.content.match(/İşletme Adı:\s*(.*?)\./))?.[1]?.trim() : '';
          
          if (currentRoomName) {
            const roomContacts = uniqueContacts.filter(c => {
               if (!c.content.includes('- Zihin Odaları:')) return false;
               const match = c.content.match(/- Zihin Odaları:\s*([^-]+)/i);
               if (!match) return false;
               const roomNames = match[1].split(',').map((s:string) => s.trim());
               return roomNames.includes(currentRoomName);
            });
            setContacts(roomContacts);
          }
        }
        
        // Fetch Shelves
        const sq = query(
          collection(db, 'beiwe_shelves'),
          where('roomId', '==', roomId)
        );
        const ssnap = await getDocs(sq);
        const shelvesData = ssnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setShelves(shelvesData);
        
        // Fetch Tasks
        const tq = query(
          collection(db, 'beiwe_tasks'),
          where('ownerId', '==', user.uid),
          where('roomId', '==', roomId)
        );
        const tsnap = await getDocs(tq);
        const tasksData: Task[] = tsnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Task));
        
        // Manual sort: newest first
        tasksData.sort((a, b) => {
          const tA = a.createdAt?.toMillis() || 0;
          const tB = b.createdAt?.toMillis() || 0;
          return tB - tA;
        });
        setTasks(tasksData);
        
        await fetchDocs();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoomAndTasks();
  }, [user, roomId]);

  const syncTaskToSmi = async (taskData: any, oldSmiNodeId?: string) => {
    if (!user) return null;
    const token = await user.getIdToken();
    if (oldSmiNodeId) {
      await deleteNode(oldSmiNodeId, token).catch(console.error);
    }
    if (!taskData.roomId) return null;
    
    let smiContent = `[Görev] Başlık: ${taskData.title}. Zihin Odaları: ${taskData.roomName}.`;
    if (taskData.shelfName) smiContent += ` Raf: ${taskData.shelfName}.`;
    smiContent += ` Durum: ${taskData.isCompleted ? 'Tamamlandı' : 'Açık'}.`;
    
    const ingestRes = await ingestMemory(
      smiContent,
      'action',
      { source: 'tasks_page', taskId: taskData.id || 'new', author: user.uid, createdAt: Date.now() },
      'fact',
      'personal',
      user.uid,
      token
    );
    return ingestRes?.id || ingestRes?.nodeId || null;
  };

  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim() || !user || !room) return;
    setIsAdding(true);

    try {
      const newTaskData: any = {
        title: newTaskTitle.trim(),
        isCompleted: false,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        roomId: room.id,
        roomName: room.name,
        shelfId: activeShelfId === 'hol' ? null : activeShelfId,
        shelfName: activeShelfId === 'hol' ? null : shelves.find(s => s.id === activeShelfId)?.name
      };

      const docRef = await addDoc(collection(db, 'beiwe_tasks'), newTaskData);
      newTaskData.id = docRef.id;
      
      const newSmiNodeId = await syncTaskToSmi(newTaskData);
      if (newSmiNodeId) {
        await updateDoc(docRef, { smiNodeId: newSmiNodeId });
        newTaskData.smiNodeId = newSmiNodeId;
      }
      
      const newTask: Task = {
        ...newTaskData,
        createdAt: { toMillis: () => Date.now() }
      };

      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelfName.trim() || !user || !room) return;
    setIsAddingShelf(true);
    
    try {
      const docRef = await addDoc(collection(db, 'beiwe_shelves'), {
        name: newShelfName.trim(),
        roomId: room.id,
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      setShelves([...shelves, { id: docRef.id, name: newShelfName.trim(), roomId: room.id, ownerId: user.uid }]);
      setNewShelfName('');
      setShowAddShelfModal(false);
      setActiveShelfId(docRef.id);
    } catch (error) {
      console.error("Error adding shelf:", error);
    } finally {
      setIsAddingShelf(false);
    }
  };

  const handleToggleCompletion = async (taskId: string, currentStatus: boolean) => {
    try {
      const targetTask = tasks.find(t => t.id === taskId);
      let newSmiNodeId = targetTask?.smiNodeId;
      if (targetTask && targetTask.roomId) {
        const updatedTaskData = { ...targetTask, isCompleted: !currentStatus };
        newSmiNodeId = await syncTaskToSmi(updatedTaskData, targetTask.smiNodeId);
      }

      await updateDoc(doc(db, 'beiwe_tasks', taskId), {
        isCompleted: !currentStatus,
        updatedAt: serverTimestamp(),
        smiNodeId: newSmiNodeId || null
      });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, isCompleted: !currentStatus, smiNodeId: newSmiNodeId || undefined } : t));
    } catch (error) {
      console.error("Error toggling task:", error);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, isCompleted: currentStatus } : t));
    }
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editTaskTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    try {
      const targetTask = tasks.find(t => t.id === taskId);
      let newSmiNodeId = targetTask?.smiNodeId;
      if (targetTask && targetTask.roomId) {
        const updatedTaskData = { ...targetTask, title: editTaskTitle.trim() };
        newSmiNodeId = await syncTaskToSmi(updatedTaskData, targetTask.smiNodeId);
      }
      
      await updateDoc(doc(db, 'beiwe_tasks', taskId), {
        title: editTaskTitle.trim(),
        updatedAt: serverTimestamp(),
        smiNodeId: newSmiNodeId || null
      });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, title: editTaskTitle.trim(), smiNodeId: newSmiNodeId || undefined } : t));
      setEditingTaskId(null);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const targetTask = tasks.find(t => t.id === taskId);
      if (targetTask?.smiNodeId && user) {
        const token = await user.getIdToken();
        await deleteNode(targetTask.smiNodeId, token).catch(console.error);
      }
      setTasks(tasks.filter(t => t.id !== taskId));
      await deleteDoc(doc(db, 'beiwe_tasks', taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleAddContactsToRoom = async () => {
    if (selectedContacts.length === 0 || !user || !room) return;
    setIsAddingContact(true);
    
    try {
      const token = await user.getIdToken();
      for (const contactId of selectedContacts) {
        const contact = allContacts.find(c => c.id === contactId);
        if (!contact) continue;
        
        let content = contact.content;
        let existingRooms: string[] = [];
        
        if (content.includes('- Zihin Odaları:')) {
          const match = content.match(/- Zihin Odaları:\s*([^-]+)/i);
          if (match) {
            existingRooms = match[1].split(',').map((s:string) => s.trim());
            content = content.replace(/- Zihin Odaları:\s*([^-]+)/i, '');
          }
        }
        
        if (!existingRooms.includes(room.name)) {
          existingRooms.push(room.name);
        }
        
        content = `${content.trim()} - Zihin Odaları: ${existingRooms.join(', ')}`;
        
        const q = query(collection(db, 'smi_nodes'), where('id', '==', contactId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await deleteDoc(doc(db, 'smi_nodes', snap.docs[0].id));
        } else {
          const q2 = query(collection(db, 'nodes'), where('id', '==', contactId));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) await deleteDoc(doc(db, 'nodes', snap2.docs[0].id));
        }
        
        await ingestMemory(
          content,
          'action',
          { source: 'room_page', author: user.uid, createdAt: Date.now() },
          'fact',
          'personal',
          user.uid,
          token
        );
      }
      
      setShowAddContactModal(false);
      setSelectedContacts([]);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setIsAddingContact(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center py-20 bg-[var(--color-paper)] h-full">
        <Loader2 className="animate-spin text-[var(--color-burnt-orange)] w-10 h-10" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--color-paper)] h-full">
        <Brain className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Zihin Odası Bulunamadı</h2>
        <button onClick={() => router.push(`/${locale}/app/workspaces`)} className="mt-4 text-[var(--color-burnt-orange)] font-medium">
          Odalar'a Dön
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      <div className="max-w-4xl mx-auto w-full space-y-8 relative z-10">
        
        {/* Header */}
        <button onClick={() => router.push(`/${locale}/app/workspaces`)} className="flex items-center gap-2 text-[var(--color-ink-light)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft size={18} /> Zihin Odalarına Dön
        </button>

        <header className="flex flex-col bg-white p-6 rounded-3xl border border-[var(--color-ink)]/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-burnt-orange)]"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
              <Brain size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-ink)] tracking-tight">{room.name}</h1>
              {room.type && <p className="text-[var(--color-ink-light)] font-medium mt-1">{room.type}</p>}
            </div>
          </div>
          
          {room.goals && (
            <div className="mt-2 bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-ink-light)] uppercase tracking-wider mb-2">
                <Sparkles size={12} className="text-[var(--color-burnt-orange)]" /> Hedefler & Kapsam
              </div>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">
                {room.goals}
              </p>
            </div>
          )}
        </header>

        {/* Contacts Section */}
        <div className="mt-8 border-t border-[var(--color-ink)]/10 pt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-ink)]">Odadaki Kişiler</h2>
            <button 
              onClick={() => setShowAddContactModal(true)}
              className="flex items-center gap-2 bg-[var(--color-ink)]/5 text-[var(--color-ink)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--color-ink)]/10 transition-colors"
            >
              <UserPlus size={16} /> Kişi Ekle
            </button>
          </div>
          
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 bg-white/50 rounded-2xl border-2 border-dashed border-[var(--color-ink)]/10">
              <Users size={32} className="text-[var(--color-ink)]/20 mb-3" />
              <p className="text-[var(--color-ink-light)] text-sm">{dict?.app?.workspace?.no_contacts || 'Bu odada henüz hiç kişi yok.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contacts.map(c => {
                const match = c.content.match(/\/(?:customer|müşteri)\s+([^-]+)/i);
                const name = match ? match[1].trim() : 'İsimsiz';
                
                let type = '-';
                if (c.content.includes('- Tip:')) {
                  const typeMatch = c.content.match(/- Tip:\s*([^-]+)/i);
                  if (typeMatch) type = typeMatch[1].trim();
                }
                
                return (
                  <div key={c.id} className="bg-white p-4 rounded-xl border border-[var(--color-ink)]/10 shadow-sm flex items-center gap-4 hover:border-[var(--color-burnt-orange)]/50 transition-colors cursor-pointer" onClick={() => router.push(`/${locale}/app/customers/${c.id}`)}>
                    <div className="w-10 h-10 rounded-full bg-[var(--color-burnt-orange)]/10 flex items-center justify-center text-[var(--color-burnt-orange)] font-bold text-sm">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--color-ink)]">{name}</div>
                      <div className="text-xs text-[var(--color-ink-light)] font-medium mt-0.5">{type}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shelves Tabs (Global Filter for Docs and Tasks) */}
        <div className="mt-8 border-t border-[var(--color-ink)]/10 pt-8">
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveShelfId('hol')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeShelfId === 'hol' ? 'bg-[var(--color-ink)] text-white shadow-md shadow-[var(--color-ink)]/20' : 'bg-white border border-[var(--color-ink)]/10 text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5'}`}
          >
            {dict?.app?.workspace?.shelf_hall || 'Hol'}
          </button>
            {shelves.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveShelfId(s.id)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeShelfId === s.id ? 'bg-[var(--color-ink)] text-white shadow-md shadow-[var(--color-ink)]/20' : 'bg-white border border-[var(--color-ink)]/10 text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5'}`}
              >
                {s.name}
              </button>
            ))}
            <button
              onClick={() => setShowAddShelfModal(true)}
              className="px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1 bg-[var(--color-burnt-orange)]/10 text-[var(--color-burnt-orange)] hover:bg-[var(--color-burnt-orange)]/20"
            >
              <Plus size={16} /> {dict?.app?.workspace?.add_shelf || 'Raf Ekle'}
            </button>
          </div>
        </div>

        {/* Docs Section */}
        <div className="mt-8 border-t border-[var(--color-ink)]/10 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-ink)]">{dict?.app?.workspace?.docs_title || 'Oda Dokümanları'}</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowNewDocEditor(true)}
                className="flex items-center gap-2 bg-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/10 text-[var(--color-ink)] px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus size={16} /> {dict?.app?.docs?.btn_text_doc || 'Metin Belgesi'}
              </button>
              <button 
                onClick={() => setShowNewSheetEditor(true)}
                className="flex items-center gap-2 bg-green-600/10 hover:bg-green-600/20 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                <Table size={16} /> {dict?.app?.docs?.btn_sheet || 'Tablo (Excel)'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {docsList.filter(d => activeShelfId === 'hol' || d.shelfId === activeShelfId).map(doc => (
              <div 
                key={doc.id} 
                onClick={() => doc.type === 'spreadsheet' ? setEditingSheet(doc) : setEditingDoc(doc)}
                className="group bg-white border border-[var(--color-ink)]/10 rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:border-blue-500/30 flex flex-col cursor-pointer"
              >
                <div className="h-24 bg-gray-50 flex items-center justify-center relative group-hover:bg-blue-50/50 transition-colors">
                   {doc.type === 'spreadsheet' ? <Table size={32} className="text-gray-300 group-hover:text-green-300 transition-colors" /> : <FileText size={32} className="text-gray-300 group-hover:text-blue-300 transition-colors" />}
                </div>
                <div className="p-4 border-t border-[var(--color-ink)]/5 flex-1">
                  <h3 className="font-semibold text-sm text-[var(--color-ink)] line-clamp-2">{doc.title || 'İsimsiz'}</h3>
                  <div className="text-xs text-[var(--color-ink-light)] mt-2">
                     {new Date(doc.updatedAt?.toMillis() || Date.now()).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </div>
            ))}
            
            {docsList.filter(d => activeShelfId === 'hol' || d.shelfId === activeShelfId).length === 0 && (
              <div className="col-span-full py-8 text-center text-[var(--color-ink-light)] border border-dashed border-[var(--color-ink)]/20 rounded-2xl">
                <p>{dict?.app?.workspace?.no_docs || 'Bu rafta/odada henüz bir doküman yok.'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mt-8 border-t border-[var(--color-ink)]/10 pt-8">
          <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6">{dict?.app?.workspace?.tasks_title || 'Oda Görevleri'}</h2>

          <form onSubmit={handleAddTask} className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-[var(--color-burnt-orange)] rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-500" />
            <div className="relative flex items-center bg-white rounded-xl shadow-sm border border-[var(--color-ink)]/10 p-2 overflow-hidden">
              <div className="pl-4 pr-2 text-[var(--color-ink-light)]">
                <Plus size={24} />
              </div>
              <input
                type="text"
                placeholder={dict?.app?.workspace?.task_placeholder || 'Bu odaya yeni bir görev ekleyin...'}
                className="flex-1 bg-transparent border-none outline-none text-lg text-[var(--color-ink)] placeholder:text-[var(--color-ink-light)]/60 py-3 px-2"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                disabled={isAdding}
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim() || isAdding}
                className="bg-[var(--color-ink)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-ink-light)] transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
              >
                {isAdding ? <Loader2 size={20} className="animate-spin" /> : (dict?.app?.workspace?.btn_add || 'Ekle')}
              </button>
            </div>
          </form>

          {(() => {
            const filteredTasks = activeShelfId === 'hol' ? tasks : tasks.filter(t => t.shelfId === activeShelfId);
            
            if (filteredTasks.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Check className="w-12 h-12 text-[var(--color-ink)]/20 mb-4" />
                  <p className="text-[var(--color-ink-light)]">
                    {activeShelfId === 'hol' 
                      ? (dict?.app?.workspace?.no_tasks_room || 'Bu odada bekleyen görev yok.') 
                      : (dict?.app?.workspace?.no_tasks_shelf || 'Bu rafta bekleyen görev yok.')}
                  </p>
                </div>
              );
            }
            
            return (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredTasks.map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className={`group flex items-center gap-4 bg-white p-4 rounded-xl border ${task.isCompleted ? 'border-[var(--color-ink)]/5' : 'border-[var(--color-ink)]/15 shadow-sm hover:border-[var(--color-burnt-orange)]/50'} transition-all`}
                  >
                    <button
                      onClick={() => handleToggleCompletion(task.id, task.isCompleted)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${task.isCompleted ? 'bg-[var(--color-ink)] border-[var(--color-ink)]' : 'bg-transparent border-[var(--color-ink)]/30 hover:border-[var(--color-burnt-orange)]'}`}
                    >
                      {task.isCompleted && <Check size={14} className="text-white" />}
                    </button>
                    
                    {editingTaskId === task.id ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text"
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          onKeyDown={(e) => { if(e.key === 'Enter') handleSaveEdit(task.id); }}
                          className="flex-1 bg-gray-50 border border-[var(--color-ink)]/20 rounded px-2 py-1 text-sm outline-none"
                          autoFocus
                        />
                        <button onClick={() => handleSaveEdit(task.id)} className="text-sm font-semibold text-[var(--color-ink)] px-2">Kaydet</button>
                        <button onClick={() => setEditingTaskId(null)} className="text-sm text-gray-500 px-2">İptal</button>
                      </div>
                    ) : (
                      <span className={`flex-1 text-lg transition-all ${task.isCompleted ? 'text-[var(--color-ink-light)] line-through opacity-70' : 'text-[var(--color-ink)] font-medium'}`}>
                        {task.title}
                      </span>
                    )}
                    
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                      {!task.isCompleted && (
                        <button
                          onClick={() => { setEditingTaskId(task.id); setEditTaskTitle(task.title); }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                      <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            );
          })()}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-paper)] rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6">Odaya Kişi Ekle</h2>
            
            {allContacts.length === 0 ? (
              <p className="text-[var(--color-ink-light)] text-center my-8">Rehberinizde hiç kişi yok. Önce "Kişiler" menüsünden kişi ekleyin.</p>
            ) : (
              <div className="space-y-3 mb-8">
                {allContacts.map(c => {
                  const match = c.content.match(/\/(?:customer|müşteri)\s+([^-]+)/i);
                  const name = match ? match[1].trim() : 'İsimsiz';
                  const isAlreadyInRoom = contacts.some(rc => rc.id === c.id);
                  
                  if (isAlreadyInRoom) return null;
                  
                  return (
                    <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedContacts.includes(c.id) ? 'border-[var(--color-burnt-orange)] bg-[var(--color-burnt-orange)]/5' : 'border-[var(--color-ink)]/10 hover:bg-[var(--color-ink)]/5'}`}>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded text-[var(--color-burnt-orange)] focus:ring-[var(--color-burnt-orange)]"
                        checked={selectedContacts.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedContacts([...selectedContacts, c.id]);
                          else setSelectedContacts(selectedContacts.filter(id => id !== c.id));
                        }}
                      />
                      <span className="font-medium text-[var(--color-ink)]">{name}</span>
                    </label>
                  );
                })}
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowAddContactModal(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 transition-colors"
                disabled={isAddingContact}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleAddContactsToRoom}
                disabled={selectedContacts.length === 0 || isAddingContact}
                className="px-5 py-2.5 rounded-xl font-medium bg-[var(--color-burnt-orange)] text-white hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isAddingContact ? <Loader2 size={18} className="animate-spin" /> : 'Seçilenleri Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shelf Modal */}
      {showAddShelfModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-paper)] rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6">Yeni Raf Ekle</h2>
            <form onSubmit={handleAddShelf}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">Raf İsmi</label>
                <input
                  type="text"
                  required
                  value={newShelfName}
                  onChange={e => setNewShelfName(e.target.value)}
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)]"
                  placeholder="Örn: Tasarım İşleri"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddShelfModal(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 transition-colors"
                  disabled={isAddingShelf}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!newShelfName.trim() || isAddingShelf}
                  className="px-5 py-2.5 rounded-xl font-medium bg-[var(--color-burnt-orange)] text-white hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isAddingShelf ? <Loader2 size={18} className="animate-spin" /> : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewDocEditor && (
        <NativeDocEditor 
          dict={dict}
          initialDoc={{ roomId: room?.id, roomName: room?.name, shelfId: activeShelfId === 'hol' ? null : activeShelfId, shelfName: activeShelfId === 'hol' ? null : shelves.find(s => s.id === activeShelfId)?.name }}
          onClose={() => setShowNewDocEditor(false)}
          onSaved={() => {
            setShowNewDocEditor(false);
            fetchDocs();
          }}
        />
      )}
      
      {editingDoc && (
        <NativeDocEditor
          dict={dict}
          initialDoc={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSaved={() => {
            setEditingDoc(null);
            fetchDocs();
          }}
        />
      )}

      {/* Spreadsheet Editors */}
      {showNewSheetEditor && (
        <NativeSheetEditor 
          dict={dict}
          initialDoc={{ roomId: room?.id, roomName: room?.name, shelfId: activeShelfId === 'hol' ? null : activeShelfId, shelfName: activeShelfId === 'hol' ? null : shelves.find(s => s.id === activeShelfId)?.name }}
          onClose={() => setShowNewSheetEditor(false)}
          onSaved={(shouldClose = true) => {
            if (shouldClose !== false) setShowNewSheetEditor(false);
            fetchDocs();
          }}
        />
      )}
      
      {editingSheet && (
        <NativeSheetEditor
          dict={dict}
          initialDoc={editingSheet}
          onClose={() => setEditingSheet(null)}
          onSaved={(shouldClose = true) => {
            if (shouldClose !== false) setEditingSheet(null);
            fetchDocs();
          }}
        />
      )}
    </div>
  );
}
