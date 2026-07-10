import { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

const db = admin.firestore();
const USERS_COLLECTION = 'scraper_users';

// Fair Fortune Wheel Configuration
const WHEEL_CONFIG = {
  MINIMUM_BASE_WEIGHT: 1.0,          // Everyone gets this minimum
  MAX_USER_PERCENTAGE: 18,           // No user can exceed 18% of wheel
  INACTIVITY_DAYS: 7,                // Remove users inactive for 7+ days
  MAX_USERS: 100,                    // Top 100 users
  SQRT_MULTIPLIER: 0.5,              // Multiplier for sqrt scaling
};

/**
 * Calculate fair wheel weights using square root scaling with caps
 * Prevents whale domination while rewarding engagement
 */
function calculateFairWeights(users: any[]) {
  if (users.length === 0) return [];

  const { MINIMUM_BASE_WEIGHT, MAX_USER_PERCENTAGE, SQRT_MULTIPLIER } = WHEEL_CONFIG;

  // Step 1: Calculate square root scaled weights
  const rawWeights = users.map(user => {
    const points = user.engagementScore || 1;
    // Use sqrt scaling for diminishing returns
    return MINIMUM_BASE_WEIGHT + (Math.sqrt(points) * SQRT_MULTIPLIER);
  });

  // Step 2: Convert to percentages
  const totalWeight = rawWeights.reduce((sum, w) => sum + w, 0);
  let percentages = rawWeights.map(w => (w / totalWeight) * 100);

  // Step 3: Apply maximum cap and redistribute overflow
  const cappedIndices: number[] = [];
  let totalCapped = 0;

  percentages.forEach((pct, idx) => {
    if (pct > MAX_USER_PERCENTAGE) {
      cappedIndices.push(idx);
      totalCapped += pct - MAX_USER_PERCENTAGE;
      percentages[idx] = MAX_USER_PERCENTAGE;
    }
  });

  // Redistribute overflow to non-capped users proportionally
  if (cappedIndices.length > 0 && totalCapped > 0) {
    const uncappedIndices = percentages
      .map((_, idx) => idx)
      .filter(idx => !cappedIndices.includes(idx));

    if (uncappedIndices.length > 0) {
      const uncappedTotal = uncappedIndices.reduce((sum, idx) => sum + percentages[idx], 0);
      
      uncappedIndices.forEach(idx => {
        const proportion = percentages[idx] / uncappedTotal;
        percentages[idx] += totalCapped * proportion;
      });
    }
  }

  // Step 4: Final normalization to ensure exactly 100%
  const finalTotal = percentages.reduce((sum, p) => sum + p, 0);
  percentages = percentages.map(p => (p / finalTotal) * 100);

  // Step 5: Map weights back to users
  return users.map((user, idx) => ({
    ...user,
    wheelWeight: rawWeights[idx],
    wheelPercentage: percentages[idx],
  }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Simple query: get top users by engagement score (or all users if no score)
      const snapshot = await db.collection(USERS_COLLECTION)
        .orderBy('engagementScore', 'desc')
        .limit(WHEEL_CONFIG.MAX_USERS)
        .get();
      
      // If no users found with engagementScore, try getting all users
      let users = snapshot.docs.map(doc => ({
        id: doc.id,
        username: doc.data().username || doc.data().name || 'Unknown User',
        giftCount: doc.data().giftCount || 0,
        engagementScore: doc.data().engagementScore || doc.data().giftCount || 1,
        totalContribution: doc.data().totalContribution || 0,
        wins: doc.data().wins || 0,
        spinParticipationCount: doc.data().spinParticipationCount || 0,
        lastSeen: doc.data().lastSeen,
        activityState: doc.data().activityState || 'active',
      }));

      // If still no users, try without orderBy (in case engagementScore field doesn't exist)
      if (users.length === 0) {
        console.log('⚠️ No users found with engagementScore, trying without orderBy...');
        const allSnapshot = await db.collection(USERS_COLLECTION)
          .limit(WHEEL_CONFIG.MAX_USERS)
          .get();
        
        users = allSnapshot.docs.map(doc => ({
          id: doc.id,
          username: doc.data().username || doc.data().name || 'Unknown User',
          giftCount: doc.data().giftCount || 0,
          engagementScore: doc.data().engagementScore || doc.data().giftCount || 1,
          totalContribution: doc.data().totalContribution || 0,
          wins: doc.data().wins || 0,
          spinParticipationCount: doc.data().spinParticipationCount || 0,
          lastSeen: doc.data().lastSeen,
          activityState: doc.data().activityState || 'active',
        }));
      }

      console.log(`✅ Found ${users.length} users in ${USERS_COLLECTION}`);

      console.log(`✅ Found ${users.length} users in ${USERS_COLLECTION}`);

      // Calculate fair weights (even if empty, will return empty array)
      users = calculateFairWeights(users);

      // Update Firestore with calculated weights (async, don't wait)
      if (users.length > 0) {
        const batch = db.batch();
        users.forEach(user => {
          const docRef = db.collection(USERS_COLLECTION).doc(user.id);
          batch.update(docRef, {
            wheelWeight: user.wheelWeight || 1,
            wheelPercentage: user.wheelPercentage || 0,
          });
        });
        batch.commit().catch(err => console.error('Failed to update wheel weights:', err));
      }

      const stats = users.length > 0 ? {
        totalEngagement: users.reduce((sum, u) => sum + u.engagementScore, 0),
        topUserPercentage: users[0]?.wheelPercentage || 0,
        averagePercentage: users.reduce((sum, u) => sum + u.wheelPercentage, 0) / users.length,
      } : {
        totalEngagement: 0,
        topUserPercentage: 0,
        averagePercentage: 0,
      };

      return res.status(200).json({
        users,
        count: users.length,
        timestamp: new Date().toISOString(),
        config: WHEEL_CONFIG,
        stats
      });
    } catch (error) {
      console.error('Error fetching wheel users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
