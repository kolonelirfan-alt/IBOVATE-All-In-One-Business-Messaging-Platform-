'use client';

import React, { useState, useEffect } from 'react';
import { Contact } from '@/types';
import { DEMO_WORKSPACE_ID } from '@/lib/api';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/inbox/contacts?workspace_id=${DEMO_WORKSPACE_ID}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setContacts(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, []);

  return (
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Contacts (CRM)</h1>
        <button style={{
          backgroundColor: 'var(--primary)',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px -1px rgba(var(--primary-rgb), 0.2)'
        }}>
          + Add Contact
        </button>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading contacts...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Channel</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Tags</th>
                <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No contacts found.
                  </td>
                </tr>
              ) : (
                contacts.map((contact, i) => (
                  <tr key={contact.id} style={{ 
                    borderBottom: i === contacts.length - 1 ? 'none' : '1px solid var(--border-color)',
                    transition: 'background-color 0.2s ease',
                  }}>
                    <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', 
                          backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold'
                        }}>
                          {contact.name.charAt(0)}
                        </div>
                        {contact.name}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{contact.phone || '-'}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                        backgroundColor: contact.channel === 'whatsapp' ? '#dcfce7' : '#fce7f3',
                        color: contact.channel === 'whatsapp' ? '#166534' : '#9d174d'
                      }}>
                        {contact.channel}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No tags</span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button style={{ 
                        background: 'none', border: 'none', color: 'var(--primary)', 
                        fontWeight: 600, cursor: 'pointer' 
                      }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
