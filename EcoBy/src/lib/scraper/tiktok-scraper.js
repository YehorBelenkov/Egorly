const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { WebcastPushConnection } = require('tiktok-live-connector');

// TikTok Live Stream Event Tracker with Real-Time Data
class TikTokScraper {
  constructor() {
    // Use process.cwd() which works in Next.js API routes
    const dbDir = path.join(process.cwd(), 'data');
    const dbPath = path.join(dbDir, 'tiktok.db');
    
    // Ensure the data directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.initDatabase();
    this.tiktokConnection = null;
    this.isConnected = false;
    this.eventCallbacks = {
      onConnect: null,
      onDisconnect: null,
      onError: null,
      onEvent: null,
    };
  }

  initDatabase() {
    // Initialize database tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        uniqueId TEXT UNIQUE NOT NULL,
        nickname TEXT,
        profilePictureUrl TEXT,
        followCount INTEGER DEFAULT 0,
        giftCount INTEGER DEFAULT 0,
        likeCount INTEGER DEFAULT 0,
        commentCount INTEGER DEFAULT 0,
        engagementScore INTEGER DEFAULT 0,
        lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_engagement_score ON users(engagementScore DESC);
      CREATE INDEX IF NOT EXISTS idx_username ON users(username);
    `);
  }

  // Calculate engagement score based on actions
  calculateEngagementScore(followCount, giftCount, likeCount, commentCount) {
    // Weighted scoring: gifts are most valuable, then follows, then comments, then likes
    return (giftCount * 100) + (followCount * 50) + (commentCount * 10) + (likeCount * 1);
  }

  // Update or insert user data
  upsertUser(userData) {
    const { username, uniqueId, nickname, profilePictureUrl } = userData;
    
    const stmt = this.db.prepare(`
      INSERT INTO users (username, uniqueId, nickname, profilePictureUrl)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        lastSeen = CURRENT_TIMESTAMP,
        nickname = excluded.nickname,
        profilePictureUrl = excluded.profilePictureUrl
    `);

    const result = stmt.run(username, uniqueId, nickname || username, profilePictureUrl || null);
    return result.changes > 0;
  }

  // Track a follow event
  trackFollow(username, uniqueId) {
    this.upsertUser({ username, uniqueId });
    
    const stmt = this.db.prepare(`
      UPDATE users 
      SET followCount = followCount + 1,
          engagementScore = (giftCount * 100) + ((followCount + 1) * 50) + (commentCount * 10) + (likeCount * 1),
          lastSeen = CURRENT_TIMESTAMP
      WHERE username = ?
    `);
    
    stmt.run(username);
    // Follow tracked (silent)
  }

  // Track a gift event
  trackGift(username, uniqueId, giftName, giftValue = 1) {
    this.upsertUser({ username, uniqueId });
    
    const stmt = this.db.prepare(`
      UPDATE users 
      SET giftCount = giftCount + ?,
          engagementScore = ((giftCount + ?) * 100) + (followCount * 50) + (commentCount * 10) + (likeCount * 1),
          lastSeen = CURRENT_TIMESTAMP
      WHERE username = ?
    `);
    
    stmt.run(giftValue, giftValue, username);
    // Gift tracked (silent)
  }

  // Track a like event
  trackLike(username, uniqueId) {
    this.upsertUser({ username, uniqueId });
    
    const stmt = this.db.prepare(`
      UPDATE users 
      SET likeCount = likeCount + 1,
          engagementScore = (giftCount * 100) + (followCount * 50) + (commentCount * 10) + ((likeCount + 1) * 1),
          lastSeen = CURRENT_TIMESTAMP
      WHERE username = ?
    `);
    
    stmt.run(username);
    // Like tracking (silent - too many logs)
  }

  // Track a comment event
  trackComment(username, uniqueId, comment) {
    this.upsertUser({ username, uniqueId });
    
    const stmt = this.db.prepare(`
      UPDATE users 
      SET commentCount = commentCount + 1,
          engagementScore = (giftCount * 100) + (followCount * 50) + ((commentCount + 1) * 10) + (likeCount * 1),
          lastSeen = CURRENT_TIMESTAMP
      WHERE username = ?
    `);
    
    stmt.run(username);
    // Comment tracked (silent)
  }

  // Get top users by engagement
  getTopUsers(limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM users 
      ORDER BY engagementScore DESC, lastSeen DESC 
      LIMIT ?
    `);
    
    return stmt.all(limit);
  }

  // Get all users
  getAllUsers() {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY engagementScore DESC');
    return stmt.all();
  }

  // Clear all user data (for testing or reset)
  clearAllUsers() {
    // Clear winners first (foreign key constraint)
    this.db.prepare('DELETE FROM winners').run();
    // Then clear users
    this.db.prepare('DELETE FROM users').run();
    console.log('🗑️ All users and winners cleared for new stream');
  }

  // Close database connection
  close() {
    if (this.tiktokConnection) {
      this.disconnect();
    }
    this.db.close();
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
