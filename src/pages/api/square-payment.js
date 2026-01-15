import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, amount, orderData } = req.body;

    console.log("=== SQUARE PAYMENT PROCESSING ===");
    console.log("Payment amount:", amount, "cents");
    console.log("Order data:", orderData?.customerInfo?.fullName);
    console.log("Environment check:");
    console.log("- SQUARE_ACCESS_TOKEN exists:", !!process.env.SQUARE_ACCESS_TOKEN);
    console.log("- SQUARE_LOCATION_ID exists:", !!process.env.SQUARE_LOCATION_ID);
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log("- All env keys:", Object.keys(process.env).filter(k => k.includes('SQUARE')));
    
    // Validate required data
    if (!token) {
      console.error("Missing payment token");
      return res.status(400).json({ 
        success: false, 
        error: "Payment token is required" 
      });
    }

    if (!amount || amount <= 0) {
      console.error("Invalid amount:", amount);
      return res.status(400).json({ 
        success: false, 
        error: "Valid payment amount is required" 
      });
    }
    
    // Validate environment variables
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.error("Missing SQUARE_ACCESS_TOKEN");
      return res.status(500).json({ 
        success: false, 
        error: "Server configuration error - missing access token" 
      });
    }

    // Prepare payment data for Square API
    const paymentData = {
      source_id: token,
      amount_money: {
        amount: amount,
        currency: "USD"
      },
      idempotency_key: randomUUID(),
      // Add order context for Square dashboard
      note: `Egorly - ${orderData?.customerInfo?.fullName || 'Customer'} - ${orderData?.cartItems?.length || 0} items`
    };
    
    console.log("Making Square API call...");
    console.log("Payment data:", JSON.stringify(paymentData, null, 2));
    
    const response = await fetch("https://connect.squareup.com/v2/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "Square-Version": "2023-10-18"
      },
      body: JSON.stringify(paymentData)
    });
    
    const responseData = await response.json();
    console.log("Square API response status:", response.status);
    console.log("Square API response:", JSON.stringify(responseData, null, 2));
    
    if (response.ok && responseData.payment) {
      console.log("Payment successful! ID:", responseData.payment.id);
      
      // Here you could:
      // 1. Save order to your database
      // 2. Send confirmation email
      // 3. Update inventory
      // 4. Trigger fulfillment process
      
      return res.status(200).json({
        success: true,
        paymentId: responseData.payment.id,
        status: responseData.payment.status,
        orderId: `EGORLY-${Date.now()}` // Generate a simple order ID
      });
    } else {
      console.error("Payment failed:", responseData.errors);
      return res.status(400).json({
        success: false,
        error: responseData.errors?.[0]?.detail || "Payment processing failed",
        details: responseData.errors
      });
    }
    
  } catch (error) {
    console.error("Payment processing error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error during payment processing",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}