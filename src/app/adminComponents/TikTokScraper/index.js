import { useState, useEffect } from 'react';
import './scraper.css';

const TikTokScraper = () => {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentStreamer, setCurrentStreamer] = useState('');
  const [topUsers, setTopUsers] = useState([]);
  const [error, setError] = useState('');
  
  // Discount toggle state
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(20);
  const [updatingDiscount, setUpdatingDiscount] = useState(false);

  // Poll for updated user data every 2 seconds
  useEffect(() => {
    fetchTopUsers();
    const pollInterval = setInterval(fetchTopUsers, 2000);
    return () => clearInterval(pollInterval);
  }, []);

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
    fetchDiscountStatus();
  }, []);
  
  const fetchDiscountStatus = async () => {
    try {
      const res = await fetch('/api/discount-toggle');
      if (res.ok) {
        const data = await res.json();
        setDiscountEnabled(data.enabled || false);
        setDiscountPercentage(data.percentage || 20);
      }
    } catch (err) {
      console.error('Failed to fetch discount status:', err);
    }
  };
  
  const toggleDiscount = async () => {
    setUpdatingDiscount(true);
    try {
      const newState = !discountEnabled;
      const res = await fetch('/api/discount-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          enabled: newState, 
          percentage: discountPercentage 
        }),
      });
      
      if (res.ok) {
        setDiscountEnabled(newState);
      }
    } catch (err) {
      console.error('Failed to toggle discount:', err);
    } finally {
      setUpdatingDiscount(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/scraper/connect');
      const data = await res.json();
      if (data.isConnected) {
        setIsConnected(true);
        setCurrentStreamer(data.username);
      }
    } catch (err) {
      console.error('Failed to check status:', err);
    }
  };

  const fetchTopUsers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setTopUsers(data.slice(0, 50));
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleConnect = async () => {
    if (!username.trim()) {
      setError('Please enter a TikTok username');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/scraper/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsConnected(true);
        setCurrentStreamer(username.trim());
        setUsername('');
        setError('');
        
        setTimeout(async () => {
          const statusRes = await fetch('http://localhost:3001/api/scraper/connect');
          const statusData = await statusRes.json();
          if (!statusData.isConnected) {
            setError('Connection established but websocket failed. Try another streamer or check if they are live.');
            setIsConnected(false);
          }
        }, 3000);
        
        fetchTopUsers();
      } else {
        setError(data.error || 'Failed to connect');
      }
    } catch (err) {
      const errorMsg = err.message || 'Connection failed';
      setError(errorMsg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('http://localhost:3001/api/scraper/disconnect', { method: 'POST' });
      setIsConnected(false);
      setCurrentStreamer('');
    } catch (err) {
      setError('Failed to disconnect');
    }
  };

  return (
    <div className="scraper-container">
      {/* Animated background */}
      <div className="scraper-background">
        <div className="scraper-bg-circle scraper-bg-circle-1"></div>
        <div className="scraper-bg-circle scraper-bg-circle-2"></div>
      </div>

      <div className="scraper-content">
        {/* Header */}
        <div className="scraper-header">
          <div>
            <h1 className="scraper-title">
              <span className="scraper-icon">🎯</span>
              TikTok Live Scraper
            </h1>
            <p className="scraper-subtitle">
              Connect to any live TikTok stream and watch real-time engagement data
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="scraper-stats-grid">
          <div className="scraper-stat-card scraper-stat-card-status">
            <div className="scraper-stat-flex">
              <div className="scraper-stat-info">
                <div className={`scraper-status-dot ${isConnected ? 'scraper-status-connected' : 'scraper-status-disconnected'}`}></div>
                <div>
                  <div className="scraper-stat-label">Status</div>
                  <div className="scraper-stat-value">
                    {isConnected ? `@${currentStreamer}` : 'Not Connected'}
                  </div>
                </div>
              </div>
              {isConnected && (
                <button onClick={handleDisconnect} className="scraper-disconnect-btn">
                  Disconnect
                </button>
              )}
            </div>
          </div>
          
          {/* Discount Toggle Card */}
          <div className="scraper-stat-card scraper-stat-card-discount">
            <div className="scraper-stat-flex">
              <div className="scraper-stat-info">
                <span className="scraper-discount-icon">💰</span>
                <div>
                  <div className="scraper-stat-label">
                    {discountPercentage}% Discount Banner
                  </div>
                  <div className={`scraper-stat-value ${discountEnabled ? 'scraper-discount-active' : 'scraper-discount-inactive'}`}>
                    {discountEnabled ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleDiscount}
                disabled={updatingDiscount}
                className={`scraper-toggle ${discountEnabled ? 'scraper-toggle-on' : 'scraper-toggle-off'} ${updatingDiscount ? 'scraper-toggle-disabled' : ''}`}
              >
                <span className={`scraper-toggle-slider ${discountEnabled ? 'scraper-toggle-slider-on' : ''}`}>
                  <span className="scraper-toggle-icon">
                    {discountEnabled ? '✓' : '✗'}
                  </span>
                </span>
              </button>
            </div>
            <div className="scraper-discount-message">
              {discountEnabled 
                ? '🎉 Discount banner is showing across the website' 
                : '⚠️ No discount banner on website'}
            </div>
          </div>
          
          <div className="scraper-stat-card scraper-stat-card-purple">
            <div className="scraper-stat-center">
              <p className="scraper-stat-label">Total Users</p>
              <p className="scraper-stat-number">{topUsers.length}</p>
              {topUsers.length > 0 && (
                <p className="scraper-stat-badge scraper-stat-badge-green">
                  <span className="scraper-badge-dot"></span>
                  Capturing data
                </p>
              )}
              {isConnected && topUsers.length === 0 && (
                <p className="scraper-stat-badge scraper-stat-badge-yellow">Waiting for events...</p>
              )}
            </div>
          </div>

          <div className="scraper-stat-card scraper-stat-card-blue">
            <div className="scraper-stat-center">
              <p className="scraper-stat-label-sm">Top Scorer</p>
              {topUsers.length > 0 ? (
                <>
                  <p className="scraper-stat-username">{topUsers[0]?.username || '-'}</p>
                  <p className="scraper-stat-points">
                    <span className="scraper-points-number">{topUsers[0]?.engagementScore || 0}</span> points
                  </p>
                </>
              ) : (
                <p className="scraper-stat-empty">-</p>
              )}
            </div>
          </div>
        </div>

        {/* Connection Form */}
        {!isConnected && (
          <div className="scraper-connection-form">
            <h2 className="scraper-form-title">
              <span className="scraper-form-icon">🔗</span>
              Connect to Live Stream
            </h2>
            <p className="scraper-form-description">
              ⚡ Enter the username of a TikTok streamer who is currently LIVE (must be actively streaming)
            </p>
            <div className="scraper-form-input-group">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                placeholder="Enter TikTok username (without @)"
                className="scraper-input"
                disabled={isConnecting}
              />
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="scraper-connect-btn"
              >
                {isConnecting ? (
                  <span className="scraper-btn-loading">
                    <span className="scraper-spinner">⏳</span>
                    Connecting...
                  </span>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
            {error && (
              <div className="scraper-error">
                <span className="scraper-error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* User Tracker Table */}
        <div className="scraper-table-container">
          <div className="scraper-table-header">
            <h2 className="scraper-table-title">
              <span className="scraper-table-icon">🏆</span>
              Live User Tracker
            </h2>
            <div className="scraper-auto-update">
              <div className="scraper-update-dot"></div>
              <span className="scraper-update-text">Auto-updating every 2s</span>
            </div>
          </div>
          
          <div className="scraper-table-scroll">
            {topUsers.length === 0 ? (
              <div className="scraper-empty-state">
                <p className="scraper-empty-icon">📊</p>
                <p className="scraper-empty-title">No users tracked yet</p>
                <p className="scraper-empty-description">Connect to a live stream to start tracking engagement</p>
              </div>
            ) : (
              <table className="scraper-table">
                <thead className="scraper-thead">
                  <tr className="scraper-thead-row">
                    <th className="scraper-th">#</th>
                    <th className="scraper-th scraper-th-left">Username</th>
                    <th className="scraper-th scraper-th-center scraper-th-yellow">🎁 Gifts</th>
                    <th className="scraper-th scraper-th-center scraper-th-green">✅ Follows</th>
                    <th className="scraper-th scraper-th-center scraper-th-blue">💬 Comments</th>
                    <th className="scraper-th scraper-th-center scraper-th-red">❤️ Likes</th>
                    <th className="scraper-th scraper-th-center scraper-th-purple">⭐ Score</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((user, index) => (
                    <tr
                      key={user.username}
                      className={`scraper-tr ${index < 3 ? 'scraper-tr-top' : ''}`}
                    >
                      <td className="scraper-td">
                        <span className={`scraper-rank scraper-rank-${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                        </span>
                      </td>
                      <td className="scraper-td">
                        <span className={`scraper-username ${index < 3 ? 'scraper-username-top' : ''}`}>
                          {user.username}
                        </span>
                      </td>
                      <td className="scraper-td scraper-td-center">
                        <span className="scraper-badge scraper-badge-yellow">
                          {user.giftCount}
                        </span>
                      </td>
                      <td className="scraper-td scraper-td-center">
                        <span className="scraper-badge scraper-badge-green-light">
                          {user.followCount}
                        </span>
                      </td>
                      <td className="scraper-td scraper-td-center">
                        <span className="scraper-badge scraper-badge-blue-light">
                          {user.commentCount}
                        </span>
                      </td>
                      <td className="scraper-td scraper-td-center">
                        <span className="scraper-badge scraper-badge-red-light">
                          {user.likeCount}
                        </span>
                      </td>
                      <td className="scraper-td scraper-td-center">
                        <span className={`scraper-score scraper-score-${index === 0 ? 'gold' : index < 3 ? 'top' : 'default'}`}>
                          {user.engagementScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="scraper-tips">
          <h3 className="scraper-tips-title">
            <span className="scraper-tips-icon">💡</span>
            How It Works
          </h3>
          <div className="scraper-tips-grid">
            <div className="scraper-tip">
              <span className="scraper-tip-icon">🔍</span>
              <div>
                <div className="scraper-tip-title">Find Live Streams</div>
                <div className="scraper-tip-description">Search TikTok for users who are currently LIVE</div>
              </div>
            </div>
            <div className="scraper-tip">
              <span className="scraper-tip-icon">⏱️</span>
              <div>
                <div className="scraper-tip-title">Real-time Only</div>
                <div className="scraper-tip-description">Tracks events AFTER connection (no historical data)</div>
              </div>
            </div>
            <div className="scraper-tip">
              <span className="scraper-tip-icon">🎯</span>
              <div>
                <div className="scraper-tip-title">Scoring System</div>
                <div className="scraper-tip-description">Gifts (100pts) • Follows (50pts) • Comments (10pts) • Likes (1pt)</div>
              </div>
            </div>
            <div className="scraper-tip">
              <span className="scraper-tip-icon">🔄</span>
              <div>
                <div className="scraper-tip-title">Auto-Update</div>
                <div className="scraper-tip-description">Table refreshes every 2 seconds with latest data</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TikTokScraper;
