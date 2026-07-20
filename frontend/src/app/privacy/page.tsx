import React from 'react';

export const metadata = {
  title: 'Privacy Policy | OmniCRM',
  description: 'Privacy Policy for OmniCRM',
};

export default function PrivacyPolicy() {
  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>Privacy Policy</h1>
      <p style={{ marginBottom: '1rem' }}>Last updated: July 2026</p>
      
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>1. Introduction</h2>
        <p>Welcome to OmniCRM. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our omnichannel business messaging platform.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>2. Data We Collect</h2>
        <p>We may collect information such as your name, email address, business details, and messaging history required to provide our CRM services via WhatsApp and Instagram.</p>
      </section>
      
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>3. How We Use Your Data</h2>
        <p>Your data is strictly used to facilitate business messaging, synchronize communications, and improve your experience on our platform. We do not sell your personal data to third parties.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>4. Data Deletion Instructions</h2>
        <p>If you wish to remove your data or disconnect your Meta accounts from OmniCRM, you can do so from your workspace settings or by contacting our support team at support@omnicrm.app. All associated messaging data will be permanently deleted upon request.</p>
      </section>
    </div>
  );
}
