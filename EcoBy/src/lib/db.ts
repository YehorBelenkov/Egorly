import Database from 'better-sqlite3';
import path from 'path';
import { TikTokUser, Prize, Winner } from '@/types';

const dbPath = path.join(process.cwd(), 'data', 'tiktok.db');
const db = new Database(dbPath);

// Initialize database
db.exec(`
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

  CREATE TABLE IF NOT EXISTS prizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('money', 'product', 'promo_code')),
    value TEXT NOT NULL,
    description TEXT,
    probability INTEGER DEFAULT 100,
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    prizeId INTEGER NOT NULL,
    wonAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (prizeId) REFERENCES prizes(id)
  );

  CREATE TABLE IF NOT EXISTS winner_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    winnerId INTEGER NOT NULL,
    tiktokUsername TEXT NOT NULL,
    screenshotUrl TEXT NOT NULL,
    contactDescription TEXT NOT NULL,
    contactMethod TEXT NOT NULL,
    paymentMethod TEXT,
    claimedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winnerId) REFERENCES winners(id)
  );

  CREATE INDEX IF NOT EXISTS idx_engagement_score ON users(engagementScore DESC);
  CREATE INDEX IF NOT EXISTS idx_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_prizes_active ON prizes(isActive);
`);

// Seed initial prizes if table is empty
const prizeCount = db.prepare('SELECT COUNT(*) as count FROM prizes').get() as { count: number };
if (prizeCount.count === 0) {
  db.prepare(`
    INSERT INTO prizes (name, type, value, description, probability, isActive) VALUES
    ('$100 Cash', 'money', '100', 'MEGA Cash prize via PayPal', 0, 1),
    ('$50 Cash', 'money', '50', 'BIG Cash prize via PayPal', 0, 1),
    ('$25 Cash', 'money', '25', 'Cash prize via PayPal', 8, 1),
    ('$10 Cash #1', 'money', '10', 'Cash prize via PayPal', 12, 1),
    ('$10 Cash #2', 'money', '10', 'Cash prize via PayPal', 12, 1),
    ('$5 Cash #1', 'money', '5', 'Small cash prize via PayPal', 20, 1),
    ('$5 Cash #2', 'money', '5', 'Small cash prize via PayPal', 20, 1),
    ('Free Product #1', 'product', 'Premium Item', 'Premium product from our store', 10, 1),
    ('Free Product #2', 'product', 'Premium Item', 'Premium product from our store', 10, 1),
    ('Mystery Box #1', 'product', 'Surprise', 'Mystery box with random items', 15, 1),
    ('Mystery Box #2', 'product', 'Surprise', 'Mystery box with random items', 15, 1),
    ('20% OFF Coupon #1', 'promo_code', 'LUCKY20', '20% discount on entire order', 100, 1),
    ('20% OFF Coupon #2', 'promo_code', 'LUCKY20', '20% discount on entire order', 100, 1),
    ('50% OFF Coupon #1', 'promo_code', 'WINNER50', '50% discount on entire order', 30, 1),
    ('50% OFF Coupon #2', 'promo_code', 'WINNER50', '50% discount on entire order', 30, 1),
    ('Free Shipping #1', 'promo_code', 'FREESHIP', 'Free shipping on next order', 70, 1),
    ('Free Shipping #2', 'promo_code', 'FREESHIP', 'Free shipping on next order', 70, 1),
    ('VIP Status #1', 'promo_code', 'VIP30DAYS', '30 days VIP membership', 3, 1),
    ('VIP Status #2', 'promo_code', 'VIP30DAYS', '30 days VIP membership', 3, 1),
    ('Exclusive Merch #1', 'product', 'Limited Edition', 'Exclusive branded merchandise', 8, 1),
    ('Exclusive Merch #2', 'product', 'Limited Edition', 'Exclusive branded merchandise', 8, 1)
  `).run();
}

