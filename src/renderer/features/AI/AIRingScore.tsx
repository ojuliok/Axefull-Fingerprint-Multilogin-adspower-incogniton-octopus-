import React from 'react';

interface AIRingScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const AIRingScore: React.FC<AIRingScoreProps> = ({
  score,
  size = 100,
  strokeWidth = 8
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Cap score between 0 and 100
  const validScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (validScore / 100) * circumference;

  let color = '#3b82f6'; // Blue for cold/new
  if (validScore >= 80) color = '#10b981'; // Emerald for highly trusted
  else if (validScore >= 50) color = '#f59e0b'; // Amber for warming up
  else if (validScore >= 20) color = '#8b5cf6'; // Violet for intermediate

  return (
    <div 
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} 
      title={`AI Trust Score: ${validScore}%`}
    >
      <svg 
        viewBox={`0 0 ${size} ${size}`} 
        style={{
          transform: 'rotate(-90deg)',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <defs>
          <linearGradient id="aiGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}80`} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
            filter: `drop-shadow(0 0 4px ${color}80)`
          }}
        />
      </svg>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 700,
        fontSize: size * 0.28,
        color: '#fff',
        zIndex: 1,
        textShadow: '0 0 10px rgba(255,255,255,0.3)'
      }}>
        {validScore}
      </span>
      <span style={{
        position: 'absolute',
        bottom: size * 0.15,
        fontFamily: "'Inter', sans-serif",
        fontSize: size * 0.1,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: 500,
        letterSpacing: 1
      }}>
        AI
      </span>
    </div>
  );
};
