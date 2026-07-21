import React from 'react';

export default function CallsPage() {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', flex: 1 }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--text-secondary)'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.5 6.49l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Coming Soon</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          The Calls feature is currently under development. Soon you'll be able to make and receive voice calls directly from IBOVATE OmniCRM.
        </p>
      </div>
    </div>
  );
}
