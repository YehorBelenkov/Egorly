import { useState, useEffect } from 'react';
import './wheel.css';

const FortuneWheelAdmin = () => {
  const [users, setUsers] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [winners, setWinners] = useState([]);
  const [frozenUsers, setFrozenUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wheelStats, setWheelStats] = useState(null);

  // Fetch users and prizes on mount
  useEffect(() => {
    fetchUsers();
    fetchPrizes();
    fetchWinners();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/wheel/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setWheelStats(data.stats); // Store fairness stats
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrizes = async () => {
    try {
      const res = await fetch('/api/wheel/settings');
      if (res.ok) {
        const data = await res.json();
        setPrizes(data.prizes || []);
      }
    } catch (err) {
      console.error('Failed to fetch prizes:', err);
    }
  };

  const fetchWinners = async () => {
    try {
      const res = await fetch('/api/wheel/winners?limit=50');
      if (res.ok) {
        const data = await res.json();
        setWinners(data.winners || []);
      }
    } catch (err) {
      console.error('Failed to fetch winners:', err);
    }
  };

  // Open wheel in popup window for streaming
  const handleOpenPopupWindow = () => {
    if (users.length === 0) {
      alert('No users to display!');
      return;
    }

    // Freeze users
    const frozen = [...users];
    setFrozenUsers(frozen);

    // Save data to localStorage for popup
    localStorage.setItem('wheelUsers', JSON.stringify(frozen));
    localStorage.setItem('wheelPrizes', JSON.stringify(prizes));

    // Open popup window (fullscreen)
    const width = window.screen.width;
    const height = window.screen.height;
    window.open(
      '/wheel-display',
      'FortuneWheelDisplay',
      `width=${width},height=${height},left=0,top=0,menubar=no,toolbar=no,location=no,status=no`
    );
  };

  // Unfreeze and refresh
  const handleRefreshUsers = async () => {
    setFrozenUsers(null);
    await fetchUsers();
    await fetchWinners();
  };

  const displayUsers = frozenUsers || users;

  return (
    <div className="wheel-admin-container">
      {/* Animated background */}
      <div className="wheel-admin-background">
        <div className="wheel-admin-bg-circle wheel-admin-bg-circle-1"></div>
        <div className="wheel-admin-bg-circle wheel-admin-bg-circle-2"></div>
      </div>

      <div className="wheel-admin-content">
        {/* Header */}
        <div className="wheel-admin-header">
          <div>
            <h1 className="wheel-admin-title">
              <span className="wheel-admin-icon">🎡</span>
              Fortune Wheel
            </h1>
            <p className="wheel-admin-subtitle">
              {frozenUsers ? `${frozenUsers.length} users loaded in popup window` : `Ready to spin for top ${displayUsers.length} users by points`}
            </p>
          </div>
          <a href="/wheel/settings" className="wheel-settings-link" target="_blank" rel="noopener noreferrer">
            <span className="wheel-settings-icon">⚙️</span>
            Configure Prizes
          </a>
        </div>

        {/* Stats Grid */}
        <div className="wheel-admin-stats-grid">
          <div className="wheel-admin-stat-card">
            <div className="wheel-admin-stat-label">Total Users</div>
            <div className="wheel-admin-stat-value">{displayUsers.length}</div>
          </div>
          <div className="wheel-admin-stat-card">
            <div className="wheel-admin-stat-label">Available Prizes</div>
            <div className="wheel-admin-stat-value">{prizes.length}</div>
          </div>
          <div className="wheel-admin-stat-card">
            <div className="wheel-admin-stat-label">Top User %</div>
            <div className="wheel-admin-stat-value">
              {wheelStats && wheelStats.topUserPercentage != null ? `${wheelStats.topUserPercentage.toFixed(1)}%` : '-'}
            </div>
            <div className="wheel-admin-stat-sublabel">Max 18% cap active</div>
          </div>
          <div className="wheel-admin-stat-card">
            <div className="wheel-admin-stat-label">Average %</div>
            <div className="wheel-admin-stat-value">
              {wheelStats && wheelStats.averagePercentage != null ? `${wheelStats.averagePercentage.toFixed(1)}%` : '-'}
            </div>
            <div className="wheel-admin-stat-sublabel">Fair distribution</div>
          </div>
          <div className="wheel-admin-stat-card">
            <div className="wheel-admin-stat-label">Status</div>
            <div className="wheel-admin-stat-value">
              {frozenUsers ? '🎬 Streaming' : '🔄 Live'}
            </div>
          </div>
          <div className="wheel-admin-stat-card">
            <div className="wheel-admin-stat-label">Mode</div>
            <div className="wheel-admin-stat-value">
              {frozenUsers ? 'Popup Active' : 'Ready'}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="wheel-admin-loading">
            <div className="wheel-admin-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="wheel-admin-empty">
            <div className="wheel-admin-empty-icon">📭</div>
            <h3>No users yet</h3>
            <p>Connect to a TikTok live stream to collect users with points</p>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="wheel-admin-controls">
              {!frozenUsers && (
                <button 
                  onClick={handleOpenPopupWindow}
                  className="wheel-admin-btn wheel-admin-btn-streaming"
                >
                  <span className="wheel-admin-btn-icon">📺</span>
                  Open Fortune Wheel in Popup Window
                </button>
              )}
              
              {frozenUsers && (
                <div className="wheel-admin-popup-info">
                  <span className="wheel-admin-popup-badge">🎬 STREAMING MODE</span>
                  <p>{frozenUsers.length} users loaded in popup - Control everything from the popup window</p>
                  <button 
                    onClick={handleRefreshUsers}
                    className="wheel-admin-btn wheel-admin-btn-secondary"
                    style={{ marginTop: '1rem' }}
                  >
                    <span className="wheel-admin-btn-icon">🔄</span>
                    Close Popup & Refresh Users
                  </button>
                </div>
              )}
            </div>

            {!frozenUsers && (
              <div className="wheel-admin-instructions">
                <h3>📋 How It Works</h3>
                <div className="wheel-admin-steps">
                  <div className="wheel-admin-step">
                    <div className="wheel-admin-step-number">1</div>
                    <div className="wheel-admin-step-content">
                      <div className="wheel-admin-step-title">Open Popup</div>
                      <div className="wheel-admin-step-desc">Launch fullscreen wheel display</div>
                    </div>
                  </div>
                  <div className="wheel-admin-step">
                    <div className="wheel-admin-step-number">2</div>
                    <div className="wheel-admin-step-content">
                      <div className="wheel-admin-step-title">View Users</div>
                      <div className="wheel-admin-step-desc">See top {displayUsers.length} users ranked by points</div>
                    </div>
                  </div>
                  <div className="wheel-admin-step">
                    <div className="wheel-admin-step-number">3</div>
                    <div className="wheel-admin-step-content">
                      <div className="wheel-admin-step-title">Spin for Winner</div>
                      <div className="wheel-admin-step-desc">Click "Start User Spin" in popup</div>
                    </div>
                  </div>
                  <div className="wheel-admin-step">
                    <div className="wheel-admin-step-number">4</div>
                    <div className="wheel-admin-step-content">
                      <div className="wheel-admin-step-title">Spin for Prize</div>
                      <div className="wheel-admin-step-desc">Click "Start Prize Spin" in popup</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Winners History */}
            {winners.length > 0 && (
              <div className="wheel-admin-winners-section">
                <h3 className="wheel-admin-winners-title">
                  <span className="wheel-admin-icon">🏆</span>
                  Recent Winners
                </h3>
                <div className="wheel-admin-winners-table-wrapper">
                  <table className="wheel-admin-winners-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Prize</th>
                        <th>Date & Time</th>
                        <th>Engagement Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.map((winner, idx) => (
                        <tr key={winner.id || idx}>
                          <td className="wheel-admin-winner-username">
                            <span className="wheel-admin-winner-badge">🎯</span>
                            {winner.username}
                          </td>
                          <td className="wheel-admin-winner-prize">
                            {winner.prize}
                          </td>
                          <td className="wheel-admin-winner-date">
                            {new Date(winner.timestamp).toLocaleString()}
                          </td>
                          <td className="wheel-admin-winner-score">
                            {winner.engagementScore || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FortuneWheelAdmin;
