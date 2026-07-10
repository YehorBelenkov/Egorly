const { WebcastPushConnection } = require('tiktok-live-connector');

// Import Firestore helpers (using dynamic import for ESM compatibility)
let dbHelpers = null;

// TikTok Live Stream Event Tracker with Firestore
class TikTokScraper {
  constructor() {
    this.tiktokConnection = null;
    this.isConnected = false;
    this.eventCallbacks = {
      onConnect: null,
      onDisconnect: null,
      onError: null,
      onEvent: null,
    };
    this.usersCache = new Map(); // In-memory cache for faster updates
    this.initFirestore();
  }

  async initFirestore() {
    // Dynamically import the Firestore helpers
    if (!dbHelpers) {
      const module = await import('../firestoreDb');
      dbHelpers = module.dbHelpers;
      console.log('✅ Firestore DB helpers loaded');
    }
  }

  // Calculate engagement score based on actions
  calculateEngagementScore(followCount, giftCount, likeCount, commentCount) {
    // Weighted scoring: gifts are most valuable, then follows, then comments, then likes
    return (giftCount * 100) + (followCount * 50) + (commentCount * 10) + (likeCount * 1);
  }

  // Update or insert user data in cache and Firestore
  async upsertUser(userData) {
    const { username, uniqueId, nickname, profilePictureUrl } = userData;
    
    // Get current user data from cache or initialize
    let user = this.usersCache.get(uniqueId) || {
      username: username || uniqueId,
      uniqueId,
      nickname: nickname || username,
      profilePictureUrl: profilePictureUrl || '',
      followCount: 0,
      giftCount: 0,
      likeCount: 0,
      commentCount: 0,
      engagementScore: 0,
    };

    // Update cache
    this.usersCache.set(uniqueId, user);

    // Update Firestore (fire and forget to avoid blocking)
    if (dbHelpers) {
      dbHelpers.upsertUser(user).catch(err => 
        console.error('Error upserting user to Firestore:', err)
      );
    }
  }

  // Track a follow event
  async trackFollow(username, uniqueId) {
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

    // Update Firestore
    if (dbHelpers) {
      dbHelpers.upsertUser(user).catch(err => 
        console.error('Error tracking follow:', err)
      );
    }
  }

  // Track a gift event
  async trackGift(username, uniqueId, giftName, giftValue = 1) {
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

    // Update Firestore
    if (dbHelpers) {
      dbHelpers.upsertUser(user).catch(err => 
        console.error('Error tracking gift:', err)
      );
    }
  }

  // Track a like event
  async trackLike(username, uniqueId) {
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

    // Update Firestore (throttled to avoid too many writes)
    if (dbHelpers && user.likeCount % 5 === 0) { // Only save every 5 likes
      dbHelpers.upsertUser(user).catch(err => 
        console.error('Error tracking like:', err)
      );
    }
  }

  // Track a comment event
  async trackComment(username, uniqueId, comment) {
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

    // Update Firestore
    if (dbHelpers) {
      dbHelpers.upsertUser(user).catch(err => 
        console.error('Error tracking comment:', err)
      );
    }
  }

  // Get top users by engagement
  async getTopUsers(limit = 50) {
    if (!dbHelpers) {
      await this.initFirestore();
    }
    return dbHelpers ? await dbHelpers.getTopUsers(limit) : [];
  }

  // Get all users
  async getAllUsers() {
    if (!dbHelpers) {
      await this.initFirestore();
    }
    return dbHelpers ? await dbHelpers.getAllUsers() : [];
  }

  // Clear all user data
  async clearAllUsers() {
    this.usersCache.clear();
    if (!dbHelpers) {
      await this.initFirestore();
    }
    if (dbHelpers) {
      await dbHelpers.clearAllUsers();
      console.log('🗑️ All scraper users cleared');
    }
  }

  // Close connection (no database to close for Firestore)
  close() {
    if (this.tiktokConnection) {
      this.disconnect();
    }
    this.usersCache.clear();
  }

