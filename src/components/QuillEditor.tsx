'use client';

import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

export default function QuillEditor({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Buraya notlarınızı yazın...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'blockquote', 'code-block'],
            ['clean']
          ]
        }
      });

      quillRef.current.on('text-change', () => {
        onChange(quillRef.current?.root.innerHTML || '');
      });
      
      if (value) {
        // Set initial value safely
        const delta = quillRef.current.clipboard.convert({ html: value });
        quillRef.current.setContents(delta, 'silent');
      }
    }
  }, []);

  return <div ref={editorRef} className="h-full pb-10" />;
}
