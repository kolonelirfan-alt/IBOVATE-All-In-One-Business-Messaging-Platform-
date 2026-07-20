import React from 'react';

export const metadata = {
  title: 'Terms of Service | OmniCRM',
  description: 'Terms of Service for OmniCRM',
};

export default function TermsOfService() {
  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>Terms of Service</h1>
      <p style={{ marginBottom: '1rem' }}>Last updated: July 2026</p>
      
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>1. Acceptance of Terms</h2>
        <p>By accessing or using OmniCRM, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>2. Use of Service</h2>
        <p>OmniCRM provides a unified dashboard for managing WhatsApp and Instagram business messages. You agree to use the service only for lawful business communication purposes and in compliance with Meta's Business Messaging Policies.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>3. Service Limitations</h2>
        <p>We do not guarantee uninterrupted access to the service. We rely on third-party APIs (such as Meta Graph API) and are not responsible for outages caused by these third-party providers.</p>
      </section>
      
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>4. Account Termination</h2>
        <p>We reserve the right to suspend or terminate your account at any time if you violate these terms or Meta's commerce and messaging policies.</p>
      </section>
    </div>
  );
}
