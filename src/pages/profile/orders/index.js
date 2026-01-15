import { useState, useEffect } from 'react'
import Layout from '../../../app/components/Layout'
import Head from 'next/head'
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore'
import { app } from '../../../lib/firebaseConfig'
import './orders.css'

const OrdersInner = ({ user }) => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedOrder, setExpandedOrder] = useState(null)

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        const fetchOrders = async () => {
            try {
                const db = getFirestore(app)
                const ordersRef = collection(db, `users/${user.uid}/orders`)
                const ordersQuery = query(ordersRef, orderBy('orderDate', 'desc'))
                const snapshot = await getDocs(ordersQuery)
                
                const ordersList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                
                setOrders(ordersList)
            } catch (error) {
                console.error('Error fetching orders:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [user])

    const getStatusColor = (status) => {
        const colors = {
            'processing': '#f59e0b',
            'shipped': '#3b82f6',
            'delivered': '#10b981',
            'cancelled': '#ef4444'
        }
        return colors[status] || '#6b7280'
    }

    const getStatusIcon = (status) => {
        const icons = {
            'processing': '⏳',
            'shipped': '🚚',
            'delivered': '✅',
            'cancelled': '❌'
        }
        return icons[status] || '📦'
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
    }

    const toggleOrderExpand = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId)
    }

    if (loading) {
        return (
            <div className="orders-loading">
                <div className="loading-spinner"></div>
                <p>Loading your orders...</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="orders-empty">
                <div className="empty-icon">🔒</div>
                <h2>Please log in to view your orders</h2>
                <button onClick={() => window.location.href = '/login'} className="login-btn">
                    Go to Login
                </button>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="orders-empty">
                <div className="empty-icon">📦</div>
                <h2>No orders yet</h2>
                <p>When you place orders, they'll appear here</p>
                <button onClick={() => window.location.href = '/'} className="shop-btn">
                    Start Shopping
                </button>
            </div>
        )
    }

    return (
        <>
            <Head>
                <title>My Orders - Egorly</title>
            </Head>
            
            <div className="orders-container">
                <div className="orders-header">
                    <h1>My Orders</h1>
                    <p className="orders-count">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
                </div>

                <div className="orders-list">
                    {orders.map((order) => (
                        <div key={order.id} className={`order-card ${expandedOrder === order.id ? 'expanded' : ''}`}>
                            <div className="order-header" onClick={() => toggleOrderExpand(order.id)}>
                                <div className="order-main-info">
                                    <div className="order-id-section">
                                        <span className="order-label">Order ID</span>
                                        <span className="order-id">#{order.orderId || order.id.slice(-8).toUpperCase()}</span>
                                    </div>
                                    
                                    <div className="order-date-section">
                                        <span className="order-label">Placed on</span>
                                        <span className="order-date">{formatDate(order.orderDate)}</span>
                                    </div>

                                    <div className="order-status-section">
                                        <div 
                                            className="status-badge" 
                                            style={{ backgroundColor: getStatusColor(order.status) }}
                                        >
                                            <span className="status-icon">{getStatusIcon(order.status)}</span>
                                            <span className="status-text">{order.status.toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="order-total-section">
                                        <span className="order-label">Total</span>
                                        <span className="order-total">${order.totals.total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="expand-icon">
                                    <svg 
                                        width="24" 
                                        height="24" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor"
                                        style={{ 
                                            transform: expandedOrder === order.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s ease'
                                        }}
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            </div>

                            {expandedOrder === order.id && (
                                <div className="order-details">
                                    {/* Items */}
                                    <div className="order-section">
                                        <h3 className="section-title">📦 Items</h3>
                                        <div className="order-items">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="order-item">
                                                    <img 
                                                        src={item.imageURL || '/images/placeholder.png'} 
                                                        alt={item.name}
                                                        className="item-image"
                                                    />
                                                    <div className="item-details">
                                                        <span className="item-name">{item.name}</span>
                                                        <span className="item-quantity">Qty: {item.quantity}</span>
                                                    </div>
                                                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Shipping Info */}
                                    <div className="order-section">
                                        <h3 className="section-title">🚚 Shipping Information</h3>
                                        <div className="shipping-details">
                                            <div className="shipping-row">
                                                <span className="shipping-label">Recipient:</span>
                                                <span className="shipping-value">{order.customerInfo.fullName}</span>
                                            </div>
                                            <div className="shipping-row">
                                                <span className="shipping-label">Address:</span>
                                                <span className="shipping-value">
                                                    {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                                                </span>
                                            </div>
                                            <div className="shipping-row">
                                                <span className="shipping-label">Phone:</span>
                                                <span className="shipping-value">{order.customerInfo.phone}</span>
                                            </div>
                                            {order.shipping && (
                                                <div className="shipping-row">
                                                    <span className="shipping-label">Carrier:</span>
                                                    <span className="shipping-value">{order.shipping.courier_service?.name || 'Standard Shipping'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tracking */}
                                    {order.trackingNumber && (
                                        <div className="order-section">
                                            <h3 className="section-title">📍 Tracking</h3>
                                            <div className="tracking-info">
                                                <div className="tracking-number">
                                                    <span className="tracking-label">Tracking Number:</span>
                                                    <span className="tracking-value">{order.trackingNumber}</span>
                                                </div>
                                                {order.estimatedDelivery && (
                                                    <div className="tracking-delivery">
                                                        <span className="tracking-label">Estimated Delivery:</span>
                                                        <span className="tracking-value">{formatDate(order.estimatedDelivery)}</span>
                                                    </div>
                                                )}
                                                <button className="track-btn">
                                                    Track Package
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Price Breakdown */}
                                    <div className="order-section">
                                        <h3 className="section-title">💵 Price Breakdown</h3>
                                        <div className="price-breakdown">
                                            <div className="price-row">
                                                <span>Subtotal:</span>
                                                <span>${order.totals.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="price-row">
                                                <span>Shipping:</span>
                                                <span>${order.totals.shipping.toFixed(2)}</span>
                                            </div>
                                            <div className="price-row">
                                                <span>Tax:</span>
                                                <span>${order.totals.tax.toFixed(2)}</span>
                                            </div>
                                            <div className="price-row total-row">
                                                <span>Total:</span>
                                                <span>${order.totals.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

const Orders = () => {
    return (
        <Layout>
            {(user) => <OrdersInner user={user} />}
        </Layout>
    )
}

export default Orders
