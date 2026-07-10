import { useState, useEffect, useMemo } from 'react';
import FortuneWheel from '../components/FortuneWheel';
import '../app/adminComponents/FortuneWheelAdmin/wheel.css';

export default function WheelDisplay() {
  const [users, setUsers] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [step, setStep] = useState('users'); // 'users', 'spin-user', 'user-selected', 'spin-prize', 'complete'
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPrize, setSelectedPrize] = useState(null);

  useEffect(() => {
    // Load data from localStorage (set by admin panel)
    const storedUsers = localStorage.getItem('wheelUsers');
    const storedPrizes = localStorage.getItem('wheelPrizes');
    
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch (e) {
        console.error('Failed to load users:', e);
      }
    }
    
    if (storedPrizes) {
      try {
        const parsedPrizes = JSON.parse(storedPrizes);
        console.log('🎁 Loaded prizes from localStorage:', parsedPrizes);
        setPrizes(parsedPrizes);
      } catch (e) {
        console.error('Failed to load prizes:', e);
      }
    }
  }, []);

  const handleStartUserSpin = async () => {
    setStep('spin-user');
    
    // Record spin participation for all users
    try {
      const userIds = users.map(u => u.id);
      await fetch('/api/wheel/record-win', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });
    } catch (error) {
      console.error('Failed to record participation:', error);
    }
  };

  const handleUserSpinComplete = (winner) => {
    setSelectedUser(winner);
    setStep('user-selected');
  };

  const handleStartPrizeSpin = () => {
    setStep('spin-prize');
  };

  const handlePrizeSpinComplete = async (prize) => {
    console.log('🏆 Selected prize:', prize);
    console.log('🖼️ Product image:', prize?.productImage);
    setSelectedPrize(prize);
    setStep('complete');
    
    // Record the win
    try {
      const winnerId = users.find(u => 
        (u.username || u.uniqueId) === selectedUser?.label
      )?.id;
      
      if (winnerId) {
        await fetch('/api/wheel/record-win', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: winnerId, 
            prize: prize?.label || prize?.name || 'Prize' 
          }),
        });
      }
    } catch (error) {
      console.error('Failed to record win:', error);
    }
  };

  const handleClose = () => {
    window.close();
  };

  const handleReset = () => {
    setStep('users');
    setSelectedUser(null);
    setSelectedPrize(null);
  };

  // Fisher-Yates shuffle for randomizing user positions on wheel
  const shuffleArray = (array) => {
    const shuffled = [...array]; // Create copy to avoid mutating original
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Randomize user positions on wheel (only shuffle once when users load)
  // This prevents highest pointers from always sitting in same position
  const shuffledUsers = useMemo(() => shuffleArray(users), [users.length]);

  // Use server-calculated fair weights (square root scaling with caps)
  // The API already applies diminishing returns and max percentage caps
  const userSegments = shuffledUsers.map((user) => ({
    id: user.id || user.uniqueId,
    label: user.username || user.name || user.uniqueId || 'Unknown',
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    weight: user.wheelPercentage || user.wheelWeight || 1, // Use server-calculated weight
    engagementScore: user.engagementScore || 0,
    wins: user.wins || 0,
    wheelPercentage: user.wheelPercentage || 0,
  }));

  const prizeSegments = prizes.map((prize, idx) => ({
    id: prize.id || idx,
    label: prize.label || prize.name || 'Prize',
    color: prize.color || `hsl(${(idx * 360) / prizes.length}, 70%, 60%)`,
    weight: 1,
    productImage: prize.productImage || null,
    type: prize.type || null
  }));
  
  if (prizeSegments.some(p => p.productImage)) {
    console.log('🎯 Prize segments with images:', prizeSegments.filter(p => p.productImage));
  }
  
  console.log('🎯 Prize segments with images:', prizeSegments.filter(p => p.productImage));

  return (
    <div className="wheel-display-fullscreen">
      {/* Close Button */}
      <button 
        onClick={handleClose}
        className="wheel-display-close-btn"
        title="Close Window"
      >
        ✕
      </button>

      {/* Fullscreen Wheel Display */}
      <div className="wheel-display-content">
        {/* User List View */}
        {step === 'users' && (
          <div className="wheel-display-users-view">
            <div className="wheel-display-header">
              <div className="wheel-display-header-badge">LIVE DRAW</div>
              <h1 className="wheel-display-title">Fortune Wheel Championship</h1>
              <p className="wheel-display-subtitle">Top 100 Participants Ranked by Engagement</p>
            </div>
            
            <div className="wheel-display-user-stats">
              <div className="wheel-display-stat-badge">
                <span className="wheel-display-stat-number">{users.length}</span>
                <span className="wheel-display-stat-label">ACTIVE PARTICIPANTS</span>
              </div>
              <div className="wheel-display-stat-badge">
                <span className="wheel-display-stat-number">{prizes.length}</span>
                <span className="wheel-display-stat-label">PRIZE POOL</span>
              </div>
              <div className="wheel-display-stat-badge">
                <span className="wheel-display-stat-number">
                  {users.reduce((sum, u) => sum + (u.engagementScore || 0), 0).toLocaleString()}
                </span>
                <span className="wheel-display-stat-label">TOTAL ENGAGEMENT</span>
              </div>
            </div>
            
            <div className="wheel-display-users-grid">
              {users.map((user, index) => (
                <div key={user.id || user.uniqueId} className="wheel-display-user-card">
                  <div className="wheel-display-user-header">
                    <div className="wheel-display-user-rank">
                      <span className="rank-number">#{index + 1}</span>
                    </div>
                    <div className="wheel-display-user-info">
                      <div className="wheel-display-user-name">{user.username}</div>
                      <div className="wheel-display-user-meta">
                        <span className="meta-item">
                          <span className="meta-label">Points:</span>
                          <span className="meta-value">{(user.engagementScore || 0).toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="wheel-display-user-footer">
                    {user.wheelPercentage > 0 && (
                      <div className="user-percentage">
                        <div className="percentage-bar">
                          <div 
                            className="percentage-fill" 
                            style={{ width: `${Math.min(user.wheelPercentage * 5, 100)}%` }}
                          ></div>
                        </div>
                        <span className="percentage-text">{user.wheelPercentage.toFixed(2)}% Win Chance</span>
                      </div>
                    )}
                    {user.wins > 0 && (
                      <div className="user-wins">
                        <span className="wins-badge">{user.wins} Previous {user.wins === 1 ? 'Win' : 'Wins'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleStartUserSpin}
              className="wheel-display-btn wheel-display-btn-primary"
            >
              <span className="btn-shine"></span>
              <span className="btn-text">INITIATE DRAW</span>
            </button>
          </div>
        )}

        {/* User Spin */}
        {step === 'spin-user' && (
          <div className="wheel-display-wheel-section">
            <div className="wheel-section-header">
              <div className="section-badge">ROUND 1</div>
              <h1 className="wheel-display-title">Participant Selection</h1>
            </div>
            <div className="wheel-display-wheel-wrapper">
              <FortuneWheel
                segments={userSegments}
                onSpinComplete={handleUserSpinComplete}
                size={800}
                autoSpin={true}
              />
            </div>
          </div>
        )}

        {/* User Selected */}
        {step === 'user-selected' && (
          <div className="wheel-display-result-view">
            <div className="result-badge">PARTICIPANT SELECTED</div>
            <h1 className="wheel-display-winner-announce">Winner Confirmed</h1>
            <div className="wheel-display-winner-card">
              <div className="winner-label">Selected Participant</div>
              <div className="wheel-display-winner-name">{selectedUser?.label}</div>
              <div className="wheel-display-winner-details">
                <div className="detail-item">
                  <span className="detail-label">Engagement Score</span>
                  <span className="detail-value">{(users.find(u => (u.username || u.uniqueId) === selectedUser?.label)?.engagementScore || 0).toLocaleString()} pts</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleStartPrizeSpin}
              className="wheel-display-btn wheel-display-btn-primary"
            >
              <span className="btn-shine"></span>
              <span className="btn-text">PROCEED TO PRIZE DRAW</span>
            </button>
          </div>
        )}

        {/* Prize Spin */}
        {step === 'spin-prize' && (
          <div className="wheel-display-wheel-section">
            <div className="wheel-section-header">
              <div className="section-badge">ROUND 2</div>
              <h1 className="wheel-display-title">Prize Selection</h1>
              <div className="wheel-display-subtitle">Winner: {selectedUser?.label}</div>
            </div>
            <div className="wheel-display-wheel-wrapper">
              <FortuneWheel
                segments={prizeSegments}
                onSpinComplete={handlePrizeSpinComplete}
                size={800}
                autoSpin={true}
              />
            </div>
          </div>
        )}

        {/* Final Result */}
        {step === 'complete' && (
          <div className="wheel-display-final">
            <div className="wheel-display-final-content">
              <div className="final-badge">DRAW COMPLETE</div>
              <h1 className="wheel-display-final-title">Congratulations!</h1>
              <div className="wheel-display-final-cards">
                <div className="wheel-display-final-card">
                  <div className="final-card-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  </div>
                  <div className="final-card-label">Champion</div>
                  <div className="final-card-value">{selectedUser?.label}</div>
                </div>
                <div className="wheel-display-final-card">
                  <div className="final-card-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20,6H16V4A2,2 0 0,0 14,2H10C8.89,2 8,2.9 8,4V6H4C2.89,6 2,6.9 2,8V19C2,20.11 2.89,21 4,21H20C21.11,21 22,20.11 22,19V8A2,2 0 0,0 20,6M10,4H14V6H10V4Z"/>
                    </svg>
                  </div>
                  <div className="final-card-label">Prize Awarded</div>
                  {selectedPrize?.productImage && (
                    <div className="final-card-product-image">
                      <img 
                        src={selectedPrize.productImage} 
                        alt={selectedPrize.label} 
                      />
                    </div>
                  )}
                  <div className="final-card-value">{selectedPrize?.label}</div>
                </div>
              </div>
              <button 
                onClick={handleReset}
                className="wheel-display-btn wheel-display-btn-secondary"
              >
                <span className="btn-text">INITIATE NEW DRAW</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .wheel-display-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wheel-display-fullscreen::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(120, 40, 200, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0, 242, 254, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(255, 0, 122, 0.1) 0%, transparent 50%);
          animation: gradient-shift 15s ease infinite;
        }

        @keyframes gradient-shift {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .wheel-display-close-btn {
          position: fixed;
          top: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          background: rgba(15, 15, 35, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.7);
          font-size: 24px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 300;
          line-height: 1;
        }

        .wheel-display-close-btn:hover {
          background: rgba(239, 68, 68, 0.9);
          border-color: rgba(255, 255, 255, 0.3);
          transform: scale(1.05) rotate(90deg);
          box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4);
        }

        .wheel-display-content {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow-y: auto;
          position: relative;
          z-index: 1;
        }

        /* Header Styles */
        .wheel-display-header {
          text-align: center;
          margin-bottom: 3rem;
          animation: fadeInDown 0.8s ease-out;
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .wheel-display-header-badge {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          color: #0a0a1a;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          border-radius: 2rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 242, 254, 0.4);
          animation: pulse-neon 2s ease-in-out infinite;
        }

        @keyframes pulse-neon {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(0, 242, 254, 0.4), 0 0 40px rgba(0, 242, 254, 0.2);
          }
          50% {
            box-shadow: 0 4px 30px rgba(0, 242, 254, 0.6), 0 0 60px rgba(0, 242, 254, 0.3);
          }
        }

        .wheel-display-title {
          color: #ffffff;
          font-size: 3.5rem;
          font-weight: 900;
          margin-bottom: 1rem;
          text-shadow: 0 0 40px rgba(0, 242, 254, 0.5);
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .wheel-display-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.125rem;
          font-weight: 500;
          letter-spacing: 0.05em;
        }

        /* User List View */
        .wheel-display-users-view {
          width: 100%;
          max-width: 1600px;
          text-align: center;
        }

        /* Stats Grid */
        .wheel-display-user-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .wheel-display-stat-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 2.5rem;
          background: rgba(15, 15, 35, 0.6);
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .wheel-display-stat-badge::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s;
        }

        .wheel-display-stat-badge:hover::before {
          left: 100%;
        }

        .wheel-display-stat-badge:hover {
          border-color: rgba(0, 242, 254, 0.5);
          box-shadow: 0 8px 32px rgba(0, 242, 254, 0.2);
          transform: translateY(-4px);
        }

        .wheel-display-stat-number {
          font-size: 2.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .wheel-display-stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* Users Grid */
        .wheel-display-users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          max-height: 55vh;
          overflow-y: auto;
          padding: 1rem;
          margin-bottom: 2rem;
          background: rgba(15, 15, 35, 0.4);
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .wheel-display-users-grid::-webkit-scrollbar {
          width: 8px;
        }

        .wheel-display-users-grid::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .wheel-display-users-grid::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          border-radius: 10px;
        }

        /* User Card */
        .wheel-display-user-card {
          background: linear-gradient(135deg, rgba(30, 30, 60, 0.8), rgba(20, 20, 40, 0.8));
          padding: 1.25rem;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .wheel-display-user-card::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #00f2fe, #4facfe, #7928ca);
          border-radius: 1rem;
          opacity: 0;
          transition: opacity 0.3s;
          z-index: -1;
        }

        .wheel-display-user-card:hover::before {
          opacity: 0.5;
        }

        .wheel-display-user-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 242, 254, 0.3);
          border-color: rgba(0, 242, 254, 0.5);
        }

        .wheel-display-user-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .wheel-display-user-rank {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7928ca 0%, #ff0080 100%);
          border-radius: 0.75rem;
          box-shadow: 0 4px 16px rgba(121, 40, 202, 0.4);
        }

        .rank-number {
          font-size: 1.125rem;
          font-weight: 900;
          color: #ffffff;
        }

        .wheel-display-user-info {
          flex: 1;
          text-align: left;
        }

        .wheel-display-user-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
          word-break: break-word;
          line-height: 1.3;
        }

        .wheel-display-user-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .meta-label {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
        }

        .meta-value {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 700;
        }

        .wheel-display-user-footer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* Percentage Bar */
        .user-percentage {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .percentage-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          overflow: hidden;
          position: relative;
        }

        .percentage-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
          border-radius: 1rem;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .percentage-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .percentage-text {
          font-size: 0.8125rem;
          color: #10b981;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .user-wins {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .wins-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #1a1a2e;
          font-size: 0.75rem;
          font-weight: 800;
          border-radius: 0.5rem;
          letter-spacing: 0.05em;
        }

        /* Buttons */
        .wheel-display-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1.25rem 3rem;
          border: none;
          border-radius: 1rem;
          font-size: 1.125rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          text-transform: uppercase;
        }

        .btn-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        }

        .wheel-display-btn:hover .btn-shine {
          animation: btn-shine 0.6s;
        }

        @keyframes btn-shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .btn-text {
          position: relative;
          z-index: 1;
        }

        .wheel-display-btn-primary {
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          color: #0a0a1a;
          box-shadow: 0 8px 32px rgba(0, 242, 254, 0.4);
        }

        .wheel-display-btn-primary:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 48px rgba(0, 242, 254, 0.6);
        }

        .wheel-display-btn-primary:active {
          transform: translateY(-2px);
        }

        .wheel-display-btn-secondary {
          background: rgba(30, 30, 60, 0.8);
          color: #ffffff;
          border: 2px solid rgba(79, 172, 254, 0.5);
          box-shadow: 0 8px 32px rgba(79, 172, 254, 0.2);
        }

        .wheel-display-btn-secondary:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 48px rgba(79, 172, 254, 0.4);
          border-color: rgba(79, 172, 254, 0.8);
        }

        /* Wheel Section */
        .wheel-display-wheel-section {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .wheel-section-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .section-badge {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          background: linear-gradient(135deg, #7928ca 0%, #ff0080 100%);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          border-radius: 2rem;
          margin-bottom: 1rem;
          box-shadow: 0 4px 20px rgba(121, 40, 202, 0.4);
        }

        .wheel-display-wheel-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        /* Result View */
        .wheel-display-result-view {
          text-align: center;
          max-width: 900px;
          width: 100%;
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .result-badge {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          color: #0a0a1a;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          border-radius: 2rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
        }

        .wheel-display-winner-announce {
          font-size: 3.5rem;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 2rem;
          text-shadow: 0 0 60px rgba(0, 242, 254, 0.8);
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            text-shadow: 0 0 60px rgba(0, 242, 254, 0.8);
          }
          50% {
            text-shadow: 0 0 80px rgba(0, 242, 254, 1);
          }
        }

        .wheel-display-winner-card {
          background: linear-gradient(135deg, rgba(30, 30, 60, 0.9), rgba(20, 20, 40, 0.9));
          padding: 3rem;
          border-radius: 1.5rem;
          border: 2px solid rgba(0, 242, 254, 0.3);
          backdrop-filter: blur(20px);
          margin-bottom: 2rem;
          box-shadow: 0 20px 60px rgba(0, 242, 254, 0.3);
        }

        .winner-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .wheel-display-winner-name {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #7928ca 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 2rem;
          line-height: 1.1;
          word-break: break-word;
        }

        .wheel-display-winner-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.75rem;
        }

        .detail-label {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
        }

        .detail-value {
          font-size: 1.25rem;
          color: #00f2fe;
          font-weight: 800;
        }

        /* Final Result */
        .wheel-display-final {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wheel-display-final-content {
          text-align: center;
          max-width: 1000px;
          animation: fadeInUp 0.8s ease-out;
        }

        .final-badge {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #1a1a2e;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          border-radius: 2rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 20px rgba(251, 191, 36, 0.4);
        }

        .wheel-display-final-title {
          font-size: 4.5rem;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 3rem;
          text-shadow: 0 0 80px rgba(0, 242, 254, 1);
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .wheel-display-final-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .wheel-display-final-card {
          background: linear-gradient(135deg, rgba(30, 30, 60, 0.9), rgba(20, 20, 40, 0.9));
          padding: 2.5rem;
          border-radius: 1.5rem;
          border: 2px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
        }

        .wheel-display-final-card:hover {
          transform: translateY(-8px);
          border-color: rgba(0, 242, 254, 0.5);
          box-shadow: 0 20px 60px rgba(0, 242, 254, 0.3);
        }

        .final-card-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.5rem;
          color: #00f2fe;
          filter: drop-shadow(0 0 20px rgba(0, 242, 254, 0.6));
        }

        .final-card-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .final-card-product-image {
          width: 200px;
          height: 200px;
          margin: 0 auto 1.5rem;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.5),
            0 0 0 3px rgba(255, 255, 255, 0.2),
            0 0 60px rgba(0, 242, 254, 0.4);
          animation: productImagePulse 2s ease-in-out infinite;
        }

        .final-card-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @keyframes productImagePulse {
          0%, 100% {
            box-shadow: 
              0 10px 40px rgba(0, 0, 0, 0.5),
              0 0 0 3px rgba(255, 255, 255, 0.2),
              0 0 60px rgba(0, 242, 254, 0.4);
          }
          50% {
            box-shadow: 
              0 15px 50px rgba(0, 0, 0, 0.6),
              0 0 0 3px rgba(255, 255, 255, 0.3),
              0 0 80px rgba(121, 40, 202, 0.6),
              0 0 100px rgba(255, 0, 128, 0.3);
          }
        }

        .final-card-value {
          font-size: 2rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.2;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
