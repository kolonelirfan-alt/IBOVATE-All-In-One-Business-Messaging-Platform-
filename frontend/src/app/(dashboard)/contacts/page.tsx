'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';

interface Contact {
  id: string;
  name: string;
  phone: string;
  channel: string;
  tags: string[];
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Add Contact Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [search]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const url = new URL(`${getApiUrl()}/api/contacts`);
      if (search) url.searchParams.append('q', search);
      const res = await fetch(url.toString());
      const data = await res.json();
      setContacts(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch(`${getApiUrl()}/api/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, phone: newPhone })
      });
      setShowAddModal(false);
      setNewName('');
      setNewPhone('');
      fetchContacts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const channelIcon = (type: string) => type === 'whatsapp' ? '📱' : type === 'instagram' ? '📷' : '✉️';
  const channelColor = (type: string) => type === 'whatsapp' ? '#25d366' : type === 'instagram' ? '#e1306c' : '#6b7280';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem', backgroundColor: 'var(--bg-0)' }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Contacts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Manage your customer directory and view their interaction history.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          + Add Contact
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }} 
          />
        </div>
        <button style={{ padding: '10px 16px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          🏷️ Filter by Tag
        </button>
        <button style={{ padding: '10px 16px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          📥 Export
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-3)' }}>
              {['Name', 'Phone / ID', 'Channel', 'Tags', 'Date Added', ''].map((h, i) => (
                <th key={i} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading contacts...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>No contacts found matching your criteria.</td></tr>
            ) : contacts.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < contacts.length - 1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{c.name}</span>
                  </div>
                </td>
                
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  {c.phone}
                </td>
                
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-0)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', width: 'fit-content' }}>
                    <span style={{ fontSize: '0.8rem', color: channelColor(c.channel) }}>{channelIcon(c.channel)}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{c.channel}</span>
                  </div>
                </td>
                
                <td style={{ padding: '16px 20px' }}>
                  {c.tags?.length > 0 ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.tags.map(t => (
                        <span key={t} style={{ padding: '2px 8px', background: 'rgba(110,86,207,0.15)', color: 'var(--primary-hover)', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                  )}
                </td>
                
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    View Profile
                  </button>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Add New Contact</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleAddContact} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Phone Number (WhatsApp)</label>
                <input 
                  type="text" 
                  required
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="e.g. 62812345678"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} 
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 16px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
