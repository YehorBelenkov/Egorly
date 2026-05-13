// CJ Dropshipping API - Pay Shipment
import { getCJAccessToken, callCJApiWithRetry } from '../../../lib/cjAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shipmentOrderId, payId } = req.body;

  if (!shipmentOrderId || !payId) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: {
        shipmentOrderId: 'string (from createOrderV3 response)',
        payId: 'string (unique payment identifier, e.g., PAY-ORDER-123-SHP-001)'
      }
    });
  }

  const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

  try {
    await callCJApiWithRetry(async () => {
      // Get access token (cached or fresh)
      const accessToken = await getCJAccessToken();

      // Pay for shipment
      const response = await fetch(`${CJ_API_URL}/shopping/pay/payBalanceV2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': accessToken,
        },
        body: JSON.stringify({
          shipmentOrderId,
          payId
        })
      });

      const data = await response.json();

      if (!data.result || data.code !== 200) {
        // Attach data to error for token detection
        const error = new Error(data.message || 'Failed to pay shipment');
        error.data = data;
        error.code = data.code;
        
        console.error('CJ Pay Shipment Error:', {
          code: data.code,
          message: data.message,
          shipmentOrderId,
          payId
        });
        
        throw error;
      }

      return data.data;
    });

    console.log('✅ CJ Shipment Paid:', {
      shipmentOrderId,
      payId
    });

    return res.status(200).json({
      success: true,
      payment: {
        shipmentOrderId,
        payId,
        status: 'paid',
        message: 'Shipment payment successful'
      }
    });

  } catch (error) {
    console.error('CJ API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process payment',
      details: error.message 
    });
  }
}
