import { ProfileFeatures } from './feature-extractor';

export interface ScoreResult {
    score: number;
    confidence: number;
    status: 'good' | 'needs_warmup';
}

/**
 * Calculates the profile trust score based on usage features.
 * Ported from engine.py to eliminate Python dependency.
 */
export function calculateScore(features: ProfileFeatures): number {
    const cookieCount = features.cookieCount || 0;
    const historySize = features.historySize || 0;
    const profileSize = features.profileSizeMb || 0;
    
    let score = 10; // Base score
    
    // Cookies are highly valued
    if (cookieCount > 50) {
        score += 30;
    } else if (cookieCount > 10) {
        score += 15;
    }
        
    // History adds trust
    if (historySize > 500) {
        score += 25;
    } else if (historySize > 100) {
        score += 10;
    }
        
    // Profile size (cache, local storage)
    if (profileSize > 50) {
        score += 35;
    } else if (profileSize > 20) {
        score += 15;
    }
        
    return Math.min(100, Math.max(0, score));
}

/**
 * Predict trust score for a profile based on features.
 */
export async function predictScore(features: ProfileFeatures): Promise<ScoreResult> {
    const score = calculateScore(features);
    return {
        score,
        confidence: 0.85,
        status: score > 70 ? 'good' : 'needs_warmup'
    };
}

/**
 * Stub function matching the old training endpoint.
 */
export async function submitFeedback(
    profileId: string, 
    feedback: 'thumbs_up' | 'thumbs_down', 
    features: ProfileFeatures
): Promise<void> {
    console.log(`[ScoreEngine] Feedback received for profile ${profileId}: ${feedback}`, features);
    // Placeholder for future local reinforcement learning/scoring fine-tuning
    return Promise.resolve();
}
