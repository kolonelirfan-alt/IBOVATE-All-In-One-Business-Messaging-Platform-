'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';

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
    <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.405a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/>
  </svg>
);

const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="#10a37f">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A6.0651 6.0651 0 0 0 19.0193 19.818a5.9847 5.9847 0 0 0 3.9977-2.9001 6.0462 6.0462 0 0 0-.7351-7.0968zM8.7505 5.6172A4.2705 4.2705 0 0 1 15.9189 6.94l-3.834 2.2136-3.3344-1.925v-1.6114zm-3.085 4.1166l3.3343 1.925v3.8502L5.6654 13.584A4.2705 4.2705 0 0 1 5.6655 9.7338zM8.7505 18.3828v-1.6114l3.3344-1.925 3.834 2.2136a4.2705 4.2705 0 0 1-7.1684 1.3228zm11.1894-3.151l-5.006-2.89L11.6095 14.5v3.8502l3.3344 1.925a4.2705 4.2705 0 0 1 5.006-5.0434zm.3946-5.498L15.3285 7.8087 11.9941 9.7338l3.3344 1.925 3.834 2.2136A4.2705 4.2705 0 0 1 20.3345 9.7338zM12 11.2343l1.834-1.0588 1.834 1.0588v2.1176l-1.834 1.0588-1.834-1.0588V11.2343z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="#229ED9">
    <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zM5.526 11.677c3.921-1.708 6.536-2.836 7.844-3.385 3.73-1.572 4.505-1.84 5.011-1.85.111-.002.36.026.518.155.132.109.171.258.188.361.018.103.037.33.02.505-.198 2.016-1.056 7.126-1.498 9.492-.187.997-.55 1.332-.897 1.365-.758.073-1.332-.497-2.067-.978-1.15-.752-1.801-1.218-2.92-1.954-1.294-.85-.455-1.317.283-2.083.193-.2 3.551-3.256 3.616-3.535.008-.035.015-.164-.06-.231-.076-.067-.193-.043-.277-.024-.118.027-2.001 1.272-5.647 3.733-.535.367-1.018.544-1.448.535-.472-.01-1.381-.267-2.057-.487-.828-.27-1.485-.413-1.428-.87.03-.239.36-.484.99-.735z"/>
  </svg>
);

const StripeIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="#635bff">
    <path fillRule="evenodd" clipRule="evenodd" d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM11.696 15.65c-2.31 0-3.602-1.002-3.602-2.585 0-1.731 1.458-2.657 4.093-2.657 1.055 0 1.954.185 2.502.435v-1.11c0-1.215-1.055-1.874-2.674-1.874-1.344 0-2.519.382-3.324.962l-.766-1.875c1.161-.738 2.876-1.147 4.512-1.147 3.011 0 4.67 1.45 4.67 3.864v5.617h-2.19v-1.41a4.237 4.237 0 0 1-3.221 1.78zm.514-1.86c1.109 0 2.059-.514 2.495-1.279v-1.2c-.528-.224-1.32-.395-2.257-.395-1.439 0-2.23.448-2.23 1.253 0 .738.646 1.621 1.992 1.621z"/>
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

