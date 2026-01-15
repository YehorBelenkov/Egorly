import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebaseConfig';

// Firestore user creation function
const createUserDb = async (user, fullName = '') => {
  try {
    const userRef = doc(firestore, 'users', user.uid);

    // Check if the user document already exists
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // If the user already exists, just log a message or return
      console.log('User already exists in Firestore.');
      return; // You can return the existing data here if needed
    }

    // If the user doesn't exist, create a new document
    await setDoc(userRef, {
      userUID: user.uid, // Store the UID explicitly if you want to refer to it elsewhere
      email: user.email,
      password: fullName, // Password
      phoneNumber: user.phoneNumber || '',
      companyName: '',
      createdAt: new Date().toISOString(),
    });

    // Create subcollection for cart (address will be created when user adds their first address)
    const cartRef = doc(firestore, `users/${user.uid}/cart`, 'default');
    await setDoc(cartRef, { items: [], createdAt: new Date().toISOString() });

    console.log('User and associated data created successfully in Firestore.');
  } catch (err) {
    console.error('Error initializing Firestore user:', err);
    throw new Error('Could not set up user data in Firestore.');
  }
};

export { createUserDb };