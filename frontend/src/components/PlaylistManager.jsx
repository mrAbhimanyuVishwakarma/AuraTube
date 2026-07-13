import React, { useState, useEffect } from 'react';
import { Play, CheckSquare, Square, Monitor, Cloud, AlertTriangle, Download, Clock, Lock } from 'lucide-react';

export default function PlaylistManager({ playlistData, onDownload, onPlaylistDownload, driveConnected, onConnectDrive, user, onOpenPricing }) {
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [globalResolution, setGlobalResolution] = useState('720p');
  const [selectedTarget, setSelectedTarget] = useState('local');

  const isPremium = user && user.is_premium;

  useEffect(() => {
    if (playlistData && playlistData.videos) {
      setSelectedVideos(playlistData.videos.map(v => v.id));
    }
  }, [playlistData]);

  if (!playlistData || playlistData.type !== 'playlist') return null;

  const { title, video_count, videos } = playlistData;

  const toggleVideo = (id) => {
    if (selectedVideos.includes(id)) {
      setSelectedVideos(selectedVideos.filter(vid => vid !== id));
    } else {
      setSelectedVideos([...selectedVideos, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedVideos(videos.map(v => v.id));
  };

  const handleSelectNone = () => {
    setSelectedVideos([]);
  };

  const formatDuration = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getFormatDetails = (res) => {
    if (res.startsWith('MP3') || res === 'mp3') {
      return { format_id: 'bestaudio/best', ext: 'mp3' };
    }
    if (res === 'm4a') {
      return { format_id: 'bestaudio[ext=m4a]/best', ext: 'm4a' };
    }
    return { format_id: 'bestvideo+bestaudio/best', ext: 'mp4' };
  };

  const handleBulkDownload = () => {
    if (selectedTarget === 'drive' && !isPremium) {
      onOpenPricing();
      return;
    }

    const selectedList = videos.filter(v => selectedVideos.includes(v.id));
    const formatDetails = getFormatDetails(globalResolution);
    
    const payload = {
        playlist_title: title,
        target: selectedTarget,
        resolution: globalResolution,
        format_id: formatDetails.format_id,
        ext: formatDetails.ext,
        videos: selectedList.map(v => ({
            url: v.url,
            video_id: v.id,
            title: v.title
        }))
    };
    
    if (onPlaylistDownload) {
        onPlaylistDownload(payload);
    }
  };

  return (
    <div className="glass-panel fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2.5rem' }}>
      {/* Playlist Header Info */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.4rem', color: '#a78bfa', marginBottom: '0.5rem', wordBreak: 'break-word' }}>Playlist: {title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Total videos: <strong style={{ color: 'white' }}>{video_count}</strong> | Selected: <strong style={{ color: 'white' }}>{selectedVideos.length}</strong>
        </p>
      </div>

      {/* Settings Row */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {/* Quality select */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Global Quality</label>
          <select 
            value={globalResolution} 
            onChange={(e) => {
              const val = e.target.value;
              setGlobalResolution(val);
            }}
            className="form-input"
            style={{ padding: '0.65rem 1rem', background: '#120e26' }}
          >
            <option value="1080p">1080p Full HD</option>
            <option value="720p">720p HD</option>
            <option value="480p">480p SD</option>
            <option value="360p">360p</option>
            <option value="MP3 (320k)">Audio (MP3 320kbps)</option>
            <option value="MP3 (256k)">Audio (MP3 256kbps)</option>
            <option value="MP3 (128k)">Audio (MP3 128kbps)</option>
            <option value="MP3 (64k)">Audio (MP3 64kbps)</option>
            <option value="m4a">Audio (M4A)</option>
          </select>
        </div>

        {/* Target selection */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Save Destination</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setSelectedTarget('local')}
              className="btn"
              style={{
                flex: 1,
                background: selectedTarget === 'local' ? 'var(--grad-primary)' : 'rgba(255,255,255,0.02)',
                border: '1px solid ' + (selectedTarget === 'local' ? 'var(--accent-primary)' : 'var(--border-color)'),
                boxShadow: selectedTarget === 'local' ? 'var(--shadow-glow)' : 'none',
                padding: '0.65rem',
                fontSize: '0.85rem'
              }}
            >
              <Monitor size={14} /> System
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
                background: selectedTarget === 'drive' ? 'var(--grad-secondary)' : 'rgba(255,255,255,0.02)',
                border: '1px solid ' + (selectedTarget === 'drive' ? 'var(--accent-secondary)' : 'var(--border-color)'),
                boxShadow: selectedTarget === 'drive' ? 'var(--shadow-glow-cyan)' : 'none',
                padding: '0.65rem',
                fontSize: '0.85rem',
                position: 'relative'
              }}
            >
              <Cloud size={14} /> Drive
              {!isPremium && <Lock size={12} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />}
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
              To save playlist tracks directly to Google Drive without occupying permanent disk space, please authenticate your account.
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

      {/* Videos List */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', maxHeight: '350px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', padding: '0.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSelectAll} style={{ background: 'none', color: '#a78bfa', fontSize: '0.8rem', fontWeight: '600' }}>Select All</button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>|</span>
            <button onClick={handleSelectNone} style={{ background: 'none', color: '#a78bfa', fontSize: '0.8rem', fontWeight: '600' }}>Select None</button>
          </div>
        </div>

        {videos.map((v, index) => {
          const isChecked = selectedVideos.includes(v.id);
          return (
            <div 
              key={v.id} 
              onClick={() => toggleVideo(v.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.6rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                background: isChecked ? 'rgba(139, 92, 246, 0.04)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderBottom: '1px solid rgba(255,255,255,0.02)'
              }}
              className="playlist-item"
            >
              <div style={{ color: isChecked ? '#a78bfa' : 'var(--text-muted)' }}>
                {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', width: '20px' }}>{index + 1}</span>
              <img src={v.thumbnail} alt="" style={{ width: '64px', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isChecked ? 'white' : 'var(--text-muted)' }}>{v.title}</p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Clock size={12} /> {formatDuration(v.duration)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <button
        onClick={handleBulkDownload}
        disabled={selectedVideos.length === 0 || (selectedTarget === 'drive' && !driveConnected)}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '0.9rem',
          fontSize: '1rem',
          gap: '0.75rem',
          opacity: (selectedVideos.length === 0 || (selectedTarget === 'drive' && !driveConnected)) ? 0.5 : 1,
          cursor: (selectedVideos.length === 0 || (selectedTarget === 'drive' && !driveConnected)) ? 'not-allowed' : 'pointer'
        }}
      >
        <Download size={20} /> Download {selectedVideos.length} Video{selectedVideos.length !== 1 ? 's' : ''} to {selectedTarget === 'drive' ? 'Google Drive' : 'Local System'}
      </button>

      <style>{`
        .playlist-item:hover {
          background: rgba(255,255,255,0.03) !important;
        }
      `}</style>
    </div>
  );
}
