// CJ Dropshipping API - Check Balance
import { getCJAccessToken, callCJApiWithRetry } from '../../../lib/cjAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

  try {
    const balance = await callCJApiWithRetry(async () => {
      // Get access token (cached or fresh)
      const accessToken = await getCJAccessToken();

      // Check CJ wallet balance
      const response = await fetch(`${CJ_API_URL}/shopping/pay/getBalance`, {
        method: 'GET',
        headers: {
          'CJ-Access-Token': accessToken,
        }
      });

      const data = await response.json();

      if (!data.result || data.code !== 200) {
        // Attach data to error for token detection
        const error = new Error(data.message || 'Failed to get CJ balance');
        error.data = data;
        error.code = data.code;
        
        console.error('CJ Get Balance Error:', {
          code: data.code,
          message: data.message
        });
        
        throw error;
      }

      return data.data.amount;
    });

    return res.status(200).json({
      success: true,
      balance: {
        amount: balance,
        currency: 'USD',
        formatted: `$${balance.toFixed(2)}`
      }
    });

  } catch (error) {
    console.error('CJ API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to check balance',
      details: error.message 
    });
  }
}
