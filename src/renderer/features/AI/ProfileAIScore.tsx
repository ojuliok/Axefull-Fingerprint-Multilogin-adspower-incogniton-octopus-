import React, { useEffect, useState } from 'react';
import { AIRingScore } from './AIRingScore';

interface ProfileAIScoreProps {
  profileId: string;
  size?: number;
  strokeWidth?: number;
}

export const ProfileAIScore: React.FC<ProfileAIScoreProps> = ({ profileId, size = 40, strokeWidth = 4 }) => {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchScore = async () => {
      try {
        const result = await window.api.ai.predictScore(profileId);
        if (isMounted && result.success && result.data) {
          setScore((result.data as any).score);
        }
      } catch (err) {
        console.error('Error fetching AI score:', err);
      }
    };
    fetchScore();
    return () => { isMounted = false; };
  }, [profileId]);

  if (score === null) {
    // Return a placeholder or skeleton
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          border: `${strokeWidth}px solid rgba(255,255,255,0.05)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      >
        <span style={{ fontSize: size * 0.25, color: 'rgba(255,255,255,0.2)' }}>...</span>
      </div>
    );
  }

  return <AIRingScore score={score} size={size} strokeWidth={strokeWidth} />;
};
