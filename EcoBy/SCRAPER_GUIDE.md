# TikTok Live Scraper - Testing Guide

## 🎯 Overview
The scraper now connects to **REAL TikTok live streams** and captures actual engagement data in real-time!

## 🚀 How to Test

### 1. Access the Scraper Test Page
Navigate to: **http://localhost:3000/scraper**

Or click the **"🎯 Test Scraper"** button from the Admin Panel.

### 2. Find a Live TikTok Stream
You need to find a TikTok user who is **currently LIVE**:

**Popular streamers to try:**
- Search TikTok for live streams with lots of viewers
- Gaming streamers usually have high engagement
- Look for streams with gift animations visible
- Check TikTok's "LIVE" section for popular broadcasts

**Tips:**
- More popular streams = more events to track
- Streams with gifts/comments happening = better for testing
- The streamer must be LIVE when you connect

### 3. Connect to the Stream
1. Enter the TikTok username (without the @ symbol)
2. Click **"Connect"**
3. Wait for connection confirmation

### 4. Watch Real-Time Data
Once connected, you'll see:

**Left Panel - Live Events Feed:**
- 🎁 Gifts (100 points each)
- ✅ Follows (50 points each)
- 💬 Comments (10 points each)
- ❤️ Likes (1 point each)
- 🔄 Shares

**Right Panel - Top Users Leaderboard:**
- Updates every 3 seconds automatically
- Shows engagement scores
- Displays breakdown of each action type

## 📊 What the Scraper Tracks

| Event Type | Points | Description |
|------------|--------|-------------|
| 🎁 Gifts | 100 | Virtual gifts sent to the streamer |
| ✅ Follows | 50 | New followers during the stream |
| 💬 Comments | 10 | Chat messages |
| ❤️ Likes | 1 | Hearts/likes sent |
| 🔄 Shares | 0 | Stream shares (tracked but no points) |

## ⚙️ Technical Details

### How It Works:
1. Uses `tiktok-live-connector` library to connect to TikTok's live stream API
2. Listens for real-time events (gifts, follows, comments, likes)
3. Stores user engagement data in SQLite database
4. Calculates engagement scores automatically
5. Updates the leaderboard in real-time

### Event Flow:
```
TikTok Live Stream → tiktok-live-connector → Scraper → Database → API → UI
```

### Files Modified:
- `/src/lib/scraper/tiktok-scraper.js` - Main scraper with real TikTok integration
- `/src/app/scraper/page.tsx` - Test UI page
- `/src/app/api/scraper/connect/route.ts` - Connection endpoint
- `/src/app/api/scraper/disconnect/route.ts` - Disconnection endpoint
- `/src/app/api/scraper/events/route.ts` - Server-Sent Events for real-time updates

## 🎮 Using the Scraped Data

After collecting engagement data, you can:

1. **Run the Fortune Wheel** (`/wheel`)
   - Uses the engagement scores to select winners
   - Higher engagement = more likely to win

2. **View Admin Dashboard** (`/admin`)
   - See all tracked users
   - Manage prizes
   - View winner history

## 🔧 Troubleshooting

### "Failed to connect"
- Make sure the username is correct (without @)
- Verify the user is currently LIVE
- Try a different streamer

### "No events appearing"
- The stream might not have much activity
- Try a more popular stream
- Wait a few seconds - events come as they happen

### "Already connected" error
- Click "Disconnect" first
- Refresh the page if needed

## 🌟 Next Steps

To use this in production:
1. Connect during YOUR live stream
2. Let it run for the entire stream duration
3. After stream ends, go to `/wheel` to select winners
4. The most engaged viewers will have the highest chance of winning!

## 📝 Notes

- The scraper must stay connected during the entire stream
- Data is saved to the database in real-time
- You can connect/disconnect as many times as needed
- Closing the browser will disconnect the scraper

---

**Ready to test?** Visit: http://localhost:3000/scraper
