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
        console.log('Shipping data:', orderData.shipping)
        
        const itemsTotal = orderData.cartItems.reduce((acc, item) => {
            // Handle different possible price properties
            const itemPrice = item.price || item.cost || parseFloat(item.amount) || 0
            const quantity = item.quantity || item.qty || 1
            console.log('Item:', item.title || item.name, 'Price:', itemPrice, 'Qty:', quantity)
            return acc + (itemPrice * quantity)
        }, 0)
        
        const shippingCost = orderData.shipping ? parseFloat(
            orderData.shipping.shipment_charge || 
            orderData.shipping.amount || 
            orderData.shipping.cost || 
            orderData.shipping.price || 0
        ) : 0
        console.log('Items total:', itemsTotal, 'Shipping cost:', shippingCost)
        
        const tax = itemsTotal * 0.08 // 8% tax
        
        return {
            subtotal: itemsTotal,
            shipping: shippingCost,
            tax: tax,
            total: itemsTotal + shippingCost + tax
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
                    details: `Redirecting you to your orders...`
                })
                
                // Save order to Firestore - both in global orders and user orders
                try {
                    const db = getFirestore(app)
                    
                    // Create order details with proper structure
                    const savedOrderData = {
                        orderId: result.orderId || `ORD-${Date.now()}`,
                        paymentId: result.paymentId || null,
                        userId: user ? user.uid : guestId,
                        userEmail: user ? user.email : (orderData.customerInfo?.email || 'guest'),
                        isGuest: !user,
                        status: 'processing',
                        items: orderData.cartItems || [],
                        customerInfo: orderData.customerInfo || {},
                        shippingAddress: orderData.shippingAddress || {},
                        shipping: orderData.shipping || {},
                        totals: {
                            subtotal: Number(totals.subtotal),
                            shipping: Number(totals.shipping),
                            tax: Number(totals.tax),
                            total: Number(totals.total)
                        },
                        orderDate: new Date().toISOString(),
                        trackingNumber: null,
                        estimatedDelivery: null,
                        paymentMethod: 'square',
                        notes: ''
                    }
                    
                    console.log('=== Attempting to save order ===')
                    console.log('Order data:', JSON.stringify(savedOrderData, null, 2))
                    
                    // Save to global orders collection (for admin) first to get the ID
                    try {
                        console.log('Saving to global orders collection...')
                        const globalOrdersRef = collection(db, 'orders')
                        const globalDocRef = await addDoc(globalOrdersRef, savedOrderData)
                        console.log('✅ Order saved to global collection with ID:', globalDocRef.id)
                        
                        // Save to user's orders (if logged in) or guest orders (if guest)
                        if (user) {
                            console.log('Saving to user orders subcollection with same ID...')
                            const userOrderDocRef = doc(db, `users/${user.uid}/orders`, globalDocRef.id)
                            await setDoc(userOrderDocRef, savedOrderData)
                            console.log('✅ Order saved to user collection with same ID:', globalDocRef.id)
                        } else if (guestId) {
                            console.log('Saving to guest orders subcollection with same ID...')
                            const guestOrderDocRef = doc(db, `guestUsers/${guestId}/orders`, globalDocRef.id)
                            await setDoc(guestOrderDocRef, savedOrderData)
                            console.log('✅ Order saved to guest collection with same ID:', globalDocRef.id)
                        }
                    } catch (saveError) {
                        console.error('❌ Failed to save orders:', saveError)
                        console.error('Error code:', saveError.code)
                        console.error('Error message:', saveError.message)
                        throw new Error(`Order save failed: ${saveError.message}`)
                    }
                    
                    // Send Telegram notification
                    try {
                        console.log('Sending Telegram notification...')
                        const notifResponse = await fetch('/api/send-telegram-notification', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ order: savedOrderData }),
                        })
                        const notifResult = await notifResponse.json()
                        console.log('Telegram notification result:', notifResult)
                    } catch (notifError) {
                        console.error('Failed to send Telegram notification:', notifError)
                        // Don't fail the order if notification fails
                    }
                } catch (error) {
                    console.error('❌ Error saving order:', error)
                    console.error('Error details:', error.message)
                    console.error('Error stack:', error.stack)
                    
                    // Show user-friendly error
                    const errorMsg = error.message.includes('permission-denied') 
                        ? 'Permission denied. Please check Firestore security rules.'
                        : error.message.includes('not-found')
                        ? 'Firestore database not found. Please check Firebase configuration.'
                        : `Failed to save order: ${error.message}`;
                    
                    alert(`⚠️ Payment successful but order save failed!\n\n${errorMsg}\n\nOrder ID: ${result.orderId || 'N/A'}\n\nPlease contact support immediately.`)
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
                    
                    // Redirect to orders page for logged-in users, home for guests
                    if (user) {
                        window.location.href = '/profile/orders'
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
                            
                            {orderData.shipping && (
                                <div className="order-item delivery-item">
                                    <div className="delivery-icon">🚀</div>
                                    <div className="item-info">
                                        <span className="item-name">
                                            {orderData.shipping.courier_service?.name || 
                                             orderData.shipping.courier_name || 
                                             orderData.shipping.service || 
                                             'Standard Shipping'}
                                        </span>
                                        <span className="item-description">
                                            {orderData.shipping.min_delivery_time && orderData.shipping.max_delivery_time 
                                                ? `${orderData.shipping.min_delivery_time}-${orderData.shipping.max_delivery_time} days`
                                                : orderData.shipping.delivery_time || 
                                                  (orderData.shipping.full_description ? orderData.shipping.full_description.split(',')[0] : 'Standard delivery')
                                            }
                                        </span>
                                    </div>
                                    <span className="item-price">
                                        ${parseFloat(
                                            orderData.shipping.shipment_charge || 
                                            orderData.shipping.amount || 
                                            orderData.shipping.cost || 
                                            orderData.shipping.price || 0
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="order-total">
                            <div className="subtotal">
                                <span>Subtotal</span>
                                <span>${totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="subtotal">
                                <span>Shipping</span>
                                <span>${totals.shipping.toFixed(2)}</span>
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