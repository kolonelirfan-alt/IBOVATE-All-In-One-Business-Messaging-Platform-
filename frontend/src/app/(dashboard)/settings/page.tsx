'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';

type SettingsTab =
  | 'user_management' | 'agent_management' | 'sla' | 'inbox_settings'
  | 'contact_info' | 'ticket' | 'security'
  | 'api_omnichannel' | 'api_chatbot'
  | 'channels' | 'hours' | 'billing';

interface NavItem {
  key: SettingsTab;
  label: string;
  badge?: string;
  children?: { key: SettingsTab; label: string }[];
}

const SETTINGS_NAV: NavItem[] = [
  { key: 'user_management', label: 'User Management' },
  { key: 'agent_management', label: 'Agent Management' },
  { key: 'sla', label: 'SLA Management' },
  { key: 'inbox_settings', label: 'Inbox' },
  { key: 'contact_info', label: 'Contact Info' },
  { key: 'ticket', label: 'Ticket' },
  { key: 'security', label: 'Security' },
  {
    key: 'api_omnichannel', label: 'API Token',
    children: [
      { key: 'api_omnichannel', label: 'Omnichannel' },
      { key: 'api_chatbot', label: 'Chatbot' },
    ]
  },
  { key: 'channels', label: 'Channels' },
  { key: 'hours', label: 'Business Hours' },
  { key: 'billing', label: 'Billing & Plan' },
];

interface Workspace { id: string; name: string; plan: string; }
interface Agent { id: string; email: string; role: string; created_at: string; }
interface Channel { id: string; type: string; external_account_id: string; status: string; }
interface ApiToken { id: string; name: string; token_display: string; type: string; is_active: boolean; created_at: string; }

// ---------- SUB-COMPONENTS ----------

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{title}</h2>
      {description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>{description}</p>}
    </div>
  );
}

function ComingSoonTab({ title }: { title: string }) {
  return (
    <div>
      <SectionHeader title={title} />
      <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚧</div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>This feature is under development and will be available soon.</div>
      </div>
    </div>
  );
}

