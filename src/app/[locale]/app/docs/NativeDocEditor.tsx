'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Save, X, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';

interface NativeDocEditorProps {
  initialDocId?: string;
  initialTitle?: string;
  initialContent?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function NativeDocEditor({ initialDocId, initialTitle, initialContent, onClose, onSaved }: NativeDocEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialTitle || 'İsimsiz Doküman');
  const [isSaving, setIsSaving] = useState(false);
  const [docId, setDocId] = useState<string>(initialDocId || crypto.randomUUID());

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Bir şeyler yazın veya yapay zekaya komut verin...',
      }),
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] text-[var(--color-ink)] max-w-4xl',
      },
    },
  });

  const handleSave = async () => {
    if (!user || !editor) return;
    
    setIsSaving(true);
    try {
      const htmlContent = editor.getHTML();
      
      const docRef = doc(db, 'beiwe_docs', docId);
      await setDoc(docRef, {
        title,
        content: htmlContent,
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
        createdAt: initialDocId ? undefined : serverTimestamp(), // only set on create
        type: 'document'
      }, { merge: true });
      
      onSaved();
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Doküman kaydedilirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

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
            placeholder="Doküman Adı"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              // Placeholder for Clarity Engine integration
              alert('Yapay Zeka özellikleri yakında!');
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <Sparkles size={16} /> Asistana Sor
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Kaydet
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
        <div className="max-w-4xl mx-auto bg-white min-h-[800px] shadow-sm border border-gray-100 rounded-2xl p-12 lg:p-16">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
