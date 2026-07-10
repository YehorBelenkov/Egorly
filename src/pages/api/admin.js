import admin from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  try {
    // Log request headers for debugging
    console.log('Request Headers:', req.headers);

    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Verify the user's ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Check the user's admin status in Firestore
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    console.log("USER DATA HERE:", userData);
    
    if (!userData) {
      return res.status(404).json({ error: 'User data not found' });
    }
    
    // Check if isAdmin is true explicitly
    if (userData.isAdmin !== true) {
      return res.status(403).json({ error: 'Access denied. Not an admin.' });
    }

    // If the user is an admin, set admin claim
    try {
      await admin.auth().setCustomUserClaims(decodedToken.uid, { admin: true });
      console.log('Admin claim set successfully for:', decodedToken.uid);
    } catch (claimError) {
      console.error('Error setting admin claim:', claimError);
      // Continue even if claim setting fails
    }
    
    // Return success response
    return res.status(200).json({ message: 'Admin verified' });

  } catch (err) {
    console.error('Error verifying admin:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}