// CJ Dropshipping API - Track Order
import { getCJAccessToken, callCJApiWithRetry } from '../../../lib/cjAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.query;

  if (!orderId) {
    return res.status(400).json({ 
      error: 'Missing required field: orderId (from createOrderV3 response)' 
    });
  }

  const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

  try {
    const orderData = await callCJApiWithRetry(async () => {
      // Get access token (cached or fresh)
      const accessToken = await getCJAccessToken();

      // Get order details including tracking
      const response = await fetch(`${CJ_API_URL}/shopping/order/getOrderDetail?orderId=${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: {
          'CJ-Access-Token': accessToken,
        }
      });

      const data = await response.json();

      if (!data.result || data.code !== 200) {
        // Attach data to error for token detection
        const error = new Error(data.message || 'Failed to get order details');
        error.data = data;
        error.code = data.code;
        
        console.error('CJ Get Order Detail Error:', {
          code: data.code,
          message: data.message,
          orderId
        });
        
        throw error;
      }

      return data.data;
    });

    // Format tracking information
    const formattedResponse = {
      success: true,
      order: {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        createTime: orderData.createTime,
        orderStatus: orderData.orderStatus,
        shipments: orderData.shipmentOrderList?.map(shipment => ({
          shipmentOrderId: shipment.shipmentOrderId,
          trackingNumber: shipment.trackingNumber || null,
          logisticsCompany: shipment.logisticsCompany || null,
          logisticsName: shipment.logisticsName || null,
          status: shipment.status,
          totalAmount: shipment.totalAmount,
          products: shipment.products?.map(p => ({
            vid: p.vid,
            productName: p.productName,
            variantName: p.variantName,
            quantity: p.quantity,
            price: p.price
          })) || [],
          // Tracking URL if available
          trackingUrl: shipment.trackingNumber 
            ? `https://www.cjdropshipping.com/track.html?number=${shipment.trackingNumber}`
            : null
        })) || []
      }
    };

    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('CJ API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to track order',
      details: error.message 
    });
  }
}
