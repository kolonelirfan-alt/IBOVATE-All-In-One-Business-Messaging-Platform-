import { Contact, Conversation } from '../types';

export const mockContacts: Contact[] = [
  {
    id: 'c1',
    external_id: '6281234567890',
    name: 'Budi Santoso',
    phone: '+62 812-3456-7890',
    channel: 'whatsapp',
    status: 'online',
    tags: ['Premium Lead'],
    last_message_at: '10:42 AM',
    last_message_preview: 'Apakah produk ini masih tersedia?'
  },
  {
    id: 'c2',
    external_id: '6289876543210',
    name: 'Siti Aminah',
    phone: '+62 898-7654-3210',
    channel: 'whatsapp',
    status: 'offline',
    tags: ['Customer'],
    last_message_at: 'Yesterday',
    last_message_preview: 'Terima kasih banyak atas infonya min.'
  },
  {
    id: 'c3',
    external_id: 'tokolaris_ig',
    name: 'Toko Laris',
    channel: 'instagram',
    status: 'offline',
    tags: ['B2B', 'Urgent'],
    last_message_at: 'Tuesday',
    last_message_preview: 'Bisa dikirim hari ini pakai gosend?'
  }
];

export const mockConversations: Record<string, Conversation> = {
  'c1': {
    id: 'conv1',
    contact_id: 'c1',
    status: 'open',
    messages: [
      {
        id: 'm1',
        conversation_id: 'conv1',
        direction: 'in',
        source: 'customer',
        content: 'Halo admin, saya ingin bertanya tentang layanan OmniCRM. Apakah produk ini masih tersedia?',
        sent_at: '10:40 AM'
      },
      {
        id: 'm2',
        conversation_id: 'conv1',
        direction: 'out',
        source: 'dashboard',
        content: 'Halo Budi! Ya, tentu saja. OmniCRM selalu tersedia dan Anda bisa memulai trial gratis sekarang. Ada pertanyaan spesifik yang ingin ditanyakan?',
        sent_at: '10:42 AM'
      }
    ]
  },
  'c2': {
    id: 'conv2',
    contact_id: 'c2',
    status: 'resolved',
    messages: [
      {
        id: 'm3',
        conversation_id: 'conv2',
        direction: 'in',
        source: 'customer',
        content: 'Berapa harga paket premiumnya?',
        sent_at: 'Yesterday 09:00 AM'
      },
      {
        id: 'm4',
        conversation_id: 'conv2',
        direction: 'out',
        source: 'dashboard',
        content: 'Paket premium seharga Rp 499.000 / bulan kak.',
        sent_at: 'Yesterday 09:15 AM'
      },
      {
        id: 'm5',
        conversation_id: 'conv2',
        direction: 'in',
        source: 'customer',
        content: 'Terima kasih banyak atas infonya min.',
        sent_at: 'Yesterday 09:20 AM'
      }
    ]
  },
  'c3': {
    id: 'conv3',
    contact_id: 'c3',
    status: 'open',
    messages: [
      {
        id: 'm6',
        conversation_id: 'conv3',
        direction: 'in',
        source: 'customer',
        content: 'Bisa dikirim hari ini pakai gosend?',
        sent_at: 'Tuesday 14:00 PM'
      }
    ]
  }
};
