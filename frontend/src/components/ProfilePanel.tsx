import React from 'react';
import { Contact } from '../types';

interface ProfilePanelProps {
  contact: Contact;
}

export default function ProfilePanel({ contact }: ProfilePanelProps) {
  return (
    <aside className="profile-panel">
      <div className="profile-avatar">{contact.name.charAt(0)}</div>
      <div className="profile-name">{contact.name}</div>
      <div className="profile-status">
        <div className="status-dot" style={{ backgroundColor: contact.status === 'online' ? 'var(--success)' : 'var(--text-secondary)' }}></div>
        {contact.status === 'online' ? 'Online' : 'Offline'}
      </div>
      
      {contact.tags.map(tag => (
        <div key={tag} className="tag-badge">{tag}</div>
      ))}
      
      <div style={{ width: '100%', marginTop: '32px' }}>
        <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Contact Info
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {contact.phone && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone Number</div>
              <div style={{ fontSize: '0.95rem' }}>{contact.phone}</div>
            </div>
          )}
          
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Channel</div>
            <div style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'capitalize' }}>
              {contact.channel === 'whatsapp' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              )}
              {contact.channel}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
