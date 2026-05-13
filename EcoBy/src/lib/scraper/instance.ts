// Global scraper instance shared across API routes
// In production, consider using Redis or another state management solution

let scraperInstance = null;

export function getScraperInstance() {
  if (!scraperInstance) {
    const TikTokScraper = require('@/lib/scraper/tiktok-scraper');
    scraperInstance = new TikTokScraper();
  }
  return scraperInstance;
}

export function clearScraperInstance() {
  if (scraperInstance) {
    try {
      scraperInstance.close();
    } catch (error) {
      console.error('Error closing scraper:', error);
    }
    scraperInstance = null;
  }
}
