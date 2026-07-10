import { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

const db = admin.firestore();
const USERS_COLLECTION = 'scraper_users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method === 'POST') {
    try {
      const snapshot = await db.collection(USERS_COLLECTION)
        .where('giftCount', '==', 0)
        .get();
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });
      
      await batch.commit();

      return res.status(200).json({ 
        success: true, 
        message: `Removed ${count} non-gift users (comment/like only)`,
        removedCount: count
      });
    } catch (error) {
      console.error('Error clearing non-gift users:', error);
      return res.status(500).json({ error: 'Failed to clear non-gift users' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
