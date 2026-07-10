'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { ingestMemory, deleteNode } from '@/lib/saule-core-client';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';

interface NativeSheetEditorProps {
  initialDoc?: any;
  onClose?: () => void;
  onSaved?: (shouldClose?: boolean) => void;
}

export default function NativeSheetEditor({ initialDoc, onClose, onSaved, dict }: NativeSheetEditorProps & { dict?: any }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialDoc?.name || initialDoc?.title || (dict?.app?.docs?.untitled_sheet || 'İsimsiz Tablo'));
  const [isSaving, setIsSaving] = useState(false);
  const [docId, setDocId] = useState<string>(initialDoc?.id || crypto.randomUUID());
  
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [shelves, setShelves] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialDoc?.roomId || '');
  const [selectedShelfId, setSelectedShelfId] = useState<string>(initialDoc?.shelfId || '');

  const workbookRef = useRef<any>(null);
  
  // Default data if no initial content
  const defaultData = [{
    name: "Sayfa1",
    celldata: [],
    status: 1
  }];
  
  const [initialData] = useState<any[]>(initialDoc?.content && initialDoc?.content !== '' ? JSON.parse(initialDoc.content) : defaultData);
  const [sheetData, setSheetData] = useState<any[]>(initialData);

  // Fetch Workspaces (Rooms) & Shelves
  useEffect(() => {
    if (!user) return;
    const fetchRoomsAndShelves = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
        const res = await fetch(`${apiUrl}/api/smi/nodes`);
        if (res.ok) {
          const data = await res.json();
          const allNodes = data.nodes || [];
          
          const userWorkspaces = allNodes.filter((n: any) => 
            n.spaceId === user.uid && 
            n.type === 'workspace' &&
            n.content.includes('Kullanıcı İşletme Bilgisi')
          ).sort((a: any, b: any) => b.createdAt - a.createdAt);
          
          const parsedWorkspaces = userWorkspaces.map((w: any) => {
            const content = w.content;
            const nameMatch = content.match(/Oda İsmi:\s*(.*?)\./) || content.match(/İşletme Adı:\s*(.*?)\./);
            return {
              id: w.id,
              name: nameMatch ? nameMatch[1].trim() : 'İsimsiz Zihin Odası',
            };
          });
          setWorkspaces(parsedWorkspaces);
        }

        const shelvesQ = query(
          collection(db, 'beiwe_shelves'),
          where('ownerId', '==', user.uid)
        );
        const shelvesSnap = await getDocs(shelvesQ);
        const shelvesData = shelvesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShelves(shelvesData);
      } catch (err) {
        console.error("Error fetching rooms or shelves", err);
      }
    };
    fetchRoomsAndShelves();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    // Force blur to commit any active cell edits in FortuneSheet
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Give FortuneSheet a moment to process the blur and trigger onChange
    await new Promise(resolve => setTimeout(resolve, 150));
    
    setIsSaving(true);
    try {
      let currentData = sheetData;
      
      // 1. Get the most up-to-date internal state directly from the FortuneSheet instance
      if (workbookRef.current && typeof workbookRef.current.getAllSheets === 'function') {
        try {
          const sheets = workbookRef.current.getAllSheets();
          if (sheets && sheets.length > 0) {
             currentData = sheets;
          }
        } catch (e) {
          console.error("getAllSheets failed", e);
        }
      }

      // CRITICAL: FortuneSheet edits the 2D 'data' matrix internally.
      // But it ONLY initializes from the 1D 'celldata' array on load.
      // We MUST sync 'data' back into 'celldata' before saving to Firebase!
      try {
        currentData = currentData.map((sheet: any) => {
          if (sheet.data && Array.isArray(sheet.data)) {
            // Write our own robust converter to guarantee no data loss
            const newCelldata: any[] = [];
            for (let r = 0; r < sheet.data.length; r++) {
              if (!Array.isArray(sheet.data[r])) continue;
              for (let c = 0; c < sheet.data[r].length; c++) {
                const cell = sheet.data[r][c];
                // Only save non-null cells that have actual properties (like v, m, ct, bg, etc)
                if (cell !== null && cell !== undefined && Object.keys(cell).length > 0) {
                  newCelldata.push({ r, c, v: cell });
                }
              }
            }
            return {
              ...sheet,
              celldata: newCelldata
            };
          }
          return sheet;
        });
      } catch (e) {
        console.error("Custom dataToCelldata mapping failed", e);
      }
      
      // 3. Build a clean, circular-reference-free array to save.
      // We explicitly pick only the safe properties that FortuneSheet uses for initialization.
      // This guarantees `JSON.stringify` will never throw, and we don't need the destructive cache fallback.
      const cleanDataToSave = currentData.map((sheet: any) => {
        return {
          name: sheet.name,
          id: sheet.id,
          order: sheet.order,
          status: sheet.status,
          celldata: sheet.celldata || [], // This now has the synced data from customDataToCelldata
          config: sheet.config || {},
          calcChain: sheet.calcChain || [],
          images: sheet.images || [],
          zoomRatio: sheet.zoomRatio || 1,
          showGridLines: sheet.showGridLines
        };
      });
      
      const jsonContent = JSON.stringify(cleanDataToSave);
      
      const roomName = workspaces.find(w => w.id === selectedRoomId)?.name || '';
      const shelf = shelves.find(s => s.id === selectedShelfId);
      const shelfName = selectedShelfId ? (shelf?.shelfName || shelf?.name || '') : '';
      
      let newSmiNodeId = initialDoc?.smiNodeId || null;
      
      if (selectedRoomId) {
        if (newSmiNodeId) {
          const token = await user.getIdToken();
          await deleteNode(newSmiNodeId, token).catch(console.error);
        }
        
        let smiContent = `[Elektronik Tablo] Başlık: ${title}. Zihin Odaları: ${roomName}.`;
        if (shelfName) smiContent += ` Raf: ${shelfName}.`;
        smiContent += `\nİçerik: (Tablo verisi mevcut)`;
        
        const token = await user.getIdToken();
        const ingestRes = await ingestMemory(
          smiContent,
          'action',
          { source: 'docs_native_editor', docId, author: user.uid, createdAt: Date.now() },
          'fact',
          'personal',
          user.uid,
          token
        );
        
        if (ingestRes?.id || ingestRes?.nodeId) {
          newSmiNodeId = ingestRes.id || ingestRes.nodeId;
        }
      } else if (newSmiNodeId) {
        const token = await user.getIdToken();
        await deleteNode(newSmiNodeId, token).catch(console.error);
        newSmiNodeId = null;
      }
      
      const docRef = doc(db, 'beiwe_docs', docId);
      const payload: any = {
        title,
        content: jsonContent,
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
        type: 'spreadsheet'
      };
      
      if (selectedRoomId) {
        payload.roomId = selectedRoomId;
        payload.roomName = roomName;
      } else {
        payload.roomId = null;
        payload.roomName = null;
      }
      
      if (selectedShelfId) {
        payload.shelfId = selectedShelfId;
        payload.shelfName = shelfName || null;
      } else {
        payload.shelfId = null;
        payload.shelfName = null;
      }
      
      if (newSmiNodeId) {
        payload.smiNodeId = newSmiNodeId;
      } else {
        payload.smiNodeId = null;
      }
      
      if (!initialDoc?.id) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(docRef, payload, { merge: true });
      
      // Kaydedildiğini belirt, ama kapatma
      alert(dict?.app?.docs?.btn_save ? dict.app.docs.btn_save + " Başarılı!" : "Kaydedildi!");
      onSaved?.(false); // fetch docs without closing the modal
    } catch (error: any) {
      console.error("Error saving document:", error);
      alert((dict?.app?.docs?.error_saving_sheet || "Tablo kaydedilirken bir hata oluştu.") + " Hata detayı: " + (error?.message || String(error)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Toolbar */}
      <div className="h-16 border-b border-[var(--color-ink)]/10 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold text-[var(--color-ink)] bg-transparent border-none outline-none focus:ring-0 placeholder-gray-300 flex-1"
            placeholder={dict?.app?.docs?.sheet_name_placeholder || 'Tablo Adı'}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Room Selection */}
          <select
            value={selectedRoomId}
            onChange={(e) => {
              setSelectedRoomId(e.target.value);
              setSelectedShelfId('');
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 text-sm text-[var(--color-ink)] rounded-xl outline-none focus:border-blue-500"
          >
            <option value="">{dict?.app?.docs?.select_room || 'Oda Seçin...'}</option>
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          
          {/* Shelf Selection (only if room selected) */}
          {selectedRoomId && (
            <select
              value={selectedShelfId}
              onChange={(e) => setSelectedShelfId(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 text-sm text-[var(--color-ink)] rounded-xl outline-none focus:border-blue-500"
            >
              <option value="">{dict?.app?.docs?.shelf_hall_option || 'Raf (Hol)'}</option>
              {shelves.filter(s => s.roomId === selectedRoomId).map(s => (
                <option key={s.id} value={s.id}>{s.shelfName || s.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {dict?.app?.docs?.btn_save || 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 w-full h-full relative z-0">
        <Workbook 
          ref={workbookRef} 
          data={initialData} 
          onChange={(data) => setSheetData(data)}
        />
      </div>
    </div>
  );
}
