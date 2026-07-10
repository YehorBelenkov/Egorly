import { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

const db = admin.firestore();
const USERS_COLLECTION = 'scraper_users';
const WINNERS_COLLECTION = 'winners';

/**
 * Record a wheel spin win for a user
 * Increments wins counter and saves winner to winners collection
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { userId, prize } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const docRef = db.collection(USERS_COLLECTION).doc(userId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const currentData = doc.data();
      const timestamp = new Date().toISOString();
      const username = currentData?.username || currentData?.name || currentData?.uniqueId || 'Unknown User';
      
      // Increment wins and participation in user document
      await docRef.update({
        wins: (currentData?.wins || 0) + 1,
        spinParticipationCount: (currentData?.spinParticipationCount || 0) + 1,
        lastWinTimestamp: timestamp,
        lastWinPrize: prize || 'Unknown Prize',
      });

      // Save to winners collection
      await db.collection(WINNERS_COLLECTION).add({
        userId,
        username,
        prize: prize || 'Unknown Prize',
        timestamp,
        engagementScore: currentData?.engagementScore || 0,
        giftCount: currentData?.giftCount || 0,
      });

      return res.status(200).json({
        success: true,
        userId,
        username,
        newWinCount: (currentData?.wins || 0) + 1,
        timestamp,
      });
    } catch (error) {
      console.error('Error recording win:', error);
      return res.status(500).json({ error: 'Failed to record win' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      // Increment spin participation for all users in the current spin
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ error: 'userIds array is required' });
      }

      const batch = db.batch();
      
      for (const userId of userIds) {
        const docRef = db.collection(USERS_COLLECTION).doc(userId);
        const doc = await docRef.get();
        
        if (doc.exists) {
          const currentData = doc.data();
          batch.update(docRef, {
            spinParticipationCount: (currentData?.spinParticipationCount || 0) + 1,
          });
        }
      }

      await batch.commit();

      return res.status(200).json({
        success: true,
        updatedCount: userIds.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating participation:', error);
      return res.status(500).json({ error: 'Failed to update participation' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
