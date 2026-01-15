import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../../app/components/CheckoutForm';
import Layout from '../../app/components/Layout';
import "./index.css";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function TestingPay() {
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    // Call your backend to create a payment intent
    const createPaymentIntent = async () => {
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 100, // $20.00 in cents
            email: "test@example.com",  // Placeholder email
            fullName: "Test User"       // Placeholder name
          }),
        });

        const data = await res.json();
        setClientSecret(data.client_secret);
      } catch (err) {
        console.error("Failed to create payment intent:", err);
      }
    };

    createPaymentIntent();
  }, []);

  const appearance = {
    theme: 'stripe', // Options: 'stripe', 'flat', 'night', 'none'
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Layout>
      <div className="payment-container">
        <h1>Checkout</h1>
        {clientSecret ? (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm />
          </Elements>
        ) : (
          <p>Loading payment form...</p>
        )}
      </div>
    </Layout>
  );
}