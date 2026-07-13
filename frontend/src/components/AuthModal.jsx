import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function AuthModal({ isOpen, onClose, onSuccess, backendUrl, onGoogleLogin }) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: '420px', padding: '2.5rem', position: 'relative' }}>

        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
          <X size={20} />
        </button>

        {/* Title */}
        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', textAlign: 'center', marginBottom: '0.5rem', fontWeight: '800' }}>
          Welcome to <span style={{ color: 'var(--accent-primary)' }}>AuraTube</span>
        </h3>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>
          Sign in to save videos to your Google Drive
        </p>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#fca5a5', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            {error}
          </div>
        )}

        {/* Google Login Only */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
              Sign in with your Google account to enable Drive downloads and save your history.
            </p>
            <button 
              onClick={onGoogleLogin}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.8rem',
                backgroundColor: 'white',
                color: 'black',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Sign in with Google
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>What you get</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                '✅ One-click login with your Google account',
                '✅ Google Drive auto-connected instantly',
                '✅ No password needed — ever',
              ].map((item, i) => (
                <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
      </div>
    </div>
  );
}
