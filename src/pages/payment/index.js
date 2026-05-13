"use client";

import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from "../../app/components/Layout"
import { app } from '../../lib/firebaseConfig'
import { getFirestore, doc, getDoc, collection, addDoc, setDoc } from 'firebase/firestore'
import { getGuestSession, getGuestCart, clearGuestCart } from '../../lib/guestUser'
import { 
  CreditCard, 
  PaymentForm, 
  GooglePay, 
  ApplePay,
  CashAppPay
} from "react-square-web-payments-sdk"
import './index.css'

const PaymentInner = ({ user }) => {
    const [cart, setCart] = useState({ items: [], updatedAt: null })
    const [orderData, setOrderData] = useState(null)
    const [paymentStatus, setPaymentStatus] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [showContent, setShowContent] = useState(false)
    const [guestId, setGuestId] = useState(null)
    
    // Square configuration with working credentials
    const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || 'sq0idp-VeeaYnmIvbl7sdhdB7NJIw'
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || 'LN9YTFF904XHD'

    // Debug environment variables
    console.log('Square App ID (with fallback):', appId)
    console.log('Square Location ID (with fallback):', locationId)
    console.log('Using fallback values:', !process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID)
    console.log('All NEXT_PUBLIC env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')))

    useEffect(()=>{
        const fetchCart = async ()=>{
            try{
                const db = getFirestore(app)
                
                if (user) {
                    // Logged-in user
                    const cartRef = doc(db, `users/${user.uid}/cart/default`)
                    const snap = await getDoc(cartRef)
                    if(snap.exists()) {
                        const data = snap.data()
                        const items = (data.items || []).map(it => ({ ...it }))
                        setCart({ items, updatedAt: data.updatedAt || null })
                    } else {
                        setCart({ items: [], updatedAt: null })
                    }
                } else {
                    // Guest user - use cart subcollection
                    const gId = await getGuestSession()
                    setGuestId(gId)
                    const cartRef = doc(db, `guestUsers/${gId}/cart/default`)
                    const snap = await getDoc(cartRef)
                    if(snap.exists()) {
                        const data = snap.data()
                        const items = (data.items || []).map(it => ({ ...it }))
                        setCart({ items, updatedAt: data.updatedAt || null })
                    } else {
                        setCart({ items: [], updatedAt: null })
                    }
                }
            }catch(e){ console.error('fetchCart', e) }
        }
        fetchCart()
    }, [user])
    
    useEffect(() => {
        // Debug: Show that user is now available
        console.log('Payment page user:', user?.uid || 'Guest user')
        console.log('Payment page cart items:', cart.items.length)
        
        // Retrieve order data from sessionStorage
        const storedOrderData = sessionStorage.getItem('orderData')
        console.log('Raw order data from sessionStorage:', storedOrderData)
        
        if (storedOrderData) {
            const parsed = JSON.parse(storedOrderData)
            console.log('Parsed order data:', parsed)
            setOrderData(parsed)
            
            // Simulate loading time for smooth transition
            setTimeout(() => {
                setIsLoading(false)
                setTimeout(() => {
                    setShowContent(true)
                }, 100)
            }, 1500)
        } else {
            // Redirect back to checkout if no order data
            window.location.href = '/checkout'
        }
    }, [user])

    // Check if Square credentials are properly configured
    const isSquareConfigured = appId && 
                               locationId && 
                               appId !== 'your_square_app_id_here' &&
                               locationId !== 'your_square_location_id_here' &&
                               appId.startsWith('sq0idp-') &&
                               locationId.length > 10

    if (!isSquareConfigured) {
        return (
            <div className="error-container">
                <div className="error-card">
                    <h1>⚠️ Payment Configuration Required</h1>
                    <p>Square payment credentials need to be configured in environment variables.</p>
                    <div className="config-help">
                        <p><strong>Required variables:</strong></p>
                        <ul>
                            <li>NEXT_PUBLIC_SQUARE_APPLICATION_ID (starts with sq0idp-)</li>
                            <li>NEXT_PUBLIC_SQUARE_LOCATION_ID</li>
                            <li>SQUARE_ACCESS_TOKEN (server-side only)</li>
                        </ul>
                        <button 
                            onClick={() => window.location.href = '/checkout'} 
                            className="back-button"
                        >
                            ← Back to Checkout
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!orderData) {
        return (
            <div className="payment-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading order details...</p>
                </div>
            </div>
        )
    }

    const calculateTotal = () => {
        console.log('Order data:', orderData)
        console.log('Cart items:', orderData.cartItems)
        
        const itemsTotal = orderData.cartItems.reduce((acc, item) => {
            // Handle different possible price properties
            const itemPrice = item.price || item.cost || parseFloat(item.amount) || 0
            const quantity = item.quantity || item.qty || 1
            console.log('Item:', item.title || item.name, 'Price:', itemPrice, 'Qty:', quantity)
            return acc + (itemPrice * quantity)
        }, 0)
        
        console.log('Items total:', itemsTotal)
        
        const tax = itemsTotal * 0.08 // 8% tax
        
        return {
            subtotal: itemsTotal,
            tax: tax,
            total: itemsTotal + tax
        }
    }

    const totals = calculateTotal()
    const totalInCents = Math.round(totals.total * 100)

    const createPaymentRequest = () => ({
        countryCode: 'US',
        currencyCode: 'USD',
        locationId: locationId,
        total: {
            amount: totals.total.toFixed(2),
            label: 'Egorly Order',
        },
    })

    // Payment processing through API route
    const submitPayment = async (token, amountInCents) => {
        try {
            const response = await fetch('/api/square-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    amount: amountInCents,
                    orderData: orderData
                }),
            })
            
            const result = await response.json()
            return result
        } catch (error) {
            console.error('Payment submission error:', error)
            return { success: false, error: error.message }
        }
    }

    const handlePaymentResponse = async (token) => {
        setIsProcessing(true)
        setPaymentStatus(null)
        
        console.log('=== Payment Processing Started ===')
        console.log('User:', user?.uid, user?.email)
        console.log('Order Data:', orderData)
        
        try {
            const result = await submitPayment(token.token, totalInCents)
            console.log('Payment result:', result)
            
            if (result.success) {
                setPaymentStatus({
                    type: 'success',
                    message: '🎉 Payment Successful!',
                    details: `Processing your order...`
                })
                
                console.log('✅ Square payment successful, creating CJ order...')
                
                // Create order data
                const orderId = `ORD-${Date.now()}`;
                const orderNumber = `SQ-${result.paymentId || Date.now()}`;
                
                let cjOrderId = null;
                let cjShipments = [];
                let cjPaymentStatus = 'pending';
                let needsFunding = false;
                
                // Step 1: Create CJ Order
                try {
                    console.log('Creating CJ order...');
                    const createOrderResponse = await fetch('/api/cj/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderNumber: orderNumber,
                            shippingAddress: {
                                name: orderData.customerInfo.fullName,
                                country: orderData.shippingAddress.country || 'US',
                                province: orderData.shippingAddress.state,
                                city: orderData.shippingAddress.city,
                                address: orderData.shippingAddress.address,
                                zip: orderData.shippingAddress.zip,
                                phone: orderData.customerInfo.phone
                            },
                            productList: orderData.cartItems.map(item => ({
                                vid: item.variant?.id,
                                quantity: item.quantity || 1
                            }))
                        })
                    });
                    
                    const createOrderData = await createOrderResponse.json();
                    
                    if (createOrderData.success) {
                        cjOrderId = createOrderData.order.orderId;
                        cjShipments = createOrderData.order.shipments || [];
                        const totalAmount = createOrderData.order.totalAmount || 0;
                        
                        console.log(`✅ CJ order created: ${cjOrderId}, Amount: $${totalAmount.toFixed(2)}`);
                        
                        // Step 2: Check CJ Balance
                        try {
                            console.log('Checking CJ wallet balance...');
                            const balanceResponse = await fetch('/api/cj/check-balance');
                            const balanceData = await balanceResponse.json();
                            
                            if (balanceData.success) {
                                const balance = balanceData.balance.amount || 0;
                                console.log(`💰 CJ Balance: $${balance.toFixed(2)}, Required: $${totalAmount.toFixed(2)}`);
                                
                                // Step 3: Pay for CJ Order if balance sufficient
                                if (balance >= totalAmount) {
                                    console.log('✅ Sufficient balance, confirming order...');
                                    
                                    // Pay for each shipment
                                    let allPaymentsSuccess = true;
                                    for (const shipment of cjShipments) {
                                        try {
                                            const paymentResponse = await fetch('/api/cj/pay-shipment', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    shipmentOrderId: shipment.shipmentOrderId,
                                                    payId: `PAY-${orderId}-${shipment.shipmentOrderId}`
                                                })
                                            });
                                            
                                            const paymentData = await paymentResponse.json();
                                            if (paymentData.success) {
                                                console.log(`✅ Shipment ${shipment.shipmentOrderId} paid`);
                                            } else {
                                                console.error(`❌ Payment failed for shipment ${shipment.shipmentOrderId}`);
                                                allPaymentsSuccess = false;
                                            }
                                        } catch (payError) {
                                            console.error('Shipment payment error:', payError);
                                            allPaymentsSuccess = false;
                                        }
                                    }
                                    
                                    if (allPaymentsSuccess) {
                                        cjPaymentStatus = 'paid';
                                        console.log('✅ All CJ shipments paid successfully');
                                    } else {
                                        cjPaymentStatus = 'partially_paid';
                                        needsFunding = true;
                                        console.warn('⚠️ Some shipments failed to pay');
                                    }
                                } else {
                                    console.warn(`⚠️ Insufficient CJ balance. Need $${(totalAmount - balance).toFixed(2)} more`);
                                    needsFunding = true;
                                    cjPaymentStatus = 'needs_funding';
                                }
                            }
                        } catch (balanceError) {
                            console.error('Balance check error:', balanceError);
                            needsFunding = true;
                            cjPaymentStatus = 'needs_funding';
                        }
                    } else {
                        console.error('CJ order creation failed:', createOrderData.error);
                    }
                } catch (cjError) {
                    console.error('CJ order error:', cjError);
                }
                
                // Save order to Firestore
                try {
                    console.log('Saving order to Firestore...');
                    const saveOrderResponse = await fetch('/api/orders/save-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId,
                            userId: user?.uid || guestId,
                            isGuest: !user,
                            cjOrderId,
                            cjShipments,
                            orderNumber,
                            customerInfo: orderData.customerInfo,
                            shippingAddress: orderData.shippingAddress,
                            items: orderData.cartItems,
                            totals: {
                                subtotal: Number(totals.subtotal),
                                shipping: orderData.deliveryEstimate?.price || 0,
                                tax: Number(totals.tax),
                                total: Number(totals.total)
                            },
                            deliveryEstimate: orderData.deliveryEstimate,
                            squarePaymentId: result.paymentId,
                            cjPaymentStatus,
                            needsFunding
                        })
                    });
                    
                    const saveResult = await saveOrderResponse.json();
                    
                    if (saveResult.success) {
                        console.log('✅ Order saved to Firestore:', orderId);
                        
                        // Update success message
                        setPaymentStatus({
                            type: 'success',
                            message: '🎉 Order Confirmed!',
                            details: needsFunding 
                                ? 'Your order is being processed. We will confirm shipping soon!'
                                : 'Your order has been placed and will ship soon!'
                        });
                        
                        // Send Telegram notification
                        try {
                            console.log('Sending Telegram notification...');
                            const notifResponse = await fetch('/api/send-telegram-notification', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    order: {
                                        orderId,
                                        orderNumber,
                                        customerInfo: orderData.customerInfo,
                                        items: orderData.cartItems,
                                        total: totals.total,
                                        needsFunding
                                    } 
                                }),
                            });
                            const notifResult = await notifResponse.json();
                            console.log('Telegram notification result:', notifResult);
                        } catch (notifError) {
                            console.error('Failed to send Telegram notification:', notifError);
                            // Don't fail the order if notification fails
                        }
                        
                        // Send order confirmation email to customer
                        try {
                            console.log('Sending order confirmation email...');
                            const emailResponse = await fetch('/api/send-order-confirmation', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    customerEmail: orderData.customerInfo.email,
                                    customerName: orderData.customerInfo.fullName,
                                    orderId,
                                    orderNumber,
                                    items: orderData.cartItems,
                                    totals,
                                    shippingAddress: orderData.shippingAddress,
                                    deliveryEstimate: orderData.deliveryEstimate,
                                    orderDate: new Date().toISOString()
                                })
                            });
                            const emailResult = await emailResponse.json();
                            if (emailResult.success) {
                                console.log('✅ Order confirmation email sent:', emailResult.emailId);
                            }
                        } catch (emailError) {
                            console.error('Failed to send order confirmation email:', emailError);
                            // Don't fail the order if email fails
                        }
                    } else {
                        console.error('Failed to save order:', saveResult.error);
                        alert(`⚠️ Payment successful but order save failed!\n\n${saveResult.error}\n\nOrder ID: ${orderId}\n\nPlease contact support immediately.`);
                    }
                } catch (saveError) {
                    console.error('Order save error:', saveError);
                    alert(`⚠️ Payment successful but order save failed!\n\n${saveError.message}\n\nOrder ID: ${orderId}\n\nPlease contact support immediately.`);
                }
                
                // Update progress to show confirmation step
                setTimeout(() => {
                    const progressSteps = document.querySelectorAll('.progress_indicator .step')
                    const progressLines = document.querySelectorAll('.step_line')
                    
                    // Mark payment step as completed
                    if (progressSteps[1]) {
                        progressSteps[1].classList.remove('active')
                        progressSteps[1].classList.add('completed')
                    }
                    
                    // Mark second progress line as completed
                    if (progressLines[1]) {
                        progressLines[1].classList.add('completed')
                    }
                    
                    // Mark confirmation step as active
                    if (progressSteps[2]) {
                        progressSteps[2].classList.add('active')
                    }
                }, 500)
                
                // Clear cart and redirect to orders page
                setTimeout(async () => {
                    // Clear cart from Firestore or localStorage
                    try {
                        if (user) {
                            const db = getFirestore(app)
                            const cartRef = doc(db, `users/${user.uid}/cart/default`)
                            await setDoc(cartRef, { items: [], updatedAt: new Date().toISOString() })
                        } else {
                            // Clear guest cart from localStorage
                            clearGuestCart()
                        }
                    } catch (error) {
                        console.error('Error clearing cart:', error)
                    }
                    
                    sessionStorage.removeItem('orderData')
                    
                    // Redirect to profile page for logged-in users (My Orders section), home for guests
                    if (user) {
                        window.location.href = '/profile'
                    } else {
                        window.location.href = '/'
                    }
                }, 3000)
            } else {
                setPaymentStatus({
                    type: 'error',
                    message: 'Payment Failed',
                    details: result.error
                })
            }
        } catch (error) {
            setPaymentStatus({
                type: 'error',
                message: 'Payment Error',
                details: error.message
            })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <>
            <Head>
                <title>Secure Payment - Egorly</title>
                <meta name="description" content="Secure payment processing for your fish snack order" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
            </Head>
            
            {/* Loading Screen */}
            {isLoading && (
                <div className="loading-screen">
                    <div className="loading-content">
                        <div className="loading-logo">
                            <div className="logo-circle"></div>
                            <h2>Egorly</h2>
                        </div>
                        <div className="loading-text">
                            <p>Preparing your secure payment...</p>
                        </div>
                        <div className="loading-spinner">
                            <div className="spinner-ring"></div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className={`checkout_wrapper ${showContent ? 'fade-in' : 'hidden'}`}>
                {/* Animated Background Circles for whole page */}
                <div className="area">
                    <ul className="circles">
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ul>
                </div>
                
                <div className="checkout_container">
                    <div className="checkout_header">
                        <div className="progress_indicator">
                            <div className="step completed">
                                <div className="step_circle">1</div>
                                <span>Information</span>
                            </div>
                            <div className="step_line completed"></div>
                            <div className="step active">
                                <div className="step_circle">2</div>
                                <span>Payment</span>
                            </div>
                            <div className="step_line"></div>
                            <div className="step">
                                <div className="step_circle">3</div>
                                <span>Confirmation</span>
                            </div>
                        </div>
                    </div>

                    <div className="checkout_content">
                        <div className="checkout-layout">
                    {/* Left Side - Payment Form */}
                    <div className="payment-section">
                        <div className="company-branding">
                            <p className="brand-text">
                                Powered by
                                <span className="animated-brand">
                                    Egorly Secure
                                </span>
                                &mdash; Almost there! Complete your order &mdash;
                            </p>
                        </div>
                        
                        <div className="header">
                            <h1 className="title">Secure Payment</h1>
                            <p className="description">Complete your fish snack order</p>
                        </div>

                        {paymentStatus && (
                            <div className={`status-message ${paymentStatus.type}`}>
                                <div className="status-icon">
                                    {paymentStatus.type === 'success' ? '✅' : '❌'}
                                </div>
                                <div className="status-text">
                                    <strong>{paymentStatus.message}</strong>
                                    <p>{paymentStatus.details}</p>
                                </div>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="processing-overlay">
                                <div className="spinner"></div>
                                <p>Processing your payment...</p>
                            </div>
                        )}

                        <div className="payment-form">
                            {isSquareConfigured ? (
                                <PaymentForm
                                    applicationId={appId}
                                    locationId={locationId}
                                    createPaymentRequest={createPaymentRequest}
                                    cardTokenizeResponseReceived={handlePaymentResponse}
                                >
                                    <div className="payment-method">
                                        <h3>💳 Credit Card</h3>
                                        <CreditCard />
                                    </div>
                                    
                                    <div className="payment-method">
                                        <h3>📱 Google Pay</h3>
                                        <GooglePay 
                                            buttonColor="black"
                                            buttonType="pay"
                                            buttonSizeMode="fill"
                                        />
                                    </div>
                                </PaymentForm>
                            ) : (
                                <div className="demo-payment">
                                    <div className="demo-notice">
                                        <h3>🔧 Demo Mode</h3>
                                        <p>Square payment is not configured. This is a demonstration.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setPaymentStatus({
                                                type: 'success',
                                                message: 'Demo Payment Successful!',
                                                details: 'This is a test payment in demo mode.'
                                            })
                                            
                                            // Update progress to show confirmation step
                                            setTimeout(() => {
                                                const progressSteps = document.querySelectorAll('.progress_indicator .step')
                                                const progressLines = document.querySelectorAll('.step_line')
                                                
                                                // Mark payment step as completed
                                                if (progressSteps[1]) {
                                                    progressSteps[1].classList.remove('active')
                                                    progressSteps[1].classList.add('completed')
                                                }
                                                
                                                // Mark second progress line as completed
                                                if (progressLines[1]) {
                                                    progressLines[1].classList.add('completed')
                                                }
                                                
                                                // Mark confirmation step as active
                                                if (progressSteps[2]) {
                                                    progressSteps[2].classList.add('active')
                                                }
                                            }, 500)
                                            
                                            setTimeout(() => {
                                                sessionStorage.removeItem('orderData')
                                                window.location.href = '/'
                                            }, 4000)
                                        }}
                                        className="demo-pay-button"
                                    >
                                        Complete Demo Order
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="security-badge">
                            <span className="lock-icon">🔒</span>
                            <span>Secured by Square</span>
                        </div>
                    </div>

                    {/* Right Side - Order Summary */}
                    <div className="order-summary">
                        <h2 className="summary-title">Order Summary</h2>
                        
                        <div className="order-items">
                            {!orderData.cartItems || orderData.cartItems.length === 0 ? (
                                <div className="no-items">
                                    <p>No items found in cart. Please return to shop.</p>
                                    <button onClick={() => window.location.href = '/'} className="back-button">
                                        ← Back to Shop
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Simple Product Summary - Just show total items and price */}
                                    <div className="order-item product-summary-item">
                                        <div className="item-info">
                                            <span className="item-name">Products ({orderData.cartItems.length} {orderData.cartItems.length === 1 ? 'item' : 'items'})</span>
                                        </div>
                                        <span className="item-price">${totals.subtotal.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="order-total">
                            <div className="subtotal">
                                <span>Subtotal</span>
                                <span>${totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="subtotal shipping-note">
                                <span>Shipping</span>
                                <span className="included-text">Included in product price</span>
                            </div>
                            <div className="subtotal">
                                <span>Tax (8%)</span>
                                <span>${totals.tax.toFixed(2)}</span>
                            </div>
                            <div className="total">
                                <span>Total</span>
                                <div className="total-amount">
                                    <span className="currency">$</span>
                                    <span className="value">{totals.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Shipping Address */}
                        <div className="shipping-info">
                            <div className="shipping-header">
                                <div className="shipping-icon">📦</div>
                                <h3>Shipping Details</h3>
                            </div>
                            <div className="address-card">
                                <div className="customer-name">
                                    <span className="name-label">Recipient</span>
                                    <span className="name-value">{orderData.customerInfo.fullName}</span>
                                </div>
                                
                                <div className="address-section">
                                    <span className="address-label">📍 Address</span>
                                    <div className="address-lines">
                                        <span className="street">{orderData.shippingAddress.address}</span>
                                        <span className="city-state">
                                            {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zip}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="contact-info">
                                    <div className="contact-item">
                                        <span className="contact-icon">📧</span>
                                        <span className="contact-value">{orderData.customerInfo.email}</span>
                                    </div>
                                    <div className="contact-item">
                                        <span className="contact-icon">📱</span>
                                        <span className="contact-value">{orderData.customerInfo.phone}</span>
                                    </div>
                                </div>
                                
                                {orderData.deliveryEstimate && (
                                    <div className="delivery-estimate-card">
                                        <div className="estimate-icon">🚚</div>
                                        <div className="estimate-details">
                                            <span className="estimate-label">Estimated Delivery</span>
                                            <span className="estimate-value">{orderData.deliveryEstimate.days} business days</span>
                                            <span className="estimate-method">via Standard International Shipping</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
        </>
    )
}

const Payment = () => {
    return (
        <Layout>
            {(user) => <PaymentInner user={user} />}
        </Layout>
    )
}

export default Payment