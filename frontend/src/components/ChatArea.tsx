import React, { useState } from 'react';
import { Contact, Conversation } from '../types';

interface ChatAreaProps {
  contact: Contact;
  conversation: Conversation;
}

export default function ChatArea({ contact, conversation }: ChatAreaProps) {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    // In a real app, this would trigger an API call to send the message
    console.log('Sending message:', inputText);
    setInputText('');
  };

  return (
    <main className="chat-area">
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="chat-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
            {contact.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{contact.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {contact.channel === 'whatsapp' ? 'WhatsApp Business' : 'Instagram Direct'}
            </div>
          </div>
        </div>
      </header>
      
      <div className="chat-messages">
        {conversation.messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.direction === 'in' ? 'incoming' : 'outgoing'}`}>
            {msg.content}
            <div className="message-meta">
              <span>{msg.sent_at}</span>
              {msg.direction === 'out' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0 8px', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>
          <input 
            type="text" 
            className="chat-input" 
            placeholder="Type a message..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn-send" onClick={handleSend}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '-2px' }}>
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}
