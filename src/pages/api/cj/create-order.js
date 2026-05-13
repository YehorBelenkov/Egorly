// CJ Dropshipping API - Create Order V3
import { getCJAccessToken, callCJApiWithRetry } from '../../../lib/cjAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderNumber, shippingAddress, productList, remark } = req.body;

  // Validate required fields
  if (!orderNumber || !shippingAddress || !productList || productList.length === 0) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: {
        orderNumber: 'string',
        shippingAddress: {
          name: 'string',
          country: 'string (2-letter code)',
          province: 'string',
          city: 'string',
          address: 'string',
          zip: 'string',
          phone: 'string'
        },
        productList: '[{ vid: string, quantity: number }]'
      }
    });
  }

  // Validate shipping address fields
  const { name, country, province, city, address, zip, phone } = shippingAddress;
  if (!name || !country || !province || !city || !address || !zip || !phone) {
    return res.status(400).json({ 
      error: 'Incomplete shipping address',
      missing: [
        !name && 'name',
        !country && 'country',
        !province && 'province',
        !city && 'city',
        !address && 'address',
        !zip && 'zip',
        !phone && 'phone'
      ].filter(Boolean)
    });
  }

  const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

  try {
    const result = await callCJApiWithRetry(async () => {
      // Get access token (cached or fresh)
      const accessToken = await getCJAccessToken();

      // Create order with CJ
      const response = await fetch(`${CJ_API_URL}/shopping/order/createOrderV3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': accessToken,
        },
        body: JSON.stringify({
          orderNumber,
          shippingAddress: {
            name,
            country,
            province,
            city,
            address,
            zip,
            phone
          },
          productList: productList.map(p => ({
            vid: p.vid,
            quantity: parseInt(p.quantity)
          })),
          ...(remark && { remark })
        })
      });

      const data = await response.json();

      if (!data.result || data.code !== 200) {
        // Attach data to error for token detection
        const error = new Error(data.message || 'Failed to create order with CJ');
        error.data = data;
        error.code = data.code;
        
        console.error('CJ Create Order Error:', {
          code: data.code,
          message: data.message,
          orderNumber
        });
        
        throw error;
      }

      return data.data;
    });

    // Extract order details and shipment info
    const orderData = result;
    
    const formattedResponse = {
      success: true,
      order: {
        orderId: orderData.orderId,
        orderNumber,
        shipments: orderData.shipmentOrderList?.map(shipment => ({
          shipmentOrderId: shipment.shipmentOrderId,
          totalAmount: shipment.totalAmount, // Product + shipping cost
          products: shipment.products,
          status: 'pending_payment'
        })) || [],
        totalAmount: orderData.shipmentOrderList?.reduce((sum, s) => sum + s.totalAmount, 0) || 0
      }
    };

    console.log('✅ CJ Order Created:', {
      orderId: orderData.orderId,
      shipmentCount: orderData.shipmentOrderList?.length || 0,
      totalAmount: formattedResponse.order.totalAmount
    });

    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('CJ API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message 
    });
  }
}
