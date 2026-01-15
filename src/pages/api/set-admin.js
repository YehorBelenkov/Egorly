import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the requester's token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // You already verified admin status in the previous API, so no need to check here again

    const { uid } = req.body;
    console.log("UID HERE!");
    console.log(uid);
    if (!uid) {
      return res.status(400).json({ error: 'UID is required.' });
    }

    // Set the custom user claim for the given UID to make them an admin
    await admin.auth().setCustomUserClaims(uid, { isAdmin: true });

    res.status(200).json({ message: 'Admin claim set successfullys.' });
  } catch (err) {
    console.error('Error setting admin claim:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}