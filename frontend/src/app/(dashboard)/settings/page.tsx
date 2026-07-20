'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';

type SettingsTab = 'workspace' | 'agents' | 'channels' | 'hours' | 'billing';

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key: 'workspace', label: 'Workspace Profile', icon: '🏢' },
  { key: 'agents', label: 'Agents & Roles', icon: '👥' },
  { key: 'channels', label: 'Channels', icon: '🔗' },
  { key: 'hours', label: 'Business Hours', icon: '🕐' },
  { key: 'billing', label: 'Billing & Plan', icon: '💳' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Workspace { id: string; name: string; plan: string; created_at: string; }
interface Agent { id: string; email: string; role: string; created_at: string; }
interface Channel { id: string; type: string; external_account_id: string; status: string; created_at: string; }

function WorkspaceTab({ workspace, onSave }: { workspace: Workspace | null; onSave: (name: string) => void }) {
  const [name, setName] = useState(workspace?.name || '');
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (workspace) setName(workspace.name); }, [workspace]);

  const handleSave = () => {
    onSave(name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Workspace Profile</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 480 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>WORKSPACE NAME</label>
          <input value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>CURRENT PLAN</label>
          <div style={{ padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
              {workspace?.plan || 'trial'}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {workspace?.plan === 'premium' ? 'All features unlocked' : 'Limited features'}
            </span>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>WORKSPACE ID</label>
          <div style={{ padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            {workspace?.id || 'Loading...'}
          </div>
        </div>
        <button onClick={handleSave} style={{ alignSelf: 'flex-start', padding: '10px 24px', background: saved ? '#10b981' : 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function AgentsTab({ agents }: { agents: Agent[] }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Agents & Roles</h2>
        <button style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
          + Invite Agent
        </button>
      </div>
      <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-3)' }}>
              {['Email', 'Role', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No agents found. Invite your first agent!</td></tr>
            ) : agents.map((agent, i) => (
              <tr key={agent.id} style={{ borderBottom: i < agents.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{agent.email}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700,
                    background: agent.role === 'owner' ? 'rgba(110,86,207,0.2)' : agent.role === 'admin' ? 'rgba(96,165,250,0.15)' : 'var(--bg-3)',
                    color: agent.role === 'owner' ? 'var(--primary-hover)' : agent.role === 'admin' ? '#60a5fa' : 'var(--text-secondary)',
                    textTransform: 'capitalize' }}>
                    {agent.role}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {new Date(agent.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {agent.role !== 'owner' && (
                    <button style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem' }}>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChannelsTab({ channels }: { channels: Channel[] }) {
  const channelIcon = (type: string) => type === 'whatsapp' ? '📱' : type === 'instagram' ? '📷' : '✉️';
  const channelColor = (type: string) => type === 'whatsapp' ? '#25d366' : type === 'instagram' ? '#e1306c' : '#6b7280';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Connected Channels</h2>
        <button style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
          + Add Channel
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {channels.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            No channels connected. Add your first channel!
          </div>
        ) : channels.map(ch => (
          <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '16px 20px', background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: channelColor(ch.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
              {channelIcon(ch.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: 2 }}>{ch.type} Business</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ch.external_account_id}</div>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700,
              background: ch.status === 'active' ? 'var(--status-new-bg)' : 'var(--status-breached-bg)',
              color: ch.status === 'active' ? 'var(--status-new-text)' : 'var(--status-breached-text)' }}>
              {ch.status}
            </span>
            <button style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--status-breached-text)', padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              Disconnect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessHoursTab() {
  const [hours, setHours] = useState(
    DAYS.map((day, i) => ({ day, enabled: i >= 1 && i <= 5, open: '09:00', close: '17:00' }))
  );
  const [saved, setSaved] = useState(false);

  const toggle = (i: number) => setHours(h => h.map((d, j) => j === i ? { ...d, enabled: !d.enabled } : d));
  const update = (i: number, field: 'open' | 'close', val: string) =>
    setHours(h => h.map((d, j) => j === i ? { ...d, [field]: val } : d));

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Business Hours</h2>
      <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', maxWidth: 580 }}>
        {hours.map((h, i) => (
          <div key={h.day} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '14px 20px', borderBottom: i < hours.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
            {/* Toggle */}
            <div onClick={() => toggle(i)} style={{ width: 40, height: 22, borderRadius: 11, background: h.enabled ? 'var(--primary)' : 'var(--bg-3)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, border: '1px solid var(--border)' }}>
              <div style={{ position: 'absolute', top: 2, left: h.enabled ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
            </div>
            <span style={{ width: 90, fontWeight: 600, color: h.enabled ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.875rem' }}>{h.day}</span>
            {h.enabled ? (
              <>
                <input type="time" value={h.open} onChange={e => update(i, 'open', e.target.value)}
                  style={{ padding: '6px 10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                <span style={{ color: 'var(--text-muted)' }}>—</span>
                <input type="time" value={h.close} onChange={e => update(i, 'close', e.target.value)}
                  style={{ padding: '6px 10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Closed</span>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        style={{ marginTop: '1.25rem', padding: '10px 24px', background: saved ? '#10b981' : 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer' }}>
        {saved ? '✓ Saved!' : 'Save Business Hours'}
      </button>
    </div>
  );
}

function BillingTab({ workspace }: { workspace: Workspace | null }) {
  const plans = [
    { name: 'Starter', price: 'Free', features: ['1 channel', '2 agents', '1,000 messages/mo', 'Basic reports'], isCurrent: workspace?.plan === 'trial' },
    { name: 'Growth', price: 'Rp 299.000/mo', features: ['5 channels', '10 agents', '10,000 messages/mo', 'Advanced reports', 'Automation'], isCurrent: false },
    { name: 'Premium', price: 'Rp 799.000/mo', features: ['Unlimited channels', 'Unlimited agents', 'Unlimited messages', 'Full analytics', 'Bot & AI', 'Priority support'], isCurrent: workspace?.plan === 'premium' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Billing & Plan</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: 820 }}>
        {plans.map(plan => (
          <div key={plan.name} style={{ padding: '1.5rem', background: plan.isCurrent ? 'var(--primary-light)' : 'var(--bg-2)', border: `1px solid ${plan.isCurrent ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: plan.isCurrent ? 'var(--primary-hover)' : 'var(--text-primary)' }}>{plan.name}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{plan.price}</div>
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            {plan.features.map(f => (
              <div key={f} style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span> {f}
              </div>
            ))}
            <button style={{ marginTop: 'auto', padding: '8px', background: plan.isCurrent ? 'transparent' : 'var(--primary)', color: plan.isCurrent ? 'var(--primary-hover)' : 'white', border: plan.isCurrent ? '1px solid var(--primary)' : 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: plan.isCurrent ? 'default' : 'pointer', fontSize: '0.85rem' }}>
              {plan.isCurrent ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    const api = getApiUrl();
    fetch(`${api}/api/workspace`).then(r => r.json()).then(d => d.data && setWorkspace(d.data)).catch(() => {});
    fetch(`${api}/api/workspace/agents`).then(r => r.json()).then(d => d.data && setAgents(d.data)).catch(() => {});
    fetch(`${api}/api/channels`).then(r => r.json()).then(d => d.data && setChannels(d.data)).catch(() => {});
  }, []);

  const handleSaveWorkspace = async (name: string) => {
    if (!workspace) return;
    await fetch(`${getApiUrl()}/api/workspace`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    setWorkspace(w => w ? { ...w, name } : w);
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden', backgroundColor: 'var(--bg-0)' }} className="animate-fade-in">
      {/* Settings Sub-Nav */}
      <div style={{ width: 220, background: 'var(--bg-2)', borderRight: '1px solid var(--border)', padding: '1rem 0', flexShrink: 0 }}>
        <div style={{ padding: '0 16px 12px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Settings</div>
        {TABS.map(tab => (
          <div key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', borderLeft: '3px solid', borderLeftColor: activeTab === tab.key ? 'var(--primary)' : 'transparent', background: activeTab === tab.key ? 'var(--primary-light)' : 'transparent', color: activeTab === tab.key ? 'var(--primary-hover)' : 'var(--text-secondary)', fontWeight: activeTab === tab.key ? 600 : 500, fontSize: '0.875rem', transition: 'all 0.15s' }}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        ))}
      </div>

      {/* Settings Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        {activeTab === 'workspace' && <WorkspaceTab workspace={workspace} onSave={handleSaveWorkspace} />}
        {activeTab === 'agents' && <AgentsTab agents={agents} />}
        {activeTab === 'channels' && <ChannelsTab channels={channels} />}
        {activeTab === 'hours' && <BusinessHoursTab />}
        {activeTab === 'billing' && <BillingTab workspace={workspace} />}
      </div>
    </div>
  );
}
