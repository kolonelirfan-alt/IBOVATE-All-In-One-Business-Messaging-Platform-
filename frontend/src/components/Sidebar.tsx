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
      
      <div className="chat-list" style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>
        {contacts.map((contact) => (
          <div 
            key={contact.id}
            className={`chat-item ${contact.id === activeContactId ? 'active' : ''}`}
            onClick={() => onSelectContact(contact.id)}
            style={{
              display: 'flex',
              padding: '12px',
              gap: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '8px',
              backgroundColor: contact.id === activeContactId ? 'var(--bg-hover)' : 'transparent',
              border: contact.id === activeContactId ? '1px solid var(--border-color)' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <div className="chat-avatar" style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              backgroundColor: 'var(--primary)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', flexShrink: 0
            }}>
              {contact.name.charAt(0)}
            </div>
            
            <div className="chat-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="chat-name" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</span>
                <span className="chat-time" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {contact.last_message_at ? new Date(contact.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              
              <div className="chat-preview" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                {contact.last_message_preview || 'No messages yet'}
              </div>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                {contact.priority && (
                  <span style={{ 
                    fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                    backgroundColor: contact.priority === 'high' ? '#fee2e2' : contact.priority === 'low' ? '#f3f4f6' : '#fef3c7',
                    color: contact.priority === 'high' ? '#ef4444' : contact.priority === 'low' ? '#6b7280' : '#f59e0b',
                    fontWeight: 600, textTransform: 'uppercase'
                  }}>
                    {contact.priority}
                  </span>
                )}
                {contact.ticket_status && (
                  <span style={{ 
                    fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                    backgroundColor: contact.ticket_status === 'open' ? '#e0e7ff' : contact.ticket_status === 'resolved' ? '#d1fae5' : '#f3f4f6',
                    color: contact.ticket_status === 'open' ? '#4f46e5' : contact.ticket_status === 'resolved' ? '#10b981' : '#6b7280',
                    fontWeight: 600, textTransform: 'uppercase'
                  }}>
                    {contact.ticket_status}
                  </span>
                )}
                {contact.assigned_to && (
                  <span style={{ 
                    fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                    backgroundColor: '#f3e8ff', color: '#9333ea', fontWeight: 600
                  }}>
                    Assigned
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
