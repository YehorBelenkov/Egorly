import { useState, useEffect } from 'react';
import { getGuestData, getDaysRemaining } from '../../lib/guestUser';
import './GuestNotice.css';

const GuestNotice = ({ guestId, onRegister }) => {
  const [daysRemaining, setDaysRemaining] = useState(30);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchGuestData = async () => {
      try {
        const guestData = await getGuestData(guestId);
        if (guestData) {
          setDaysRemaining(getDaysRemaining(guestData));
        }
      } catch (error) {
        console.error('Error fetching guest data:', error);
      }
    };

    if (guestId) {
      fetchGuestData();
    }
  }, [guestId]);

  if (!isVisible) return null;

  const urgencyLevel = daysRemaining <= 7 ? 'urgent' : daysRemaining <= 14 ? 'warning' : 'info';

  return (
    <div className={`guest-notice ${urgencyLevel}`}>
      <div className="guest-notice-content">
        <div className="guest-notice-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
          </svg>
        </div>
        <div className="guest-notice-text">
          <h3>You're Shopping as a Guest</h3>
          <p>
            Your cart and order data will be deleted in <strong>{daysRemaining} days</strong> unless you create an account.
            {daysRemaining <= 7 && ' Act now to save your information!'}
          </p>
        </div>
        <div className="guest-notice-actions">
          <button 
            className="guest-notice-btn primary"
            onClick={() => window.location.href = '/register'}
          >
            Create Account
          </button>
          <button 
            className="guest-notice-btn secondary"
            onClick={() => setIsVisible(false)}
          >
            Dismiss
          </button>
        </div>
      </div>
      <button 
        className="guest-notice-close"
        onClick={() => setIsVisible(false)}
        aria-label="Close notice"
      >
        ×
      </button>
    </div>
  );
};

export default GuestNotice;
