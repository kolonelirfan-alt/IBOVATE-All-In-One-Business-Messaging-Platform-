'use client';

import React, { useState } from 'react';
import { mockContacts, mockConversations } from '../lib/mockData';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import ProfilePanel from '../components/ProfilePanel';

export default function Home() {
  const [activeContactId, setActiveContactId] = useState<string>(mockContacts[0].id);

  const activeContact = mockContacts.find(c => c.id === activeContactId);
  const activeConversation = mockConversations[activeContactId];

  return (
    <div className="app-container animate-fade-in">
      <Sidebar 
        contacts={mockContacts} 
        activeContactId={activeContactId} 
        onSelectContact={setActiveContactId} 
      />
      
      {activeContact && activeConversation ? (
        <>
          <ChatArea 
            contact={activeContact} 
            conversation={activeConversation} 
          />
          <ProfilePanel 
            contact={activeContact} 
          />
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Select a conversation to start chatting
        </div>
      )}
    </div>
  );
}
