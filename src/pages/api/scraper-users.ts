import { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../lib/firebaseAdmin';

const db = admin.firestore();
const USERS_COLLECTION = 'scraper_users';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method === 'GET') {
    try {
      // Limit to top 100 users for display (but Firestore stores up to 2k)
      const snapshot = await db.collection(USERS_COLLECTION)
        .orderBy('engagementScore', 'desc')
        .limit(100)
        .get();
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching scraper users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
