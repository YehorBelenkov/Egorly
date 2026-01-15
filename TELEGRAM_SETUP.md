# Telegram Bot Setup Instructions

## You've already provided the bot token, now you need to get your Chat ID:

### Step 1: Start a conversation with your bot
1. Open Telegram
2. Search for your bot: `@YourBotName` (or click the link Telegram gave you when creating the bot)
3. Click "Start" or send any message to your bot (e.g., "Hello")

### Step 2: Get your Chat ID
Option A - Use the GetIDs Bot:
1. Search for `@userinfobot` in Telegram
2. Start a conversation with it
3. It will instantly reply with your Chat ID

Option B - Use the Telegram API:
1. Open this URL in your browser (replace with your bot token):
   https://api.telegram.org/bot8376385543:AAHqA3Scvocp6jYOIswl9pwPJrkdEfuISZE/getUpdates

2. Send a message to your bot first (step 1 above)
3. Look for the "chat" object in the response, find the "id" field
   Example: `"chat":{"id":123456789,"first_name":"Your Name"}`
   Your Chat ID is: `123456789`

### Step 3: Add Chat ID to your environment variables
1. Add to your `.env.local` file:
   ```
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

2. Restart your development server:
   ```
   npm run dev
   ```

### Step 4: Test the notification
1. Place a test order on your website
2. You should receive a Telegram message with the order details!

## Notification Features:
- ✅ Order ID
- ✅ Customer name, email, and phone
- ✅ Complete list of items with quantities and prices
- ✅ Shipping address
- ✅ Payment breakdown (subtotal, shipping, tax, total)
- ✅ Formatted with emojis for easy reading

## Security Notes:
- Never commit your bot token or chat ID to GitHub
- Keep them in `.env.local` which is gitignored
- For production (Vercel), add TELEGRAM_CHAT_ID to your environment variables in the Vercel dashboard

## Troubleshooting:
- If notifications don't arrive, check the browser console for errors
- Make sure you've sent at least one message to your bot
- Verify the Chat ID is correct using getUpdates endpoint
- The order will still be saved even if the notification fails
