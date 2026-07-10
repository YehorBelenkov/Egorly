const { WebcastPushConnection } = require('tiktok-live-connector');
const admin = require('../../lib/firebaseAdmin').default;

const db = admin.firestore();
const USERS_COLLECTION = 'scraper_users';

// TikTok Live Stream Event Tracker with Firestore
class TikTokScraper {
  constructor() {
    this.tiktokConnection = null;
    this.isConnected = false;
    this.currentUsername = null;
    this.usersCache = new Map(); // In-memory cache for faster updates
    this.connectionId = null; // Track active connection to prevent stale events
  }

  // Calculate engagement score based on actions
  // Optimized to prioritize gifts (most important for fortune wheel)
  calculateEngagementScore(followCount, giftCount, likeCount, commentCount) {
    // Gifts worth way more since they're what matters for the wheel
    return (giftCount * 100) + (followCount * 50) + (commentCount * 10) + (likeCount * 1);
  }

  // Update or insert user data in Firestore
  async upsertUser(user) {
    // CRITICAL: Stop if disconnected or no connection ID (prevents race conditions)
    if (!this.isConnected || !this.connectionId) {
      console.log('⏸️ Skipping database write - scraper disconnected or no active connection');
      return;
    }

    const { username, uniqueId, nickname, profilePictureUrl } = user;
    
    if (!uniqueId || uniqueId === 'undefined') {
      console.warn('Cannot save user with invalid uniqueId:', username);
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      
      // Enhanced user data for fair fortune wheel system
      const userData = {
        username: username || uniqueId,
        uniqueId,
        giftCount: user.giftCount || 0,
        engagementScore: user.engagementScore || 0,
        totalContribution: user.engagementScore || 0, // Track lifetime contribution
        lastSeen: timestamp,
        activityState: 'active', // 'active' | 'inactive'
      };

      // Use uniqueId as document ID to prevent duplicates
      const docRef = db.collection(USERS_COLLECTION).doc(uniqueId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        // Update existing user, preserve wheel stats
        const existingData = doc.data();
        await docRef.update({
          ...userData,
          // Preserve wheel statistics
          wins: existingData.wins || 0,
          spinParticipationCount: existingData.spinParticipationCount || 0,
          wheelWeight: existingData.wheelWeight || 0,
          wheelPercentage: existingData.wheelPercentage || 0,
        });
      } else {
        // Create new user with createdAt and initial wheel stats
        await docRef.set({
          ...userData,
          createdAt: timestamp,
          wins: 0,
          spinParticipationCount: 0,
          wheelWeight: 0,
          wheelPercentage: 0,
        });
      }
    } catch (error) {
      console.error('Error upserting user:', error);
    }
  }

  // Track a follow event
  async trackFollow(username, uniqueId, connectionId) {
    // Skip if disconnected or wrong connection
    if (!this.isConnected || this.connectionId !== connectionId) {
      console.log('⏸️ Ignoring follow event - scraper disconnected or stale connection');
      return;
    }
    
    // Skip if no valid uniqueId
    if (!uniqueId || uniqueId === 'undefined') {
      console.warn('Skipping user with invalid uniqueId:', username);
      return;
    }

    let user = this.usersCache.get(uniqueId) || {
      username: username || uniqueId,
      uniqueId,
      nickname: username,
      profilePictureUrl: '',
      followCount: 0,
      giftCount: 0,
      likeCount: 0,
      commentCount: 0,
      engagementScore: 0,
    };

    user.followCount += 1;
    user.engagementScore = this.calculateEngagementScore(
      user.followCount,
      user.giftCount,
      user.likeCount,
      user.commentCount
    );

    this.usersCache.set(uniqueId, user);
    await this.upsertUser(user);
  }

  // Track a gift event
  async trackGift(username, uniqueId, giftName, giftValue = 1, connectionId) {
    // Skip if disconnected or wrong connection
    if (!this.isConnected || this.connectionId !== connectionId) {
      console.log('⏸️ Ignoring gift event - scraper disconnected or stale connection');
      return;
    }
    
    // Skip if no valid uniqueId
    if (!uniqueId || uniqueId === 'undefined') {
      console.warn('Skipping user with invalid uniqueId:', username);
      return;
    }
    let user = this.usersCache.get(uniqueId) || {
      username: username || uniqueId,
      uniqueId,
      nickname: username,
      profilePictureUrl: '',
      followCount: 0,
      giftCount: 0,
      likeCount: 0,
      commentCount: 0,
      engagementScore: 0,
    };

    user.giftCount += giftValue;
    user.engagementScore = this.calculateEngagementScore(
      user.followCount,
      user.giftCount,
      user.likeCount,
      user.commentCount
    );

    this.usersCache.set(uniqueId, user);
    await this.upsertUser(user);
    console.log(`🎁 ${username} sent gift: ${giftName} (value: ${giftValue})`);
  }

  // Track a like event
  async trackLike(username, uniqueId, connectionId) {
    // Skip if disconnected or wrong connection
    if (!this.isConnected || this.connectionId !== connectionId) {
      console.log('⏸️ Ignoring like event - scraper disconnected or stale connection');
      return;
    }
    
    // Skip if no valid uniqueId
    if (!uniqueId || uniqueId === 'undefined') {
      console.warn('Skipping user with invalid uniqueId:', username);
      return;
    }

    let user = this.usersCache.get(uniqueId) || {
      username: username || uniqueId,
      uniqueId,
      nickname: username,
      profilePictureUrl: '',
      followCount: 0,
      giftCount: 0,
      likeCount: 0,
      commentCount: 0,
      engagementScore: 0,
    };

    user.likeCount += 1;
    user.engagementScore = this.calculateEngagementScore(
      user.followCount,
      user.giftCount,
      user.likeCount,
      user.commentCount
    );

    this.usersCache.set(uniqueId, user);

    // Only save every 5 likes to reduce Firestore writes
    if (user.likeCount % 5 === 0) {
      await this.upsertUser(user);
    }
  }

