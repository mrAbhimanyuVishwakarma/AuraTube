import React, { useState, useEffect } from 'react';
import { Youtube, Download, CloudLightning, RefreshCw, AlertTriangle, ShieldCheck, User, LogOut, Sparkles, Sun, Moon, ArrowRight, Menu, X } from 'lucide-react';
import UrlInput from './components/UrlInput';
import FormatSelector from './components/FormatSelector';
import PlaylistManager from './components/PlaylistManager';
import DownloadDashboard from './components/DownloadDashboard';
import AuthModal from './components/AuthModal';
import PricingModal from './components/PricingModal';
import FaqModal from './components/FaqModal';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const formatStorage = (bytesStr) => {
  if (!bytesStr) return '∞';
  const bytes = parseInt(bytesStr, 10);
  if (isNaN(bytes)) return '∞';
  if (bytes >= 1099511627776) return (bytes / 1099511627776).toFixed(1) + 'TB';
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(0) + 'GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + 'MB';
  return bytes + 'B';
};

export default function App() {
  const [videoData, setVideoData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [driveStatus, setDriveStatus] = useState({
    is_configured: false,
    is_connected: false,
    email: null
  });
  const [tasks, setTasks] = useState([]);

  // SaaS States
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);


  // Fetch Drive Connection & User Profile on Mount
  useEffect(() => {
    fetchDriveStatus();
    fetchUserProfile();
  }, []);

  // Set up EventSource for real-time progress update
  useEffect(() => {
    const eventSource = new EventSource(`${BACKEND_URL}/api/progress`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTasks(data);
      } catch (err) {
        console.error("Error parsing progress SSE event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("EventSource error, attempting to reconnect...", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchDriveStatus = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/drive/status`);
      if (res.ok) {
        const data = await res.json();
        setDriveStatus(data);
      }
    } catch (err) {
      console.error("Could not fetch Drive status:", err);
    }
  };

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (err) {
      console.error("Could not fetch user profile:", err);
    }
  };

  const handleExtractMetadata = async (url) => {
    setIsLoading(true);
    setError(null);
    setVideoData(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${BACKEND_URL}/api/extract`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ url })
      });

      if (res.ok) {
        const data = await res.json();
        setVideoData(data);
      } else {
        const errData = await res.json();
        setError(errData.detail || "Failed to analyze YouTube URL.");
      }
    } catch (err) {
      setError("Failed to connect to backend server. Make sure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTrigger = async (downloadPayload) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${BACKEND_URL}/api/download`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(downloadPayload)
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || "Failed to start download.");
      }
    } catch (err) {
      alert("Error contacting server. Please try again.");
    }
  };

  const handlePlaylistDownloadTrigger = async (downloadPayload) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${BACKEND_URL}/api/download-playlist`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(downloadPayload)
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || "Failed to start playlist download.");
      }
    } catch (err) {
      alert("Error contacting server. Please try again.");
    }
  };

  const handleDisconnectDrive = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/drive/disconnect`, { method: 'POST' });
      if (res.ok) {
        fetchDriveStatus();
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/drive/auth-url`);
      if (res.ok) {
        const data = await res.json();

        const width = 600;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          data.url,
          'Google Sign In',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        const messageListener = (event) => {
          if (event.data && event.data.type === 'oauth-success') {
            localStorage.setItem('token', event.data.token);
            fetchUser();
            window.removeEventListener('message', messageListener);
            setIsAuthOpen(false); // Close auth modal if open
          }
        };
        window.addEventListener('message', messageListener);

        const timer = setInterval(() => {
          if (popup && popup.closed) {
            clearInterval(timer);
          }
        }, 1000);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to start Google Auth.");
      }
    } catch (err) {
      alert("Error getting authentication URL.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    alert("Logged out successfully.");
  };

  return (
    <div className="container">
      {/* App Header / Navigation */}
      <header className="app-header" style={{ borderBottom: 'none', padding: '2rem 0', marginBottom: '4rem' }}>
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="logo-text">AuraTube<span>.</span></div>
          {/* Mobile Menu Button - Only visible on mobile */}
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Kraft-style Navigation Links (Desktop) */}
        <div className="nav-links desktop-nav" style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          <span style={{ cursor: 'pointer', color: 'var(--text-main)' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</span>
          <span style={{ cursor: 'pointer' }} onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}>Features</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setIsPricingOpen(true)}>Pricing</span>
          <span style={{ cursor: 'pointer' }} onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })}>About</span>
          <span style={{ cursor: 'pointer' }} onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}>Contact Us</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="header-actions">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{ background: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Removed Drive Status Pill */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {user.is_premium ? (
                <span className="premium-badge" style={{ background: 'var(--accent-primary)', color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '0.3rem 0.65rem' }}>
                  PRO
                </span>
              ) : (
                <button onClick={() => setIsPricingOpen(true)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  Go Premium
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={handleLogout} title="Logout">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600' }}>
                  {user.email.split('@')[0]}
                </span>
                <LogOut size={16} color="var(--text-muted)" />
              </div>
            </div>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} style={{ background: 'none', border: 'none', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem', whiteSpace: 'nowrap', cursor: 'pointer' }}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--bg-main)', zIndex: 2000,
          display: 'flex', flexDirection: 'column', padding: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <div className="logo-text">AuraTube<span>.</span></div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <X size={28} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            <span style={{ cursor: 'pointer', color: 'var(--text-main)' }} onClick={() => { setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</span>
            <span style={{ cursor: 'pointer' }} onClick={() => { setIsMobileMenuOpen(false); document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</span>
            <span style={{ cursor: 'pointer' }} onClick={() => { setIsMobileMenuOpen(false); setIsPricingOpen(true); }}>Pricing</span>
            <span style={{ cursor: 'pointer' }} onClick={() => { setIsMobileMenuOpen(false); document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' }); }}>About</span>
            <span style={{ cursor: 'pointer' }} onClick={() => { setIsMobileMenuOpen(false); document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' }); }}>Contact Us</span>
          </div>
          
          <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Theme</div>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{ background: 'var(--bg-card)', color: 'var(--text-main)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {theme === 'light' ? <><Moon size={20} /> Dark Mode</> : <><Sun size={20} /> Light Mode</>}
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="hero-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '6rem', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
            Download Video<br />& Playlists.
          </h1>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
            <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'underline', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--text-main)'} onMouseOut={e => e.target.style.color = 'var(--text-muted)'}>Privacy Policy</a>
            <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'underline', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--text-main)'} onMouseOut={e => e.target.style.color = 'var(--text-muted)'}>Terms of Service</a>
          </div>
        </div>
        <div style={{ paddingLeft: '2rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            INTRO
          </p>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '400px' }}>
            Seamlessly fetch media from YouTube directly to your local storage or seamlessly upload them to your Google Drive account without using your bandwidth.
          </p>

          <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-primary)', fontWeight: '700', marginBottom: '0.2rem' }}>4K</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Resolution<br />supported</p>
            </div>
            <div 
              style={{ cursor: !driveStatus.is_connected ? 'pointer' : 'default' }}
              onClick={() => { if (!driveStatus.is_connected) handlePillClick(); }}
            >
              <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-primary)', fontWeight: '700', marginBottom: '0.2rem' }}>
                {driveStatus.is_connected ? (driveStatus.storage_limit ? formatStorage(driveStatus.storage_limit) : '∞') : 'Login'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cloud<br />storage limits</p>
            </div>
            <div>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-primary)', fontWeight: '700', marginBottom: '0.2rem' }}>12K+</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Videos<br />downloaded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main App Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: '3rem',
        alignItems: 'start'
      }} className="main-grid">

        {/* Left Side: Inputs, extract previews and Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Paste URL */}
          <UrlInput onSubmit={handleExtractMetadata} isLoading={isLoading} />

          {/* Error Message */}
          {error && (
            <div className="glass-panel fade-in" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-primary)', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', color: 'var(--text-main)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <AlertTriangle size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.9rem' }}>{error}</p>
            </div>
          )}

          {/* Skeleton Loaders */}
          {isLoading && (
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '200px', height: '112px', background: 'var(--border-color)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ width: '80%', height: '24px', background: 'var(--border-color)' }} />
                  <div style={{ width: '40%', height: '16px', background: 'var(--border-color)' }} />
                </div>
              </div>
            </div>
          )}

          {/* Display formats if single video */}
          {videoData && videoData.type === 'video' && (
            <FormatSelector
              videoData={videoData}
              onDownload={handleDownloadTrigger}
              onDownload={handleDownloadTrigger}
              user={user}
              onOpenPricing={() => setIsPricingOpen(true)}
            />
          )}

          {/* Display playlist selection if playlist */}
          {videoData && videoData.type === 'playlist' && (
            <PlaylistManager
              playlistData={videoData}
              onDownload={handleDownloadTrigger}
              onPlaylistDownload={handlePlaylistDownloadTrigger}
              onPlaylistDownload={handlePlaylistDownloadTrigger}
              user={user}
              onOpenPricing={() => setIsPricingOpen(true)}
            />
          )}

        </div>

        {/* Right Side: Sidebar with active tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '2rem' }} className="sidebar">
          <DownloadDashboard
            tasks={tasks}
            onClearHistory={fetchDriveStatus}
            backendUrl={BACKEND_URL}
          />
        </div>
      </div>

      {/* Features & Plans Section */}
      <div id="features-section" style={{ marginTop: '6rem', marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '3rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Features & Pricing
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }} className="features-grid-layout">
          {/* Processes */}
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', height: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Two Ways to Save</h3>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.85rem' }}>1</span>
                Local Download
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginLeft: '2.25rem' }}>
                Download videos and playlists directly to your computer or mobile device. Perfect for offline viewing and keeping local backups of your favorite content.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.85rem' }}>2</span>
                Save to Google Drive
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginLeft: '2.25rem' }}>
                Connect your Google Drive account and bypass your local bandwidth entirely. Videos are fetched and uploaded directly from our high-speed servers to your cloud storage seamlessly.
              </p>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', height: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Choose Your Plan</h3>

            <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Free Plan</h4>
              <ul style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', paddingLeft: '1.2rem', margin: 0 }}>
                <li>Standard resolution downloads (up to 1080p)</li>
                <li>Process 1 video at a time</li>
                <li>Local Download & Google Drive supported</li>
                <li>Standard processing speed</li>
              </ul>
            </div>

            <div style={{ padding: '1.5rem', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)', background: 'var(--bg-card-hover)', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-12px', right: '1.5rem', background: 'var(--accent-primary)', color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>PRO</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Premium Plan</h4>
              <ul style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', paddingLeft: '1.2rem', margin: 0 }}>
                <li>Maximum resolution support (2K, 4K)</li>
                <li>Bulk Playlist downloading (Unlimited concurrency)</li>
                <li>Priority high-speed server processing</li>
              </ul>
              <button
                onClick={() => setIsPricingOpen(true)}
                className="btn btn-primary"
                style={{ marginTop: '1.5rem', width: '100%', fontSize: '0.9rem' }}
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about-section" style={{ marginTop: '6rem', marginBottom: '4rem', padding: '3rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          About AuraTube
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '800px' }}>
          AuraTube started with a simple mission: to make fetching and saving high-quality media as frictionless as possible. We noticed that downloading 4K videos or backing up entire playlists was a clunky, bandwidth-heavy process. By integrating directly with Google Drive, we bypass the middleman—your local internet connection—allowing our high-speed servers to handle the heavy lifting. Whether you're a content creator, an archivist, or just someone who loves offline viewing, AuraTube is built for you.
        </p>
      </div>

      {/* Contact Section */}
      <div id="contact-section" style={{ marginTop: '4rem', marginBottom: '6rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Contact Us
        </h2>
        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', maxWidth: '600px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            Have a question, feature request, or need help with your Premium plan? We'd love to hear from you.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <strong style={{ color: 'var(--text-main)' }}>Email:</strong>
              <a href="mailto:support@auratube.com" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>support@auratube.com</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <strong style={{ color: 'var(--text-main)' }}>Twitter:</strong>
              <a href="#" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>@AuraTubeApp</a>
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.75rem' }}>Have a quick question?</p>
              <button onClick={() => setIsFaqOpen(true)} className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <CloudLightning size={18} color="var(--accent-primary)" /> Ask FAQ Assistant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal Overlay */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={fetchUserProfile} 
        backendUrl={BACKEND_URL}
        onGoogleLogin={handleGoogleLogin}
      />

      {/* Pricing Modal Overlay */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onSuccess={fetchUserProfile}
        backendUrl={BACKEND_URL}
      />

      {/* FAQ Modal */}
      <FaqModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
      />

      {/* Global CSS tweaks for grid responsiveness */}
      <style>{`
        @media (max-width: 900px) {
          .hero-section {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .hero-section h1 {
            font-size: 3rem !important;
          }
          .nav-links {
            display: none !important;
          }
          .main-grid, .features-grid-layout {
            grid-template-columns: 1fr !important;
          }
          .sidebar {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}

