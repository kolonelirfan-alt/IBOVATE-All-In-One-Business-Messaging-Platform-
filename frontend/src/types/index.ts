export interface Message {
  id: string;
  conversation_id: string;
  direction: 'in' | 'out';
  source: 'customer' | 'dashboard' | 'app_echo';
  content: string;
  sent_at: string; // ISO 8601 String
}

export interface Contact {
  id: string;
  external_id: string;
  name: string;
  phone?: string;
  channel: 'whatsapp' | 'instagram';
  status: 'online' | 'offline';
  tags: string[];
  last_message_at: string;
  last_message_preview: string;
  conversation_id?: string;
  priority?: 'low' | 'medium' | 'high';
  ticket_status?: 'open' | 'pending' | 'resolved';
  assigned_to?: string | null;
}

export interface Conversation {
  id: string;
  contact_id: string;
  status: 'open' | 'pending' | 'resolved';
  priority?: 'low' | 'medium' | 'high';
  assigned_to?: string | null;
  messages: Message[];
}
