import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!stripe || !elements) {
            setError('Stripe is not ready');
            setLoading(false);
            return;
        }

        const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/order-confirmation`,
            },
        });

        if (result.error) {
            setError(result.error.message);
            setLoading(false);
        } else {
            // Redirect will happen automatically
        }
    };

    return (
        <form onSubmit={handleSubmit} className="checkout-form">
            <div>
                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Full Name:</label>
                <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                />
            </div>

            <PaymentElement /> {/* 👈 Replaces CardElement */}

            <button type="submit" disabled={!stripe || loading}>
                {loading ? 'Processing...' : 'Pay Now'}
            </button>

            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
};

export default CheckoutForm;