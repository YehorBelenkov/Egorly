// Guest User Management System
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { app } from './firebaseConfig';

const db = getFirestore(app);

/**
 * Generate a unique guest ID
 */
export const generateGuestId = () => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get or create guest user session
 * Only stores in localStorage - no Firestore write until purchase
 */
export const getGuestSession = async () => {
  // Check if guest ID exists in localStorage
  let guestId = localStorage.getItem('guestUserId');
  
  if (!guestId) {
    // Create new guest user ID (localStorage only)
    guestId = generateGuestId();
    localStorage.setItem('guestUserId', guestId);
    
    // Store creation date for expiration tracking
    const createdAt = new Date().toISOString();
    localStorage.setItem('guestCreatedAt', createdAt);
  }
  
  return guestId;
};

/**
 * Get guest cart data from localStorage
 */
export const getGuestCart = () => {
  try {
    const cartData = localStorage.getItem('guestCart');
    if (cartData) {
      return JSON.parse(cartData);
    }
    return { items: [], updatedAt: null };
  } catch (error) {
    console.error('Error reading guest cart:', error);
    return { items: [], updatedAt: null };
  }
};

/**
 * Save guest cart data to localStorage
 */
export const saveGuestCart = (cartData) => {
  try {
    localStorage.setItem('guestCart', JSON.stringify(cartData));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
};

/**
 * Clear guest cart from localStorage
 */
export const clearGuestCart = () => {
  localStorage.removeItem('guestCart');
};

/**
 * Convert guest user to registered user
 * Migrates cart from localStorage to Firestore user account
 */
export const convertGuestToUser = async (guestId, userId) => {
  try {
    // Migrate cart from localStorage to user's Firestore cart
    const guestCart = getGuestCart();
    
    if (guestCart.items && guestCart.items.length > 0) {
      const userCartRef = doc(db, `users/${userId}/cart/default`);
      await setDoc(userCartRef, guestCart, { merge: true });
    }
    
    // Migrate orders from guest Firestore orders (if any exist from past purchases)
    const guestOrdersRef = collection(db, `guestUsers/${guestId}/orders`);
    const guestOrdersSnapshot = await getDocs(guestOrdersRef);
    
    if (!guestOrdersSnapshot.empty) {
      for (const orderDoc of guestOrdersSnapshot.docs) {
        const orderData = orderDoc.data();
        const userOrderRef = doc(db, `users/${userId}/orders`, orderDoc.id);
        await setDoc(userOrderRef, {
          ...orderData,
          userId: userId,
          isGuest: false,
          migratedAt: serverTimestamp()
        });
        
        await deleteDoc(orderDoc.ref);
      }
      
      // Delete guest user document after migration
      const guestRef = doc(db, 'guestUsers', guestId);
      const guestDoc = await getDoc(guestRef);
      if (guestDoc.exists()) {
        await deleteDoc(guestRef);
      }
    }
    
    // Clear guest data from localStorage
    clearGuestCart();
    localStorage.removeItem('guestUserId');
    localStorage.removeItem('guestCreatedAt');
    
    console.log('Guest data migrated successfully');
  } catch (error) {
    console.error('Error converting guest to user:', error);
    throw error;
  }
};

/**
 * Clear guest session from localStorage
 */
export const clearGuestSession = () => {
  localStorage.removeItem('guestUserId');
  localStorage.removeItem('guestCreatedAt');
  clearGuestCart();
};

/**
 * Check if guest session is expired (30 days)
 */
export const isGuestExpired = () => {
  const createdAt = localStorage.getItem('guestCreatedAt');
  if (!createdAt) return false;
  
  const created = new Date(createdAt);
  const expiresAt = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
  return new Date() > expiresAt;
};

/**
 * Get days remaining for guest account
 */
export const getDaysRemaining = () => {
  const createdAt = localStorage.getItem('guestCreatedAt');
  if (!createdAt) return 30;
  
  const created = new Date(createdAt);
  const expiresAt = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffTime = expiresAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};
