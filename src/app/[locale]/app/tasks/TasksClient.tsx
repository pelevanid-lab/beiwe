'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { setClarityContext } from '@/lib/clarity-context';
import { ingestMemory, deleteNode } from '@/lib/saule-core-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2, Calendar, Clock, Loader2, Sparkles, AlertCircle, Edit2 } from 'lucide-react';

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

export default function TasksClient({ dict }: { dict: any }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [allShelves, setAllShelves] = useState<any[]>([]);
  const [selectedShelfId, setSelectedShelfId] = useState<string>('hol');
  const { user } = useAuth();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      
      try {
        const q = query(
          collection(db, 'beiwe_tasks'),
          where('ownerId', '==', user.uid),
          // orderBy('createdAt', 'desc') // Requires composite index, skipping for now
        );
        
        const snapshot = await getDocs(q);
        const tasksData: Task[] = snapshot.docs.map(doc => ({
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
        updateClarityContext(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchWorkspaces = async () => {
      if (!user) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
        const res = await fetch(`${apiUrl}/api/smi/nodes`);
        if (!res.ok) return;
        const data = await res.json();
        const allNodes = data.nodes || [];
        const userWorkspaces = allNodes.filter((n: any) => 
          n.spaceId === user.uid && 
          n.type === 'workspace' &&
          n.content.includes('Kullanıcı İşletme Bilgisi')
        );
        const parsedWorkspaces = userWorkspaces.map((w: any) => {
          const content = w.content;
          const nameMatch = content.match(/Oda İsmi:\s*(.*?)\./) || content.match(/İşletme Adı:\s*(.*?)\./);
          return {
            id: w.id,
            name: nameMatch ? nameMatch[1].trim() : 'İsimsiz Zihin Odası'
          };
        });
        setWorkspaces(parsedWorkspaces);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchShelves = async () => {
      if (!user) return;
      try {
        const sq = query(
          collection(db, 'beiwe_shelves'),
          where('ownerId', '==', user.uid)
        );
        const ssnap = await getDocs(sq);
        setAllShelves(ssnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      }
    };

    fetchTasks();
    fetchWorkspaces();
    fetchShelves();
  }, [user]);

  useEffect(() => {
    setSelectedShelfId('hol');
  }, [selectedRoomId]);

  const updateClarityContext = (currentTasks: Task[]) => {
    setClarityContext({
      module: 'tasks',
      title: 'Görev Listesi (Master To-Do)',
      data: {
        totalTasks: currentTasks.length,
        completedTasks: currentTasks.filter(t => t.isCompleted).length,
        pendingTasks: currentTasks.filter(t => !t.isCompleted).map(t => ({ id: t.id, title: t.title }))
      }
    });
  };

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
    
    if (!newTaskTitle.trim() || !user) return;
    setIsAdding(true);

    try {
      const shelfName = selectedRoomId && selectedShelfId !== 'hol' 
        ? allShelves.find(s => s.id === selectedShelfId)?.name 
        : null;

      const newTaskData: any = {
        title: newTaskTitle.trim(),
        isCompleted: false,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        roomId: selectedRoomId || null,
        roomName: selectedRoomId ? workspaces.find(w => w.id === selectedRoomId)?.name || '' : '',
        shelfId: selectedRoomId && selectedShelfId !== 'hol' ? selectedShelfId : null,
        shelfName: shelfName || null
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
        createdAt: { toMillis: () => Date.now() } // mock timestamp for immediate UI sort
      };

      const updatedTasks = [newTask, ...tasks];
      setTasks(updatedTasks);
      updateClarityContext(updatedTasks);
      setNewTaskTitle('');
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleCompletion = async (taskId: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, isCompleted: !currentStatus } : t);
      setTasks(updatedTasks);
      updateClarityContext(updatedTasks);

      const targetTask = tasks.find(t => t.id === taskId);
      let newSmiNodeId = targetTask?.smiNodeId;
      
      if (targetTask && targetTask.roomId) {
        const updatedTaskData = { ...targetTask, isCompleted: !currentStatus };
        newSmiNodeId = await syncTaskToSmi(updatedTaskData, targetTask.smiNodeId);
      }

      const taskRef = doc(db, 'beiwe_tasks', taskId);
      await updateDoc(taskRef, {
        isCompleted: !currentStatus,
        updatedAt: serverTimestamp(),
        smiNodeId: newSmiNodeId || null
      });
      
      // Update local state with new smiNodeId
      const finalTasks = updatedTasks.map(t => t.id === taskId ? { ...t, smiNodeId: newSmiNodeId || undefined } : t);
      setTasks(finalTasks);
    } catch (error) {
      console.error("Error toggling task:", error);
      // Revert on error
      const revertedTasks = tasks.map(t => t.id === taskId ? { ...t, isCompleted: currentStatus } : t);
      setTasks(revertedTasks);
      updateClarityContext(revertedTasks);
    }
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editTaskTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    try {
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, title: editTaskTitle.trim() } : t);
      setTasks(updatedTasks);
      updateClarityContext(updatedTasks);
      
      const targetTask = tasks.find(t => t.id === taskId);
      let newSmiNodeId = targetTask?.smiNodeId;
      
      if (targetTask && targetTask.roomId) {
        const updatedTaskData = { ...targetTask, title: editTaskTitle.trim() };
        newSmiNodeId = await syncTaskToSmi(updatedTaskData, targetTask.smiNodeId);
      }
      
      const taskRef = doc(db, 'beiwe_tasks', taskId);
      await updateDoc(taskRef, {
        title: editTaskTitle.trim(),
        updatedAt: serverTimestamp(),
        smiNodeId: newSmiNodeId || null
      });
      
      const finalTasks = updatedTasks.map(t => t.id === taskId ? { ...t, smiNodeId: newSmiNodeId || undefined } : t);
      setTasks(finalTasks);
      
      setEditingTaskId(null);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Optimistic update
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      setTasks(updatedTasks);
      updateClarityContext(updatedTasks);

      const targetTask = tasks.find(t => t.id === taskId);
      if (targetTask?.smiNodeId && user) {
        const token = await user.getIdToken();
        await deleteNode(targetTask.smiNodeId, token).catch(console.error);
      }

      await deleteDoc(doc(db, 'beiwe_tasks', taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const pendingCount = tasks.filter(t => !t.isCompleted).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob pointer-events-none" />
      <div className="absolute top-0 right-72 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto w-full space-y-8 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 border-b border-[var(--color-ink)]/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
              <Sparkles size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-[var(--color-ink)] tracking-tight">Odak Panosu</h1>
              <p className="text-[var(--color-ink-light)] text-base mt-2 flex items-center gap-2">
                Clarity Engine destekli akıllı görev yönetim merkeziniz.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium bg-white px-4 py-2 rounded-full border border-[var(--color-ink)]/10 shadow-sm text-[var(--color-ink)]">
            <span className="flex w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            {pendingCount} Açık Görev
          </div>
        </header>

        {/* Input Area */}
        <form onSubmit={handleAddTask} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-[var(--color-burnt-orange)] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
          <div className="relative flex items-center bg-white rounded-xl shadow-sm border border-[var(--color-ink)]/10 p-2 overflow-hidden">
            <div className="pl-4 pr-2 text-[var(--color-ink-light)]">
              <Plus size={24} />
            </div>
            <input
              type="text"
              placeholder="Yeni bir görev veya hedef ekleyin..."
              className="flex-1 bg-transparent border-none outline-none text-lg text-[var(--color-ink)] placeholder:text-[var(--color-ink-light)]/60 py-3 px-2"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              disabled={isAdding}
            />
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              disabled={isAdding || workspaces.length === 0}
              className="bg-gray-50 border-none outline-none text-sm text-[var(--color-ink)] px-3 py-2 mr-3 rounded-lg cursor-pointer max-w-[150px] md:max-w-[200px] truncate"
            >
              <option value="">Oda Seç</option>
              {workspaces.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {selectedRoomId && (
              <select
                value={selectedShelfId}
                onChange={(e) => setSelectedShelfId(e.target.value)}
                disabled={isAdding}
                className="bg-gray-50 border-none outline-none text-sm text-[var(--color-ink)] px-3 py-2 mr-3 rounded-lg cursor-pointer max-w-[120px] md:max-w-[150px] truncate"
              >
                <option value="hol">Hol</option>
                {allShelves.filter(s => s.roomId === selectedRoomId).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <button
              type="submit"
              disabled={!newTaskTitle.trim() || isAdding}
              className="bg-[var(--color-ink)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-ink-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {isAdding ? <Loader2 size={20} className="animate-spin" /> : "Ekle"}
            </button>
          </div>
        </form>

        {/* List Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 size={40} className="text-[var(--color-ink)] animate-spin mb-4" />
            <p className="text-[var(--color-ink-light)] font-medium">Görevleriniz yükleniyor...</p>
          </div>
        ) : tasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 bg-[var(--color-ink)]/5 rounded-full flex items-center justify-center mb-6">
              <Check className="w-12 h-12 text-[var(--color-ink)]/30" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--color-ink)] mb-2">Her şey tamam!</h3>
            <p className="text-[var(--color-ink-light)] max-w-md">Bekleyen hiçbir göreviniz yok. Yeni bir hedef ekleyerek Clarity Engine'in çalışmaya başlamasını sağlayabilirsiniz.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map(task => (
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
                    <div className={`flex-1 flex flex-col justify-center transition-all ${task.isCompleted ? 'opacity-70' : ''}`}>
                      <span className={`text-lg font-medium ${task.isCompleted ? 'text-[var(--color-ink-light)] line-through' : 'text-[var(--color-ink)]'}`}>
                        {task.title}
                      </span>
                      {task.roomName && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[var(--color-burnt-orange)]/10 text-[var(--color-burnt-orange)]">
                            {task.roomName}
                          </span>
                          {task.shelfName && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[var(--color-ink)]/10 text-[var(--color-ink)]">
                              {task.shelfName}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
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
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
