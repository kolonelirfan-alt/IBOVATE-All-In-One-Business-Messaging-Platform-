'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Contact, Conversation, Message } from '@/types';
import { supabase } from '@/lib/supabase';
import { getApiUrl } from '@/lib/api';

interface ChatAreaProps {
  contact: Contact;
  conversation: Conversation;
  onResolve?: () => void;
  onUpdate?: () => void;
}

export default function ChatArea({ contact, conversation, onResolve, onUpdate }: ChatAreaProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>(conversation.messages || []);
  const [isSending, setIsSending] = useState(false);
  const [agents, setAgents] = useState<{id: string, email: string}[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(conversation.messages || []);
  }, [conversation.id, conversation.messages]);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/workspace/agents`)
      .then(r => r.json())
      .then(d => { if (d.data) setAgents(d.data); })
      .catch(() => {});
  }, []);

  // Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`messages:conv:${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content) return;
    setInputText('');
    setIsSending(true);

    try {
      await fetch(`${getApiUrl()}/api/inbox/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversation.id, content })
      });
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async () => {
    try {
      await fetch(`${getApiUrl()}/api/inbox/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      });
      onResolve?.();
    } catch (err) {
      console.error('Resolve failed:', err);
    }
  };

  const handleAssign = async (agentId: string) => {
    setShowAssign(false);
    try {
      await fetch(`${getApiUrl()}/api/inbox/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: agentId })
      });
      onUpdate?.();
    } catch (err) {
      console.error('Assign failed:', err);
    }
  };

  return (
    <div className="chat-area">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', color: 'white'
          }}>
            {contact.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{contact.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {contact.channel === 'whatsapp' ? '🟢 WhatsApp Business' : '📷 Instagram Direct'}
            </div>
          </div>
        </div>

        <div className="chat-header-actions" style={{ position: 'relative' }}>
          <button className="action-btn secondary" onClick={() => setShowAssign(!showAssign)}>
            {conversation.assigned_to ? 'Reassign' : 'Assign'}
          </button>
          
          {showAssign && (
            <div style={{
              position: 'absolute', top: '100%', right: '100px', marginTop: 4,
              background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
              borderRadius: 6, zIndex: 10, minWidth: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Assign to Agent
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {agents.length === 0 ? (
                  <div style={{ padding: '8px 12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>No agents found</div>
                ) : (
                  agents.map(a => (
                    <div 
                      key={a.id}
                      onClick={() => handleAssign(a.id)}
                      style={{ padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {a.email} {conversation.assigned_to === a.id && '✓'}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <button className="action-btn primary" onClick={handleResolve}>✓ Resolve</button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.direction === 'in' ? 'incoming' : 'outgoing'}`}>
            {msg.content}
            <div className="message-meta">
              <span>{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {msg.direction === 'out' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <input
            type="text"
            className="chat-input"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isSending}
          />
          <button
            className="btn-send"
            onClick={handleSend}
            disabled={isSending || !inputText.trim()}
            style={{ opacity: isSending || !inputText.trim() ? 0.5 : 1 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
