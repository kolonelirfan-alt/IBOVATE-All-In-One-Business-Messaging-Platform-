'use client';

import React, { useState, useEffect, useCallback } from 'react';
import InboxSubNav from '@/components/InboxSubNav';
import ConversationList from '@/components/ConversationList';
import ChatArea from '@/components/ChatArea';
import ProfilePanel from '@/components/ProfilePanel';
import EmptyState from '@/components/EmptyState';
import { Contact, Conversation } from '@/types';
import { DEMO_WORKSPACE_ID, getApiUrl } from '@/lib/api';

import { supabase } from '@/lib/supabase';

const FILTER_LABELS: Record<string, string> = {
  all: 'All chats',
  mine: 'My chats',
  unassigned: 'Unassigned',
  assigned: 'Assigned',
  resolved: 'Resolved',
};

export default function InboxPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [counts, setCounts] = useState({ all: 0, unassigned: 0, assigned: 0, resolved: 0 });

  // Fetch contacts (with filter)
  const fetchContacts = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || '';
      const url = `${getApiUrl()}/api/inbox/contacts?user_email=${encodeURIComponent(userEmail)}${activeFilter !== 'all' ? `&filter=${activeFilter}` : ''}`;
      const res = await fetch(url, {
        headers: { 'X-User-Email': userEmail }
      });
      const data = await res.json();
      if (data.data) {
        setContacts(data.data);
        // Auto-select first if none selected
        if (data.data.length > 0 && !activeContactId) {
          setActiveContactId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [activeFilter, activeContactId]);

  useEffect(() => {
    fetchContacts(false);
  }, [activeFilter]);

  // Realtime subscription + 3-second polling fallback
  useEffect(() => {
    const channel = supabase
      .channel('public:messages_inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchContacts(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchContacts(true);
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchContacts(true);
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchContacts]);

  // Fetch badge counts
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const userEmail = user?.email || '';
      fetch(`${getApiUrl()}/api/inbox/counts?user_email=${encodeURIComponent(userEmail)}`, {
        headers: { 'X-User-Email': userEmail }
      })
        .then(r => r.json())
        .then(data => {
          if (data) setCounts(data);
        })
        .catch(() => {});
    });
  }, [activeFilter, contacts]);

  // Fetch messages when contact changes
  useEffect(() => {
    if (!activeContactId) return;
    const contact = contacts.find(c => c.id === activeContactId);
    if (!contact?.conversation_id) return;

    fetch(`${getApiUrl()}/api/inbox/conversations/${contact.conversation_id}/messages`)
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setActiveConversation({
            id: contact.conversation_id!,
            contact_id: contact.id,
            status: (contact.ticket_status as any) || 'open',
            messages: data.data,
            assigned_to: contact.assigned_to ?? null,
          });
        }
      })
      .catch(err => console.error('Failed to fetch messages', err));
  }, [activeContactId, contacts]);

  const activeContact = contacts.find(c => c.id === activeContactId);

  const handleResolve = () => {
    // Refresh after resolve
    setActiveContactId('');
    setActiveConversation(null);
    fetchContacts();
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* Panel 2: Inbox Sub-Nav */}
      <InboxSubNav
        activeFilter={activeFilter}
        onFilterChange={(f) => {
          setActiveFilter(f);
          setActiveContactId('');
          setActiveConversation(null);
        }}
        counts={counts}
      />

      {/* Panel 3: Conversation List */}
      <ConversationList
        contacts={contacts}
        activeContactId={activeContactId}
        onSelectContact={setActiveContactId}
        filterLabel={FILTER_LABELS[activeFilter] || 'All chats'}
      />

      {/* Panel 4: Chat Area OR Empty State */}
      {activeContact && activeConversation ? (
        <>
          <ChatArea
            contact={activeContact}
            conversation={activeConversation}
            onResolve={handleResolve}
            onUpdate={() => fetchContacts(true)}
          />
          <ProfilePanel contact={activeContact} />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
