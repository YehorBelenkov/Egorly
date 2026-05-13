// Save Order to Firestore (Server-side with Admin SDK)
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    orderId,
    userId,
    isGuest,
    cjOrderId,
    cjShipments,
    orderNumber,
    customerInfo,
    shippingAddress,
    items,
    totals,
    deliveryEstimate,
    squarePaymentId,
    cjPaymentStatus,
    needsFunding
  } = req.body;

  // Validate required fields
  if (!orderId || !orderNumber || !customerInfo || !shippingAddress || !items) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['orderId', 'orderNumber', 'customerInfo', 'shippingAddress', 'items']
    });
  }

  try {
    const db = admin.firestore(); // Admin SDK - bypasses security rules

    const orderData = {
      orderId,
      userId: userId || null,
      isGuest: isGuest || false,
      orderNumber,
      
      // CJ Order Info
      cjOrderId: cjOrderId || null,
      cjShipments: cjShipments || [],
      cjPaymentStatus: cjPaymentStatus || 'pending',
      needsFunding: needsFunding || false,
      
      // Customer Info
      customerInfo: {
        fullName: customerInfo.fullName,
        email: customerInfo.email,
        phone: customerInfo.phone
      },
      
      // Shipping Address
      shippingAddress: {
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        country: shippingAddress.country || 'US'
      },
      
      // Order Items
      items: items.map(item => ({
        name: item.name,
        variant: item.variant || {},
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl || item.image
      })),
      
      // Totals
      totals: {
        subtotal: totals?.subtotal || 0,
        shipping: totals?.shipping || 0,
        tax: totals?.tax || 0,
        total: totals?.total || 0
      },
      
      // Delivery Estimate
      deliveryEstimate: deliveryEstimate || null,
      
      // Payment Info
      squarePaymentId: squarePaymentId || null,
      
      // Order Status
      status: needsFunding ? 'needs_funding' : 'processing',
      
      // Timestamps
      orderDate: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to global orders collection using Admin SDK
    await db.collection('orders').doc(orderId).set(orderData);
    
    // Also save to user's or guest's orders subcollection for their access
    if (isGuest && userId) {
      await db.collection('guestUsers').doc(userId).collection('orders').doc(orderId).set(orderData);
      console.log(`✅ Order saved to guestUsers/${userId}/orders/${orderId}`);
    } else if (userId) {
      await db.collection('users').doc(userId).collection('orders').doc(orderId).set(orderData);
      console.log(`✅ Order saved to users/${userId}/orders/${orderId}`);
    }

    console.log('✅ Order saved to global orders collection:', orderId);

    return res.status(200).json({
      success: true,
      orderId,
      message: 'Order saved successfully'
    });

  } catch (error) {
    console.error('❌ Error saving order:', error);
    return res.status(500).json({ 
      error: 'Failed to save order',
      details: error.message 
    });
  }
}