export const dbHelpers = {
  // Users
  getAllUsers: (): TikTokUser[] => {
    return db.prepare('SELECT * FROM users ORDER BY engagementScore DESC').all() as TikTokUser[];
  },

  getTopUsers: (limit: number): TikTokUser[] => {
    return db.prepare('SELECT * FROM users ORDER BY engagementScore DESC LIMIT ?').all(limit) as TikTokUser[];
  },

  getUserById: (id: number): TikTokUser | undefined => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as TikTokUser | undefined;
  },

  deleteUser: (id: number): boolean => {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  },

  resetUserStats: (id: number): boolean => {
    const result = db.prepare(`
      UPDATE users 
      SET followCount = 0, giftCount = 0, likeCount = 0, commentCount = 0, engagementScore = 0
      WHERE id = ?
    `).run(id);
    return result.changes > 0;
  },

  // Prizes
  getAllPrizes: (): Prize[] => {
    const prizes = db.prepare('SELECT * FROM prizes ORDER BY probability DESC').all() as any[];
    return prizes.map(p => ({ ...p, isActive: Boolean(p.isActive) }));
  },

  getActivePrizes: (): Prize[] => {
    const prizes = db.prepare('SELECT * FROM prizes WHERE isActive = 1 ORDER BY probability DESC').all() as any[];
    return prizes.map(p => ({ ...p, isActive: Boolean(p.isActive) }));
  },

  getPrizeById: (id: number): Prize | undefined => {
    const prize = db.prepare('SELECT * FROM prizes WHERE id = ?').get(id) as any;
    return prize ? { ...prize, isActive: Boolean(prize.isActive) } : undefined;
  },

  addPrize: (prize: Omit<Prize, 'id'>): number => {
    const result = db.prepare(`
      INSERT INTO prizes (name, type, value, description, probability, isActive)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(prize.name, prize.type, prize.value, prize.description || null, prize.probability, prize.isActive ? 1 : 0);
    return result.lastInsertRowid as number;
  },

  updatePrize: (id: number, prize: Partial<Prize>): boolean => {
    const updates: string[] = [];
    const values: any[] = [];

    if (prize.name !== undefined) { updates.push('name = ?'); values.push(prize.name); }
    if (prize.type !== undefined) { updates.push('type = ?'); values.push(prize.type); }
    if (prize.value !== undefined) { updates.push('value = ?'); values.push(prize.value); }
    if (prize.description !== undefined) { updates.push('description = ?'); values.push(prize.description); }
    if (prize.probability !== undefined) { updates.push('probability = ?'); values.push(prize.probability); }
    if (prize.isActive !== undefined) { updates.push('isActive = ?'); values.push(prize.isActive ? 1 : 0); }

    if (updates.length === 0) return false;

    values.push(id);
    const result = db.prepare(`UPDATE prizes SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return result.changes > 0;
  },

  deletePrize: (id: number): boolean => {
    const result = db.prepare('DELETE FROM prizes WHERE id = ?').run(id);
    return result.changes > 0;
  },

  // Winners
  recordWinner: (userId: number, prizeId: number): number => {
    const result = db.prepare('INSERT INTO winners (userId, prizeId) VALUES (?, ?)').run(userId, prizeId);
    return result.lastInsertRowid as number;
  },

  getAllWinners: (): Winner[] => {
    return db.prepare(`
      SELECT 
        w.id,
        w.userId,
        w.prizeId,
        u.username,
        p.name as prizeName,
        p.type as prizeType,
        p.value as prizeValue,
        w.wonAt
      FROM winners w
      JOIN users u ON w.userId = u.id
      JOIN prizes p ON w.prizeId = p.id
      ORDER BY w.wonAt DESC
    `).all() as Winner[];
  },

  getWinnersByUser: (userId: number): Winner[] => {
    return db.prepare(`
      SELECT 
        w.id,
        w.userId,
        w.prizeId,
        u.username,
        p.name as prizeName,
        p.type as prizeType,
        p.value as prizeValue,
        w.wonAt
      FROM winners w
      JOIN users u ON w.userId = u.id
      JOIN prizes p ON w.prizeId = p.id
      WHERE w.userId = ?
      ORDER BY w.wonAt DESC
    `).all(userId) as Winner[];
  },

  // Winner Claims
  submitClaim: (claim: {
    winnerId: number;
    tiktokUsername: string;
    screenshotUrl: string;
    contactDescription: string;
    contactMethod: string;
    paymentMethod?: string;
  }): number => {
    const result = db.prepare(`
      INSERT INTO winner_claims (winnerId, tiktokUsername, screenshotUrl, contactDescription, contactMethod, paymentMethod)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      claim.winnerId,
      claim.tiktokUsername,
      claim.screenshotUrl,
      claim.contactDescription,
      claim.contactMethod,
      claim.paymentMethod || null
    );
    return result.lastInsertRowid as number;
  },

  getClaimByWinnerId: (winnerId: number): any => {
    return db.prepare('SELECT * FROM winner_claims WHERE winnerId = ?').get(winnerId);
  },

  getAllClaims: (): any[] => {
    return db.prepare(`
      SELECT 
        wc.*,
        w.userId,
        u.username as winnerUsername,
        p.name as prizeName,
        p.type as prizeType,
        p.value as prizeValue
      FROM winner_claims wc
      JOIN winners w ON wc.winnerId = w.id
      JOIN users u ON w.userId = u.id
      JOIN prizes p ON w.prizeId = p.id
      ORDER BY wc.claimedAt DESC
    `).all();
  },
};

export default db;
