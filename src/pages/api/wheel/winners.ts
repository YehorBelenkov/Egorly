import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

const db = admin.firestore();
const WINNERS_COLLECTION = 'winners';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { limit = 50 } = req.query;

      // Fetch winners ordered by timestamp (most recent first)
      const winnersSnapshot = await db
        .collection(WINNERS_COLLECTION)
        .orderBy('timestamp', 'desc')
        .limit(Number(limit))
        .get();

      const winners = winnersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({
        success: true,
        winners,
        count: winners.length,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Fetch winners error:', error);
    return res.status(500).json({ error: 'Failed to fetch winners' });
  }
}
