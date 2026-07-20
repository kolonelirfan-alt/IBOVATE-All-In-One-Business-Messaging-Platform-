'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import ProfilePanel from '../components/ProfilePanel';
import { Contact, Conversation } from '../types';
// import { mockContacts, mockConversations } from '../lib/mockData';

// Placeholder workspace_id for testing until auth is implemented
const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000000";

export default function Home() {
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch contacts
  useEffect(() => {
    fetch(`http://localhost:8000/api/inbox/contacts?workspace_id=${DEMO_WORKSPACE_ID}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setContacts(data.data);
          if (data.data.length > 0 && !activeContactId) {
            setActiveContactId(data.data[0].id);
          }
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch contacts", err);
        setIsLoading(false);
      });
  }, []);

  // Fetch conversation when active contact changes
  useEffect(() => {
    if (!activeContactId) return;
    
    const contact = contacts.find(c => c.id === activeContactId);
    if (contact && contact.conversation_id) {
      fetch(`http://localhost:8000/api/inbox/conversations/${contact.conversation_id}/messages`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setActiveConversation({
              id: contact.conversation_id!,
              status: contact.status as any,
              messages: data.data,
              assignedTo: null
            });
          }
        })
        .catch(err => console.error("Failed to fetch messages", err));
    }
  }, [activeContactId, contacts]);

  const activeContact = contacts.find(c => c.id === activeContactId);

  if (isLoading) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div className="app-container animate-fade-in">
      <Sidebar 
        contacts={contacts} 
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
          {contacts.length === 0 ? "No contacts found. Waiting for messages..." : "Select a conversation to start chatting"}
        </div>
      )}
    </div>
  );
}
