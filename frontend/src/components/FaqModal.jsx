import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, HelpCircle } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "What is the difference between Free and Premium?",
  "How does the Google Drive integration work?",
  "Is there a daily limit for downloads?",
  "Do you support 4K resolution?",
  "How can I cancel my subscription?"
];

const FAQ_DATABASE = [
  {
    keywords: ['price', 'cost', 'premium', 'upgrade', 'difference', 'free', 'subscription'],
    responses: [
      "AuraTube is free for basic use! Our Premium plan ($2.99/month) unlocks unlimited downloads, 4K resolution, and direct Google Drive cloud saves.",
      "You can use our Free plan forever with a 5-video daily limit (up to 720p). If you need more power, Premium is $2.99/mo for unlimited batch processing and 4K support.",
      "The Free tier is great for occasional downloads. For heavy users, Premium offers unlimited high-speed downloads, playlist batching, and Drive uploads for a small monthly fee."
    ]
  },
  {
    keywords: ['drive', 'google', 'cloud', 'save', 'upload', 'integration', 'work'],
    responses: [
      "With Google Drive connected, AuraTube fetches videos directly from our high-speed servers to your Drive. It completely bypasses your local network bandwidth!",
      "You can link your Google account in the Settings section. Once linked, simply choose 'Upload to Drive' when downloading, and the video goes straight to the cloud.",
      "Our Google Drive integration is a Premium feature that saves files directly to your cloud storage. No more filling up your local hard drive!"
    ]
  },
  {
    keywords: ['limit', 'how many', 'daily', 'quota', 'restrict'],
    responses: [
      "Free users can download up to 5 videos per day. Upgrading to Premium removes this limit entirely!",
      "There is a 5 download/day limit on the free plan to ensure server stability. Premium users have zero limits.",
      "You've got 5 free downloads every 24 hours. If you hit the cap, you can either wait for it to reset or upgrade to Premium for unlimited access."
    ]
  },
  {
    keywords: ['resolution', '4k', '1080p', 'quality', 'hd'],
    responses: [
      "Free users can download up to 720p resolution. Premium users unlock everything up to 4K and 8K where available!",
      "We support all YouTube resolutions! 720p is free, while 1080p, 1440p, and 4K are reserved for Premium subscribers.",
      "If the original video is in 4K, our Premium plan can fetch it in full 4K quality with perfectly synced audio."
    ]
  },
  {
    keywords: ['cancel', 'refund', 'stop', 'unsubscribe'],
    responses: [
      "You can cancel your subscription at any time from your account settings. You will retain Premium features until the end of your billing cycle.",
      "Canceling is easy and commitment-free. Just head to your profile to manage or cancel your active subscription.",
      "If you need to stop your subscription, just use the 'Manage Subscription' link in your profile. We don't lock you into long-term contracts."
    ]
  },
  {
    keywords: ['playlist', 'batch', 'multiple'],
    responses: [
      "You can paste a full YouTube playlist URL into the search bar. We'll extract all the videos so you can batch download them at once (Premium feature).",
      "Playlist processing is fully supported! Just paste the link and select which videos you want to download or send to Drive."
    ]
  }
];

export default function FaqModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi there! I'm AuraBot. I can help answer questions about features, pricing, or how to use the app. What's on your mind?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const typeMessage = async (text) => {
    setMessages(prev => [...prev, { role: 'bot', text: '' }]);
    for (let i = 0; i <= text.length; i++) {
      await new Promise(r => setTimeout(r, 15)); // typing speed
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = text.substring(0, i);
        return newMessages;
      });
    }
  };

  const analyzeAndRespond = async (userMessage) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500)); // Dynamic 0.8s - 1.3s pause
    setIsTyping(false);

    const lowerQ = userMessage.toLowerCase();
    let bestMatch = null;
    let maxMatches = 0;

    // Analyze question against FAQ database
    for (const category of FAQ_DATABASE) {
      let matches = 0;
      for (const keyword of category.keywords) {
        if (lowerQ.includes(keyword)) matches++;
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = category;
      }
    }

    let responseText = "That's a great question! While I'm just an AI assistant, I recommend checking out our Pricing page or emailing support@auratube.com for highly specific issues.";
    
    if (bestMatch) {
      // Pick a random response from the best matched category so it doesn't repeat identically
      const possibleResponses = bestMatch.responses;
      responseText = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
    }

    await typeMessage(responseText);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    await analyzeAndRespond(userMessage);
  };

  const handleSuggestedClick = async (question) => {
    if (isTyping) return;
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    await analyzeAndRespond(question);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div className="glass-panel modal-content" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: '500px',
        display: 'flex', flexDirection: 'column',
        height: '650px', maxHeight: '90vh',
        position: 'relative'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={24} color="var(--accent-primary)" /> FAQ Assistant
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1rem'
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex', gap: '0.75rem',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              maxWidth: '85%'
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-card-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="var(--accent-primary)" />}
              </div>
              <div style={{
                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-card-hover)',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                padding: '0.85rem 1rem',
                borderRadius: '1rem',
                borderTopRightRadius: msg.role === 'user' ? 0 : '1rem',
                borderTopLeftRadius: msg.role === 'bot' ? 0 : '1rem',
                fontSize: '0.95rem', lineHeight: '1.5'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--bg-card-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={16} color="var(--accent-primary)" />
              </div>
              <div style={{
                background: 'var(--bg-card-hover)', padding: '0.85rem 1rem',
                borderRadius: '1rem', borderTopLeftRadius: 0,
                display: 'flex', alignItems: 'center', gap: '0.3rem'
              }}>
                <span className="dot-typing">...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Interactive Input Area Container */}
        <div 
          onMouseEnter={() => setShowSuggestions(true)}
          onMouseLeave={() => setShowSuggestions(false)}
        >
          {/* Suggested Questions */}
          {!isTyping && showSuggestions && (
            <div style={{ padding: '0 1.5rem 1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleSuggestedClick(q)}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--accent-primary)',
                    color: 'var(--accent-primary)', padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-full)', fontSize: '0.8rem',
                    cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <div style={{
            padding: '1.25rem', borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-card-hover)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)'
          }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                value={inputValue}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question..."
                style={{
                  flex: 1, padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)', color: 'var(--text-main)',
                  outline: 'none', fontSize: '0.95rem'
                }}
              />
              <button type="submit" disabled={!inputValue.trim() || isTyping} style={{
                width: '46px', height: '46px', borderRadius: '50%',
                background: inputValue.trim() && !isTyping ? 'var(--accent-primary)' : 'var(--text-muted)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s'
              }}>
                <Send size={18} color="white" style={{ marginLeft: '0.1rem' }} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
