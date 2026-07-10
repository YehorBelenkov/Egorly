// Firestore database helpers for TikTok scraper
import { db } from './firebaseAdmin';
import { TikTokUser } from '@/types';

const USERS_COLLECTION = 'scraper_users';

export const dbHelpers = {
  // Get all users sorted by engagement score
  getAllUsers: async (): Promise<TikTokUser[]> => {
    try {
      const snapshot = await db.collection(USERS_COLLECTION)
        .orderBy('engagementScore', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      } as TikTokUser));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  },

  // Get top N users by engagement score
  getTopUsers: async (limit: number): Promise<TikTokUser[]> => {
    try {
      const snapshot = await db.collection(USERS_COLLECTION)
        .orderBy('engagementScore', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      } as TikTokUser));
    } catch (error) {
      console.error('Error getting top users:', error);
      return [];
    }
  },

  // Add or update a user
  upsertUser: async (user: Partial<TikTokUser> & { uniqueId: string }): Promise<void> => {
    try {
      // Find existing user by uniqueId
      const existingSnapshot = await db.collection(USERS_COLLECTION)
        .where('uniqueId', '==', user.uniqueId)
        .limit(1)
        .get();

      const timestamp = new Date().toISOString();

      if (!existingSnapshot.empty) {
        // Update existing user
        const docRef = existingSnapshot.docs[0].ref;
        await docRef.update({
          ...user,
          lastSeen: timestamp,
        });
      } else {
        // Create new user
        await db.collection(USERS_COLLECTION).add({
          username: user.username || user.uniqueId,
          uniqueId: user.uniqueId,
          nickname: user.nickname || '',
          profilePictureUrl: user.profilePictureUrl || '',
          followCount: user.followCount || 0,
          giftCount: user.giftCount || 0,
          likeCount: user.likeCount || 0,
          commentCount: user.commentCount || 0,
          engagementScore: user.engagementScore || 0,
          lastSeen: timestamp,
          createdAt: timestamp,
        });
      }
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  },

  // Delete a user by Firestore document ID
  deleteUser: async (docId: string): Promise<boolean> => {
    try {
      await db.collection(USERS_COLLECTION).doc(docId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },

  // Clear ALL users from database
  clearAllUsers: async (): Promise<void> => {
    try {
      const snapshot = await db.collection(USERS_COLLECTION).get();
      const batch = db.batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log('🗑️ All scraper users cleared');
    } catch (error) {
      console.error('Error clearing all users:', error);
      throw error;
    }
  },

  // Clear ONLY users who have no gifts (comment/like-only users)
  clearNonGiftUsers: async (): Promise<number> => {
    try {
      const snapshot = await db.collection(USERS_COLLECTION)
        .where('giftCount', '==', 0)
        .get();
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });
      
      await batch.commit();
      console.log(`🗑️ Removed ${count} non-gift users (comment/like only)`);
      return count;
    } catch (error) {
      console.error('Error clearing non-gift users:', error);
      throw error;
    }
  },

  // Get count of gift users (users with giftCount > 0)
  getGiftUsersCount: async (): Promise<number> => {
    try {
      const snapshot = await db.collection(USERS_COLLECTION)
        .where('giftCount', '>', 0)
        .get();
      
      return snapshot.size;
    } catch (error) {
      console.error('Error getting gift users count:', error);
      return 0;
    }
  },
};
