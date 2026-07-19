import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Camera, CheckCircle2, ArrowRight } from 'lucide-react';
import '../styles/Onboarding.css';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [syncing, setSyncing] = useState(false);

  const handleConnect = () => {
    setStep(2);
    // Simulate Meta popup delay
    setTimeout(() => {
      setStep(3);
    }, 1500);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      navigate('/inbox');
    }, 3000);
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card glass">
        <div className="brand-header">
          <div className="logo-placeholder">O</div>
          <h2>OmniCRM</h2>
        </div>
        
        {step === 1 && (
          <div className="step-content">
            <h3>Connect Your Channels</h3>
            <p>Link your WhatsApp Business and Instagram accounts to start managing all conversations in one unified inbox.</p>
            
            <div className="channel-list">
              <div className="channel-item">
                <div className="channel-icon wa"><MessageCircle /></div>
                <div className="channel-info">
                  <h4>WhatsApp Business API</h4>
                  <span>Connect via Embedded Signup</span>
                </div>
              </div>
              <div className="channel-item">
                <div className="channel-icon ig"><Camera /></div>
                <div className="channel-info">
                  <h4>Instagram DM</h4>
                  <span>Connect via Graph API</span>
                </div>
              </div>
            </div>

            <button className="primary-btn" onClick={handleConnect}>
              Connect with Facebook <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-content center-content">
            <div className="spinner"></div>
            <h3>Waiting for Meta...</h3>
            <p>Please complete the connection process in the popup window.</p>
          </div>
        )}

        {step === 3 && (
          <div className="step-content center-content">
            <div className="success-icon"><CheckCircle2 size={48} /></div>
            <h3>Channels Connected!</h3>
            <p>Your WhatsApp (+62 812-XXXX-XXXX) and Instagram (@tokolaris_id) are now linked.</p>
            
            {syncing ? (
              <div className="sync-status">
                <div className="spinner small"></div>
                <span>Syncing historical messages...</span>
              </div>
            ) : (
              <button className="primary-btn mt-4" onClick={handleSync}>
                Start Syncing History
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
