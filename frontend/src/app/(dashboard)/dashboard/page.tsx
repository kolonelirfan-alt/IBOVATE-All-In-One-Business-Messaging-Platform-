'use client';

import React from 'react';

export default function DashboardPage() {
  const stats = [
    { label: 'Total Tickets', value: '1,245', change: '+12%' },
    { label: 'Unresolved', value: '34', change: '-5%' },
    { label: 'Avg Response Time', value: '2m 14s', change: '-12s' },
    { label: 'CSAT Score', value: '4.8/5', change: '+0.1' },
  ];

  return (
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }} className="animate-fade-in">
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--text-primary)' }}>
        Overview
      </h1>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>{stat.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stat.value}</span>
              <span style={{ 
                fontSize: '0.85rem', 
                fontWeight: 'bold', 
                color: stat.change.startsWith('+') && stat.label !== 'Unresolved' ? '#10b981' : 
                       stat.change.startsWith('-') && stat.label === 'Unresolved' ? '#10b981' : 
                       stat.change.startsWith('-') && stat.label === 'Avg Response Time' ? '#10b981' : 
                       '#ef4444',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts / Recent Activity Placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          minHeight: '300px'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Message Volume</h2>
          <div style={{ width: '100%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            [ Chart Component Placeholder ]
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          minHeight: '300px'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Agent Status</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['Rina Gunawan (Online)', 'Budi Santoso (Busy)', 'Siti Aminah (Offline)'].map((agent, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '10px', height: '10px', borderRadius: '50%', 
                  backgroundColor: agent.includes('Online') ? '#10b981' : agent.includes('Busy') ? '#f59e0b' : '#9ca3af' 
                }} />
                <span>{agent}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
