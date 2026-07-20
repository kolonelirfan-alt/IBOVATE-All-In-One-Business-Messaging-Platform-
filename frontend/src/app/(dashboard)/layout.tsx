import React from 'react';
import GlobalSidebar from '@/components/GlobalSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <GlobalSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
        {/* We can add a top header here later if needed */}
        {children}
      </div>
    </div>
  );
}
