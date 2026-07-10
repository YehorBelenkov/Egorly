const TikTokScraper = require('./tiktok-scraper');

// Use global to persist instance across Next.js hot reloads
const SCRAPER_KEY = Symbol.for('tiktok.scraper.instance');

function getScraperInstance() {
  // Check global first to survive hot reloads
  if (!global[SCRAPER_KEY]) {
    global[SCRAPER_KEY] = new TikTokScraper();
    console.log('🎯 TikTok Scraper instance created');
  } else {
    console.log('♻️ Reusing existing TikTok Scraper instance');
  }
  return global[SCRAPER_KEY];
}

module.exports = { getScraperInstance };
