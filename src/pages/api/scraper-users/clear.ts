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
      const snapshot = await db.collection(USERS_COLLECTION).get();
      const batch = db.batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();

      return res.status(200).json({ 
        success: true, 
        message: 'All user data cleared successfully' 
      });
    } catch (error) {
      console.error('Error clearing users:', error);
      return res.status(500).json({ error: 'Failed to clear user data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
