import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

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
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Check the user's admin status in Firestore
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
    
    // Proceed with admin access
    res.status(200).json({ message: 'Admin verified' });

    // If the user is an admin, trigger the set-admin API
    const response = await fetch('http://localhost:3000/api/set-admin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid: decodedToken.uid }),  // The UID you want to set as admin
    });
    
    const responseBody = await response.json(); // Read the body once
    
    console.log("Response Status:", response.status);
    console.log("Response Body:", responseBody); // Now you can log the body
    
    if (response.ok) {
      res.status(200).json({ message: 'Admin verified and set' });
    } else {
      console.log("BIG ERROR HERE");
      res.status(response.status).json(responseBody); // Use the response body here
    }

  } catch (err) {
    console.error('Error verifying admin:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}