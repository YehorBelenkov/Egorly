'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import './FortuneWheel.css';

interface WheelSegment {
  id: number | string;
  label: string;
  color?: string;
  weight?: number; // For weighted wheel segments (based on gift count)
  productImage?: string | null;
  type?: string;
}

interface FortuneWheelProps {
  segments: WheelSegment[];
  onSpinComplete?: (winner: WheelSegment) => void;
  size?: number;
  isPrizeWheel?: boolean;
  autoSpin?: boolean; // Auto-spin when component mounts
}

export default function FortuneWheel({ segments, onSpinComplete, size = 740, isPrizeWheel = false, autoSpin = false }: FortuneWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<WheelSegment | null>(null);
  const [currentSegment, setCurrentSegment] = useState<WheelSegment | null>(null);
  const wheelRef = useRef<SVGGElement>(null);
  const currentRotation = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasAutoSpun = useRef(false);

  // Auto-spin when component mounts (disabled for user wheel)
  useEffect(() => {
    if (autoSpin && !hasAutoSpun.current && segments.length > 0 && isPrizeWheel) {
      hasAutoSpun.current = true;
      // Small delay to ensure component is fully rendered
      setTimeout(() => {
        spinWheel();
      }, 500);
    }
  }, [autoSpin, segments, isPrizeWheel]);

  // Create tick sound using Web Audio API
  const playTickSound = () => {
    if (typeof window === 'undefined') return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  };

  // Create celebratory crowd cheer sound
  const playCelebrationSound = () => {
    if (typeof window === 'undefined') return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    // Create multiple oscillators for a rich celebration sound
    const frequencies = [400, 600, 800, 1000, 1200];
    
    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const delay = index * 0.05; // Stagger the sounds slightly
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      // Create an ascending pitch sweep for excitement
      oscillator.frequency.setValueAtTime(freq * 0.8, now + delay);
      oscillator.frequency.exponentialRampToValueAtTime(freq * 1.5, now + delay + 0.3);
      
      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(0.15, now + delay + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.8);
      
      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.8);
    });
    
    // Add a "yay" vocal-like sound using filtered noise
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1500;
    noiseFilter.Q.value = 10;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noiseSource.start(now);
    noiseSource.stop(now + 0.5);
  };

  // Reset wheel state when segments change
  useEffect(() => {
    currentRotation.current = 0;
    setWinner(null);
    if (wheelRef.current) {
      gsap.set(wheelRef.current, { rotation: 0 });
    }
  }, [segments.length]);

  // Generate wheel segment paths based on actual number of segments
  // Support weighted segments for better chances
  const segmentCount = segments.length;
  
  // Calculate angles based on weights
  const totalWeight = segments.reduce((sum, seg) => sum + (seg.weight || 1), 0);
  const segmentAngles = segments.map(seg => ((seg.weight || 1) / totalWeight) * 360);
  
  // Create cumulative angles for positioning
  const cumulativeAngles = segmentAngles.reduce((acc, angle) => {
    acc.push((acc[acc.length - 1] || 0) + angle);
    return acc;
  }, [] as number[]);

  const generateSegmentPath = (index: number) => {
    const startAngle = index === 0 ? 0 : cumulativeAngles[index - 1];
    const endAngle = cumulativeAngles[index];
    const outerRadius = 873;
    const innerRadius = 500; // Wider segments for better text display

    const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
    
    const x1 = outerRadius * Math.cos(toRad(startAngle));
    const y1 = outerRadius * Math.sin(toRad(startAngle));
    const x2 = outerRadius * Math.cos(toRad(endAngle));
    const y2 = outerRadius * Math.sin(toRad(endAngle));
    const x3 = innerRadius * Math.cos(toRad(endAngle));
    const y3 = innerRadius * Math.sin(toRad(endAngle));
    const x4 = innerRadius * Math.cos(toRad(startAngle));
    const y4 = innerRadius * Math.sin(toRad(startAngle));

    return `M${x1},${y1}A${outerRadius},${outerRadius},0,0,1,${x2},${y2}L${x3},${y3}A${innerRadius},${innerRadius},0,0,0,${x4},${y4}Z`;
  };

  const generateTextPath = (index: number, radius: number, id: string) => {
    const startAngle = index === 0 ? 0 : cumulativeAngles[index - 1];
    const endAngle = cumulativeAngles[index];
    
    const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
    
    const x1 = radius * Math.cos(toRad(startAngle));
    const y1 = radius * Math.sin(toRad(startAngle));
    const x2 = radius * Math.cos(toRad(endAngle));
    const y2 = radius * Math.sin(toRad(endAngle));

    return {
      path: `M${x1},${y1}A${radius},${radius},0,0,1,${x2},${y2}`,
      id: `${id}_${index}`
    };
  };

  const spinWheel = () => {
    if (isSpinning || segments.length === 0 || !wheelRef.current) {
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    // Reset rotation to 0 before each spin
    gsap.set(wheelRef.current, { rotation: 0 });
    currentRotation.current = 0;

    const winnerIndex = Math.floor(Math.random() * segmentCount);
    const selectedWinner = segments[winnerIndex];

    // Optimized spin parameters for smooth performance with 100 users
    const spins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations (smoother)
    const duration = 6 + Math.random() * 2; // 6-8 seconds (faster, less lag)
    
    // Use power4.out for smoothest deceleration
    const randomEasing = "power4.out";
    
    // Calculate rotation to align a RANDOM POINT within the winning segment with the arrow
    // This makes it look more natural and less scripted
    const winnerStartAngle = winnerIndex === 0 ? 0 : cumulativeAngles[winnerIndex - 1];
    const winnerEndAngle = cumulativeAngles[winnerIndex];
    const segmentSize = winnerEndAngle - winnerStartAngle;
    
    // Random position within the segment (0 = left edge, 1 = right edge, 0.5 = center)
    // Using a slight bias towards center (0.3 to 0.7) but still random
    const randomOffset = 0.2 + (Math.random() * 0.6); // Favors middle-ish but not always centered
    const targetAngle = (360 * spins) - (winnerStartAngle + (segmentSize * randomOffset));

    // Throttled tick sounds for better performance
    let lastRotation = 0;
    let lastTickTime = 0;
    let lastSegmentIndex = -1;
    const tickThreshold = 20; // Play tick every 20 degrees (less frequent)
    const tickTimeThreshold = 50; // Minimum 50ms between ticks (throttle)
    
    gsap.to(wheelRef.current, {
      rotation: targetAngle,
      duration: duration,
      ease: randomEasing,
      transformOrigin: "50% 50%",
      force3D: true, // GPU acceleration
      onUpdate: function() {
        if (!wheelRef.current) return;
        
        const now = Date.now();
        const currentRot = gsap.getProperty(wheelRef.current, 'rotation') as number;
        const rotationDiff = Math.abs(currentRot - lastRotation);
        
        // Calculate which segment is currently at the top (arrow points down at 0 degrees)
        // The arrow is at the top, so we need to find which segment is at 0 degrees
        const normalizedAngle = ((360 - (currentRot % 360)) + 360) % 360;
        
        // Find which segment this angle falls into
        let currentIndex = 0;
        for (let i = 0; i < cumulativeAngles.length; i++) {
          if (normalizedAngle <= cumulativeAngles[i]) {
            currentIndex = i;
            break;
          }
        }
        
        // Always update current segment display (no throttling for visual updates)
        if (currentIndex !== lastSegmentIndex) {
          setCurrentSegment(segments[currentIndex]);
          lastSegmentIndex = currentIndex;
        }
        
        // Play tick sound (throttled for performance)
        if (rotationDiff >= tickThreshold && (now - lastTickTime) >= tickTimeThreshold) {
          playTickSound();
          lastRotation = currentRot;
          lastTickTime = now;
        }
      },
      onComplete: () => {
        currentRotation.current = targetAngle;
        // Set current segment to winner before stopping spin (ensures correct display)
        setCurrentSegment(selectedWinner);
        setWinner(selectedWinner);
        
        // Small delay to show the final winner in current segment display before hiding it
        setTimeout(() => {
          setCurrentSegment(null);
          setIsSpinning(false);
        }, 500);

        // Play celebration sound when winner is selected
        playCelebrationSound();

        if (onSpinComplete) {
          setTimeout(() => {
            onSpinComplete(selectedWinner);
          }, 500);
        }
      }
    });
  };

  return (
    <div className="fortune-wheel-container">
      {/* Current Segment Display Above Wheel */}
      {isSpinning && currentSegment && (
        <div className="wheel-current-segment-display">
          <div className="current-segment-label">
            {isPrizeWheel ? '🎁 Current Prize:' : '👤 Current User:'}
          </div>
          <div className="current-segment-name">
            {currentSegment.label}
          </div>
        </div>
      )}

      <div className="fortune-wheel-wrapper" style={{ width: size, height: size }}>
        {/* Animated LED Lights Ring */}
        <div className="led-ring">
          {Array.from({ length: 48 }).map((_, i) => (
            <div 
              key={i} 
              className="led-light" 
              style={{ 
                transform: `rotate(${i * 7.5}deg) translateY(-${size / 2 + 20}px)`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

        {/* Winner Pointer Arrow at Top - Professional Casino Style */}
        <div className="wheel-arrow" style={{ top: '-120px' }}>
          <div className="wheel-arrow-inner">
            <div className="wheel-arrow-label">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                      fill="currentColor" stroke="currentColor" strokeWidth="1"/>
              </svg>
              WINNER
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '8px' }}>
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                      fill="currentColor" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </div>
            <svg width="80" height="80" viewBox="0 0 80 80" className="wheel-arrow-svg">
              <defs>
                <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" />
                  <stop offset="50%" stopColor="#7928ca" />
                  <stop offset="100%" stopColor="#ff0080" />
                </linearGradient>
                <filter id="arrowGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <polygon 
                points="40,65 10,15 40,28 70,15" 
                fill="url(#arrowGradient)"
                stroke="#fff"
                strokeWidth="3"
                strokeLinejoin="round"
                filter="url(#arrowGlow)"
              />
            </svg>
          </div>
        </div>

        {/* Wheel SVG */}
        <svg viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg" className="wheel-svg">
          <defs>
            {/* Gradient definitions for wheel segments */}
            {/* Neon Casino Gradients */}
            <linearGradient id="gradient-0" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#4facfe" />
            </linearGradient>
            <linearGradient id="gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7928ca" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff0080" />
              <stop offset="100%" stopColor="#ff4d94" />
            </linearGradient>
            <linearGradient id="gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
            <linearGradient id="gradient-4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d2ff" />
              <stop offset="100%" stopColor="#3a7bd5" />
            </linearGradient>
            <linearGradient id="gradient-5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e233ff" />
              <stop offset="100%" stopColor="#ff6b9d" />
            </linearGradient>
            
            {/* Outer Ring Glow */}
            <filter id="outerGlow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Segment Glow */}
            <filter id="segmentGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Decorative Outer Rings - Casino Style */}
          <circle cx="1000" cy="1000" r="920" fill="none" stroke="url(#gradient-0)" strokeWidth="6" opacity="0.3" filter="url(#outerGlow)" />
          <circle cx="1000" cy="1000" r="900" fill="none" stroke="url(#gradient-1)" strokeWidth="4" opacity="0.5" />
          <circle cx="1000" cy="1000" r="880" fill="none" stroke="url(#gradient-2)" strokeWidth="2" opacity="0.4" className="pulse-ring" />
          
          {/* Main Outer Ring */}
          <mask id="path-1-inside-1_9_42" fill="white">
            <path d="M1922 1005C1922 1514.21 1509.21 1927 1000 1927C490.793 1927 78 1514.21 78 1005C78 495.793 490.793 83 1000 83C1509.21 83 1922 495.793 1922 1005ZM471.592 1005C471.592 1296.83 708.168 1533.41 1000 1533.41C1291.83 1533.41 1528.41 1296.83 1528.41 1005C1528.41 713.168 1291.83 476.592 1000 476.592C708.168 476.592 471.592 713.168 471.592 1005Z" />
          </mask>
          <path
            d="M1922 1005C1922 1514.21 1509.21 1927 1000 1927C490.793 1927 78 1514.21 78 1005C78 495.793 490.793 83 1000 83C1509.21 83 1922 495.793 1922 1005ZM471.592 1005C471.592 1296.83 708.168 1533.41 1000 1533.41C1291.83 1533.41 1528.41 1296.83 1528.41 1005C1528.41 713.168 1291.83 476.592 1000 476.592C708.168 476.592 471.592 713.168 471.592 1005Z"
            fill="rgba(15, 12, 41, 0.8)"
            stroke="url(#gradient-0)"
            strokeWidth="12"
            mask="url(#path-1-inside-1_9_42)"
            filter="url(#outerGlow)"
          />

          {/* Rotating Wheel Group */}
          <g ref={wheelRef} transform="translate(1000, 1000)" className="wheel-rotating-group">
            {/* Wheel Segments */}
            {segments.slice(0, segmentCount).map((segment, idx) => {
              const colorIndex = idx % 6;
              
              return (
                <path
                  key={`segment-${idx}`}
                  d={generateSegmentPath(idx)}
                  fill={`url(#gradient-${colorIndex})`}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="3"
                  filter="url(#segmentGlow)"
                  opacity="0.95"
                  className="wheel-segment"
                />
              );
            })}

            {/* Text Labels - Truncated and optimized for 100 segments */}
            {segments.slice(0, segmentCount).map((segment, idx) => {
              const startAngle = idx === 0 ? 0 : cumulativeAngles[idx - 1];
              const endAngle = cumulativeAngles[idx];
              const angle = ((startAngle + endAngle) / 2) - 90;
              const segmentAngle = endAngle - startAngle;
              const radius = 686;
              
              let labelText = segment.label || '';
              
              // Prize wheel: keep current perfect settings (short text)
              // User wheel: allow much longer text to show full usernames
              const maxLength = isPrizeWheel 
                ? (segmentAngle < 5 ? 14 : segmentAngle < 10 ? 16 : segmentAngle < 20 ? 18 : segmentAngle < 40 ? 10 : 32)
                : (segmentAngle < 5 ? 44 : segmentAngle < 10 ? 6 : segmentAngle < 20 ? 8 : segmentAngle < 40 ? 10 : 12);
              
              if (labelText.length > maxLength) {
                labelText = labelText.substring(0, maxLength - 1) + '…';
              }
              
              const fontSize = segmentAngle < 5 ? 28 : segmentAngle < 10 ? 36 : segmentAngle < 20 ? 45 : 55;
              const strokeWidth = 2;
              
              return (
                <g key={`title-${idx}`} transform={`rotate(${angle})`}>
                  <text
                    x={radius}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={fontSize}
                    fontWeight="800"
                    stroke="#000000"
                    strokeWidth={strokeWidth}
                    paintOrder="stroke"
                  >
                    {labelText}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Center Button - Casino Style */}
          <g onClick={spinWheel} style={{ cursor: isSpinning ? 'not-allowed' : 'pointer' }} opacity={isSpinning ? 0.6 : 1} className="center-button-group">
            {/* Outer glow ring */}
            <circle cx="1000" cy="1000" r="110" fill="none" stroke="url(#gradient-0)" strokeWidth="4" opacity="0.5" className="button-glow-ring" />
            
            {/* Main button circle with gradient */}
            <circle cx="1000" cy="1000" r="95" fill="url(#gradient-1)" opacity="0.3" />
            <circle cx="1000" cy="1000" r="90" fill="rgba(15, 12, 41, 0.95)" stroke="url(#gradient-2)" strokeWidth="5" filter="url(#outerGlow)" />
            
            {/* Inner decorative ring */}
            <circle cx="1000" cy="1000" r="75" fill="none" stroke="url(#gradient-0)" strokeWidth="2" opacity="0.4" />
            
            {/* SPIN text with professional styling */}
            <text x="1000" y="1015" fontSize="52" fill="url(#gradient-0)" textAnchor="middle" fontWeight="900" letterSpacing="3">
              SPIN
            </text>
          </g>
        </svg>

        {/* Winner Display - Professional Casino Style */}
        {winner && !isSpinning && (
          <div className="wheel-winner-display" style={{ top: `${size + 220}px` }}>
            <div className="wheel-winner-card">
              {winner.productImage && (
                <div className="winner-product-image">
                  <img src={winner.productImage} alt={winner.label} />
                </div>
              )}
              <div className="winner-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                        fill="#00f2fe" stroke="#fff" strokeWidth="1"/>
                </svg>
              </div>
              <h3 className="wheel-winner-title">{isPrizeWheel ? 'PRIZE WON' : 'WINNER'}</h3>
              <div className="wheel-winner-divider"></div>
              <p className="wheel-winner-name">{winner.label || 'Winner'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
