import React from 'react';
import { Download, CheckCircle, XCircle, Loader2, CloudLightning, ExternalLink, HardDrive, Trash2 } from 'lucide-react';

export default function DownloadDashboard({ tasks, onClearHistory, backendUrl }) {
  const handleClear = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/tasks/clear`, { method: 'POST' });
      if (res.ok) {
        onClearHistory();
      }
    } catch (err) {
      console.error("Failed to clear tasks:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'downloading': return '#8b5cf6';
      case 'merging': return '#eab308';
      case 'uploading': return '#06b6d4';
      default: return 'var(--text-muted)';
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="glass-panel fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Download size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
        <p style={{ fontSize: '0.95rem' }}>No active downloads or uploads.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CloudLightning size={22} /> Download Progress Dashboard
        </h3>
        <button 
          onClick={handleClear} 
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', gap: '0.4rem', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
        >
          <Trash2 size={13} /> Clear Finished
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tasks.map((task) => {
          const isPending = task.status === 'pending';
          const isDownloading = task.status === 'downloading';
          const isMerging = task.status === 'merging';
          const isUploading = task.status === 'uploading';
          const isCompleted = task.status === 'completed';
          const isFailed = task.status === 'failed';
          
          return (
            <div 
              key={task.id} 
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Task Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.25rem' }} title={task.title}>
                    {task.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ color: 'white', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {task.resolution}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: task.target === 'drive' ? '#22d3ee' : '#c084fc' }}>
                      {task.target === 'drive' ? <CloudLightning size={12} /> : <HardDrive size={12} />}
                      {task.target === 'drive' ? 'Direct to Drive' : 'Local System'}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: getStatusColor(task.status) }}>
                  {(isDownloading || isMerging || isUploading || isPending) && (
                    <Loader2 size={14} className="loading-spinner" />
                  )}
                  {isCompleted && <CheckCircle size={14} />}
                  {isFailed && <XCircle size={14} />}
                  <span style={{ textTransform: 'uppercase' }}>
                    {isMerging ? 'merging audio/video' : task.status}
                  </span>
                </div>
              </div>

              {/* Progress details */}
              {!isCompleted && !isFailed && !isPending && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <span>{task.downloaded} / {task.total_size}</span>
                  <span>Speed: {task.speed}</span>
                  <span>ETA: {task.eta}</span>
                </div>
              )}

              {/* Progress Bar */}
              {!isFailed && !isPending && (
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div 
                    style={{ 
                      width: `${task.progress}%`, 
                      height: '100%', 
                      background: task.target === 'drive' ? 'var(--grad-secondary)' : 'var(--grad-primary)',
                      boxShadow: task.target === 'drive' ? 'var(--shadow-glow-cyan)' : 'var(--shadow-glow)',
                      transition: 'width 0.3s ease'
                    }} 
                  />
                </div>
              )}

              {/* Finished States */}
              {isCompleted && (
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Completed successfully
                  </span>
                  {task.target === 'drive' && task.drive_link && (
                    <a 
                      href={task.drive_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.3rem', 
                        color: '#22d3ee', 
                        fontSize: '0.8rem', 
                        fontWeight: '600', 
                        textDecoration: 'none' 
                      }}
                    >
                      View on Google Drive <ExternalLink size={13} />
                    </a>
                  )}
                  {task.target === 'local' && (
                    <a 
                      href={`${backendUrl}/api/download-file/${task.id}`}
                      download
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        background: 'rgba(192, 132, 252, 0.1)', 
                        color: '#c084fc', 
                        padding: '0.3rem 0.8rem', 
                        borderRadius: 'var(--radius-full)', 
                        fontSize: '0.8rem', 
                        fontWeight: '600', 
                        textDecoration: 'none',
                        border: '1px solid rgba(192, 132, 252, 0.2)'
                      }}
                    >
                      <Download size={13} /> Download to Device
                    </a>
                  )}
                </div>
              )}

              {/* Error messages */}
              {isFailed && (
                <div style={{ marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', color: '#fca5a5' }}>
                  <strong>Error:</strong> {task.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
