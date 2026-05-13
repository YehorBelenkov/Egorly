const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'tiktok.db');
const db = new Database(dbPath);

// Arrays of random usernames
const adjectives = ['Cool', 'Happy', 'Lucky', 'Fast', 'Smart', 'Epic', 'Wild', 'Neon', 'Cyber', 'Dream', 'Star', 'Moon', 'Fire', 'Ice', 'Thunder'];
const nouns = ['Tiger', 'Dragon', 'Phoenix', 'Wolf', 'Eagle', 'Ninja', 'Wizard', 'Knight', 'Racer', 'Gamer', 'Pro', 'King', 'Queen', 'Legend', 'Master'];
const suffixes = ['', 'X', 'XD', '123', '2026', 'Pro', 'YT', 'TTV', 'Live', 'Official'];

function generateRandomUsername() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${adj}${noun}${suffix}`;
}

function generateRandomEngagement() {
  return {
    followCount: Math.floor(Math.random() * 2), // 0-1 follows
    giftCount: Math.floor(Math.random() * 10), // 0-9 gifts
    likeCount: Math.floor(Math.random() * 50), // 0-49 likes
    commentCount: Math.floor(Math.random() * 20), // 0-19 comments
  };
}

function calculateEngagementScore(followCount, giftCount, likeCount, commentCount) {
  return (giftCount * 100) + (followCount * 50) + (commentCount * 10) + (likeCount * 1);
}

console.log('Adding 20 random users to the database...\n');

const stmt = db.prepare(`
  INSERT OR REPLACE INTO users (username, uniqueId, nickname, followCount, giftCount, likeCount, commentCount, engagementScore, lastSeen)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

let successCount = 0;

for (let i = 0; i < 20; i++) {
  const username = generateRandomUsername();
  const uniqueId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const engagement = generateRandomEngagement();
  const engagementScore = calculateEngagementScore(
    engagement.followCount,
    engagement.giftCount,
    engagement.likeCount,
    engagement.commentCount
  );

  try {
    stmt.run(
      username,
      uniqueId,
      username, // nickname same as username
      engagement.followCount,
      engagement.giftCount,
      engagement.likeCount,
      engagement.commentCount,
      engagementScore
    );
    
    console.log(`✅ Added: ${username} | Score: ${engagementScore} | Gifts: ${engagement.giftCount} | Follows: ${engagement.followCount} | Comments: ${engagement.commentCount} | Likes: ${engagement.likeCount}`);
    successCount++;
  } catch (error) {
    console.log(`⚠️  Skipped duplicate: ${username}`);
  }
}

console.log(`\n🎉 Successfully added ${successCount} users!`);
console.log('\nTop 5 users by engagement score:');

const topUsers = db.prepare('SELECT username, engagementScore FROM users ORDER BY engagementScore DESC LIMIT 5').all();
topUsers.forEach((user, idx) => {
  console.log(`${idx + 1}. ${user.username} - Score: ${user.engagementScore}`);
});

db.close();
