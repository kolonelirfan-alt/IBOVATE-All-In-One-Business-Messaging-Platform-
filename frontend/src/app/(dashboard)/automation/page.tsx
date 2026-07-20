'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';

interface AutomationRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_value: string;
  action_type: string;
  action_value: string;
  is_active: boolean;
  created_at: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  'exact_match': 'Exact Match',
  'contains': 'Contains Keyword',
  'first_message': 'First Time Message',
  'outside_hours': 'Outside Business Hours'
};

const ACTION_LABELS: Record<string, string> = {
  'send_message': 'Send Reply',
  'assign_agent': 'Assign to Agent',
  'add_tag': 'Add Tag',
  'resolve': 'Mark as Resolved'
};

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTriggerType, setNewTriggerType] = useState('contains');
  const [newTriggerValue, setNewTriggerValue] = useState('');
  const [newActionType, setNewActionType] = useState('send_message');
  const [newActionValue, setNewActionValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/automation/rules`);
      const data = await res.json();
      setRules(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
    try {
      await fetch(`${getApiUrl()}/api/automation/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
    } catch (err) {
      // Revert if failed
      setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: currentStatus } : r));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch(`${getApiUrl()}/api/automation/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName, 
          trigger_type: newTriggerType,
          trigger_value: newTriggerValue,
          action_type: newActionType,
          action_value: newActionValue
        })
      });
      setShowModal(false);
      
      // Reset form
      setNewName('');
      setNewTriggerValue('');
      setNewActionValue('');
      fetchRules();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem', backgroundColor: 'var(--bg-0)' }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Bot & Automation</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Create rules to automatically handle incoming messages and route tickets.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          + New Rule
        </button>
      </div>

      {/* Rules Table */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-3)' }}>
              {['Status', 'Rule Name', 'Condition', 'Action', 'Created', ''].map((h, i) => (
                <th key={i} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading rules...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>No automation rules active. Create one above!</td></tr>
            ) : rules.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: i < rules.length - 1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                
                <td style={{ padding: '16px 20px' }}>
                  <div 
                    onClick={() => handleToggle(r.id, r.is_active)} 
                    style={{ width: 44, height: 24, borderRadius: 12, background: r.is_active ? 'var(--primary)' : 'var(--bg-3)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', border: '1px solid var(--border)' }}>
                    <div style={{ position: 'absolute', top: 2, left: r.is_active ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                  </div>
                </td>

                <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {r.name}
                </td>
                
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>IF {TRIGGER_LABELS[r.trigger_type] || r.trigger_type}</div>
                  {r.trigger_value && (
                    <code style={{ fontSize: '0.75rem', background: 'var(--bg-0)', padding: '2px 6px', borderRadius: 4, color: 'var(--primary-hover)', border: '1px solid rgba(110,86,207,0.3)' }}>
                      "{r.trigger_value}"
                    </code>
                  )}
                </td>
                
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>THEN {ACTION_LABELS[r.action_type] || r.action_type}</div>
                  {r.action_value && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.action_value}
                    </div>
                  )}
                </td>

                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    Edit
                  </button>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Reply Builder Ad */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(110,86,207,0.1), rgba(96,165,250,0.1))', border: '1px solid rgba(110,86,207,0.2)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-hover)', marginBottom: 4 }}>Quick Reply Templates</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Create canned responses that your agents can send with a single click in the Inbox.</p>
        </div>
        <button style={{ padding: '8px 16px', background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem' }}>
          Manage Templates
        </button>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Create Automation Rule</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Rule Name</label>
                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Auto-reply for Pricing"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>IF (Trigger)</label>
                  <select value={newTriggerType} onChange={e => setNewTriggerType(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginBottom: 8 }}>
                    <option value="contains">Contains Keyword</option>
                    <option value="exact_match">Exact Match</option>
                    <option value="first_message">First Time Message</option>
                    <option value="outside_hours">Outside Business Hours</option>
                  </select>
                  {['contains', 'exact_match'].includes(newTriggerType) && (
                    <input type="text" required value={newTriggerValue} onChange={e => setNewTriggerValue(e.target.value)} placeholder="Keyword..."
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                  )}
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>THEN (Action)</label>
                  <select value={newActionType} onChange={e => setNewActionType(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginBottom: 8 }}>
                    <option value="send_message">Send Auto-Reply</option>
                    <option value="assign_agent">Assign to Agent</option>
                    <option value="add_tag">Add Label/Tag</option>
                  </select>
                  <input type={newActionType === 'send_message' ? 'text' : 'text'} required value={newActionValue} onChange={e => setNewActionValue(e.target.value)} placeholder={newActionType === 'send_message' ? 'Message content...' : 'Value...'}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '10px 16px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
