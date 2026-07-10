# Fair Fortune Wheel System

## Overview
A psychologically balanced, anti-whale fortune wheel system that ensures every participant feels valued while rewarding top supporters proportionally.

---

## Core Principles

### 1. **Everyone Has a Chance**
- Every active user receives a guaranteed minimum wheel slice
- No user can become visually invisible
- Small contributors always feel they have hope to win

### 2. **Diminishing Returns for Whales**
- Uses **square root scaling** instead of raw points
- Prevents top donors from dominating 80%+ of the wheel
- Top users get rewarded, but not overwhelmingly so

### 3. **Maximum Ownership Cap**
- No single user can exceed **18% of the wheel**
- If exceeded, overflow redistributes to other users proportionally
- Creates visual balance and psychological fairness

### 4. **Activity-Based Participation**
- Users inactive for **7+ days** are excluded
- Keeps wheel fresh and relevant
- Encourages consistent engagement

---

## Weight Calculation Algorithm

### Formula:
```javascript
baseWeight = MINIMUM_BASE_WEIGHT (1.0)
bonusWeight = sqrt(engagementScore) * SQRT_MULTIPLIER (0.5)
finalWeight = baseWeight + bonusWeight
```

### Example Calculation:
| User | Points | Raw % | Fair Weight | Fair % |
|------|--------|-------|-------------|--------|
| User A | 10,000 | 83.3% | 51.0 | 14.2% ✅ |
| User B | 1,000 | 8.3% | 16.8 | 4.7% |
| User C | 500 | 4.2% | 12.2 | 3.4% |
| User D | 100 | 0.8% | 6.0 | 1.7% |
| ... | ... | ... | ... | ... |
| User Z | 10 | 0.08% | 2.6 | 0.7% |

**Result:** 
- Top user with 10,000 points gets 14.2% instead of 83.3%
- Bottom user with 10 points gets 0.7% instead of 0.08%
- Everyone remains visible and hopeful!

---

## Engagement Scoring

Points are calculated based on TikTok live interactions:

| Action | Points | Reasoning |
|--------|--------|-----------|
| Gift | 100 | Primary value action |
| Follow | 50 | High commitment |
| Comment | 10 | Moderate engagement |
| Like | 1 | Minimal effort |

### Formula:
```javascript
engagementScore = (giftCount × 100) + (followCount × 50) + 
                  (commentCount × 10) + (likeCount × 1)
```

---

## Data Structure

### Firestore Collection: `scraper_users`

Each user document contains:

```typescript
{
  // Identity
  username: string,
  uniqueId: string,
  
  // Engagement
  giftCount: number,
  engagementScore: number,
  totalContribution: number,
  
  // Wheel Stats
  wheelWeight: number,          // Calculated weight
  wheelPercentage: number,       // % of wheel owned
  wins: number,                  // Total wins
  spinParticipationCount: number, // Total spins participated
  
  // Activity
  lastSeen: string (ISO timestamp),
  activityState: 'active' | 'inactive',
  createdAt: string (ISO timestamp),
  
  // Last Win (optional)
  lastWinTimestamp?: string,
  lastWinPrize?: string,
}
```

---

## API Endpoints

### `GET /api/wheel/users`
Fetches top 100 active users with fair weights calculated.

**Response:**
```json
{
  "users": [...],
  "count": 100,
  "timestamp": "2026-05-20T...",
  "config": {
    "MINIMUM_BASE_WEIGHT": 1.0,
    "MAX_USER_PERCENTAGE": 18,
    "INACTIVITY_DAYS": 7,
    "MAX_USERS": 100
  },
  "stats": {
    "totalEngagement": 125430,
    "topUserPercentage": 14.2,
    "averagePercentage": 1.0
  }
}
```

### `POST /api/wheel/record-win`
Records a user's win after prize selection.

**Body:**
```json
{
  "userId": "user_unique_id",
  "prize": "10% Discount"
}
```

### `PATCH /api/wheel/record-win`
Increments spin participation for all users in current spin.

**Body:**
```json
{
  "userIds": ["user1", "user2", ...]
}
```

---

## Psychological Design

### Why This Works:

