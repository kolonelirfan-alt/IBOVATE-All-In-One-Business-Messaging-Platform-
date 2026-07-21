import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Data Deletion Instructions | IBOVATE OmniCRM',
  description: 'Instructions for removing your data from IBOVATE.',
};

export default function DataDeletion() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-0)', color: 'var(--text-primary)' }}>
      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 5%', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>I</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>IBOVATE</span>
        </Link>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: '4rem 5%', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          Data Deletion Instructions
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          IBOVATE complies strictly with Meta's developer policies. If you have connected your Meta (Facebook or Instagram) account to IBOVATE OmniCRM and wish to remove your data or disconnect your integration, follow the steps below.
        </p>

        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>Method 1: Disconnect via OmniCRM Dashboard</h2>
          <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 0 }}>
            <li>Log in to your IBOVATE OmniCRM account.</li>
            <li>Navigate to the <strong>Integrations</strong> page from the sidebar.</li>
            <li>Locate the <strong>WhatsApp</strong> or <strong>Instagram</strong> channel.</li>
            <li>Click on <strong>Manage</strong> and select <strong>Disconnect</strong>.</li>
            <li>All associated permanent access tokens and session data will be immediately removed from our databases.</li>
          </ol>
        </div>

        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>Method 2: Remove App via Facebook Settings</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
            You can revoke our app's access directly from your Facebook account:
          </p>
          <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 0 }}>
            <li>Go to your Facebook account's <strong>Settings & Privacy</strong> &gt; <strong>Settings</strong>.</li>
            <li>Select <strong>Business Integrations</strong> from the left menu.</li>
            <li>Find <strong>IBOVATE OmniCRM</strong> in the list of active integrations.</li>
            <li>Click <strong>Remove</strong> and confirm.</li>
            <li>This will instantly revoke our API access. To request complete deletion of historical conversation data, email us at <strong>privacy@ibovate.com</strong>.</li>
          </ol>
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2rem' }}>
          For further assistance regarding privacy or data deletion, please reach out to privacy@ibovate.com.
        </p>
      </main>
      
      {/* Footer */}
      <footer style={{ padding: '2rem 5%', borderTop: '1px solid var(--border)', background: 'var(--bg-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        <div>&copy; {new Date().getFullYear()} IBOVATE. All rights reserved.</div>
      </footer>
    </div>
  );
}
