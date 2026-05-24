import React, { useState } from 'react';
import { Youtube, Search, ArrowRight, Loader2, Clipboard } from 'lucide-react';

export default function UrlInput({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
      }
    } catch (err) {
      console.warn("Failed to read clipboard:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="url-input-container fade-in" style={{ marginBottom: '2.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
          <Youtube size={22} />
          Paste YouTube URL
        </h2>
        
        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={18} />
            </span>
            
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
              placeholder="Paste video or playlist link here... (e.g. https://www.youtube.com/watch?v=...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
            
            <button
              type="button"
              onClick={handlePaste}
              title="Paste from clipboard"
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                color: 'var(--text-muted)',
                hover: { color: 'white' }
              }}
              disabled={isLoading}
            >
              <Clipboard size={18} />
            </button>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ minWidth: '130px', whiteSpace: 'nowrap' }}
            disabled={isLoading || !url.trim()}
          >
            {isLoading ? (
              <Loader2 size={18} className="loading-spinner" />
            ) : (
              <>
                Analyze <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
