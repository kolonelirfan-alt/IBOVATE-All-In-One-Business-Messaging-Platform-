'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { supabase } from '@/lib/supabase';

// Icon components for Integrations
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433"/>
        <stop offset="25%" stopColor="#e6683c"/>
        <stop offset="50%" stopColor="#dc2743"/>
        <stop offset="75%" stopColor="#cc2366"/>
        <stop offset="100%" stopColor="#bc1888"/>
      </linearGradient>
    </defs>
    <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="#0088cc">
    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-2.03 9.56c-.15.68-.55.84-1.12.52l-3.1-2.29-1.5 1.44c-.16.16-.3.3-.61.3l.22-3.17 5.77-5.21c.25-.22-.05-.34-.39-.12l-7.14 4.5-3.07-.96c-.67-.21-.68-.67.14-.99l12.01-4.63c.56-.21 1.05.13.83.83z"/>
  </svg>
);

const AIWorkspaceIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--primary)" strokeWidth="2">
    <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
    <path d="M12 12L2.5 7.5"/>
    <path d="M12 12v10"/>
  </svg>
);

const StripeIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="#635BFF">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C17.702.757 15.11 0 12.193 0 6.643 0 2.923 2.915 2.923 7.747c0 7.42 10.22 6.277 10.22 9.508 0 .963-.829 1.542-2.168 1.542-2.61 0-5.637-1.192-7.51-2.185l-.946 5.676C4.372 23.366 7.399 24 10.748 24c5.967 0 9.873-2.88 9.873-7.854 0-7.868-10.245-6.525-10.245-9.696z"/>
  </svg>
);

interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'messaging' | 'ai' | 'payments';
  status: 'connected' | 'available' | 'coming_soon';
  setupUrl?: string;
  tags?: string[];
}

