const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'tiktok.db');
const db = new Database(dbPath);

const users = db.prepare('SELECT * FROM users ORDER BY engagementScore DESC LIMIT 10').all();

console.log(`\n📊 Database Status:`);
console.log(`Total users: ${users.length}`);

if (users.length > 0) {
  console.log('\nTop 10 users:');
  users.forEach((u, i) => {
    console.log(`${i+1}. ${u.username} - Score: ${u.engagementScore} (Gifts:${u.giftCount} Follows:${u.followCount} Comments:${u.commentCount} Likes:${u.likeCount})`);
  });
} else {
  console.log('\n⚠️  No users in database. Connection might be failing.');
}

db.close();
