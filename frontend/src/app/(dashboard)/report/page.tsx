import React from 'react';

export default function ReportPage() {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', flex: 1 }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--text-secondary)'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Coming Soon</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          The Analytics & Reports feature is currently under development. Soon you'll be able to track your agents' performance and message volumes.
        </p>
      </div>
    </div>
  );
}