  // Track a comment event
  async trackComment(username, uniqueId, comment, connectionId) {
    // Skip if disconnected or wrong connection
    if (!this.isConnected || this.connectionId !== connectionId) {
      console.log('⏸️ Ignoring comment event - scraper disconnected or stale connection');
      return;
    }
    
    // Skip if no valid uniqueId
    if (!uniqueId || uniqueId === 'undefined') {
      console.warn('Skipping user with invalid uniqueId:', username);
      return;
    }

    let user = this.usersCache.get(uniqueId) || {
      username: username || uniqueId,
      uniqueId,
      nickname: username,
      profilePictureUrl: '',
      followCount: 0,
      giftCount: 0,
      likeCount: 0,
      commentCount: 0,
      engagementScore: 0,
    };

    user.commentCount += 1;
    user.engagementScore = this.calculateEngagementScore(
      user.followCount,
      user.giftCount,
      user.likeCount,
      user.commentCount
    );

    this.usersCache.set(uniqueId, user);
    await this.upsertUser(user);
  }

  // Clear all user data
  async clearAllUsers() {
    this.usersCache.clear();
    try {
      const snapshot = await db.collection(USERS_COLLECTION).get();
      const batch = db.batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log('🗑️ All scraper users cleared');
    } catch (error) {
      console.error('Error clearing users:', error);
      throw error;
    }
  }

  // Connect to TikTok Live Stream
  async connect(username) {
    try {
      if (this.isConnected) {
        throw new Error('Already connected to a live stream. Disconnect first.');
      }

      console.log(`🔗 Connecting to @${username}'s live stream...`);
      
      // Generate unique connection ID to track this specific connection
      const connectionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      this.connectionId = connectionId;
      console.log(`🆔 Connection ID: ${connectionId}`);
      
      this.tiktokConnection = new WebcastPushConnection(username);

      // Connect and wait for it to complete
      const state = await this.tiktokConnection.connect();
      console.log(`✅ Connected to @${username}! Room ID: ${state.roomId}`);
      this.isConnected = true;
      this.currentUsername = username;

      // Handle disconnection
      this.tiktokConnection.on('disconnected', () => {
        console.log('🔌 Disconnected from live stream');
        this.isConnected = false;
        this.currentUsername = null;
      });

      // Handle errors
      this.tiktokConnection.on('error', err => {
        console.error('⚠️ Connection error:', err);
      });

      // Track gifts - pass connectionId to verify it's still the active connection
      this.tiktokConnection.on('gift', data => {
        const username = data.uniqueId || data.nickname;
        const giftValue = data.diamondCount || 1;
        this.trackGift(username, data.uniqueId, data.giftName, giftValue, connectionId);
      });

      // Track follows - pass connectionId
      this.tiktokConnection.on('follow', data => {
        const username = data.uniqueId || data.nickname;
        this.trackFollow(username, data.uniqueId, connectionId);
      });

      // Track likes - pass connectionId
      this.tiktokConnection.on('like', data => {
        const username = data.uniqueId || data.nickname;
        const likeCount = data.likeCount || 1;
        for (let i = 0; i < likeCount; i++) {
          this.trackLike(username, data.uniqueId, connectionId);
        }
      });

      // Track comments/chat - pass connectionId
      this.tiktokConnection.on('chat', data => {
        const username = data.uniqueId || data.nickname;
        this.trackComment(username, data.uniqueId, data.comment, connectionId);
      });

      return { success: true, message: `Connecting to @${username}...` };
    } catch (error) {
      console.error('❌ Connection error:', error);
      
      // Clean up on error
      this.isConnected = false;
      this.currentUsername = null;
      this.connectionId = null;
      this.tiktokConnection = null;
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      
      if (error.message && error.message.includes('Unexpected server response')) {
        errorMessage = `❌ @${username} is not currently LIVE on TikTok. Please find a user who is actively streaming.`;
      } else if (error.message && error.message.includes('getaddrinfo ENOTFOUND')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message && error.message.includes('User not found')) {
        errorMessage = `User @${username} not found. Please check the username.`;
      }
      
      return { success: false, message: errorMessage };
    }
  }

  // Disconnect from TikTok Live Stream
  disconnect() {
    console.log('🔌 Disconnecting from live stream...');
    console.log(`🆔 Invalidating connection ID: ${this.connectionId}`);
    
    // Invalidate connection ID FIRST - this prevents any queued events from processing
    const oldConnectionId = this.connectionId;
    this.connectionId = null;
    
    // Set disconnected flag to stop processing any incoming events
    this.isConnected = false;
    this.currentUsername = null;
    
    // Clear the cache to prevent any buffered updates
    this.usersCache.clear();
    
    if (this.tiktokConnection) {
      // Remove all event listeners
      this.tiktokConnection.removeAllListeners();
      
      // Then disconnect the WebSocket
      try {
        this.tiktokConnection.disconnect();
      } catch (err) {
        console.error('Error during disconnect:', err);
      }
      
      this.tiktokConnection = null;
    }
    
    console.log(`✅ Disconnected successfully - connection ${oldConnectionId} terminated`);
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      username: this.currentUsername,
    };
  }

  // Close connection
  close() {
    this.disconnect();
    this.usersCache.clear();
  }
}

module.exports = TikTokScraper;
