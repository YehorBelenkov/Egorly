import { useState, useEffect } from 'react';
import FortuneWheel from '../../components/FortuneWheel';
import styles from './wheel.module.css';

export default function WheelPage() {
  const [users, setUsers] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [frozenUsers, setFrozenUsers] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [step, setStep] = useState('select'); // 'select', 'spin-user', 'spin-prize', 'complete'
  const [loading, setLoading] = useState(true);

  // Fetch users and prizes on mount
  useEffect(() => {
    fetchUsers();
    fetchPrizes();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/wheel/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
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

  // Freeze users when opening wheel (prevent updates during spin)
  const handleOpenWheel = () => {
    if (!frozenUsers && users.length > 0) {
      setFrozenUsers([...users]);
      setStep('spin-user');
      console.log(`🔒 Frozen ${users.length} users for wheel`);
    }
  };

  // Unfreeze and refresh
  const handleRefreshUsers = async () => {
    setFrozenUsers(null);
    setSelectedUser(null);
    setSelectedPrize(null);
    setStep('select');
    await fetchUsers();
    console.log('🔄 Users refreshed');
  };

  // Handle user spin complete
  const handleUserSpinComplete = (winner) => {
    setSelectedUser(winner);
    setStep('spin-prize');
    console.log(`🎉 User Winner: ${winner.label}`);
  };

  // Handle prize spin complete
  const handlePrizeSpinComplete = (winner) => {
    setSelectedPrize(winner);
    setStep('complete');
    console.log(`🎁 Prize Winner: ${winner.label}`);
  };

  const displayUsers = frozenUsers || users;
  
  // Convert users to wheel segments with WEIGHTED SEGMENTS based on gift count
  const userSegments = displayUsers.map(user => ({
    id: user.id,
    label: user.username,
    weight: user.giftCount || 1, // Higher gift count = bigger segment
    color: undefined // Will use default gradients
  }));

  // Convert prizes to wheel segments (equal weight)
  const prizeSegments = prizes.map(prize => ({
    id: prize.id,
    label: prize.label,
    weight: 1,
    color: undefined,
    productImage: prize.productImage || null,
    type: prize.type
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎡 Fortune Wheel</h1>
        <p>
          {step === 'select' && `Top ${displayUsers.length} Gift Senders`}
          {step === 'spin-user' && 'Spin to Select Winner'}
          {step === 'spin-prize' && `Spin for ${selectedUser?.label}'s Prize`}
          {step === 'complete' && 'Winner Selected!'}
        </p>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Users</span>
          <span className={styles.statValue}>{displayUsers.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Prizes</span>
          <span className={styles.statValue}>{prizes.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Status</span>
          <span className={styles.statValue}>
            {frozenUsers ? '🔒 Frozen' : '🔄 Live'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading users...</p>
        </div>
      ) : displayUsers.length === 0 ? (
        <div className={styles.empty}>
          <p>📭 No gift senders yet</p>
          <p>Connect to a TikTok live stream to collect users</p>
        </div>
      ) : (
        <>
          <div className={styles.controls}>
            {step === 'select' && (
              <button 
                onClick={handleOpenWheel}
                className={styles.btnPrimary}
              >
                🎯 Open Wheel (Freeze {users.length} Users)
              </button>
            )}
            {step === 'complete' && (
              <button 
                onClick={handleRefreshUsers}
                className={styles.btnSecondary}
              >
                🔄 Close Wheel & Refresh Users
              </button>
            )}
          </div>

          {step === 'spin-user' && (
            <div className={styles.wheelContainer}>
              <h2 className={styles.wheelTitle}>🎰 Spin for User Winner</h2>
              <FortuneWheel 
                segments={userSegments}
                onSpinComplete={handleUserSpinComplete}
                size={600}
                isPrizeWheel={false}
              />
              <div className={styles.weightInfo}>
                <p>💡 Users with more gifts have bigger segments!</p>
              </div>
            </div>
          )}

          {step === 'spin-prize' && selectedUser && (
            <div className={styles.wheelContainer}>
              <h2 className={styles.wheelTitle}>🎁 Spin for {selectedUser.label}'s Prize</h2>
              <FortuneWheel 
                segments={prizeSegments}
                onSpinComplete={handlePrizeSpinComplete}
                size={600}
                isPrizeWheel={true}
              />
            </div>
          )}

          {step === 'complete' && selectedUser && selectedPrize && (
            <div className={styles.winner}>
              <h2>🎉 Congratulations!</h2>
              <div className={styles.winnerCard}>
                <div className={styles.winnerUser}>
                  <span className={styles.label}>Winner:</span>
                  <span className={styles.username}>@{selectedUser.label}</span>
                </div>
                <div className={styles.winnerPrize}>
                  <span className={styles.label}>Prize:</span>
                  <span className={styles.prize}>{selectedPrize.label}</span>
                </div>
              </div>
            </div>
          )}

          {step === 'select' && (
            <div className={styles.instructions}>
              <h3>📋 How It Works</h3>
              <ol>
                <li>Click "Open Wheel" to freeze the current top {users.length} gift senders</li>
                <li><strong>First Spin:</strong> Select the winning user (weighted by gifts!)</li>
                <li><strong>Second Spin:</strong> Select their prize from available rewards</li>
                <li>Users with more gifts have bigger wheel segments = better chance!</li>
                <li>When done, click "Close Wheel & Refresh" to get the latest users</li>
              </ol>
            </div>
          )}
        </>
      )}

      <div className={styles.settingsLink}>
        <a href="/wheel/settings" className={styles.linkBtn}>
          ⚙️ Configure Prizes
        </a>
      </div>
    </div>
  );
}
