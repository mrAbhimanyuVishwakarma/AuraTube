import React, { useState } from 'react';
import { Download, Cloud, Monitor, Clock, Play, FileVideo, FileAudio, AlertTriangle, Lock } from 'lucide-react';

export default function FormatSelector({ videoData, onDownload, driveConnected, onConnectDrive, user, onOpenPricing }) {
  const [selectedTarget, setSelectedTarget] = useState('local'); // 'local' or 'drive'
  
  if (!videoData || videoData.type === 'playlist') return null;

  const { title, thumbnail, duration, formats, id } = videoData;

  const formatDuration = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const videoFormats = formats.filter(f => !f.is_audio);
  const audioFormats = formats.filter(f => f.is_audio);

  const handleDownloadClick = (format) => {
    const isPremium = user && user.is_premium;
    
    // Lock GDrive uploads behind premium
    if (selectedTarget === 'drive' && !isPremium) {
      onOpenPricing();
      return;
    }

    // Lock resolutions > 1080p behind premium
    const heightMatch = format.resolution.match(/\d+/);
    const height = heightMatch ? parseInt(heightMatch[0]) : 0;
    if (height > 1080 && !isPremium) {
      onOpenPricing();
      return;
    }

    onDownload({
      url: `https://www.youtube.com/watch?v=${id}`,
      video_id: id,
      format_id: format.format_id,
      resolution: format.resolution,
      ext: format.ext,
      target: selectedTarget,
      title: title
    });
  };

  const isPremium = user && user.is_premium;

  return (
    <div className="glass-panel fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2.5rem' }}>
      {/* Video Details */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', width: '240px', aspectRatio: '16/9', border: '1px solid var(--border-color)' }}>
          <img src={thumbnail} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <span style={{ position: 'absolute', right: '0.5rem', bottom: '0.5rem', background: 'rgba(0,0,0,0.8)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> {formatDuration(duration)}
          </span>
        </div>
        
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', lineHeight: '1.4', wordBreak: 'break-word' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>YouTube Video ID: {id}</p>
          </div>
          
          {/* Target Selector */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              onClick={() => setSelectedTarget('local')}
              className="btn"
              style={{
                flex: 1,
                background: selectedTarget === 'local' ? 'var(--grad-primary)' : 'rgba(255,255,255,0.03)',
                border: '1px solid ' + (selectedTarget === 'local' ? 'var(--accent-primary)' : 'var(--border-color)'),
                boxShadow: selectedTarget === 'local' ? 'var(--shadow-glow)' : 'none',
                gap: '0.5rem',
                fontSize: '0.9rem',
                padding: '0.6rem'
              }}
            >
              <Monitor size={16} /> Save to System
            </button>
            
            <button
              onClick={() => {
                if (!isPremium) {
                  onOpenPricing();
                } else {
                  setSelectedTarget('drive');
                }
              }}
              className="btn"
              style={{
                flex: 1,
                background: selectedTarget === 'drive' ? 'var(--grad-secondary)' : 'rgba(255,255,255,0.03)',
                border: '1px solid ' + (selectedTarget === 'drive' ? 'var(--accent-secondary)' : 'var(--border-color)'),
                boxShadow: selectedTarget === 'drive' ? 'var(--shadow-glow-cyan)' : 'none',
                gap: '0.5rem',
                fontSize: '0.9rem',
                padding: '0.6rem',
                position: 'relative'
              }}
            >
              <Cloud size={16} /> Upload to Drive
              {!isPremium && <Lock size={12} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />}
            </button>
          </div>
        </div>
      </div>

      {/* Connection Warning for Drive */}
      {selectedTarget === 'drive' && !driveConnected && (
        <div style={{ 
          background: 'rgba(139, 92, 246, 0.03)', 
          border: '1px solid var(--border-color-focus)', 
          padding: '1.5rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Cloud size={32} color="var(--accent-secondary)" style={{ opacity: 0.8 }} />
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem', color: 'white' }}>Google Drive Connection Required</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.4' }}>
              To save files directly to Google Drive without occupying permanent disk space, please authenticate your account.
            </p>
          </div>
          <button
            onClick={onConnectDrive}
            className="btn btn-primary"
            style={{ 
              background: 'linear-gradient(135deg, #4285F4, #34A853, #FBBC05, #EA4335)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: '700',
              padding: '0.6rem 1.5rem',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 4px 12px rgba(66, 133, 244, 0.25)',
              border: 'none',
              marginTop: '0.5rem'
            }}
          >
            Sign in with Google
          </button>
        </div>
      )}

      {/* Grid of Formats */}
      <div>
        {/* Video Grid */}
        {videoFormats.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <FileVideo size={16} /> Video Resolutions
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {videoFormats.map((f, idx) => {
                const isLocked = f.height > 1080 && !isPremium;
                return (
                  <button
                    key={idx}
                    onClick={() => handleDownloadClick(f)}
                    disabled={selectedTarget === 'drive' && !driveConnected && !isLocked}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '1rem 0.5rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid ' + (isLocked ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)'),
                      borderRadius: 'var(--radius-md)',
                      color: isLocked ? 'var(--text-muted)' : 'white',
                      cursor: 'pointer',
                      opacity: (selectedTarget === 'drive' && !driveConnected && !isLocked) ? 0.5 : 1,
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    className="format-button"
                  >
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {f.resolution}
                      {isLocked && <Lock size={12} color="#fca5a5" />}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {f.ext.toUpperCase()} {f.is_dash ? '• Merged' : ''}
                    </span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: selectedTarget === 'drive' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                    color: selectedTarget === 'drive' ? '#22d3ee' : '#c084fc',
                    fontWeight: '600'
                  }}>
                    {formatSize(f.size)}
                  </span>
                </button>
              );
              })}
            </div>
          </div>
        )}

        {/* Audio Grid */}
        {audioFormats.length > 0 && (
          <div>
            <h4 style={{ fontSize: '1rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <FileAudio size={16} /> Audio Formats
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {audioFormats.map((f, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDownloadClick(f)}
                  disabled={selectedTarget === 'drive' && !driveConnected}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '1rem 0.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    cursor: (selectedTarget === 'drive' && !driveConnected) ? 'not-allowed' : 'pointer',
                    opacity: (selectedTarget === 'drive' && !driveConnected) ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                  className="format-button"
                >
                  <span style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.25rem' }}>{f.resolution}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{f.ext.toUpperCase()}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: selectedTarget === 'drive' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                    color: selectedTarget === 'drive' ? '#22d3ee' : '#c084fc',
                    fontWeight: '600'
                  }}>
                    {formatSize(f.size)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .format-button:hover:not(:disabled) {
          border-color: \${selectedTarget === 'drive' ? 'var(--accent-secondary)' : 'var(--accent-primary)'} !important;
          transform: translateY(-3px);
          box-shadow: \${selectedTarget === 'drive' ? 'var(--shadow-glow-cyan)' : 'var(--shadow-glow)'};
          background: rgba(255,255,255,0.04) !important;
        }
      `}</style>
    </div>
  );
}
