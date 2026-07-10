import { NextApiRequest, NextApiResponse } from 'next';

const { getScraperInstance } = require('../../../lib/scraper/instance');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const scraperInstance = getScraperInstance();

  if (req.method === 'GET') {
    try {
      const status = scraperInstance.getConnectionStatus();
      return res.status(200).json(status);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      // Check if already connected
      const status = scraperInstance.getConnectionStatus();
      if (status.isConnected) {
        return res.status(400).json({
          error: 'Already connected to a live stream. Disconnect first.',
          currentUsername: status.username
        });
      }

      // Clear all existing users before connecting to new stream
      await scraperInstance.clearAllUsers();
      console.log('🗑️  Cleared all users for new stream');

      // Connect to TikTok live stream
      const result = await scraperInstance.connect(username);

      if (result.success) {
        // Get updated connection status
        const status = scraperInstance.getConnectionStatus();
        return res.status(200).json({
          success: true,
          message: result.message,
          username,
          isConnected: status.isConnected
        });
      } else {
        return res.status(500).json({
          error: result.message,
          isConnected: false
        });
      }
    } catch (error: any) {
      console.error('Connect API error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to connect to TikTok live stream'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
