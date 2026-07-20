'use client';

import React from 'react';

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-bubble">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="white">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <circle cx="8.5" cy="10.5" r="1.5" fill="rgba(255,255,255,0.6)"/>
          <circle cx="12" cy="10.5" r="1.5" fill="rgba(255,255,255,0.6)"/>
          <circle cx="15.5" cy="10.5" r="1.5" fill="rgba(255,255,255,0.6)"/>
        </svg>
      </div>
      <h3>A chat will appear here</h3>
      <p>Select a chat to view customer messages.</p>
    </div>
  );
}
