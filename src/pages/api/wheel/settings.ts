import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

const db = admin.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get wheel settings
      const settingsDoc = await db.collection('wheel_settings').doc('config').get();
      
      if (!settingsDoc.exists) {
        // Return default settings
        return res.status(200).json({
          prizes: [
            { id: 1, label: '10% Discount', type: 'discount', value: 10 },
            { id: 2, label: '20% Discount', type: 'discount', value: 20 },
            { id: 3, label: '30% Discount', type: 'discount', value: 30 },
            { id: 4, label: 'Free Shipping', type: 'shipping', value: 0 },
            { id: 5, label: '50% Discount', type: 'discount', value: 50 },
          ]
        });
      }

      return res.status(200).json(settingsDoc.data());
    }

    if (req.method === 'POST') {
      // Update wheel settings
      const { prizes } = req.body;

      await db.collection('wheel_settings').doc('config').set({
        prizes,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      return res.status(200).json({ success: true, prizes });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Wheel settings error:', error);
    return res.status(500).json({ error: 'Failed to process wheel settings' });
  }
}
