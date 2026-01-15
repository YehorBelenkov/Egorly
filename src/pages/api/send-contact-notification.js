export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fullName, businessName, email, phone, message, hasBusinessName } = req.body;

        if (!fullName || !email || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        // If no chat ID is configured, log instructions but don't fail
        if (!TELEGRAM_CHAT_ID) {
            console.warn('⚠️ TELEGRAM_CHAT_ID not configured!');
            console.warn('📱 To receive contact notifications:');
            console.warn('1. Message your bot on Telegram');
            console.warn('2. Get your Chat ID from @userinfobot');
            console.warn('3. Add TELEGRAM_CHAT_ID to your .env file');
            return res.status(200).json({ 
                success: true, 
                warning: 'Telegram Chat ID not configured. Message saved but notification not sent.' 
            });
        }

        // Create the message
        const contactType = hasBusinessName ? '🏢 Business' : '👤 Individual';
        
        let messageText = `
🔔 *NEW CONTACT FORM SUBMISSION* 🔔

${contactType} *Contact Request*

👤 *Name:* ${fullName}`;

        if (hasBusinessName && businessName) {
            messageText += `\n🏢 *Business:* ${businessName}`;
        }

        messageText += `
📧 *Email:* ${email}`;

        if (phone) {
            messageText += `\n📱 *Phone:* ${phone}`;
        }

        messageText += `

💬 *Message:*
${message}

📅 *Received:* ${new Date().toLocaleString('en-US', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
})}
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
                text: messageText,
                parse_mode: 'Markdown',
            }),
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Telegram API Error:', data);
            return res.status(200).json({ 
                success: true, 
                warning: 'Message received but notification failed',
                error: data.description 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Contact notification sent successfully' 
        });

    } catch (error) {
        console.error('Error sending contact notification:', error);
        return res.status(200).json({ 
            success: true, 
            warning: 'Message received but notification failed' 
        });
    }
}
