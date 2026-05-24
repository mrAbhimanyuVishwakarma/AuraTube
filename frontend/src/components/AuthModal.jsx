import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Loader2, Key } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function AuthModal({ isOpen, onClose, onSuccess, backendUrl }) {
  const [tab, setTab] = useState('google'); // 'google' | 'email'
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    if (!isOpen || !GOOGLE_CLIENT_ID) return;
    if (window.google) { setGoogleReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    document.head.appendChild(script);
  }, [isOpen]);

  // Render Google button when script is ready and tab is 'google'
  useEffect(() => {
    if (!googleReady || !isOpen || tab !== 'google' || !GOOGLE_CLIENT_ID) return;
    const el = document.getElementById('google-signin-btn');
    if (!el) return;
    el.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
    });
    window.google.accounts.id.renderButton(el, {
      theme: 'filled_black',
      size: 'large',
      width: 320,
      text: 'signin_with',
      shape: 'pill',
      logo_alignment: 'left',
    });
  }, [googleReady, isOpen, tab]);

  const handleGoogleCredential = async (response) => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        onSuccess();
        onClose();
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Google sign-in failed. Please try again.');
      }
    } catch {
      setError('Connection error. Server is unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (isLogin) {
          localStorage.setItem('token', data.access_token);
          onSuccess();
          onClose();
        } else {
          const loginRes = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            localStorage.setItem('token', loginData.access_token);
            onSuccess();
            onClose();
          } else {
            setIsLogin(true);
            setError('Account created! Please sign in.');
          }
        }
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Authentication failed.');
      }
    } catch {
      setError('Connection error. Server is unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '0.35rem' }}>
          {[{ id: 'google', label: '🔵 Google' }, { id: 'email', label: '✉️ Email' }].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(''); }}
              style={{
                flex: 1, padding: '0.55rem', borderRadius: 'var(--radius-sm)',
                background: tab === t.id ? 'var(--bg-main)' : 'transparent',
                color: tab === t.id ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: tab === t.id ? '700' : '500',
                fontSize: '0.88rem', cursor: 'pointer', border: 'none',
                boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#fca5a5', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            {error}
          </div>
        )}

        {/* Google Tab */}
        {tab === 'google' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {GOOGLE_CLIENT_ID ? (
              <>
                <div id="google-signin-btn" style={{ minHeight: '44px', display: 'flex', justifyContent: 'center', width: '100%' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
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
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <p style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>⚙️</p>
                <p>Google Sign-In is not configured yet.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Add <code>VITE_GOOGLE_CLIENT_ID</code> to your environment variables.</p>
              </div>
            )}
          </div>
        )}

        {/* Email Tab */}
        {tab === 'email' && (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {['Sign In', 'Sign Up'].map((label, i) => (
                <button
                  key={label}
                  onClick={() => { setIsLogin(i === 0); setError(''); }}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                    background: (isLogin ? i === 0 : i === 1) ? 'var(--accent-primary)' : 'transparent',
                    color: (isLogin ? i === 0 : i === 1) ? 'white' : 'var(--text-muted)',
                    fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer',
                    border: '1px solid ' + ((isLogin ? i === 0 : i === 1) ? 'var(--accent-primary)' : 'var(--border-color)'),
                    transition: 'all 0.2s ease'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" required className="form-input" style={{ paddingLeft: '2.75rem' }} placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" required className="form-input" style={{ paddingLeft: '2.75rem' }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="password" required className="form-input" style={{ paddingLeft: '2.75rem' }} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }} disabled={isLoading}>
                {isLoading ? <Loader2 size={18} className="loading-spinner" /> : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