function AgentsTab({ agents }: { agents: Agent[] }) {
  return (
    <div>
      <SectionHeader title="Agent Management" description="Manage agents who handle customer conversations." />
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ padding: '8px 18px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
          + Invite Agent
        </button>
      </div>
      <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-3)' }}>
              {['Email', 'Role', 'Joined', ''].map((h, i) => (
                <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No agents yet. Invite your first agent!</td></tr>
            ) : agents.map((agent, i) => (
              <tr key={agent.id} style={{ borderBottom: i < agents.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <td style={{ padding: '14px 16px', fontWeight: 500 }}>{agent.email}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
                    background: agent.role === 'owner' ? 'rgba(110,86,207,0.2)' : 'var(--bg-3)',
                    color: agent.role === 'owner' ? 'var(--primary-hover)' : 'var(--text-secondary)' }}>
                    {agent.role}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(agent.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '14px 16px' }}>
                  {agent.role !== 'owner' && <button style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>}
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
  const cc = (t: string) => t === 'whatsapp' ? '#25d366' : t === 'instagram' ? '#e1306c' : '#6b7280';
  const ci = (t: string) => t === 'whatsapp' ? '📱' : t === 'instagram' ? '📷' : '✉️';
  return (
    <div>
      <SectionHeader title="Connected Channels" description="Manage your messaging channel integrations." />
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ padding: '8px 18px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>+ Add Channel</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {channels.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>No channels connected.</div>
        ) : channels.map(ch => (
          <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: cc(ch.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{ci(ch.type)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: 2 }}>{ch.type} Business</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ch.external_account_id}</div>
            </div>
            <span style={{ padding: '3px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, background: ch.status === 'active' ? 'var(--status-new-bg)' : 'var(--bg-3)', color: ch.status === 'active' ? 'var(--status-new-text)' : 'var(--text-muted)' }}>{ch.status}</span>
            <button style={{ background: 'none', border: '1px solid var(--status-breached-text)', color: 'var(--status-breached-text)', padding: '6px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Disconnect</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiTokenTab({ tokenType }: { tokenType: 'omnichannel' | 'chatbot' }) {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTokenName, setNewTokenName] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/workspace/api-tokens?token_type=${tokenType}`);
      const data = await res.json();
      setTokens(data.data || []);
    } catch { } finally { setIsLoading(false); }
  }, [tokenType]);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const handleGenerate = async () => {
    if (!newTokenName.trim()) return;
    setIsGenerating(true);
    setGeneratedToken(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/workspace/api-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName.trim(), type: tokenType })
      });
      const data = await res.json();
      if (data.token) {
        setGeneratedToken(data.token);
        setNewTokenName('');
        fetchTokens();
      }
    } catch { } finally { setIsGenerating(false); }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this token? This cannot be undone.')) return;
    await fetch(`${getApiUrl()}/api/workspace/api-tokens/${id}`, { method: 'DELETE' });
    fetchTokens();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabel = tokenType === 'omnichannel' ? 'Omnichannel' : 'Chatbot';

  return (
    <div>
      <SectionHeader
        title={`API Token — ${typeLabel}`}
        description={`Use these tokens to authenticate API requests to the ${typeLabel} endpoints. Keep them secret and do not share them publicly.`}
      />

      {/* Generate New Token */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Generate New Token</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={newTokenName}
            onChange={e => setNewTokenName(e.target.value)}
            placeholder={`e.g. Production ${typeLabel} Token`}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
          />
          <button onClick={handleGenerate} disabled={isGenerating || !newTokenName.trim()}
            style={{ padding: '10px 20px', background: newTokenName.trim() ? 'var(--primary)' : 'var(--bg-3)', color: newTokenName.trim() ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: newTokenName.trim() ? 'pointer' : 'not-allowed', fontSize: '0.875rem', transition: 'all 0.15s' }}>
            {isGenerating ? 'Generating...' : '+ Generate Token'}
          </button>
        </div>

        {/* Show generated token once */}
        {generatedToken && (
          <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'var(--status-new-bg)', border: '1px solid var(--status-new-text)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-new-text)' }}>⚠️ Copy this token now — it will not be shown again!</span>
              <button onClick={() => handleCopy(generatedToken)} style={{ padding: '4px 12px', background: copied ? '#10b981' : 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all', display: 'block', background: 'var(--bg-0)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
              {generatedToken}
            </code>
          </div>
        )}
      </div>

      {/* Token List */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-3)' }}>
              {['Name', 'Token', 'Created', ''].map((h, i) => (
                <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : tokens.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tokens yet. Generate your first token above.</td></tr>
            ) : tokens.map((token, i) => (
              <tr key={token.id} style={{ borderBottom: i < tokens.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.875rem' }}>{token.name}</td>
                <td style={{ padding: '14px 16px' }}>
                  <code style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'var(--bg-3)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                    {token.token_display}
                  </code>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{new Date(token.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '14px 16px' }}>
                  <button onClick={() => handleRevoke(token.id)} style={{ background: 'none', border: '1px solid var(--status-breached-text)', color: 'var(--status-breached-text)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Usage Docs */}
      <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem' }}>How to use</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>Include the token in the <code>Authorization</code> header of your API requests:</p>
        <pre style={{ background: 'var(--bg-0)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: '#a78bfa', overflow: 'auto', lineHeight: 1.7 }}>
{`curl -X GET \\
  https://your-api.railway.app/api/inbox/contacts \\
  -H "Authorization: Bearer <your-token>"`}
        </pre>
      </div>
    </div>
  );
}

function BusinessHoursTab() {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [hours, setHours] = useState(DAYS.map((day, i) => ({ day, enabled: i >= 1 && i <= 5, open: '09:00', close: '17:00' })));
  const [saved, setSaved] = useState(false);
  const toggle = (i: number) => setHours(h => h.map((d, j) => j === i ? { ...d, enabled: !d.enabled } : d));
  const update = (i: number, field: 'open' | 'close', val: string) => setHours(h => h.map((d, j) => j === i ? { ...d, [field]: val } : d));
  return (
    <div>
      <SectionHeader title="Business Hours" description="Set when your team is available to respond." />
      <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', maxWidth: 560 }}>
        {hours.map((h, i) => (
          <div key={h.day} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < hours.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
            <div onClick={() => toggle(i)} style={{ width: 40, height: 22, borderRadius: 11, background: h.enabled ? 'var(--primary)' : 'var(--bg-3)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, border: '1px solid var(--border)' }}>
              <div style={{ position: 'absolute', top: 2, left: h.enabled ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
            </div>
            <span style={{ width: 90, fontWeight: 600, color: h.enabled ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.875rem' }}>{h.day}</span>
            {h.enabled ? (
              <>
                <input type="time" value={h.open} onChange={e => update(i, 'open', e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                <span style={{ color: 'var(--text-muted)' }}>—</span>
                <input type="time" value={h.close} onChange={e => update(i, 'close', e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
              </>
            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Closed</span>}
          </div>
        ))}
      </div>
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} style={{ marginTop: 16, padding: '10px 24px', background: saved ? '#10b981' : 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer' }}>
        {saved ? 'Saved!' : 'Save Hours'}
      </button>
    </div>
  );
}

function BillingTab({ workspace }: { workspace: Workspace | null }) {
  const plans = [
    { name: 'Starter', price: 'Free', features: ['1 channel', '2 agents', '1,000 msg/mo'], isCurrent: workspace?.plan === 'trial' },
    { name: 'Growth', price: 'Rp 299.000/mo', features: ['5 channels', '10 agents', '10,000 msg/mo', 'Automation'], isCurrent: false },
    { name: 'Premium', price: 'Rp 799.000/mo', features: ['Unlimited channels', 'Unlimited agents', 'Bot & AI', 'Priority support'], isCurrent: workspace?.plan === 'premium' },
  ];
  return (
    <div>
      <SectionHeader title="Billing & Plan" description="Manage your subscription and usage." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: 780 }}>
        {plans.map(p => (
          <div key={p.name} style={{ padding: '1.5rem', background: p.isCurrent ? 'var(--primary-light)' : 'var(--bg-2)', border: `1px solid ${p.isCurrent ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 800, color: p.isCurrent ? 'var(--primary-hover)' : 'var(--text-primary)' }}>{p.name}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{p.price}</div>
            <div style={{ height: 1, background: 'var(--border)' }} />
            {p.features.map(f => <div key={f} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}><span style={{ color: '#10b981' }}>✓</span>{f}</div>)}
            <button style={{ marginTop: 'auto', padding: '8px', background: p.isCurrent ? 'transparent' : 'var(--primary)', color: p.isCurrent ? 'var(--primary-hover)' : 'white', border: p.isCurrent ? '1px solid var(--primary)' : 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: p.isCurrent ? 'default' : 'pointer', fontSize: '0.85rem' }}>
              {p.isCurrent ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- MAIN PAGE ----------

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('agent_management');
  const [expandedApiToken, setExpandedApiToken] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    const api = getApiUrl();
    fetch(`${api}/api/workspace`).then(r => r.json()).then(d => d.data && setWorkspace(d.data)).catch(() => {});
    fetch(`${api}/api/workspace/agents`).then(r => r.json()).then(d => d.data && setAgents(d.data)).catch(() => {});
    fetch(`${api}/api/channels`).then(r => r.json()).then(d => d.data && setChannels(d.data)).catch(() => {});
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'agent_management': return <AgentsTab agents={agents} />;
      case 'user_management': return <ComingSoonTab title="User Management" />;
      case 'sla': return <ComingSoonTab title="SLA Management" />;
      case 'inbox_settings': return <ComingSoonTab title="Inbox Settings" />;
      case 'contact_info': return <ComingSoonTab title="Contact Info" />;
      case 'ticket': return <ComingSoonTab title="Ticket Settings" />;
      case 'security': return <ComingSoonTab title="Security" />;
      case 'api_omnichannel': return <ApiTokenTab tokenType="omnichannel" />;
      case 'api_chatbot': return <ApiTokenTab tokenType="chatbot" />;
      case 'channels': return <ChannelsTab channels={channels} />;
      case 'hours': return <BusinessHoursTab />;
      case 'billing': return <BillingTab workspace={workspace} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden', backgroundColor: 'var(--bg-0)' }} className="animate-fade-in">
      {/* Settings Nav */}
      <div style={{ width: 220, background: 'var(--bg-2)', borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px 8px', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Settings</div>
        {SETTINGS_NAV.map(item => {
          const isParentActive = item.children ? item.children.some(c => c.key === activeTab) : activeTab === item.key;
          const hasChildren = !!item.children;
          const isExpanded = item.key === 'api_omnichannel' ? expandedApiToken : false;

          return (
            <React.Fragment key={item.key}>
              <div
                onClick={() => {
                  if (hasChildren) {
                    setExpandedApiToken(v => !v);
                    setActiveTab(item.children![0].key);
                  } else {
                    setActiveTab(item.key);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 16px', cursor: 'pointer',
                  borderLeft: '3px solid',
                  borderLeftColor: isParentActive && !hasChildren ? 'var(--primary)' : 'transparent',
                  background: isParentActive && !hasChildren ? 'var(--primary-light)' : 'transparent',
                  color: isParentActive ? 'var(--primary-hover)' : 'var(--text-secondary)',
                  fontWeight: isParentActive ? 600 : 500, fontSize: '0.875rem', transition: 'all 0.15s'
                }}>
                <span>{item.label}</span>
                {hasChildren && <span style={{ fontSize: '0.7rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>}
                {item.badge && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: 8 }}>{item.badge}</span>}
              </div>

              {/* Children */}
              {hasChildren && isExpanded && item.children!.map(child => (
                <div key={child.key}
                  onClick={() => setActiveTab(child.key)}
                  style={{
                    padding: '8px 16px 8px 32px', cursor: 'pointer', fontSize: '0.85rem',
                    borderLeft: '3px solid', borderLeftColor: activeTab === child.key ? 'var(--primary)' : 'transparent',
                    background: activeTab === child.key ? 'var(--primary-light)' : 'transparent',
                    color: activeTab === child.key ? 'var(--primary-hover)' : 'var(--text-secondary)',
                    fontWeight: activeTab === child.key ? 600 : 400, transition: 'all 0.15s'
                  }}>
                  {child.label}
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
        {renderContent()}
      </div>
    </div>
  );
}
