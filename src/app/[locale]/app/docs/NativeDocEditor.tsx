'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Save, X, ArrowLeft, Loader2, Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Undo, Redo } from 'lucide-react';
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

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const Button = ({ onClick, disabled, isActive, children }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${isActive ? 'bg-gray-200 text-black font-bold' : 'text-gray-600'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-100 rounded-t-2xl shrink-0">
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      >
        <Bold size={18} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      >
        <Italic size={18} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
      >
        <Strikethrough size={18} />
      </Button>
      
      <div className="w-px h-6 bg-gray-300 mx-1" />

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
      >
        <Heading1 size={18} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
      >
        <Heading2 size={18} />
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
      >
        <List size={18} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
      >
        <ListOrdered size={18} />
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <Button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo size={18} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo size={18} />
      </Button>
    </div>
  );
};

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
        <div className="max-w-4xl mx-auto bg-white min-h-[800px] shadow-sm border border-gray-100 rounded-2xl flex flex-col">
          <MenuBar editor={editor} />
          <div className="p-12 lg:p-16 flex-1 cursor-text" onClick={() => editor.commands.focus()}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
