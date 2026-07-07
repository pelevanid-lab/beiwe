'use client';

import React, { useState } from 'react';
import { Search, MessageCircle, Mail, Camera, Send, Filter, MoreVertical, Archive, Trash2, Reply } from 'lucide-react';

const mockMessages = [
  {
    id: '1',
    sender: 'Ahmet Yılmaz',
    platform: 'whatsapp',
    preview: 'Merhaba, yarınki randevu saatini 14:00 olarak güncelleyebilir miyiz?',
    timestamp: '10:42',
    unread: true,
    history: [
      { sender: 'them', text: 'Merhaba, yarınki randevu saatini 14:00 olarak güncelleyebilir miyiz?', time: '10:42' }
    ]
  },
  {
    id: '2',
    sender: 'Zeynep Kaya',
    platform: 'instagram',
    preview: 'Ürün kataloğunuzu bana DM üzerinden iletebilir misiniz?',
    timestamp: 'Dün',
    unread: true,
    history: [
      { sender: 'them', text: 'Ürün kataloğunuzu bana DM üzerinden iletebilir misiniz?', time: 'Dün 15:30' }
    ]
  },
  {
    id: '3',
    sender: 'Murat Demir',
    platform: 'outlook',
    preview: 'Proje sözleşmesini ekte iletiyorum. İnceledikten sonra dönüş yaparsınız.',
    timestamp: 'Dün',
    unread: false,
    history: [
      { sender: 'them', text: 'Proje sözleşmesini ekte iletiyorum. İnceledikten sonra dönüş yaparsınız. İyi çalışmalar.', time: 'Dün 09:15' },
      { sender: 'me', text: 'Teşekkürler Murat Bey, gün içinde inceleyip dönüş yapacağım.', time: 'Dün 10:00' }
    ]
  },
  {
    id: '4',
    sender: 'Ayşe Öztürk',
    platform: 'whatsapp',
    preview: 'Ödemeyi gönderdim, dekontu paylaşıyorum.',
    timestamp: 'Pzt',
    unread: false,
    history: [
      { sender: 'them', text: 'Ödemeyi gönderdim, dekontu paylaşıyorum.', time: 'Pzt 14:20' }
    ]
  }
];