const integrationsData: IntegrationDef[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Cloud API',
    description: 'Connect your official WhatsApp Business number to send and receive messages.',
    icon: <WhatsAppIcon />,
    category: 'messaging',
    status: 'available',
    tags: ['Popular', 'Messaging']
  },
  {
    id: 'instagram',
    name: 'Instagram Direct',
    description: 'Manage customer Instagram DMs directly from OmniCRM unified inbox.',
    icon: <InstagramIcon />,
    category: 'messaging',
    status: 'available',
    tags: ['Popular', 'Messaging']
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Connect Telegram bot for customer support and automated broadcasts.',
    icon: <TelegramIcon />,
    category: 'messaging',
    status: 'coming_soon',
    tags: ['Messaging']
  }
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationDef[]>(integrationsData);
  const [channels, setChannels] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'messaging' | 'ai' | 'payments'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isTogglingCoexistence, setIsTogglingCoexistence] = useState(false);
  const [isSyncingCoexistence, setIsSyncingCoexistence] = useState(false);

  const [discoveredNumbers, setDiscoveredNumbers] = useState<any[]>([]);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('');
  const [fbToken, setFbToken] = useState<string>('');

  useEffect(() => {
    // Load Meta Facebook SDK
    // @ts-ignore
    if (window.FB) return;
    if (document.getElementById('facebook-jssdk')) return;

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // @ts-ignore
      if (window.FB) {
        // @ts-ignore
        window.FB.init({
          appId: '1567575554822438',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      }
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const userEmail = user?.email || '';
      fetch(`${getApiUrl()}/api/channels?user_email=${encodeURIComponent(userEmail)}`, {
        headers: { 'X-User-Email': userEmail }
      })
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setChannels(data.data);
            setIntegrations(prev => prev.map(int => {
              const isConnected = data.data.some((ch: any) => ch.type === int.id && ch.status === 'active');
              if (isConnected) {
                return { ...int, status: 'connected' as const };
              }
              return { ...int, status: int.status === 'connected' ? 'available' as const : int.status };
            }));
          }
        })
        .catch(err => console.error('Failed to fetch channels:', err));
    });
  }, []);

  const handleConnectClick = (id: string) => {
    setConnectingId(id);
    setShowConnectModal(true);
    setLoadingText('');
    setDiscoveredNumbers([]);
    setSelectedPhoneId('');
    setFbToken('');
  };

  const submitConnection = async (token: string, externalId?: string, pageId?: string, pageToken?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || '';
      setLoadingText('Connecting channel to your workspace...');
      const endpoint = connectingId === 'whatsapp' ? '/api/channels/whatsapp/connect' : '/api/channels/instagram/connect';
      const body = connectingId === 'whatsapp' 
        ? { access_token: token, phone_number_id: externalId, user_email: userEmail } 
        : { access_token: token, ig_account_id: externalId, page_id: pageId, page_access_token: pageToken, user_email: userEmail };
      
      const res = await fetch(`${getApiUrl()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Email': userEmail },
        body: JSON.stringify(body)
      });
      
      const resJson = await res.json().catch(() => ({}));

      if (res.ok && resJson.status === 'connected') {
        setShowConnectModal(false);
        const channelsRes = await fetch(`${getApiUrl()}/api/channels`, {
          headers: { 'X-User-Email': userEmail }
        });
        const data = await channelsRes.json();
        if (data.data) {
          setChannels(data.data);
          setIntegrations(prev => prev.map(int => {
            if (data.data.some((ch: any) => ch.type === int.id && ch.status === 'active')) return { ...int, status: 'connected' as const };
            return int;
          }));
        }
      } else {
        alert(resJson.detail || 'Failed to connect channel. Please ensure your Facebook account has a valid business account linked.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Connection failed: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
      setLoadingText('');
    }
  };

  const handleFacebookLogin = () => {
    // @ts-ignore
    if (!window.FB) return alert("Facebook SDK is still loading. Please refresh the page and try again.");
    
    setIsSubmitting(true);
    setLoadingText('Awaiting Facebook Login...');
    
    // @ts-ignore
    window.FB.login((response: any) => {
      if (response.authResponse) {
        const token = response.authResponse.accessToken;
        setFbToken(token);

        if (connectingId === 'whatsapp') {
          setLoadingText('Discovering WhatsApp Business numbers...');
          fetch(`${getApiUrl()}/api/channels/whatsapp/discover-numbers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: token })
          })
            .then(r => r.json())
            .then(d => {
              const numbers = d.numbers || [];
              if (numbers.length > 1) {
                setDiscoveredNumbers(numbers);
                setSelectedPhoneId(numbers[0].phone_number_id);
                setIsSubmitting(false);
                setLoadingText('');
              } else if (numbers.length === 1) {
                submitConnection(token, numbers[0].phone_number_id);
              } else {
                submitConnection(token);
              }
            })
            .catch(() => {
              submitConnection(token);
            });
        } else {
          submitConnection(token);
        }
      } else {
        console.log('User cancelled login or did not fully authorize.');
        setIsSubmitting(false);
        setLoadingText('');
      }
    }, {
      scope: 'instagram_basic,instagram_manage_messages,pages_show_list,pages_read_engagement,pages_manage_metadata,whatsapp_business_management,whatsapp_business_messaging,business_management',
      auth_type: 'rerequest'
    });
  };

  const handleDisconnect = async (type: string) => {
    if (!confirm(`Are you sure you want to disconnect ${type}?`)) return;
    try {
      const channelToDisconnect = channels.find(c => c.type === type);
      if (channelToDisconnect) {
        await fetch(`${getApiUrl()}/api/channels/${channelToDisconnect.id}`, { method: 'DELETE' });
        setChannels(prev => prev.filter(c => c.id !== channelToDisconnect.id));
        setIntegrations(prev => prev.map(int => int.id === type ? { ...int, status: 'available' as const } : int));
      }
    } catch (err) {
      console.error('Failed to disconnect channel:', err);
    }
  };

  const handleSync = async (type: string) => {
    try {
      setIsSyncing(type);
      const channelToSync = channels.find(c => c.type === type);
      if (channelToSync) {
        const res = await fetch(`${getApiUrl()}/api/channels/${channelToSync.id}/sync`, { method: 'POST' });
        const data = await res.json();
        if (data.status === 'success') {
          alert(`Successfully synced ${data.count || 0} messages!`);
        } else {
          alert('Sync complete!');
        }
      }
    } catch (err) {
      console.error('Failed to sync channel:', err);
    } finally {
      setIsSyncing(null);
    }
  };

  const handleToggleCoexistence = async (channelId: string, currentStatus: boolean) => {
    try {
      setIsTogglingCoexistence(true);
      const res = await fetch(`${getApiUrl()}/api/channels/${channelId}/coexistence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, coexistence_enabled: !currentStatus } : ch));
      } else {
        alert(data.detail || 'Failed to update Coexistence status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating Coexistence settings');
    } finally {
      setIsTogglingCoexistence(false);
    }
  };

  const handleSyncCoexistence = async (channelId: string) => {
    try {
      setIsSyncingCoexistence(true);
      const res = await fetch(`${getApiUrl()}/api/channels/${channelId}/sync-coexistence`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert('Historical backfill sync complete! Previous WhatsApp messages have been synced.');
        setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, historical_sync_status: 'completed' } : ch));
      } else {
        alert(data.detail || 'Failed to sync Coexistence chats');
      }
    } catch (err) {
      console.error(err);
      alert('Error syncing Coexistence chats');
    } finally {
      setIsSyncingCoexistence(false);
    }
  };

  const filteredIntegrations = integrations.filter(int => {
    const matchesCategory = activeCategory === 'all' || int.category === activeCategory;
    const matchesSearch = int.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          int.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'All Integrations' },
    { id: 'messaging', label: 'Messaging' },
    { id: 'ai', label: 'AI & Bots' },
    { id: 'payments', label: 'Payments' }
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 2.5rem', height: '100%', overflowY: 'auto', backgroundColor: 'var(--bg-0)' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Integrations</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 600 }}>
          Connect IBOVATE OmniCRM with your favorite apps and platforms to streamline your communication and workflows.
        </p>
      </div>

      {/* Controls: Search and Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: '1px solid',
                borderColor: activeCategory === cat.id ? 'var(--primary)' : 'var(--border)',
                background: activeCategory === cat.id ? 'var(--primary-light)' : 'var(--bg-2)',
                color: activeCategory === cat.id ? 'var(--primary-hover)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <svg style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search integrations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-2)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {/* Grid */}
      {filteredIntegrations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No integrations found</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Try adjusting your search or filter criteria.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredIntegrations.map(int => (
            <div 
              key={int.id}
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="integration-card hover-lift"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ width: 48, height: 48, background: 'var(--bg-0)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}>
                  {int.icon}
                </div>
                {int.status === 'connected' ? (
                  <span style={{ padding: '4px 10px', background: 'var(--status-new-bg)', color: 'var(--status-new-text)', fontSize: '0.7rem', fontWeight: 800, borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Connected
                  </span>
                ) : int.status === 'coming_soon' ? (
                  <span style={{ padding: '4px 10px', background: 'var(--bg-3)', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Coming Soon
                  </span>
                ) : null}
              </div>
              
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{int.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem', flex: 1 }}>
                {int.description}
              </p>

              {int.id === 'whatsapp' && int.status === 'connected' && (() => {
                const waChannel = channels.find(c => c.type === 'whatsapp');
                const coexistenceEnabled = waChannel?.coexistence_enabled || false;
                const isSyncingHist = isSyncingCoexistence || waChannel?.historical_sync_status === 'syncing';
                return (
                  <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📱 WhatsApp Coexistence
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: coexistenceEnabled ? '#dcfce7' : '#e5e7eb', color: coexistenceEnabled ? '#166534' : '#374151', fontWeight: 700 }}>
                          {coexistenceEnabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                      Gunakan aplikasi WhatsApp Business di HP secara bersamaan dengan dashboard OmniCRM. Pesan balasan dari HP akan otomatis masuk sebagai echo message.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => waChannel && handleToggleCoexistence(waChannel.id, coexistenceEnabled)}
                        disabled={isTogglingCoexistence || !waChannel}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: coexistenceEnabled ? '#dc2626' : 'var(--primary)',
                          color: 'white',
                          cursor: (isTogglingCoexistence || !waChannel) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isTogglingCoexistence ? 'Updating...' : coexistenceEnabled ? 'Matikan Coexistence' : 'Aktifkan Coexistence'}
                      </button>
                      {coexistenceEnabled && (
                        <button
                          onClick={() => waChannel && handleSyncCoexistence(waChannel.id)}
                          disabled={isSyncingHist || !waChannel}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--primary)',
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            cursor: (isSyncingHist || !waChannel) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isSyncingHist ? 'Syncing...' : 'Sinkronkan Pesan Lama'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {int.tags?.map(tag => (
                    <span key={tag} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-3)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
                
                {int.status === 'connected' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {int.id === 'instagram' && (
                      <button onClick={() => handleSync(int.id)} disabled={isSyncing === int.id} style={{ padding: '8px 16px', background: 'var(--primary-light)', color: 'var(--primary-hover)', border: '1px solid var(--primary-light)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem', cursor: isSyncing === int.id ? 'not-allowed' : 'pointer' }}>
                        {isSyncing === int.id ? 'Syncing...' : 'Sync Chats'}
                      </button>
                    )}
                    <button onClick={() => handleDisconnect(int.id)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                      Disconnect
                    </button>
                  </div>
                ) : int.status === 'available' ? (
                  <button onClick={() => handleConnectClick(int.id)} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s' }}>
                    Connect
                  </button>
                ) : (
                  <button style={{ padding: '8px 16px', background: 'var(--bg-3)', color: 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem', cursor: 'not-allowed' }} disabled>
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1);
          border-color: var(--primary-light);
        }
      `}} />

      {/* Connect Modal */}
      {showConnectModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-1)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 480, border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Connect {connectingId === 'whatsapp' ? 'WhatsApp Meta API' : 'Instagram API'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Authorize your Meta account to connect this channel automatically.
            </p>

            {discoveredNumbers.length > 0 ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Pilih Nomor WhatsApp Business Yang Ingin Dihubungkan:
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 220, overflowY: 'auto' }}>
                  {discoveredNumbers.map(n => (
                    <div 
                      key={n.phone_number_id}
                      onClick={() => setSelectedPhoneId(n.phone_number_id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid',
                        borderColor: selectedPhoneId === n.phone_number_id ? 'var(--primary)' : 'var(--border)',
                        background: selectedPhoneId === n.phone_number_id ? 'var(--primary-light)' : 'var(--bg-2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{n.verified_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{n.display_phone_number}</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedPhoneId === n.phone_number_id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => submitConnection(fbToken, selectedPhoneId)}
                  disabled={isSubmitting || !selectedPhoneId}
                  style={{
                    marginTop: '1.25rem',
                    width: '100%',
                    padding: '12px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: (isSubmitting || !selectedPhoneId) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? 'Connecting Channel...' : 'Hubungkan Nomor Terpilih'}
                </button>
              </div>
            ) : (
              <>
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Why we need these permissions:</strong>
                  We require <code style={{ color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 4px', borderRadius: '4px' }}>whatsapp_business_management</code> and <code style={{ color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 4px', borderRadius: '4px' }}>instagram_manage_messages</code> to allow you to read and reply to customer conversations. We never post on your behalf.
                </div>
                
                {/* 1-Click Facebook Login Button */}
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <button onClick={handleFacebookLogin} disabled={isSubmitting} style={{ 
                    background: isSubmitting ? '#a0c3ff' : '#1877F2', 
                    color: 'white', 
                    border: 'none', 
                    padding: '12px 24px', 
                    borderRadius: '8px', 
                    fontWeight: 700, 
                    fontSize: '1rem', 
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}>
                    {isSubmitting ? (
                      <svg className="animate-spin" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                        <path d="M12 2a10 10 0 0 1 10 10"></path>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )}
                    {isSubmitting ? 'Connecting...' : 'Log in with Facebook'}
                  </button>
                  
                  {loadingText && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {loadingText}
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowConnectModal(false)} disabled={isSubmitting} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
