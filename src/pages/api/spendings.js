import admin from '../../lib/firebaseAdmin';

const db = admin.firestore();

export default async function handler(req, res) {
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        if (!decodedToken.admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        if (req.method === 'GET') {
            // Fetch spendings with limit to prevent memory issues
            const spendingsSnapshot = await db
                .collection('spendings')
                .orderBy('date', 'desc')
                .limit(200) // Add limit to prevent crashes
                .get();
            
            const spendings = spendingsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return res.status(200).json({ spendings });
        }

        if (req.method === 'POST') {
            // Add new spending
            const { description, amount, category, date } = req.body;
            
            if (!description || !amount) {
                return res.status(400).json({ error: 'Description and amount are required' });
            }

            const newSpending = {
                description,
                amount: parseFloat(amount),
                category: category || 'other',
                date: date || new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            };

            const docRef = await db.collection('spendings').add(newSpending);
            
            return res.status(200).json({ 
                success: true, 
                id: docRef.id,
                spending: newSpending 
            });
        }

        if (req.method === 'DELETE') {
            // Delete spending
            const { id } = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'Spending ID is required' });
            }

            await db.collection('spendings').doc(id).delete();
            
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error in spendings API:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
