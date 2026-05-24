import React, { useState, useEffect } from 'react';
import { Settings, Cloud, Key, CheckCircle2, AlertCircle, RefreshCw, LogOut, HelpCircle } from 'lucide-react';

export default function GoogleDriveSetup({ driveStatus, onRefreshStatus, backendUrl, onConnectDrive }) {
  const [downloadsDir, setDownloadsDir] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    // Fetch current settings
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setDownloadsDir(data.downloads_dir || '');
        setClientId(data.google_client_id || '');
        setClientSecret(data.google_client_secret || '');
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`${backendUrl}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downloads_dir: downloadsDir,
          google_client_id: clientId,
          google_client_secret: clientSecret
        })
      });
      if (res.ok) {
        setSaveMessage({ type: 'success', text: 'Settings updated successfully!' });
        onRefreshStatus();
      } else {
        const errData = await res.json();
        setSaveMessage({ type: 'error', text: errData.detail || 'Failed to update settings.' });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Connection error to backend.' });
    } finally {
      setIsSaving(false);
    }
  };



  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Drive?")) return;
    try {
      const res = await fetch(`${backendUrl}/api/drive/disconnect`, { method: 'POST' });
      if (res.ok) {
        onRefreshStatus();
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  return (
    <div id="drive-setup-section" className="glass-panel fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
        <Settings size={22} color="var(--accent-primary)" /> Google Drive Login
      </h2>

      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
        
        {/* Connection Status Card */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {driveStatus.is_connected ? (
                <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={24} />
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--text-main)' }}>Connected</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{driveStatus.email}</p>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={24} />
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--text-main)' }}>Not Connected</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sign in to upload videos directly to your Google Drive.</p>
                  </div>
                </div>
              )}
            </div>

            {driveStatus.is_connected ? (
              <button 
                onClick={handleDisconnect} 
                className="btn btn-secondary" 
                style={{ width: 'fit-content', gap: '0.5rem', fontSize: '0.85rem', color: '#f87171' }}
              >
                <LogOut size={14} /> Disconnect Account
              </button>
            ) : (
              <button 
                onClick={onConnectDrive} 
                className="btn btn-primary" 
                style={{ 
                  width: 'fit-content', 
                  gap: '0.5rem', 
                  fontSize: '0.85rem'
                }}
              >
                <Cloud size={14} /> Connect Google Account
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
