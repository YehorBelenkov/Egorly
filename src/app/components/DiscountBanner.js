import { useState, useEffect } from 'react';
import './DiscountBanner.css';

export default function DiscountBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [percentage, setPercentage] = useState(20);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('discountBannerDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Fetch discount status
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/discount-toggle');
        if (res.ok) {
          const data = await res.json();
          setIsVisible(data.enabled || false);
          setPercentage(data.percentage || 20);
        }
      } catch (err) {
        console.error('Failed to fetch discount status:', err);
      }
    };

    fetchStatus();
    
    // Poll every 10 seconds to check if admin toggled it
    const interval = setInterval(fetchStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('discountBannerDismissed', 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="discount-banner">
      <div className="discount-banner-content">
        <div className="discount-banner-icon">🎉</div>
        <div className="discount-banner-text">
          <span className="discount-banner-highlight">{percentage}% OFF</span>
          <span className="discount-banner-message">Sitewide Sale - Limited Time Only!</span>
        </div>
        <button 
          className="discount-banner-close" 
          onClick={handleDismiss}
          aria-label="Close banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
