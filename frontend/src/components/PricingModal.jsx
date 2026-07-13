import React, { useState } from 'react';
import { X, Check, ShieldCheck, Loader2, CreditCard, ShieldAlert } from 'lucide-react';

export default function PricingModal({ isOpen, onClose, onSuccess, backendUrl }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (gateway) => {
    setError('');
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError("Please sign in or create an account first to upgrade.");
      setIsLoading(false);
      return;
    }

    try {
      if (gateway === 'stripe') {
        const res = await fetch(`${backendUrl}/api/billing/stripe/create-checkout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          window.location.href = data.session_url; // Redirect to Stripe Checkout
        } else {
          const errData = await res.json();
          setError(errData.detail || "Failed to initiate Stripe payment.");
        }
      } else if (gateway === 'razorpay') {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setError("Failed to load Razorpay SDK. Check your internet connection.");
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${backendUrl}/api/billing/razorpay/create-order`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          
          const options = {
            key: data.key_id,
            amount: data.amount,
            currency: data.currency,
            name: "AuraTube Premium",
            description: "Unlock high-quality downloads & Google Drive uploads",
            order_id: data.order_id,
            handler: async function (response) {
              setIsLoading(true);
              try {
                const verifyRes = await fetch(`${backendUrl}/api/billing/razorpay/verify`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(response)
                });
                
                if (verifyRes.ok) {
                  alert("Subscription upgrade successful! You are now a Premium user.");
                  onSuccess();
                  onClose();
                } else {
                  setError("Payment verification failed on the server.");
                }
              } catch (err) {
                setError("Network error during payment verification.");
              } finally {
                setIsLoading(false);
              }
            },
            theme: { color: "#8b5cf6" }
          };
          
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          const errData = await res.json();
          setError(errData.detail || "Failed to create Razorpay Order.");
        }
      }
    } catch (err) {
      setError("Communication error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{
        maxWidth: '500px'
      }}>
        {/* Close */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
        >
          <X size={20} />
        </button>

        <h3 style={{
          fontSize: '1.5rem',
          color: 'var(--text-main)',
          textAlign: 'center',
          marginBottom: '0.5rem',
          fontWeight: '800'
        }}>
          Upgrade to Premium
        </h3>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          Get unlimited high-definition downloads & direct-to-cloud uploads.
        </p>

        {error && (
          <div style={{
            background: 'var(--bg-card-hover)',
            borderLeft: '4px solid var(--accent-primary)',
            borderRadius: '6px',
            color: 'var(--text-main)',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldAlert size={16} color="var(--accent-primary)" />
            {error}
          </div>
        )}

        {/* Feature Comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', color: 'var(--text-main)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
            <Check size={18} color="var(--accent-primary)" />
            <span>High Quality Downloads (1440p, 4K, 8K)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
            <Check size={18} color="var(--accent-primary)" />
            <span>Direct Google Drive cloud uploads (No local disk footprint)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
            <Check size={18} color="var(--accent-primary)" />
            <span>Unlimited downloads (Removes daily limit of 5 downloads)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
            <Check size={18} color="var(--accent-primary)" />
            <span>Support developer & project updates</span>
          </div>
        </div>

        {/* Price Tag */}
        <div style={{
          background: 'var(--bg-card-hover)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>$2.99</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}> / month</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: '0.25rem', fontWeight: '600' }}>
            Or ₹199/month for Indian users (UPI)
          </p>
        </div>

        {/* Payment Buttons Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => handlePayment('stripe')}
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700'
            }}
          >
            {isLoading ? (
              <Loader2 size={18} className="loading-spinner" />
            ) : (
              <>
                <CreditCard size={18} /> Stripe / Cards / PayPal (Global)
              </>
            )}
          </button>

          <button
            onClick={() => handlePayment('razorpay')}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.85rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              borderColor: 'rgba(6, 182, 212, 0.3)',
              hover: { borderColor: 'rgba(6, 182, 212, 0.6)' }
            }}
          >
            {isLoading ? (
              <Loader2 size={18} className="loading-spinner" />
            ) : (
              <>
                <ShieldCheck size={18} color="#06b6d4" /> Razorpay / UPI / Cards (India)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
