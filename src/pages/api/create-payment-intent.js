import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { amount, email, fullName, customerId } = req.body;

        try {
            let customer;

            if (customerId) {
                customer = await stripe.customers.retrieve(customerId);
            } else {
                customer = await stripe.customers.create({
                    email,
                    name: fullName,
                });
            }

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: 'usd',
                automatic_payment_methods: {
                    enabled: true, // ✅ This allows PaymentElement to support cards, wallets, and more
                },
                receipt_email: email,
                customer: customer.id,
                metadata: { full_name: fullName },
            });

            res.status(200).json({ client_secret: paymentIntent.client_secret });
        } catch (error) {
            console.error('Error creating payment intent:', error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}