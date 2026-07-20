import React from 'react';
import { Contact } from '../types';

interface SidebarProps {
  contacts: Contact[];
  activeContactId: string;
  onSelectContact: (id: string) => void;
}

export default function Sidebar({ contacts, activeContactId, onSelectContact }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>OmniCRM</h1>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"></path>
          </svg>
        </button>
      </div>
      
      <div className="chat-list">
        {contacts.map((contact) => (
          <div 
            key={contact.id}
            className={`chat-item ${contact.id === activeContactId ? 'active' : ''}`}
            onClick={() => onSelectContact(contact.id)}
          >
            <div className="chat-avatar">{contact.name.charAt(0)}</div>
            <div className="chat-info">
              <div className="chat-name">
                <span>{contact.name}</span>
                <span className="chat-time">{contact.last_message_at}</span>
              </div>
              <div className="chat-preview">{contact.last_message_preview}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
