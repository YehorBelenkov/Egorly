import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function TestInvoice() {
  const [testData, setTestData] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // Load test data from sessionStorage
    const data = sessionStorage.getItem('testInvoiceData');
    if (data) {
      setTestData(JSON.parse(data));
    }
  }, []);

  const handleSendTest = async () => {
    if (!testData) {
      alert('No test data available!');
      return;
    }

    setSending(true);
    
    try {
      const response = await fetch('/api/send-order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: 'yehorbelenkov@gmail.com',
          customerName: testData.customerInfo.fullName || 'Test Customer',
          orderId: `TEST-${Date.now()}`,
          orderNumber: `TEST-ORDER-${Date.now()}`,
          items: testData.cart || [],
          totals: {
            subtotal: testData.subtotal || 0,
            shipping: 0,
            tax: (testData.subtotal || 0) * 0.1,
            total: (testData.subtotal || 0) * 1.1
          },
          shippingAddress: testData.shippingAddress || {},
          deliveryEstimate: testData.deliveryEstimate || null,
          orderDate: new Date().toISOString()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSent(true);
        alert('✅ Test invoice sent to yehorbelenkov@gmail.com!');
      } else {
        alert('❌ Failed to send: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  if (!testData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>No test data found</h2>
        <p>Please go to checkout page first and click the test button</p>
        <button onClick={() => window.location.href = '/checkout'}>
          Go to Checkout
        </button>
      </div>
    );
  }

  const totals = {
    subtotal: testData.subtotal || 0,
    shipping: 0,
    tax: (testData.subtotal || 0) * 0.1,
    total: (testData.subtotal || 0) * 1.1
  };

  return (
    <>
      <Head>
        <title>Test Invoice Preview - Egorly</title>
      </Head>
      
      <div style={{ 
        maxWidth: '800px', 
        margin: '40px auto', 
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ 
          marginBottom: '30px', 
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h1 style={{ margin: '0 0 10px 0' }}>📧 Invoice Preview</h1>
          <p style={{ margin: 0, color: '#666' }}>
            This is how the email will look when sent to customers
          </p>
        </div>

        {/* Email Preview */}
        <div style={{ 
          border: '2px solid #ddd', 
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '30px',
          backgroundColor: '#fff'
        }}>
          <InvoicePreview data={testData} totals={totals} />
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={handleSendTest}
            disabled={sending || sent}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: sent ? '#28a745' : '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: sending || sent ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.7 : 1
            }}
          >
            {sending ? '📤 Sending...' : sent ? '✅ Sent!' : '📨 Send Test to yehorbelenkov@gmail.com'}
          </button>

          <button
            onClick={() => window.location.href = '/checkout'}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← Back to Checkout
          </button>
        </div>
      </div>
    </>
  );
}

// Invoice Preview Component (matches the email HTML)
function InvoicePreview({ data, totals }) {
  const orderId = `TEST-${Date.now()}`;
  const orderNumber = `TEST-ORDER-${Date.now()}`;
  
  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <img 
          src="/images/Egorly.jpg" 
          alt="Egorly Logo" 
          style={{ maxWidth: '150px', height: 'auto', marginBottom: '20px' }}
        />
        <h1 style={{ 
          color: '#ffffff', 
          fontSize: '28px', 
          fontWeight: 'bold', 
          margin: 0 
        }}>
          Egorly
        </h1>
        <p style={{ 
          color: '#ffffff', 
          fontSize: '16px', 
          margin: '10px 0 0 0', 
          opacity: 0.9 
        }}>
          Premium Quality Products
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '40px 30px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#333333', 
          margin: '0 0 10px 0' 
        }}>
          Thank You for Your Order! 🎉
        </h2>
        <p style={{ 
          fontSize: '16px', 
          color: '#666666', 
          lineHeight: '1.6', 
          margin: '0 0 30px 0' 
        }}>
          Hi {data.customerInfo.fullName || 'Customer'},<br/><br/>
          We're excited to confirm that we've received your order! Your purchase is being processed and will be shipped soon.
        </p>

        {/* Order Information */}
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '10px 0', 
            borderBottom: '1px solid #e9ecef' 
          }}>
            <span style={{ fontWeight: 600, color: '#495057' }}>Order Number:</span>
            <span style={{ color: '#212529' }}>{orderNumber}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '10px 0', 
            borderBottom: '1px solid #e9ecef' 
          }}>
            <span style={{ fontWeight: 600, color: '#495057' }}>Order ID:</span>
            <span style={{ color: '#212529' }}>{orderId}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '10px 0' 
          }}>
            <span style={{ fontWeight: 600, color: '#495057' }}>Order Date:</span>
            <span style={{ color: '#212529' }}>
              {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Delivery Estimate */}
        {data.deliveryEstimate && (
          <div style={{
            backgroundColor: '#d4edda',
            borderLeft: '4px solid #28a745',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '30px'
          }}>
            <p style={{ 
              fontWeight: 600, 
              color: '#155724', 
              margin: '0 0 5px 0' 
            }}>
              📦 Estimated Delivery
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#155724', 
              margin: 0 
            }}>
              {data.deliveryEstimate.days} via {data.deliveryEstimate.method}
            </p>
          </div>
        )}

        {/* Order Items */}
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#333333', 
          margin: '30px 0 15px 0' 
        }}>
          Order Items
        </h3>
        
        {data.cart && data.cart.map((item, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            padding: '15px 0', 
            borderBottom: '1px solid #e9ecef' 
          }}>
            <img 
              src={item.imageUrl || item.image || '/images/calamari_product_salt.png'} 
              alt={item.name}
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginRight: '15px'
              }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ 
                fontWeight: 600, 
                color: '#333333', 
                margin: '0 0 5px 0' 
              }}>
                {item.name}
              </p>
              <p style={{ 
                fontSize: '14px', 
                color: '#666666',
                margin: 0
              }}>
                Quantity: {item.quantity || 1}
              </p>
            </div>
            <div style={{ 
              fontWeight: 600, 
              color: '#333333', 
              textAlign: 'right' 
            }}>
              ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
            </div>
          </div>
        ))}

        {/* Totals */}
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '8px 0' 
          }}>
            <span style={{ color: '#495057' }}>Subtotal:</span>
            <span style={{ color: '#212529', fontWeight: 600 }}>
              ${totals.subtotal.toFixed(2)}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '8px 0' 
          }}>
            <span style={{ color: '#495057' }}>Shipping:</span>
            <span style={{ color: '#212529', fontWeight: 600 }}>
              Included in product price
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '8px 0' 
          }}>
            <span style={{ color: '#495057' }}>Tax:</span>
            <span style={{ color: '#212529', fontWeight: 600 }}>
              ${totals.tax.toFixed(2)}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#667eea',
            borderTop: '2px solid #dee2e6',
            paddingTop: '15px',
            marginTop: '10px'
          }}>
            <span>Total:</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping Information */}
        <div style={{
          backgroundColor: '#e7f3ff',
          borderLeft: '4px solid #667eea',
          padding: '15px',
          borderRadius: '4px',
          margin: '20px 0'
        }}>
          <p style={{ 
            fontWeight: 600, 
            color: '#333333', 
            margin: '0 0 10px 0' 
          }}>
            📍 Shipping Address
          </p>
          <p style={{ 
            fontSize: '14px', 
            color: '#666666', 
            lineHeight: '1.6', 
            margin: 0 
          }}>
            {data.customerInfo.fullName}<br/>
            {data.shippingAddress.address}<br/>
            {data.shippingAddress.city}, {data.shippingAddress.state} {data.shippingAddress.zip}<br/>
            {data.shippingAddress.country || 'United States'}
          </p>
        </div>

        <center>
          <a 
            href="https://egorly.com/profile/orders" 
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              backgroundColor: '#667eea',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              margin: '20px 0'
            }}
          >
            Track Your Order
          </a>
        </center>

        <p style={{ 
          fontSize: '16px', 
          color: '#666666', 
          lineHeight: '1.6', 
          margin: 0 
        }}>
          If you have any questions about your order, please don't hesitate to contact us at{' '}
          <a href="mailto:support@egorly.com" style={{ color: '#667eea' }}>
            support@egorly.com
          </a>
        </p>
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '30px',
        textAlign: 'center',
        borderTop: '1px solid #dee2e6'
      }}>
        <p style={{ fontSize: '14px', color: '#6c757d', margin: '5px 0' }}>
          Thank you for shopping with Egorly!
        </p>
        <p style={{ fontSize: '14px', color: '#6c757d', margin: '5px 0' }}>
          <a href="https://egorly.com" style={{ color: '#667eea', textDecoration: 'none' }}>
            Visit Our Store
          </a>
          {' | '}
          <a href="mailto:support@egorly.com" style={{ color: '#667eea', textDecoration: 'none' }}>
            Contact Support
          </a>
        </p>
        <p style={{ 
          marginTop: '20px', 
          fontSize: '12px', 
          color: '#adb5bd',
          margin: '20px 0 5px 0'
        }}>
          © {new Date().getFullYear()} Egorly. All rights reserved.
        </p>
      </div>
    </div>
  );
}