1. **Visible Representation**
   - Everyone sees their name on the wheel
   - Small users feel included, not invisible
   - Creates community feeling

2. **Fair Advantage**
   - Top supporters get 10-15x better odds
   - But not 100x better (which feels rigged)
   - Maintains hope for all participants

3. **Anti-Whale Protection**
   - Prevents "impossible to win" feeling
   - Keeps smaller users emotionally engaged
   - Encourages long-term participation

4. **Transparency**
   - Fair percentages displayed in admin
   - System feels honest and balanced
   - Users trust the outcome

---

## Configuration Tuning

Adjust these constants in `/api/wheel/users.ts`:

```javascript
const WHEEL_CONFIG = {
  MINIMUM_BASE_WEIGHT: 1.0,    // ↑ = more equality
  MAX_USER_PERCENTAGE: 18,     // ↓ = less whale dominance
  INACTIVITY_DAYS: 7,          // ↓ = fresher pool
  MAX_USERS: 100,              // ↑ = more participants
  SQRT_MULTIPLIER: 0.5,        // ↓ = less advantage for whales
};
```

### Tuning Guide:

**More Equality:**
- ↑ Increase `MINIMUM_BASE_WEIGHT` (e.g., 1.5)
- ↓ Decrease `SQRT_MULTIPLIER` (e.g., 0.3)
- ↓ Decrease `MAX_USER_PERCENTAGE` (e.g., 15)

**More Reward for Top Users:**
- ↑ Increase `SQRT_MULTIPLIER` (e.g., 0.7)
- ↑ Increase `MAX_USER_PERCENTAGE` (e.g., 25)
- ↓ Decrease `MINIMUM_BASE_WEIGHT` (e.g., 0.5)

---

## Performance Considerations

### Scalability:
- **Supports 1000s of users** in database
- Only top 100 loaded into wheel
- Firestore batch operations for weight updates
- Async weight calculation (non-blocking)

### Optimization:
- Server-side weight calculation (reduces client load)
- Cached wheel percentages in database
- Throttled API calls during spin
- GPU-accelerated wheel rendering

---

## Future Enhancements

### Potential Features:
1. **VIP Tier System** - Special multipliers for consistent supporters
2. **Streak Bonuses** - Reward multi-stream participation
3. **Time Decay** - Older contributions gradually lose weight
4. **Dynamic Caps** - Adjust max percentage based on user count
5. **Leaderboard Integration** - Display top contributors
6. **Historical Analytics** - Track win distribution over time

---

## Testing Scenarios

### Test Case 1: Single Whale
- User A: 100,000 points
- Users B-Z: 10-100 points each
- **Expected:** User A gets ~18% (capped), others share 82%

### Test Case 2: Multiple Whales
- Users A, B, C: 50,000 points each
- Users D-Z: 10-100 points each
- **Expected:** Top 3 each get ~15-18%, others share ~50%

### Test Case 3: Equal Distribution
- All users: 500 points each
- **Expected:** Everyone gets ~1% (perfectly equal)

### Test Case 4: Inactivity Filter
- 50 users active today
- 50 users inactive 8+ days
- **Expected:** Only 50 active users shown

---

## Troubleshooting

### "Top user dominates wheel visually"
- ✅ Decrease `MAX_USER_PERCENTAGE` to 15%
- ✅ Decrease `SQRT_MULTIPLIER` to 0.3

### "Small users too small to see"
- ✅ Increase `MINIMUM_BASE_WEIGHT` to 1.5
- ✅ Reduce `MAX_USERS` to 50

### "Wheel feels too equal, no reward for whales"
- ✅ Increase `SQRT_MULTIPLIER` to 0.7
- ✅ Increase `MAX_USER_PERCENTAGE` to 25%

### "Inactive users cluttering wheel"
- ✅ Decrease `INACTIVITY_DAYS` to 3

---

## Summary

This system creates a **psychologically fair, engaging, and scalable** fortune wheel that:

✅ Prevents whale domination  
✅ Keeps everyone hopeful  
✅ Rewards engagement proportionally  
✅ Maintains long-term excitement  
✅ Scales to thousands of users  
✅ Feels honest and transparent  

**Result:** Higher retention, more engagement, and a community that feels valued! 🎡✨