const ALL_INTEGRATIONS: IntegrationDef[] = [
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
    description: 'Reply to Instagram DMs and story mentions directly from your CRM inbox.',
    icon: <InstagramIcon />,
    category: 'messaging',
    status: 'available',
    tags: ['Social']
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    description: 'Empower your chatbot with advanced AI to auto-reply to customers intelligently.',
    icon: <OpenAIIcon />,
    category: 'ai',
    status: 'coming_soon',
    tags: ['AI']
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Connect a Telegram bot to handle customer inquiries seamlessly.',
    icon: <TelegramIcon />,
    category: 'messaging',
    status: 'coming_soon',
    tags: ['Messaging']
  },
  {
    id: 'stripe',
    name: 'Stripe Payments',
    description: 'Generate payment links and collect payments directly within chats.',
    icon: <StripeIcon />,
    category: 'payments',
    status: 'coming_soon',
    tags: ['Finance']
  }
];

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'messaging' | 'ai' | 'payments'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationDef[]>(ALL_INTEGRATIONS);
  
  // Connect Modal State
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  
  // Facebook SDK Load
  useEffect(() => {
    // Check if FB SDK is already loaded
    if (document.getElementById('facebook-jssdk')) return;

    // Load the SDK asynchronously
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

  const [accessToken, setAccessToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConnectClick = (id: string) => {
    setConnectingId(id);
    setAccessToken('');
    setPhoneId('');
    setShowConnectModal(true);
  };

  const handleFacebookLogin = () => {
    // @ts-ignore
    if (!window.FB) {
      alert("Facebook SDK is still loading or failed to load. Please ensure your App ID is configured.");
      return;
    }
    
    // @ts-ignore
    window.FB.login((response: any) => {
      if (response.authResponse) {
        const token = response.authResponse.accessToken;
        // In a real flow, you send this token to the backend to exchange for a permanent token
        // and fetch the WABA ID. For now, we mock the UI success.
        setAccessToken(token);
        // We still need the phone ID, so we might autofill the token but leave phone ID manual for this hybrid demo
        alert("Facebook Login Successful! Token received. (Backend implementation required for automatic phone ID fetching)");
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {
      // Requested scopes for Meta Business Messaging (WhatsApp & Instagram)
      scope: 'instagram_basic,instagram_manage_messages,pages_show_list,whatsapp_business_management,whatsapp_business_messaging'
    });
  };

  const handleDisconnect = async (type: string) => {
    if (!confirm(`Are you sure you want to disconnect ${type}?`)) return;
    
    const channel = channels.find((c: any) => c.type === type);
    if (!channel) return;
    
    try {
      await fetch(`${getApiUrl()}/api/channels/${channel.id}`, { method: 'DELETE' });
      
      // Refresh channels
      const channelsRes = await fetch(`${getApiUrl()}/api/channels`);
      const data = await channelsRes.json();
      if (data.data) {
        setChannels(data.data);
        setIntegrations(prev => prev.map(int => {
          if (data.data.some((ch: any) => ch.type === int.id && ch.status !== 'disconnected')) {
            return { ...int, status: 'connected' as const };
          }
          return { ...int, status: int.status === 'connected' ? 'available' : int.status };
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to disconnect');
    }
  };

  const handleConnectSubmit = async () => {
    if (!accessToken || !phoneId) return alert('Please fill in both fields.');
    setIsSubmitting(true);
    try {
      const endpoint = connectingId === 'whatsapp' ? '/api/channels/whatsapp/connect' : '/api/channels/instagram/connect';
      const body = connectingId === 'whatsapp' ? { access_token: accessToken, phone_number_id: phoneId, workspace_id: '66e3c66a-9464-4ee6-abd0-4d886b5ef3c8' } : { access_token: accessToken, ig_account_id: phoneId, workspace_id: '66e3c66a-9464-4ee6-abd0-4d886b5ef3c8' };
      
      const res = await fetch(`${getApiUrl()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setShowConnectModal(false);
        // Refresh channels
        const channelsRes = await fetch(`${getApiUrl()}/api/channels`);
        const data = await channelsRes.json();
        if (data.data) {
          setChannels(data.data);
          setIntegrations(prev => prev.map(int => {
            if (data.data.some((ch: any) => ch.type === int.id)) {
              return { ...int, status: 'connected' as const };
            }
            return int;
          }));
        }
      } else {
        alert('Failed to connect channel.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting channel.');
    } finally {
      setIsSubmitting(false);
    }
  };


  useEffect(() => {
    // Fetch connected channels to update status
    fetch(`${getApiUrl()}/api/channels`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setChannels(data.data);
          
          // Update the status of integrations based on connected channels
          setIntegrations(prev => prev.map(int => {
            const isConnected = data.data.some((ch: any) => ch.type === int.id && ch.status === 'active');
            if (isConnected) {
              return { ...int, status: 'connected' };
            }
            return int;
          }));
        }
      })
      .catch(err => console.error('Failed to fetch channels:', err));
  }, []);

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
        {/* Category Pills */}
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

        {/* Search Bar */}
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>
                {int.description}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {int.tags?.map(tag => (
                    <span key={tag} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-3)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
                
                {int.status === 'connected' ? (
                  <button onClick={() => handleDisconnect(int.id)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    Disconnect
                  </button>
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

      {/* Global Style for hover-lift */}
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
          <div style={{ background: 'var(--bg-1)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 450, border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Connect {connectingId === 'whatsapp' ? 'WhatsApp Meta API' : 'Instagram API'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Authorize your Meta account to connect this channel automatically.</p>
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Why we need these permissions:</strong>
              We require <code style={{ color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 4px', borderRadius: '4px' }}>whatsapp_business_management</code> and <code style={{ color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 4px', borderRadius: '4px' }}>instagram_manage_messages</code> to allow you to read and reply to customer conversations directly from your OmniCRM inbox. We never post on your behalf.
            </div>
            
            {/* Facebook Login Button */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <button onClick={handleFacebookLogin} style={{ 
                background: '#1877F2', 
                color: 'white', 
                border: 'none', 
                padding: '12px 24px', 
                borderRadius: '8px', 
                fontWeight: 700, 
                fontSize: '1rem', 
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                justifyContent: 'center'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Log in with Facebook
              </button>
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Requires your Meta App ID to be configured in <code>page.tsx</code>.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span style={{ padding: '0 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR MANUAL ENTRY</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Permanent Access Token</label>
              <input type="text" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="EAAG..." style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{connectingId === 'whatsapp' ? 'Phone Number ID' : 'IG Account ID'}</label>
              <input type="text" value={phoneId} onChange={e => setPhoneId(e.target.value)} placeholder="1234567890" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowConnectModal(false)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConnectSubmit} disabled={isSubmitting} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                {isSubmitting ? 'Connecting...' : 'Connect Channel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
