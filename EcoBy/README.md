# TikTok Fortune Wheel 🎡

An interactive fortune wheel system for selecting and rewarding active TikTok live stream viewers with exciting prizes!

## Features

- **TikTok Live Stream Tracking**: Monitors user engagement (gifts, follows, comments, likes)
- **Dual Fortune Wheels**: 
  - First wheel selects a random winner from active viewers
  - Second wheel determines what prize they win
- **Prize Management**: Configure money, products, or promo codes as prizes
- **Admin Dashboard**: View tracked users, manage prizes, and see winners history
- **Engagement Scoring**: Weighted scoring system prioritizing gifts > follows > comments > likes

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: SQLite (better-sqlite3)
- **Backend**: Node.js

## Getting Started

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run the TikTok Scraper

During your TikTok live stream, run the scraper to track user engagement:

\`\`\`bash
npm run scraper
\`\`\`

**Note**: The current scraper is a demo/mock implementation. To track real TikTok data, you'll need to integrate with:
- [TikTok Live Connector](https://github.com/zerodytrash/TikTok-Live-Connector) (unofficial)
- TikTok official API (if available for your use case)
- Manual data entry through the admin panel

### 4. Update Scraper for Real TikTok Data

Edit \`src/lib/scraper/tiktok-scraper.js\` and integrate with TikTok Live events:

\`\`\`javascript
const { WebcastPushConnection } = require('tiktok-live-connector');

const tiktokLiveConnection = new WebcastPushConnection('YOUR_USERNAME');

tiktokLiveConnection.on('gift', data => {
  scraper.trackGift(data.uniqueId, data.uniqueId, data.giftName, data.diamondCount);
});

tiktokLiveConnection.on('follow', data => {
  scraper.trackFollow(data.uniqueId, data.uniqueId);
});

// ... more event handlers
\`\`\`

## Project Structure

\`\`\`
EcoBy/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Home page
│   │   ├── wheel/             # Fortune wheel page
│   │   ├── admin/             # Admin dashboard
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   └── FortuneWheel.tsx   # Main wheel component
│   ├── lib/                   # Utilities and database
│   │   ├── db.ts              # Database helpers
│   │   └── scraper/           # TikTok scraper
│   └── types/                 # TypeScript types
├── data/                      # SQLite database (auto-created)
└── package.json
\`\`\`

## Usage

### Home Page
Navigate between the Fortune Wheel and Admin Panel.

### Fortune Wheel (/wheel)
1. Click "SPIN THE WHEEL" to select a random winner from tracked users
2. After selection, automatically moves to the prize wheel
3. Prize wheel spins to determine what the winner receives
4. View winner details and spin again for more giveaways

### Admin Panel (/admin)
- **Users Tab**: View all tracked users with engagement scores
- **Prizes Tab**: Manage available prizes (activate/deactivate/delete)
- **Winners Tab**: See complete history of all giveaway winners

## Database Schema

### Users Table
- Tracks TikTok usernames and engagement metrics
- Calculates engagement score: (gifts × 100) + (follows × 50) + (comments × 10) + (likes × 1)

### Prizes Table
- Prize configuration with types: money, product, promo_code
- Probability weighting for wheel selection
- Active/inactive status

### Winners Table
- Records each giveaway result
- Links users to prizes with timestamps

## Customization

### Adding New Prizes

Use the database helpers in your code:

\`\`\`typescript
import { dbHelpers } from '@/lib/db';

dbHelpers.addPrize({
  name: '$100 Grand Prize',
  type: 'money',
  value: '100',
  description: 'Big cash prize!',
  probability: 5,
  isActive: true
});
\`\`\`

### Changing Engagement Scoring

Edit the \`calculateEngagementScore\` function in \`src/lib/scraper/tiktok-scraper.js\`:

\`\`\`javascript
calculateEngagementScore(followCount, giftCount, likeCount, commentCount) {
  // Customize weights here
  return (giftCount * 100) + (followCount * 50) + (commentCount * 10) + (likeCount * 1);
}
\`\`\`

### Styling the Wheels

Modify colors in \`src/components/FortuneWheel.tsx\`:

\`\`\`typescript
const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', // ... add your colors
];
\`\`\`

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run scraper\` - Run TikTok scraper (demo mode)

## Next Steps

1. **Integrate Real TikTok Data**: Connect to TikTok's live stream API or use community libraries
2. **Add Authentication**: Protect admin panel with authentication
3. **Deploy**: Host on Vercel, Netlify, or your preferred platform
4. **Database Upgrade**: Migrate from SQLite to PostgreSQL for production
5. **Add Prize Images**: Enhance UI with prize images and animations
6. **Email Notifications**: Automatically notify winners

## License

MIT

## Support

For issues or questions, please check the TikTok Live Connector documentation or create an issue in this repository.

---

**Good luck with your TikTok streams! 🎉**
