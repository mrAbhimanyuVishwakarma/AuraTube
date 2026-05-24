import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, Key } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onSuccess, backendUrl }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin ? { email, password } : { email, password };
      
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        
        if (isLogin) {
          localStorage.setItem('token', data.access_token);
          onSuccess();
          onClose();
        } else {
          // After register, automatically log in
          const loginRes = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            localStorage.setItem('token', loginData.access_token);
            onSuccess();
            onClose();
          } else {
            setIsLogin(true);
            setError('Registration successful! Please login.');
          }
        }
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Connection error. Server is unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{
        maxWidth: '400px'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
            hover: { color: 'white' }
          }}
        >
          <X size={20} />
        </button>

        <h3 style={{
          fontSize: '1.5rem',
          color: '#a78bfa',
          textAlign: 'center',
          marginBottom: '2rem',
          fontWeight: '700'
        }}>
          {isLogin ? 'Sign In to AuraTube' : 'Create Account'}
        </h3>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            color: '#fca5a5',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={18} className="loading-spinner" />
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          {isLogin ? (
            <p>
              New to AuraTube?{' '}
              <button 
                onClick={() => { setIsLogin(false); setError(''); }}
                style={{ background: 'none', color: '#a78bfa', fontWeight: '600' }}
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                style={{ background: 'none', color: '#a78bfa', fontWeight: '600' }}
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
