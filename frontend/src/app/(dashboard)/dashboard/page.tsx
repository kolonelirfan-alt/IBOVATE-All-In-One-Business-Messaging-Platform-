'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';

interface Stats {
  total_contacts: number;
  total_conversations: number;
  open_conversations: number;
  resolved_conversations: number;
}

interface Channel { id: string; type: string; status: string; external_account_id: string; }

const StatCard = ({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: string; color: string }) => (
  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const api = getApiUrl();
    Promise.all([
      fetch(`${api}/api/dashboard/stats`).then(r => r.json()),
      fetch(`${api}/api/channels`).then(r => r.json()),
    ]).then(([statsData, channelsData]) => {
      setStats(statsData);
      setChannels(channelsData.data || []);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const channelIcon = (type: string) => type === 'whatsapp' ? '💬' : type === 'instagram' ? '📷' : '✉️';
  const channelColor = (type: string) => type === 'whatsapp' ? '#25d366' : '#e1306c';

  const resolutionRate = stats
    ? stats.total_conversations > 0 ? Math.round((stats.resolved_conversations / stats.total_conversations) * 100) : 0
    : 0;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-0)' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Contacts" value={isLoading ? '...' : stats?.total_contacts ?? 0} icon="👥" color="#6e56cf" sub="All registered contacts" />
        <StatCard label="All Conversations" value={isLoading ? '...' : stats?.total_conversations ?? 0} icon="💬" color="#60a5fa" sub="Across all channels" />
        <StatCard label="Open Tickets" value={isLoading ? '...' : stats?.open_conversations ?? 0} icon="🔴" color="#f59e0b" sub="Awaiting response" />
        <StatCard label="Resolution Rate" value={isLoading ? '...' : `${resolutionRate}%`} icon="✅" color="#10b981" sub={`${stats?.resolved_conversations ?? 0} resolved`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Message Volume Chart Placeholder */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Message Volume (Last 7 Days)</h2>
          {/* Simple bar chart visualization */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150, paddingTop: 16 }}>
            {[42, 78, 55, 90, 64, 83, 71].map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', background: 'linear-gradient(180deg, var(--primary) 0%, rgba(110,86,207,0.3) 100%)', borderRadius: '4px 4px 0 0', height: `${(val / 90) * 120}px`, transition: 'height 0.5s ease' }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Connected Channels */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Connected Channels</h2>
            {isLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
            ) : channels.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No channels connected.</div>
            ) : channels.map(ch => (
              <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: channelColor(ch.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'white', fontWeight: 700 }}>
                  {channelIcon(ch.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{ch.type}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ch.external_account_id}</div>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  background: ch.status === 'active' ? 'var(--status-new-bg)' : 'var(--bg-3)',
                  color: ch.status === 'active' ? 'var(--status-new-text)' : 'var(--text-muted)' }}>
                  {ch.status}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '💬 Go to Inbox', href: '/inbox' },
                { label: '👥 View Contacts', href: '/contacts' },
                { label: '⚙️ Manage Settings', href: '/settings' },
              ].map(a => (
                <a key={a.href} href={a.href} style={{ display: 'block', padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'background 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-4)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-3)')}>
                  {a.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
