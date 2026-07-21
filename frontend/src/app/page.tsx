import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'IBOVATE OmniCRM | The Ultimate Business Messaging Platform',
  description: 'Unify your customer communications across WhatsApp, Instagram, and more with our premium omnichannel inbox.',
};

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-0)', color: 'var(--text-primary)' }}>
      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 5%', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>I</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>IBOVATE</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Privacy</Link>
          <Link href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Terms</Link>
          <Link href="/inbox" style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Go to App</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 5%', textAlign: 'center' }}>
        <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2rem', textTransform: 'uppercase' }}>
          Omnichannel Platform 2.0
        </div>
        
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: '800px', marginBottom: '1.5rem', background: 'linear-gradient(to right, #ffffff, #a0a0a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Unify Your Customer Conversations
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '3rem', lineHeight: 1.6 }}>
          Manage WhatsApp, Instagram, and web chats from a single, beautiful dashboard built for modern customer service teams.
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/inbox" style={{ background: 'var(--primary)', color: 'white', padding: '1rem 2rem', borderRadius: 'var(--radius-full)', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 8px 16px rgba(0, 112, 243, 0.2)', transition: 'transform 0.2s' }}>
            Start for free
          </Link>
          <Link href="#features" style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '1rem 2rem', borderRadius: 'var(--radius-full)', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem' }}>
            Learn more
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '2rem 5%', borderTop: '1px solid var(--border)', background: 'var(--bg-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        <div>&copy; {new Date().getFullYear()} IBOVATE. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/data-deletion" style={{ color: 'inherit', textDecoration: 'none' }}>Data Deletion</Link>
        </div>
      </footer>
    </div>
  );
}
