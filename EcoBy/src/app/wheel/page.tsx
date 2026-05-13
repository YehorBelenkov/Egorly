'use client';

import { useState, useEffect, useRef } from 'react';
import FortuneWheel from '@/components/FortuneWheel';
import { TikTokUser, Prize } from '@/types';
import './page.css';

export default function WheelPage() {
  const [users, setUsers] = useState<TikTokUser[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedUser, setSelectedUser] = useState<TikTokUser | null>(null);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [showPrizeWheel, setShowPrizeWheel] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const celebrationSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchData();
    // Initialize sound effects
    winSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzWJ0fPTgjMGHm7A7+OZUQ0PVqzn77BfGAg+ldryxnMpBSuBzvLZizYIG2S37OihUgwLTKXh8bllHAc2jdXzyn0sBS2CzfLajjYIG2e77eWhUgwLTKXh8bdkGwc4j9bzyn8rBSyBzvLajDUIF2e67OWgUAwLTKXh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfUAwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfUAwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjGwc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjGwc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIEA==');
    celebrationSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzWJ0fPTgjMGHm7A7+OZUQ0PVqzn77BfGAg+ldryxnMpBSuBzvLZizYIG2S37OihUgwLTKXh8bllHAc2jdXzyn0sBS2CzfLajjYIG2e77eWhUgwLTKXh8bdkGwc4j9bzyn8rBSyBzvLajDUIF2e67OWgUAwLTKXh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfUAwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfUAwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjHAc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjGwc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8bZjGwc2jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLajjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIF2a57OWfTwwKTKTh8rZjGwc1jdXzyn0rBSuBzvLbjjUIEA==');
  }, []);

  const createConfetti = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4'];
    const confettiCount = 150;
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      container.appendChild(confetti);
    }

    setTimeout(() => {
      container.remove();
    }, 5000);
  };

  const fetchData = async () => {
    try {
      const [usersRes, prizesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/prizes')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (prizesRes.ok) {
        const prizesData = await prizesRes.json();
        setPrizes(prizesData.filter((p: Prize) => p.isActive));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserWheelComplete = (winner: any) => {
    const user = users.find(u => u.id === parseInt(winner.id));
    if (user) {
      setSelectedUser(user);
      setShowWinnerModal(true);
      createConfetti();
      
      // Play win sound
      if (winSoundRef.current) {
        winSoundRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
    }
  };

  const handleRollForPrize = () => {
    setShowWinnerModal(false);
    setShowPrizeWheel(true);
  };

  const handlePrizeWheelComplete = async (winner: any) => {
    const prize = prizes.find(p => p.id === parseInt(winner.id));
    if (prize && selectedUser) {
      setSelectedPrize(prize);
      setShowPrizeModal(true);
      createConfetti();

      // Play celebration sound
      if (celebrationSoundRef.current) {
        celebrationSoundRef.current.play().catch(e => console.log('Audio play failed:', e));
      }

      // Record winner in database and remove user from pool
      try {
        await fetch('/api/winners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUser.id,
            prizeId: prize.id
          })
        });

        // Remove the winner from users table (they'll be re-added when they interact again)
        await fetch(`/api/users?id=${selectedUser.id}`, {
          method: 'DELETE'
        });

        console.log(`✅ ${selectedUser.username} won and was removed from the pool`);
      } catch (error) {
        console.error('Error recording winner:', error);
      }
    }
  };

  const resetWheels = () => {
    setSelectedUser(null);
    setSelectedPrize(null);
    setShowPrizeWheel(false);
    setShowWinnerModal(false);
    setShowPrizeModal(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="wheel-page-container">
        <div className="bg"></div>
        <div className="star-field">
          <div className="layer"></div>
          <div className="layer"></div>
          <div className="layer"></div>
        </div>
        <div className="wheel-page-content">
          <div className="text-white text-2xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="wheel-page-container">
        <div className="bg"></div>
        <div className="star-field">
          <div className="layer"></div>
          <div className="layer"></div>
          <div className="layer"></div>
        </div>
        <div className="wheel-page-content">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">No Users Yet</h2>
          <p className="text-gray-600 mb-6">
            Start your TikTok live stream and run the scraper to collect active viewers!
          </p>
          <a
            href="/admin"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            Go to Admin Panel
          </a>
        </div>
        </div>
      </div>
    );
  }

  const userSegments = users.map(user => ({
    id: user.id,
    label: user.username,
    color: ''
  }));

  const prizeSegments = prizes.map(prize => ({
    id: prize.id,
    label: prize.name,
    color: prize.type === 'money' ? '#10B981' : prize.type === 'product' ? '#F59E0B' : '#8B5CF6'
  }));

  return (
    <div className="wheel-page-container">
      <div className="bg"></div>
      <div className="star-field">
        <div className="layer"></div>
        <div className="layer"></div>
        <div className="layer"></div>
      </div>
      <div className="wheel-page-content">
        {!showPrizeWheel ? (
          // User Selection Wheel
          <FortuneWheel
            key="user-wheel"
            segments={userSegments}
            onSpinComplete={handleUserWheelComplete}
            size={1100}
          />
        ) : (
          // Prize Selection Wheel
          <FortuneWheel
            key="prize-wheel"
            segments={prizeSegments}
            onSpinComplete={handlePrizeWheelComplete}
            size={1100}
            isPrizeWheel={true}
          />
        )}
      </div>

      {/* Winner Modal */}
      {showWinnerModal && selectedUser && (
        <div className="celebration-modal">
          <div className="celebration-content">
            <div className="celebration-icon">🎉</div>
            <h2 className="celebration-title">Winner Selected!</h2>
            <div className="winner-name">{selectedUser.username}</div>
            <p className="celebration-subtitle">Congratulations! Let's roll for a prize!</p>
            <button 
              onClick={handleRollForPrize}
              className="roll-prize-button"
            >
              🎁 Roll for Prize
            </button>
          </div>
        </div>
      )}

      {/* Prize Winner Modal */}
      {showPrizeModal && selectedPrize && selectedUser && (
        <div className="celebration-modal">
          <div className="celebration-content">
            <div className="celebration-icon">🏆</div>
            <h2 className="celebration-title">Prize Won!</h2>
            <div className="winner-name">{selectedUser.username}</div>
            <div className="prize-name">Won: {selectedPrize.name}</div>
            <div className="prize-value">Value: {selectedPrize.value}</div>
            <a 
              href="/"
              className="roll-prize-button"
            >
              ✅ Finish
            </a>
          </div>
        </div>
      )}

      {/* Back to home link */}
      <a href="/" className="wheel-back-button">
        ← Back to Home
      </a>
    </div>
  );
}
