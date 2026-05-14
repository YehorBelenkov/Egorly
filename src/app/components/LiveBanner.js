import { useState, useEffect } from 'react';
import { getIsLive } from '../../lib/liveStatus';
import './LiveBanner.css';

export default function LiveBanner() {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    setIsLive(getIsLive());
  }, []);

  if (!isLive) return null;

  return (
    <div className="global_live_banner">
      <div className="global_live_pulse"></div>
      <span className="global_live_text">🔴 LIVE NOW - 20% OFF EVERYTHING!</span>
    </div>
  );
}
