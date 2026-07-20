'use client';

import React from 'react';

interface InboxSubNavProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: {
    all: number;
    unassigned: number;
    assigned: number;
    resolved: number;
  };
}

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const filters = [
  { key: 'all', label: 'All chats', countKey: 'all' as const },
  { key: 'mine', label: 'My chats', countKey: null },
  { key: 'unassigned', label: 'Unassigned', countKey: 'unassigned' as const },
  { key: 'assigned', label: 'Assigned', countKey: 'assigned' as const },
  { key: 'resolved', label: 'Resolved', countKey: 'resolved' as const },
];

export default function InboxSubNav({ activeFilter, onFilterChange, counts }: InboxSubNavProps) {
  return (
    <div className="inbox-subnav">
      {/* Header */}
      <div className="subnav-header">
        <span className="subnav-title">Inbox</span>
        <div className="subnav-actions">
          <button className="subnav-icon-btn" title="Search">
            <SearchIcon />
          </button>
          <button className="subnav-icon-btn" title="New conversation">
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Filter items */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
        {filters.map((f) => {
          const count = f.countKey ? counts[f.countKey] : null;
          const isActive = activeFilter === f.key;
          return (
            <div
              key={f.key}
              className={`subnav-item ${isActive ? 'active' : ''}`}
              onClick={() => onFilterChange(f.key)}
            >
              <span>{f.label}</span>
              {count !== null && count > 0 && (
                <span className="subnav-count">{count}</span>
              )}
            </div>
          );
        })}

        {/* Custom View Section */}
        <div className="subnav-section-label">
          <span>Custom view</span>
          <button className="subnav-icon-btn" title="Add custom view">
            <PlusIcon />
          </button>
        </div>

        <div className="subnav-item">
          <span>Verified Customer</span>
        </div>
      </div>

      {/* Promo Banner */}
      <div style={{
        margin: 12,
        padding: '12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--primary-light)',
        border: '1px solid rgba(110, 86, 207, 0.3)',
        fontSize: '0.78rem'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--primary-hover)', marginBottom: 4 }}>
          Explore Inbox new look
        </div>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
          Enjoy improved performance and easier navigation.
        </div>
        <button style={{
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 10px',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%'
        }}>
          Learn more
        </button>
      </div>
    </div>
  );
}
