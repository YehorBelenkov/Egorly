'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import './FortuneWheel.css';

interface WheelSegment {
  id: number | string;
  label: string;
  color?: string;
}

interface FortuneWheelProps {
  segments: WheelSegment[];
  onSpinComplete?: (winner: WheelSegment) => void;
  size?: number;
  isPrizeWheel?: boolean;
}

export default function FortuneWheel({ segments, onSpinComplete, size = 740, isPrizeWheel = false }: FortuneWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<WheelSegment | null>(null);
  const wheelRef = useRef<SVGGElement>(null);
  const currentRotation = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

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
  const segmentCount = segments.length;
  const segmentAngle = 360 / segmentCount;

  const generateSegmentPath = (index: number) => {
    const startAngle = index * segmentAngle;
    const endAngle = (index + 1) * segmentAngle;
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
    const startAngle = index * segmentAngle;
    const endAngle = (index + 1) * segmentAngle;
    
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

    // More varied spin parameters for excitement
    const spins = 12 + Math.floor(Math.random() * 10); // 12-21 full rotations for high speed
    const duration = 10 + Math.random() * 5; // 10-15 seconds for suspense
    
    // Random easing for variety
    const easings = ["power4.out", "power3.out", "circ.out", "expo.out"];
    const randomEasing = easings[Math.floor(Math.random() * easings.length)];
    
    // Calculate rotation to align the CENTER of the winning segment with the arrow at the top
    // Negative rotation brings the segment to the top position
    const segmentCenterOffset = segmentAngle / 2;
    const targetAngle = (360 * spins) - (winnerIndex * segmentAngle + segmentCenterOffset);

    // Play tick sounds based on rotation speed
    let lastRotation = 0;
    const tickThreshold = segmentAngle / 2; // Play tick every half segment
    
    gsap.to(wheelRef.current, {
      rotation: targetAngle,
      duration: duration,
      ease: randomEasing,
      transformOrigin: "50% 50%",
      onUpdate: function() {
        if (!wheelRef.current) return;
        
        // Get current rotation from GSAP
        const currentRot = gsap.getProperty(wheelRef.current, 'rotation') as number;
        const rotationDiff = Math.abs(currentRot - lastRotation);
        
        // Play tick sound when we've rotated past the threshold
        if (rotationDiff >= tickThreshold) {
          playTickSound();
          lastRotation = currentRot;
        }
      },
      onComplete: () => {
        currentRotation.current = targetAngle;
        setWinner(selectedWinner);
        setIsSpinning(false);

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
      <div className="fortune-wheel-wrapper" style={{ width: size, height: size }}>
        {/* Winner Pointer Arrow at Top - Centered */}
        <div className="wheel-arrow" style={{ top: '-100px' }}>
          <div className="wheel-arrow-inner">
            <div className="wheel-arrow-label">
              🏆 WINNER 🏆
            </div>
            <svg width="70" height="70" viewBox="0 0 70 70" className="wheel-arrow-svg">
              <defs>
                <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#FFA500" />
                  <stop offset="100%" stopColor="#FF8C00" />
                </linearGradient>
                <filter id="arrowGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <polygon 
                points="35,60 12,15 35,25 58,15" 
                fill="url(#arrowGradient)"
                stroke="#FFF"
                strokeWidth="2.5"
                strokeLinejoin="round"
                filter="url(#arrowGlow)"
              />
            </svg>
          </div>
        </div>

        {/* Wheel SVG */}
        <svg viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg" className="wheel-svg">
          {/* Outer Ring */}
          <mask id="path-1-inside-1_9_42" fill="white">
            <path d="M1922 1005C1922 1514.21 1509.21 1927 1000 1927C490.793 1927 78 1514.21 78 1005C78 495.793 490.793 83 1000 83C1509.21 83 1922 495.793 1922 1005ZM471.592 1005C471.592 1296.83 708.168 1533.41 1000 1533.41C1291.83 1533.41 1528.41 1296.83 1528.41 1005C1528.41 713.168 1291.83 476.592 1000 476.592C708.168 476.592 471.592 713.168 471.592 1005Z" />
          </mask>
          <path
            d="M1922 1005C1922 1514.21 1509.21 1927 1000 1927C490.793 1927 78 1514.21 78 1005C78 495.793 490.793 83 1000 83C1509.21 83 1922 495.793 1922 1005ZM471.592 1005C471.592 1296.83 708.168 1533.41 1000 1533.41C1291.83 1533.41 1528.41 1296.83 1528.41 1005C1528.41 713.168 1291.83 476.592 1000 476.592C708.168 476.592 471.592 713.168 471.592 1005Z"
            fill="#272b35e8"
            stroke="#3d445291"
            strokeWidth="13"
            mask="url(#path-1-inside-1_9_42)"
          />

          {/* Rotating Wheel Group */}
          <g ref={wheelRef} transform="translate(1000, 1000)">
            {/* Wheel Segments */}
            {segments.slice(0, segmentCount).map((segment, idx) => (
              <path
                key={`segment-${idx}`}
                d={generateSegmentPath(idx)}
                fill="#343a46c2"
                stroke="#444c59c2"
                strokeWidth="6"
              />
            ))}

            {/* Text Labels - Horizontal for prizes, Vertical for users */}
            {segments.slice(0, segmentCount).map((segment, idx) => {
              const angle = (idx * segmentAngle + segmentAngle / 2) - 90;
              const radius = 686; // Position in middle of segment
              const textLength = segment.label.length;
              const fontSize = textLength > 12 ? 24 : textLength > 8 ? 28 : 32;
              
              return (
                <g key={`title-${idx}`} transform={`rotate(${angle})`}>
                  <text
                    x={radius}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={fontSize}
                    fontWeight="600"
                    transform={isPrizeWheel ? `rotate(90, ${radius}, 0)` : undefined}
                  >
                    {segment.label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Center Button */}
          <g onClick={spinWheel} style={{ cursor: isSpinning ? 'not-allowed' : 'pointer' }} opacity={isSpinning ? 0.5 : 1}>
            <circle cx="1000" cy="1000" r="80" fill="#1f232e" stroke="#444c59" strokeWidth="4" />
            <text x="1000" y="1020" fontSize="48" fill="#fff" textAnchor="middle" fontWeight="bold">
              SPIN
            </text>
          </g>
        </svg>

        {/* Winner Display - Below Button */}
        {winner && !isSpinning && (
          <div className="wheel-winner-display" style={{ top: `${size + 110}px` }}>
            <div className="wheel-winner-card">
              <h3 className="wheel-winner-title">🎉 WINNER! 🎉</h3>
              <p className="wheel-winner-name">{winner.label}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
