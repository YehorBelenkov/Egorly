export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { order } = req.body;

        if (!order) {
            return res.status(400).json({ error: 'Order data is required' });
        }

        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
        const AUTHORIZED_USERNAME = 'RegorBelenkov'; // Your Telegram username (without @)

        // If no chat ID is configured, log instructions but don't fail
        if (!TELEGRAM_CHAT_ID) {
            console.warn('⚠️ TELEGRAM_CHAT_ID not configured!');
            console.warn('📱 To receive order notifications:');
            console.warn('1. Message your bot on Telegram');
            console.warn('2. Get your Chat ID from @userinfobot or');
            console.warn('   https://api.telegram.org/bot8376385543:AAHqA3Scvocp6jYOIswl9pwPJrkdEfuISZE/getUpdates');
            console.warn('3. Add TELEGRAM_CHAT_ID to your .env.local file');
            return res.status(200).json({ 
                success: true, 
                warning: 'Telegram Chat ID not configured. See console for setup instructions.' 
            });
        }

        // Verify the chat belongs to the authorized user
        try {
            const verifyUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat`;
            const verifyResponse = await fetch(`${verifyUrl}?chat_id=${TELEGRAM_CHAT_ID}`);
            const chatData = await verifyResponse.json();
            
            if (chatData.ok) {
                const username = chatData.result.username;
                if (username !== AUTHORIZED_USERNAME) {
                    console.error('❌ Unauthorized Telegram user detected:', username);
                    console.error('Only @' + AUTHORIZED_USERNAME + ' is authorized to receive notifications');
                    return res.status(403).json({ 
                        success: false, 
                        error: 'Unauthorized Telegram user' 
                    });
                }
            }
        } catch (verifyError) {
            console.error('Error verifying Telegram user:', verifyError);
            // Continue anyway if verification fails
        }

        // Format order items
        const itemsList = order.items.map((item, index) => 
            `${index + 1}. ${item.name}\n   Qty: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}`
        ).join('\n');

        // Create the message
        const message = `
🔔 *NEW ORDER RECEIVED* 🔔

📋 *Order ID:* ${order.orderId || order.id?.slice(-8).toUpperCase() || 'N/A'}
📅 *Date:* ${new Date(order.orderDate).toLocaleString('en-US', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
})}

👤 *Customer Information:*
• Name: ${order.customerInfo.fullName}
• Email: ${order.userEmail}
• Phone: ${order.customerInfo.phone}

📦 *Items Ordered:*
${itemsList}

📍 *Shipping Address:*
${order.shippingAddress.address}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}

💰 *Payment Summary:*
• Subtotal: $${order.totals.subtotal.toFixed(2)}
• Shipping: $${order.totals.shipping.toFixed(2)}
• Tax: $${order.totals.tax.toFixed(2)}
• *TOTAL PAID: $${order.totals.total.toFixed(2)}*

✅ Payment Status: PAID
⚡ Status: Processing
`;

        // Send message to Telegram
        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
            }),
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Telegram API Error:', data);
            // Don't fail the order if notification fails
            return res.status(200).json({ 
                success: true, 
                warning: 'Order saved but notification failed',
                error: data.description 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Notification sent successfully' 
        });

    } catch (error) {
        console.error('Error sending Telegram notification:', error);
        // Don't fail the order if notification fails
        return res.status(200).json({ 
            success: true, 
            warning: 'Order saved but notification failed' 
        });
    }
}
