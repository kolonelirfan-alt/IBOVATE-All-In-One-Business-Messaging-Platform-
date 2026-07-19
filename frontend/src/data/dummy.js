export const conversations = [
  {
    id: 'conv-1',
    contact: {
      id: 'c-1',
      name: 'Budi Santoso',
      phone: '+62 812-3456-7890',
      avatar: 'https://i.pravatar.cc/150?u=budi'
    },
    channel: 'whatsapp',
    status: 'open',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    sessionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString(),
    unreadCount: 2,
    messages: [
      { id: 'm-1', direction: 'in', content: 'Halo min, mau tanya soal tagihan INV-2023', sentAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), source: 'customer' },
      { id: 'm-2', direction: 'out', content: 'Halo Budi, silakan. Ada yang bisa kami bantu?', sentAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(), source: 'dashboard' },
      { id: 'm-3', direction: 'in', content: 'Kok belum ada konfirmasi pembayaran ya?', sentAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), source: 'customer' },
      { id: 'm-4', direction: 'in', content: 'Padahal saya sudah transfer dari kemarin sore.', sentAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(), source: 'customer' }
    ]
  },
  {
    id: 'conv-2',
    contact: {
      id: 'c-2',
      name: 'Siska (Toko Laris)',
      phone: '@tokolaris_id',
      avatar: 'https://i.pravatar.cc/150?u=siska'
    },
    channel: 'instagram',
    status: 'pending',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    sessionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    unreadCount: 0,
    messages: [
      { id: 'm-5', direction: 'in', content: 'Kak, stok dress merah yang di post terakhir masih?', sentAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), source: 'customer' },
      { id: 'm-6', direction: 'out', content: 'Masih kak, sisa 2 pcs ya', sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(), source: 'app_echo' },
      { id: 'm-7', direction: 'in', content: 'Oke saya order via website ya', sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), source: 'customer' }
    ]
  },
  {
    id: 'conv-3',
    contact: {
      id: 'c-3',
      name: 'Agus Pratama',
      phone: '+62 813-9876-5432',
      avatar: 'https://i.pravatar.cc/150?u=agus'
    },
    channel: 'whatsapp',
    status: 'resolved',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    sessionExpiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Expired
    unreadCount: 0,
    messages: [
      { id: 'm-8', direction: 'in', content: 'Terima kasih, barang sudah sampai dengan aman.', sentAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), source: 'customer' },
      { id: 'm-9', direction: 'out', content: 'Sama-sama kak! Ditunggu next ordernya.', sentAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(), source: 'dashboard' }
    ]
  }
];
