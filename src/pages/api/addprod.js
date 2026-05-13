import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebaseConfig';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
console.log("Admin SDK initialized with service account:", serviceAccount.client_email);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Function to verify if the user is an admin
const verifyAdmin = async (token) => {
  try {
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("DECODED TOKEN:", decodedToken);  // Log the token's claims
    console.log("Token Admin Claim:", decodedToken.admin || decodedToken.isAdmin);
    // Check admin status in Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      throw new Error('Access denied: User is not an admin.');
    }

    return decodedToken; // Return the decoded token containing the uid and admin claim
  } catch (err) {
    throw new Error(err.message || 'Failed to verify admin status.');
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
      }

      // Verify admin status and get decoded token
      const decodedToken = await verifyAdmin(token);

      // Extract product data from request body
      const { 
        name, 
        price, 
        imageUrls, 
        quantity, 
        cjProductId,
        variants,
        description, 
        descriptionSections, 
        attributes, 
        packingList, 
        videoUrl 
      } = req.body;

      console.log('Received product data:', { name, price, quantity, cjProductId, variantsCount: variants?.length });

      // Validate required fields
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Missing or invalid name' });
      }
      if (!price || isNaN(price) || price <= 0) {
        return res.status(400).json({ error: 'Missing or invalid price' });
      }
      if (!quantity || isNaN(quantity) || quantity < 0) {
        return res.status(400).json({ error: 'Missing or invalid quantity' });
      }

      // Create a unique product ID based on the timestamp (or you can use a Firestore-generated ID)
      const productRef = db.collection('products').doc(Date.now().toString());
      await productRef.set({
        name,
        price,
        quantity,
        cjProductId: cjProductId || null, // CJ Dropshipping Product ID
        variants: variants || [], // Array of selected variants with custom images
        description: description || '', // Optional main description
        descriptionSections: descriptionSections || [], // Array of {title, content}
        attributes: attributes || [], // Array of {key, value}
        packingList: packingList || [], // Array of items included
        imageUrls: imageUrls || [], // Array of image URLs
        videoUrl: videoUrl || null, // Optional video URL
        createdAt: new Date().toISOString(),
        uid: decodedToken.uid,
        admin: decodedToken.isAdmin || false,
      });

      res.status(200).json({ success: true, message: 'Product added successfully' });
    } catch (error) {
      console.error('Error adding product:', error);
      res.status(403).json({ error: error.message || 'Access denied' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}