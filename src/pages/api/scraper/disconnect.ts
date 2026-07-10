import { NextApiRequest, NextApiResponse } from 'next';

const { getScraperInstance } = require('../../../lib/scraper/instance');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      console.log('📡 Disconnect API called');
      const scraperInstance = getScraperInstance();
      
      const statusBefore = scraperInstance.getConnectionStatus();
      console.log('Status before disconnect:', statusBefore);
      
      scraperInstance.disconnect();
      
      const statusAfter = scraperInstance.getConnectionStatus();
      console.log('Status after disconnect:', statusAfter);

      return res.status(200).json({
        success: true,
        message: 'Disconnected from live stream',
        isConnected: statusAfter.isConnected
      });
    } catch (error: any) {
      console.error('Disconnect API error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to disconnect'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
