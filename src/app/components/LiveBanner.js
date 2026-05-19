import { useState, useEffect } from 'react';
import './LiveBanner.css';

export default function LiveBanner() {
  const [isLive, setIsLive] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(20);

  useEffect(() => {
    const fetchDiscountStatus = async () => {
      try {
        const res = await fetch('/api/discount-toggle');
        if (res.ok) {
          const data = await res.json();
          setIsLive(data.enabled || false);
          setDiscountPercentage(data.percentage || 20);
        }
      } catch (err) {
        console.error('Failed to fetch discount status:', err);
      }
    };

    fetchDiscountStatus();
    
    // Poll every 5 seconds to check if admin toggled it
    const interval = setInterval(fetchDiscountStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (!isLive) return null;

  return (
    <div className="global_live_banner">
      <div className="global_live_pulse"></div>
      <span className="global_live_text">🔴 LIVE NOW - {discountPercentage}% OFF EVERYTHING!</span>
    </div>
  );
}