  // Connect to TikTok Live Stream
  async connect(username) {
    try {
      if (this.isConnected) {
        throw new Error('Already connected to a live stream. Disconnect first.');
      }

      console.log(`🔗 Connecting to @${username}'s live stream...`);
      this.tiktokConnection = new WebcastPushConnection(username);

      // Set up event listeners
      this.tiktokConnection.connect().then(state => {
        console.log(`✅ Connected to @${username}! Room ID: ${state.roomId}`);
        this.isConnected = true;
        if (this.eventCallbacks.onConnect) {
          this.eventCallbacks.onConnect({ username, roomId: state.roomId });
        }
      }).catch(err => {
        console.error('❌ Failed to connect:', err);
        this.isConnected = false;
        if (this.eventCallbacks.onError) {
          this.eventCallbacks.onError(err);
        }
      });

      // Handle disconnection
      this.tiktokConnection.on('disconnected', () => {
        console.log('🔌 Disconnected from live stream');
        this.isConnected = false;
        if (this.eventCallbacks.onDisconnect) {
          this.eventCallbacks.onDisconnect();
        }
      });

      // Handle errors
      this.tiktokConnection.on('error', err => {
        console.error('⚠️ Connection error:', err);
        if (this.eventCallbacks.onError) {
          this.eventCallbacks.onError(err);
        }
      });

      // Track gifts
      this.tiktokConnection.on('gift', data => {
        const username = data.uniqueId || data.nickname;
        const giftValue = data.diamondCount || 1;
        this.trackGift(username, data.uniqueId, data.giftName, giftValue);
        if (this.eventCallbacks.onEvent) {
          this.eventCallbacks.onEvent({
            type: 'gift',
            username,
            giftName: data.giftName,
            value: giftValue,
            timestamp: new Date(),
          });
        }
      });

      // Track follows
      this.tiktokConnection.on('follow', data => {
        const username = data.uniqueId || data.nickname;
        this.trackFollow(username, data.uniqueId);
        if (this.eventCallbacks.onEvent) {
          this.eventCallbacks.onEvent({
            type: 'follow',
            username,
            timestamp: new Date(),
          });
        }
      });

      // Track likes
      this.tiktokConnection.on('like', data => {
        const username = data.uniqueId || data.nickname;
        const likeCount = data.likeCount || 1;
        // Track each like
        for (let i = 0; i < likeCount; i++) {
          this.trackLike(username, data.uniqueId);
        }
        if (this.eventCallbacks.onEvent) {
          this.eventCallbacks.onEvent({
            type: 'like',
            username,
            count: likeCount,
            timestamp: new Date(),
          });
        }
      });

      // Track comments/chat
      this.tiktokConnection.on('chat', data => {
        const username = data.uniqueId || data.nickname;
        this.trackComment(username, data.uniqueId, data.comment);
        if (this.eventCallbacks.onEvent) {
          this.eventCallbacks.onEvent({
            type: 'comment',
            username,
            comment: data.comment,
            timestamp: new Date(),
          });
        }
      });

      // Track shares
      this.tiktokConnection.on('share', data => {
        const username = data.uniqueId || data.nickname;
        if (this.eventCallbacks.onEvent) {
          this.eventCallbacks.onEvent({
            type: 'share',
            username,
            timestamp: new Date(),
          });
        }
      });

      return { success: true, message: `Connecting to @${username}...` };
    } catch (error) {
      console.error('❌ Connection error:', error);
      if (this.eventCallbacks.onError) {
        this.eventCallbacks.onError(error);
      }
      return { success: false, message: error.message };
    }
  }

  // Disconnect from TikTok Live Stream
  disconnect() {
    if (this.tiktokConnection) {
      this.tiktokConnection.disconnect();
      this.tiktokConnection = null;
      this.isConnected = false;
      console.log('🔌 Disconnected from live stream');
    }
  }

  // Set event callbacks for real-time updates
  setEventCallbacks(callbacks) {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks };
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      username: this.tiktokConnection ? this.tiktokConnection.uniqueId : null,
    };
  }

}

// Example usage / Demo mode
if (require.main === module) {
  console.log('🚀 TikTok Scraper Started (Demo Mode)');
  console.log('================================================');
  console.log('In production, integrate with tiktok-live-connector or similar library');
  console.log('For now, this is a mock implementation with manual tracking\n');

  const scraper = new TikTokScraper();

  // Demo: Simulate some user interactions
  console.log('📊 Simulating user interactions...\n');

  // Simulate various user actions
  scraper.trackFollow('user123', 'user123_id');
  scraper.trackGift('user123', 'user123_id', 'Rose', 1);
  scraper.trackLike('user123', 'user123_id');
  scraper.trackComment('user123', 'user123_id', 'Great stream!');
  
  scraper.trackFollow('coolgamer456', 'gamer456_id');
  scraper.trackGift('coolgamer456', 'gamer456_id', 'Diamond', 10);
  scraper.trackGift('coolgamer456', 'gamer456_id', 'Sports Car', 5);
  
  scraper.trackLike('viewer789', 'viewer789_id');
  scraper.trackLike('viewer789', 'viewer789_id');
  scraper.trackComment('viewer789', 'viewer789_id', 'Love this!');

  console.log('\n📈 Top Users by Engagement:');
  console.log('================================================');
  const topUsers = scraper.getTopUsers(10);
  topUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.username} - Score: ${user.engagementScore} (Gifts: ${user.giftCount}, Follows: ${user.followCount}, Comments: ${user.commentCount}, Likes: ${user.likeCount})`);
  });

  scraper.close();
}

module.exports = TikTokScraper;
