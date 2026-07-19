import React, { useState } from 'react';
import { conversations } from '../data/dummy';
import { Search, Phone, MoreVertical, Send, Paperclip, Smile, Image as ImageIcon } from 'lucide-react';
import '../styles/Inbox.css';

export default function Inbox() {
  const [activeConv, setActiveConv] = useState(conversations[0]);
  const [inputText, setInputText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    // In a real app, this would dispatch an action or API call
    console.log("Sending:", inputText);
    setInputText('');
  };

  const isSessionExpired = new Date(activeConv.sessionExpiresAt) < new Date();

  return (
    <div className="inbox-layout">
      {/* Sidebar List */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search conversations..." />
          </div>
          <div className="filter-tabs">
            <button className="active">Open</button>
            <button>Pending</button>
            <button>Resolved</button>
          </div>
        </div>
        
        <div className="conversation-list">
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              className={`conv-item ${activeConv.id === conv.id ? 'active' : ''}`}
              onClick={() => setActiveConv(conv)}
            >
              <img src={conv.contact.avatar} alt="avatar" className="avatar" />
              <div className="conv-item-content">
                <div className="conv-item-header">
                  <h4>{conv.contact.name}</h4>
                  <span className="time">
                    {new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="preview">
                  {conv.messages[conv.messages.length - 1].content}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <div className="badge">{conv.unreadCount}</div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-area">
        <header className="chat-header">
          <div className="chat-header-info">
            <img src={activeConv.contact.avatar} alt="avatar" className="avatar" />
            <div>
              <h3>{activeConv.contact.name}</h3>
              <span>{activeConv.channel === 'whatsapp' ? activeConv.contact.phone : '@' + activeConv.contact.phone.replace('@', '')} • {activeConv.status}</span>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="icon-btn"><Search size={20} /></button>
            <button className="icon-btn"><Phone size={20} /></button>
            <button className="icon-btn"><MoreVertical size={20} /></button>
          </div>
        </header>
        
        <div className="message-list">
          {activeConv.messages.map(msg => (
            <div key={msg.id} className={`message-wrapper ${msg.direction}`}>
              {msg.source === 'app_echo' && msg.direction === 'out' && (
                <div className="echo-badge">Sent from WhatsApp Business App</div>
              )}
              <div className="message-bubble">
                <p>{msg.content}</p>
                <span className="msg-time">
                  {new Date(msg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ))}
        </div>

        <footer className="chat-input-area">
          {isSessionExpired ? (
            <div className="session-expired-banner">
              <p>The 24-hour window has expired. You can only send pre-approved template messages.</p>
              <button className="template-btn">Select Template</button>
            </div>
          ) : (
            <form className="input-form" onSubmit={handleSend}>
              <button type="button" className="icon-btn"><Smile size={24} /></button>
              <button type="button" className="icon-btn"><Paperclip size={24} /></button>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              />
              <button type="submit" className="send-btn" disabled={!inputText.trim()}>
                <Send size={20} />
              </button>
            </form>
          )}
        </footer>
      </main>

      {/* Profile Panel */}
      <aside className="profile-panel">
        <div className="profile-header center-content">
          <img src={activeConv.contact.avatar} alt="avatar" className="avatar large" />
          <h3>{activeConv.contact.name}</h3>
          <p>{activeConv.contact.phone}</p>
        </div>
        
        <div className="profile-section">
          <h4>About</h4>
          <p>Customer since {new Date().getFullYear()}</p>
        </div>

        <div className="profile-section">
          <h4>Tags</h4>
          <div className="tags">
            <span className="tag">VIP</span>
            <span className="tag">{activeConv.channel}</span>
          </div>
        </div>

        <div className="profile-section">
          <h4>Recent Orders</h4>
          <div className="order-placeholder">
            <span>INV-2023</span>
            <span>Rp 450.000</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
