import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    customerEmail, 
    customerName, 
    orderId, 
    orderNumber,
    items, 
    totals,
    shippingAddress,
    deliveryEstimate,
    orderDate 
  } = req.body;

  if (!customerEmail || !customerName || !orderId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create beautiful HTML email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 20px;
          }
          .header-title {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          .header-subtitle {
            color: #ffffff;
            font-size: 16px;
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
          }
          .thank-you {
            font-size: 24px;
            font-weight: bold;
            color: #333333;
            margin: 0 0 10px 0;
          }
          .message {
            font-size: 16px;
            color: #666666;
            line-height: 1.6;
            margin: 0 0 30px 0;
          }
          .order-info {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .order-info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .order-info-row:last-child {
            border-bottom: none;
          }
          .order-info-label {
            font-weight: 600;
            color: #495057;
          }
          .order-info-value {
            color: #212529;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333333;
            margin: 30px 0 15px 0;
          }
          .item {
            display: flex;
            padding: 15px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .item:last-child {
            border-bottom: none;
          }
          .item-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
            margin-right: 15px;
          }
          .item-details {
            flex: 1;
          }
          .item-name {
            font-weight: 600;
            color: #333333;
            margin: 0 0 5px 0;
          }
          .item-variant {
            font-size: 14px;
            color: #666666;
            margin: 0 0 5px 0;
          }
          .item-quantity {
            font-size: 14px;
            color: #666666;
          }
          .item-price {
            font-weight: 600;
            color: #333333;
            text-align: right;
          }
          .totals {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .total-label {
            color: #495057;
          }
          .total-value {
            color: #212529;
            font-weight: 600;
          }
          .total-final {
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
            border-top: 2px solid #dee2e6;
            padding-top: 15px;
            margin-top: 10px;
          }
          .shipping-info {
            background-color: #e7f3ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .shipping-title {
            font-weight: 600;
            color: #333333;
            margin: 0 0 10px 0;
          }
          .shipping-address {
            font-size: 14px;
            color: #666666;
            line-height: 1.6;
            margin: 0;
          }
          .delivery-estimate {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .delivery-title {
            font-weight: 600;
            color: #155724;
            margin: 0 0 5px 0;
          }
          .delivery-text {
            font-size: 14px;
            color: #155724;
            margin: 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
          }
          .footer-text {
            font-size: 14px;
            color: #6c757d;
            margin: 5px 0;
          }
          .footer-link {
            color: #667eea;
            text-decoration: none;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #667eea;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <img src="https://firebasestorage.googleapis.com/v0/b/ecoby-73116.firebasestorage.app/o/Egorly.jpg?alt=media&token=513ff7b1-8db1-49b9-b25d-814b9c5d83e5" alt="Egorly Logo" class="logo">
            <h1 class="header-title">Egorly</h1>
            <p class="header-subtitle">Premium Quality Products</p>
          </div>

          <!-- Content -->
          <div class="content">
            <h2 class="thank-you">Thank You for Your Order! 🎉</h2>
            <p class="message">
              Hi ${customerName},<br><br>
              We're excited to confirm that we've received your order! Your purchase is being processed and will be shipped soon.
            </p>

            <!-- Order Information -->
            <div class="order-info">
              <div class="order-info-row">
                <span class="order-info-label">Order Number:</span>
                <span class="order-info-value">${orderNumber}</span>
              </div>
              <div class="order-info-row">
                <span class="order-info-label">Order ID:</span>
                <span class="order-info-value">${orderId}</span>
              </div>
              <div class="order-info-row">
                <span class="order-info-label">Order Date:</span>
                <span class="order-info-value">${new Date(orderDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>

            ${deliveryEstimate ? `
            <!-- Delivery Estimate -->
            <div class="delivery-estimate">
              <p class="delivery-title">📦 Estimated Delivery</p>
              <p class="delivery-text">${deliveryEstimate.days} via ${deliveryEstimate.method}</p>
            </div>
            ` : ''}

            <!-- Order Items -->
            <h3 class="section-title">Order Items</h3>
            ${items.map(item => `
              <div class="item">
                <img src="${item.imageUrl || item.image || 'https://via.placeholder.com/80'}" alt="${item.name}" class="item-image">
                <div class="item-details">
                  <p class="item-name">${item.name}</p>
                  <p class="item-quantity">Quantity: ${item.quantity}</p>
                </div>
                <div class="item-price">
                  $${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            `).join('')}

            <!-- Totals -->
            <div class="totals">
              <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span class="total-value">$${totals.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span class="total-label">Shipping:</span>
                <span class="total-value">Included in product price</span>
              </div>
              <div class="total-row">
                <span class="total-label">Tax:</span>
                <span class="total-value">$${totals.tax.toFixed(2)}</span>
              </div>
              <div class="total-row total-final">
                <span class="total-label">Total:</span>
                <span class="total-value">$${totals.total.toFixed(2)}</span>
              </div>
            </div>

            <!-- Shipping Information -->
            <div class="shipping-info">
              <p class="shipping-title">📍 Shipping Address</p>
              <p class="shipping-address">
                ${customerName}<br>
                ${shippingAddress.address}<br>
                ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br>
                ${shippingAddress.country || 'United States'}
              </p>
            </div>

            <center>
              <a href="https://egorly.com/profile" class="button">Track Your Order</a>
            </center>

            <p class="message">
              If you have any questions about your order, please don't hesitate to contact us at 
              <a href="mailto:support@egorly.com" style="color: #667eea;">support@egorly.com</a>
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p class="footer-text">Thank you for shopping with Egorly!</p>
            <p class="footer-text">
              <a href="https://egorly.com" class="footer-link">Visit Our Store</a> | 
              <a href="mailto:support@egorly.com" class="footer-link">Contact Support</a>
            </p>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
              © ${new Date().getFullYear()} Egorly. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    const data = await resend.emails.send({
      from: 'Egorly Orders <orders@egorly.com>',
      to: [customerEmail],
      subject: `Order Confirmation - ${orderNumber}`,
      html: emailHtml,
    });

    console.log('✅ Order confirmation email sent:', data.id);

    return res.status(200).json({ 
      success: true, 
      emailId: data.id,
      message: 'Order confirmation sent successfully' 
    });

  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
