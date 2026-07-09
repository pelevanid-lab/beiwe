'use client';

import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Mail, Camera, Send, Filter, MoreVertical, Archive, Trash2, Reply, Send as SendIcon, Inbox, SendHorizontal, FileText, AlertCircle, Phone, Globe } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

type ChatMessage = { sender: 'me' | 'them'; text: string; time: string };

type InboxMessage = {
  id: string;
  sender: string;
  platform: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  history: ChatMessage[];
  contact?: string; // email or phone number
  folder: 'inbox' | 'sent' | 'drafts' | 'spam' | 'archive';
  threadId?: string;
  to?: string;
};

const INTEGRATIONS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', active: false },
  { id: 'gmail', name: 'Gmail', icon: Mail, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', active: true },
  { id: 'instagram', name: 'Instagram', icon: Camera, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200', active: false },
  { id: 'telegram', name: 'Telegram', icon: SendIcon, color: 'text-blue-400', bg: 'bg-blue-50', border: 'border-blue-200', active: false, comingSoon: true },
  { id: 'webchat', name: 'Web Chat', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', active: false, comingSoon: true },
];

const FOLDERS = [
  { id: 'inbox', name: 'Gelen Kutusu', icon: Inbox },
  { id: 'sent', name: 'Giden Kutusu', icon: SendHorizontal },
  { id: 'drafts', name: 'Taslaklar', icon: FileText },
  { id: 'spam', name: 'Spam', icon: AlertCircle },
  { id: 'archive', name: 'Arşiv', icon: Archive },
];

export default function InboxClient({ dict }: { dict: any }) {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [activeFolder, setActiveFolder] = useState('inbox');

  const [isSending, setIsSending] = useState(false);

  // Firestore Real-time Listener for Webhook Data
  useEffect(() => {
    const q = query(collection(db, 'inbox_messages'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groups = new Map<string, InboxMessage>();

      snapshot.forEach((doc) => {
        const msg = { id: doc.id, ...doc.data() } as InboxMessage;
        
        // Group strictly by sender to create a "Chat" feel per contact
        // We can extract the email from "Name <email>" for better grouping
        const extractEmail = (str: string) => {
          const match = str.match(/<(.+)>/);
          return match ? match[1] : str;
        };
        
        let rawSender = msg.sender;
        // If the message is in the 'sent' folder, the sender is actually 'me' 
        // and the real conversation partner is the 'to' address.
        if (msg.folder === 'sent' && msg.to) {
           rawSender = msg.to;
        }

        const groupKey = extractEmail(rawSender);
        
        if (!groups.has(groupKey)) {
          // Store the normalized sender (email) so the chat header looks consistent
          groups.set(groupKey, { ...msg, sender: rawSender });
        } else {
          const existing = groups.get(groupKey)!;
          // Prepend older history to the newest message's history
          existing.history = [...msg.history, ...existing.history];
        }
      });
      
      const fetchedMessages = Array.from(groups.values());
      
      setMessages(prev => {
        const drafts = prev.filter(m => m.id.startsWith('draft-'));
        return [...drafts, ...fetchedMessages];
      });
    }, (error) => {
      console.error('Firestore listener error:', error);
    });

    return () => unsubscribe();
  }, []);

  // Check URL params for new draft
  useEffect(() => {
    const customer = searchParams.get('customer');
    const platform = searchParams.get('platform');
    const contact = searchParams.get('contact');

    if (customer && platform) {
      const draftId = `draft-${Date.now()}`;
      
      const newDraft: InboxMessage = {
        id: draftId,
        sender: customer,
        platform: platform,
        contact: contact || '',
        preview: 'Yeni taslak mesaj...',
        timestamp: 'Şimdi',
        unread: false,
        history: [], // No history yet
        folder: 'inbox'
      };

      setMessages(prev => {
        // Prevent duplicate drafts for the same customer and platform
        if (prev.some(m => m.sender === customer && m.platform === platform)) {
          const existing = prev.find(m => m.sender === customer && m.platform === platform)!;
          setSelectedMessageId(existing.id);
          return prev;
        }
        return [newDraft, ...prev];
      });
      setSelectedMessageId(draftId);
    }
  }, [searchParams]);

  const selectedMessage = messages.find(m => m.id === selectedMessageId);
  const filteredMessages = messages;

  const getPlatformIcon = (platform: string) => {
    const integration = INTEGRATIONS.find(i => i.id === platform);
    if (integration) {
      const Icon = integration.icon;
      return <Icon size={14} />;
    }
    return <MessageCircle size={14} />;
  };

  const getPlatformColors = (platform: string) => {
    const integration = INTEGRATIONS.find(i => i.id === platform);
    if (integration) {
      return `${integration.bg} ${integration.color} ${integration.border}`;
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPlatformName = (platform: string) => {
    const integration = INTEGRATIONS.find(i => i.id === platform);
    return integration ? integration.name : 'Bilinmeyen';
  };

  const handleSend = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    setIsSending(true);
    
    try {
      // Extract custom subject if exists, e.g. "<Test Konu> Merhaba"
      let customSubject = null;
      let finalReplyText = replyText;
      const subjectMatch = replyText.match(/^<([^>]+)>([\s\S]*)$/);
      if (subjectMatch) {
        customSubject = subjectMatch[1].trim();
        finalReplyText = subjectMatch[2].trim();
      }

      // Optimiztic UI Update (Ekranda anında göstermek için)
      setMessages(prev => prev.map(msg => {
        if (msg.id === selectedMessage.id) {
          return {
            ...msg,
            preview: finalReplyText,
            timestamp: 'Şimdi',
            history: [...msg.history, { sender: 'me', text: (customSubject ? `<${customSubject}> ` : '') + finalReplyText, time: 'Şimdi' }]
          };
        }
        return msg;
      }));

      // Gerçekten Gönder
      const token = localStorage.getItem('google_access_token');
      if (selectedMessage.platform === 'gmail' && token) {
        
        // Default subject if custom is not provided
        let defaultSubject = 'Konusuz';
        if (selectedMessage.preview) {
          const splitPrev = selectedMessage.preview.split('-')[0].trim();
          defaultSubject = splitPrev.startsWith('Re:') ? splitPrev : 'Re: ' + splitPrev;
        }

        const res = await fetch('/api/gmail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            to: selectedMessage.contact || selectedMessage.sender,
            subject: customSubject || defaultSubject,
            text: finalReplyText,
            threadId: selectedMessage.threadId || selectedMessage.id
          })
        });
        
        if (!res.ok) {
          const err = await res.json();
          alert('E-posta gönderilemedi: ' + err.error);
        }
      }
      
      setReplyText('');
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] overflow-hidden w-full relative">
      
      {/* 1. Header & Integrations Bar (Top Section) */}
      <div className="bg-white border-b border-[var(--color-ink)]/10 flex flex-col px-6 py-4 shrink-0 z-30 relative shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--color-burnt-orange)]/10 rounded-xl text-[var(--color-burnt-orange)]">
              <SendIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight leading-none">İletişim Merkezi</h1>
              <p className="text-[var(--color-ink-light)] text-sm mt-1">Tüm mesajlarınız ve e-postalarınız tek bir yerde</p>
            </div>
          </div>
        </div>
        
        {/* Integrations List */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
          {INTEGRATIONS.map(integration => {
            const Icon = integration.icon;
            return (
              <div 
                key={integration.id} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all shrink-0 ${
                  integration.active 
                    ? `bg-white ${integration.border} ${integration.color} shadow-sm` 
                    : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60 grayscale'
                }`}
                title={!integration.active && !integration.comingSoon ? 'Bağlantı Kurulmadı' : integration.comingSoon ? 'Yakında eklenecek' : ''}
              >
                <Icon size={16} />
                <span>{integration.name}</span>
                {integration.comingSoon && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded ml-1">Yakında</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Folders & Messages List (Horizontal Section) */}
      <div className="bg-white border-b border-[var(--color-ink)]/10 shrink-0 flex flex-col z-20 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-[var(--color-ink)]/5 gap-4 shadow-sm">
          {/* Removed Folders to create a unified inbox */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0 items-center">
             <div className="font-bold text-[var(--color-ink)] text-sm px-2">Tüm Mesajlar</div>
          </div>
          
          {/* Search */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-light)]" />
            <input 
              type="text" 
              placeholder="Mesajlarda ara..." 
              className="w-full bg-[var(--color-paper)] border border-[var(--color-ink)]/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[var(--color-burnt-orange)] transition-colors"
            />
          </div>
        </div>

        {/* The horizontal scrolling message list (Wide Cards) */}
        <div className="flex items-center gap-6 overflow-x-auto p-6 no-scrollbar min-h-[180px] bg-gray-50/50">
          {filteredMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-ink-light)] space-y-2 py-6">
               <MessageCircle size={24} className="opacity-20" />
               <p className="text-sm">Bu kutuda mesaj bulunmuyor.</p>
            </div>
          ) : (
            filteredMessages.map(msg => (
              <div 
                key={msg.id}
                onClick={() => setSelectedMessageId(msg.id)}
                className={`w-[400px] shrink-0 bg-white p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${
                  selectedMessageId === msg.id 
                    ? 'border-[var(--color-burnt-orange)] shadow-md ring-2 ring-[var(--color-burnt-orange)]/20 scale-[1.02]' 
                    : 'border-[var(--color-ink)]/10 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`font-bold text-lg truncate pr-2 ${msg.unread ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-light)]'}`}>
                    {msg.sender}
                  </h3>
                  <span className="text-xs text-[var(--color-ink-light)] whitespace-nowrap font-medium">{msg.timestamp}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border ${getPlatformColors(msg.platform)}`}>
                    {getPlatformIcon(msg.platform)} {getPlatformName(msg.platform)}
                  </span>
                  {msg.unread && <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-burnt-orange)]"></span>}
                </div>
                <p className={`text-sm line-clamp-2 leading-relaxed ${msg.unread ? 'text-[var(--color-ink)] font-medium' : 'text-[var(--color-ink-light)]'}`}>
                  {msg.preview}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Chat History (Vertical Section) */}
      <div className="flex-1 bg-[var(--color-paper)] flex flex-col relative overflow-hidden">
        {selectedMessage ? (
          <div className="flex-1 flex flex-col relative h-full">
            {/* Detail Header */}
            <div className="h-16 bg-white/80 backdrop-blur-md border-b border-[var(--color-ink)]/5 flex items-center justify-between px-8 shrink-0 z-10 absolute top-0 w-full">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ink)]/5 flex items-center justify-center font-bold text-[var(--color-ink)] text-sm">
                  {selectedMessage.sender.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-[var(--color-ink)] text-base">{selectedMessage.sender}</h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold border ${getPlatformColors(selectedMessage.platform)}`}>
                    {getPlatformIcon(selectedMessage.platform)} {getPlatformName(selectedMessage.platform)} {selectedMessage.contact && `• ${selectedMessage.contact}`}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-[var(--color-ink-light)] hover:bg-[var(--color-ink)]/5 rounded-lg transition-colors" title="Yanıtla"><Reply size={18}/></button>
                <button className="p-2 text-[var(--color-ink-light)] hover:bg-[var(--color-ink)]/5 rounded-lg transition-colors" title="Arşivle"><Archive size={18}/></button>
                <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sil"><Trash2 size={18}/></button>
                <button className="p-2 text-[var(--color-ink-light)] hover:bg-[var(--color-ink)]/5 rounded-lg transition-colors"><MoreVertical size={18}/></button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-8 pt-24 space-y-6">
              {selectedMessage.history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--color-ink-light)] space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm border border-[var(--color-ink)]/5">
                    {getPlatformIcon(selectedMessage.platform)}
                  </div>
                  <p className="text-base italic">Henüz bir mesaj geçmişi yok. Mesaj yazarak sohbeti başlatın.</p>
                </div>
              ) : (
                selectedMessage.history.map((chat, idx) => (
                  <div key={idx} className={`flex flex-col ${chat.sender === 'me' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      chat.sender === 'me' 
                        ? 'bg-[var(--color-burnt-orange)] text-white rounded-br-sm' 
                        : 'bg-white border border-[var(--color-ink)]/5 text-[var(--color-ink)] rounded-bl-sm'
                    }`}>
                      {chat.text}
                    </div>
                    <span className="text-[11px] text-[var(--color-ink-light)] mt-2 mx-2 font-medium">{chat.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-paper)] text-[var(--color-ink-light)]">
            <SendIcon size={64} className="opacity-20 mb-6" />
            <p className="text-lg">Okumak veya yanıtlamak için bir mesaj seçin.</p>
          </div>
        )}
      </div>

      {/* 4. Full-Width Bottom Compose Area */}
      <div className="bg-white border-t border-[var(--color-ink)]/10 p-6 shrink-0 flex flex-col relative z-20 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        <div className="max-w-screen-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-bold text-[var(--color-ink)] uppercase tracking-wider">
              {selectedMessage ? `Yanıtla: ${selectedMessage.sender}` : 'Yeni Mesaj'}
            </span>
            {selectedMessage && (
              <span className="text-xs text-[var(--color-ink-light)] flex items-center gap-1.5 bg-[var(--color-paper)] px-3 py-1.5 rounded-lg border border-[var(--color-ink)]/5">
                Kanal: <strong className={getPlatformColors(selectedMessage.platform).split(' ')[1]}>{getPlatformName(selectedMessage.platform)}</strong>
              </span>
            )}
          </div>
          <div className={`bg-[var(--color-paper)] border rounded-2xl p-4 flex flex-col transition-colors ${selectedMessage ? 'border-[var(--color-ink)]/20 focus-within:border-[var(--color-burnt-orange)] focus-within:shadow-md' : 'border-[var(--color-ink)]/10 opacity-60'}`}>
            <textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={!selectedMessage}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={selectedMessage ? `<Konu> Mesajınız... şeklinde e-postanızın konusunu belirleyebilirsiniz (isteğe bağlı). ${getPlatformName(selectedMessage.platform)} üzerinden yazın...` : 'Yanıtlamak için bir mesaj seçin...'}
              className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[120px] max-h-[300px] text-base text-[var(--color-ink)] outline-none disabled:cursor-not-allowed leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-ink)]/5">
              <span className="text-xs text-[var(--color-ink-light)]">Enter gönderir, Shift+Enter alt satıra geçer.</span>
              <button 
                onClick={handleSend}
                disabled={!replyText.trim() || !selectedMessage || isSending}
                className="px-8 py-3 bg-[var(--color-burnt-orange)] text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:hover:bg-[var(--color-burnt-orange)] flex items-center gap-2 shadow-sm"
              >
                {isSending ? 'Gönderiliyor...' : 'Gönder'} <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
