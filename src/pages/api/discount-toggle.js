import admin from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  const db = admin.firestore();
  const discountRef = db.collection('settings').doc('discount');

  try {
    if (req.method === 'GET') {
      // Get current discount status
      const docSnap = await discountRef.get();
      if (docSnap.exists) {
        res.status(200).json(docSnap.data());
      } else {
        // Default: discount is OFF
        res.status(200).json({ enabled: false, percentage: 20 });
      }
    } else if (req.method === 'POST') {
      // Update discount status
      const { enabled, percentage } = req.body;
      
      await discountRef.set({
        enabled: enabled || false,
        percentage: percentage || 20,
        updatedAt: new Date().toISOString()
      });

      res.status(200).json({ success: true, enabled, percentage });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Discount toggle error:', error);
    res.status(500).json({ error: error.message });
  }
}
