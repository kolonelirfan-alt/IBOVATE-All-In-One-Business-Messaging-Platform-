'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';

interface Campaign {
  id: string;
  name: string;
  status: string;
  recipient_count: number;
  sent_count: number;
  template_name: string;
  created_at: string;
}

export default function BroadcastPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [recipientCount, setRecipientCount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/campaigns`);
      const data = await res.json();
      setCampaigns(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch(`${getApiUrl()}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName, 
          recipient_count: Number(recipientCount),
          scheduled_at: new Date().toISOString()
        })
      });
      setShowModal(false);
      setNewName('');
      setRecipientCount('');
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return { bg: 'var(--bg-3)', text: 'var(--text-muted)' };
      case 'scheduled': return { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' };
      case 'processing': return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' };
      case 'completed': return { bg: 'var(--status-new-bg)', text: 'var(--status-new-text)' };
      case 'failed': return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' };
      default: return { bg: 'var(--bg-3)', text: 'var(--text-muted)' };
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem', backgroundColor: 'var(--bg-0)' }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Campaigns & Broadcasts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Send bulk messages and WhatsApp templates to your customers.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          + New Campaign
        </button>
      </div>

      {/* Stats Quick View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Campaigns', value: campaigns.length },
          { label: 'Sent This Month', value: campaigns.reduce((acc, c) => acc + c.sent_count, 0) },
          { label: 'Avg Open Rate', value: '68%' },
          { label: 'Avg Reply Rate', value: '24%' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-3)' }}>
              {['Campaign Name', 'Template', 'Status', 'Recipients', 'Sent', 'Created At', ''].map((h, i) => (
                <th key={i} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading campaigns...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>No campaigns found. Create your first broadcast!</td></tr>
            ) : campaigns.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < campaigns.length - 1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                
                <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {c.name}
                </td>
                
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {c.template_name}
                </td>
                
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
                    background: getStatusColor(c.status).bg, color: getStatusColor(c.status).text 
                  }}>
                    {c.status}
                  </span>
                </td>
                
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {c.recipient_count}
                </td>

                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {c.sent_count}
                </td>
                
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    Report
                  </button>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>New Broadcast Campaign</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Campaign Name</label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Promo Lebaran 2026"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Target Recipient Count</label>
                <input 
                  type="number" 
                  required
                  value={recipientCount}
                  onChange={e => setRecipientCount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Number of customers to blast"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} 
                />
              </div>
              
              <div style={{ padding: '12px 14px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 10 }}>
                <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                <span style={{ fontSize: '0.8rem', color: '#60a5fa', lineHeight: 1.5 }}>
                  In a full implementation, you would select a WhatsApp Approved Template and upload a CSV of contacts here.
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 16px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Scheduling...' : 'Schedule Blast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
