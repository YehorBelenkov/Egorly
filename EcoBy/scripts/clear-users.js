const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'tiktok.db');
const db = new Database(dbPath);

console.log('🗑️  Clearing all users from database...');

// First clear winners table (has foreign key to users)
const winnersResult = db.prepare('DELETE FROM winners').run();
console.log(`✅ Deleted ${winnersResult.changes} winners`);

// Then clear users
const usersResult = db.prepare('DELETE FROM users').run();
console.log(`✅ Deleted ${usersResult.changes} users`);

console.log('Database cleared! Ready for fresh scraper data.');

db.close();