export default function InboxClient({ dict }: { dict: any }) {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(mockMessages[0].id);
  const [replyText, setReplyText] = useState('');

  const selectedMessage = mockMessages.find(m => m.id === selectedMessageId);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp': return <MessageCircle size={14} />;
      case 'instagram': return <Camera size={14} />;
      case 'outlook': return <Mail size={14} />;
      default: return <MessageCircle size={14} />;
    }
  };

  const getPlatformColors = (platform: string) => {
    switch (platform) {
      case 'whatsapp': return 'bg-green-100 text-green-700 border-green-200';
      case 'instagram': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'outlook': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'whatsapp': return 'WhatsApp';
      case 'instagram': return 'Instagram';
      case 'outlook': return 'Outlook';
      default: return 'Bilinmeyen';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] overflow-hidden w-full relative">
      
      {/* Header */}
      <div className="h-20 bg-white border-b border-[var(--color-ink)]/10 flex items-center px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--color-burnt-orange)]/10 rounded-xl text-[var(--color-burnt-orange)]">
            <Mail size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight leading-none">Gelen Kutusu</h1>
            <p className="text-[var(--color-ink-light)] text-sm mt-1">Tüm mesajlarınız tek bir yerde</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left List Panel */}
        <div className="w-1/3 min-w-[320px] max-w-[400px] bg-[var(--color-paper)] border-r border-[var(--color-ink)]/10 flex flex-col">
          
          <div className="p-4 border-b border-[var(--color-ink)]/5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-light)]" />
              <input 
                type="text" 
                placeholder="Mesajlarda ara..." 
                className="w-full bg-white border border-[var(--color-ink)]/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[var(--color-burnt-orange)]"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-white border border-[var(--color-ink)]/10 rounded-lg py-1.5 text-xs font-medium text-[var(--color-ink)] flex items-center justify-center gap-1.5 hover:bg-[var(--color-ink)]/5">
                <Filter size={14}/> Filtrele
              </button>
              <button className="flex-1 bg-white border border-[var(--color-ink)]/10 rounded-lg py-1.5 text-xs font-medium text-[var(--color-ink)] flex items-center justify-center gap-1.5 hover:bg-[var(--color-ink)]/5">
                <Archive size={14}/> Arşiv
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {mockMessages.map(msg => (
              <div 
                key={msg.id}
                onClick={() => setSelectedMessageId(msg.id)}
                className={`p-4 border-b border-[var(--color-ink)]/5 cursor-pointer transition-colors ${selectedMessageId === msg.id ? 'bg-[var(--color-burnt-orange)]/5 border-l-4 border-l-[var(--color-burnt-orange)]' : 'hover:bg-white border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold text-sm ${msg.unread ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-light)]'}`}>
                    {msg.sender}
                  </h3>
                  <span className="text-xs text-[var(--color-ink-light)]">{msg.timestamp}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${getPlatformColors(msg.platform)}`}>
                    {getPlatformIcon(msg.platform)} {getPlatformName(msg.platform)}
                  </span>
                  {msg.unread && <span className="w-2 h-2 rounded-full bg-[var(--color-burnt-orange)]"></span>}
                </div>
                <p className={`text-xs line-clamp-2 ${msg.unread ? 'text-[var(--color-ink)] font-medium' : 'text-[var(--color-ink-light)]'}`}>
                  {msg.preview}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Detail Panel */}
        {selectedMessage ? (
          <div className="flex-1 bg-white flex flex-col relative">
            
            {/* Detail Header */}
            <div className="h-16 border-b border-[var(--color-ink)]/5 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ink)]/5 flex items-center justify-center font-bold text-[var(--color-ink)]">
                  {selectedMessage.sender.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-[var(--color-ink)] text-sm">{selectedMessage.sender}</h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold border ${getPlatformColors(selectedMessage.platform)}`}>
                    {getPlatformIcon(selectedMessage.platform)} {getPlatformName(selectedMessage.platform)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-[var(--color-ink-light)] hover:bg-[var(--color-ink)]/5 rounded-lg transition-colors"><Reply size={18}/></button>
                <button className="p-2 text-[var(--color-ink-light)] hover:bg-[var(--color-ink)]/5 rounded-lg transition-colors"><Archive size={18}/></button>
                <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                <button className="p-2 text-[var(--color-ink-light)] hover:bg-[var(--color-ink)]/5 rounded-lg transition-colors"><MoreVertical size={18}/></button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[var(--color-paper)]">
              {selectedMessage.history.map((chat, idx) => (
                <div key={idx} className={`flex flex-col ${chat.sender === 'me' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${chat.sender === 'me' ? 'bg-[var(--color-burnt-orange)] text-white rounded-br-sm' : 'bg-white border border-[var(--color-ink)]/5 text-[var(--color-ink)] rounded-bl-sm shadow-sm'}`}>
                    {chat.text}
                  </div>
                  <span className="text-[10px] text-[var(--color-ink-light)] mt-1 mx-1">{chat.time}</span>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <div className="p-4 bg-white border-t border-[var(--color-ink)]/5">
              <div className="bg-[var(--color-paper)] border border-[var(--color-ink)]/10 rounded-2xl p-2 flex items-end focus-within:border-[var(--color-burnt-orange)] transition-colors">
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`${getPlatformName(selectedMessage.platform)} üzerinden yanıtla...`}
                  className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] px-3 py-2 text-sm text-[var(--color-ink)]"
                  rows={1}
                />
                <button 
                  disabled={!replyText.trim()}
                  className="p-2.5 bg-[var(--color-burnt-orange)] text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:hover:bg-[var(--color-burnt-orange)] shrink-0 m-1"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 px-2">
                <span className="text-xs text-[var(--color-ink-light)]">Enter göndermez, Shift+Enter alt satıra geçer.</span>
                <span className="text-xs text-[var(--color-ink-light)] flex items-center gap-1">
                  Yanıt Kanalı: <strong>{getPlatformName(selectedMessage.platform)}</strong>
                </span>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white text-[var(--color-ink-light)]">
            <Mail size={48} className="opacity-20 mb-4" />
            <p>Okumak veya yanıtlamak için bir mesaj seçin.</p>
          </div>
        )}

      </div>
    </div>
  );
}
