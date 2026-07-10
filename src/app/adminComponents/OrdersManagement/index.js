import { useState, useEffect } from 'react'
import { getFirestore, collection, query, orderBy, getDocs, doc, updateDoc, limit } from 'firebase/firestore'
import { app } from '../../../lib/firebaseConfig'
import './index.css'

const OrdersManagement = ({ idToken }) => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [loadLimit, setLoadLimit] = useState(50) // Limit orders to prevent memory issues

    useEffect(() => {
        let isMounted = true
        
        const loadOrders = async () => {
            if (isMounted) {
                await fetchOrders()
            }
        }
        
        loadOrders()
        
        return () => {
            isMounted = false
        }
    }, [loadLimit])

    const fetchOrders = async () => {
        try {
            const db = getFirestore(app)
            const ordersRef = collection(db, 'orders')
            // Add limit to prevent loading thousands of orders
            const ordersQuery = query(ordersRef, orderBy('orderDate', 'desc'), limit(loadLimit))
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

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const db = getFirestore(app)
            
            // Find the order to get userId
            const order = orders.find(o => o.id === orderId)
            if (!order) {
                alert('Order not found')
                return
            }
            
            const updateData = {
                status: newStatus,
                updatedAt: new Date().toISOString()
            }
            
            // Update in global orders collection
            const globalOrderRef = doc(db, 'orders', orderId)
            await updateDoc(globalOrderRef, updateData)
            
            // Update in user's orders subcollection
            if (order.userId) {
                const userOrderRef = doc(db, `users/${order.userId}/orders`, orderId)
                await updateDoc(userOrderRef, updateData)
            }
            
            // Update local state
            setOrders(orders.map(o => 
                o.id === orderId ? { ...o, status: newStatus } : o
            ))
            
            alert(`Order status updated to: ${newStatus}`)
        } catch (error) {
            console.error('Error updating order:', error)
            alert('Failed to update order status')
        }
    }

    const updateTrackingInfo = async (orderId, trackingNumber, estimatedDelivery) => {
        try {
            const db = getFirestore(app)
            
            // Find the order to get userId
            const order = orders.find(o => o.id === orderId)
            if (!order) {
                alert('Order not found')
                return
            }
            
            const updateData = {
                trackingNumber,
                estimatedDelivery,
                status: 'shipped',
                updatedAt: new Date().toISOString()
            }
            
            // Update in global orders collection
            const globalOrderRef = doc(db, 'orders', orderId)
            await updateDoc(globalOrderRef, updateData)
            
            // Update in user's orders subcollection
            if (order.userId) {
                const userOrderRef = doc(db, `users/${order.userId}/orders`, orderId)
                await updateDoc(userOrderRef, updateData)
            }
            
            // Update local state
            setOrders(orders.map(o => 
                o.id === orderId ? { ...o, trackingNumber, estimatedDelivery, status: 'shipped' } : o
            ))
            
            alert('Tracking info updated successfully! Customer can now track their order.')
        } catch (error) {
            console.error('Error updating tracking:', error)
            alert('Failed to update tracking info')
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status) => {
        const colors = {
            'processing': '#f59e0b',
            'shipped': '#3b82f6',
            'delivered': '#10b981',
            'cancelled': '#ef4444'
        }
        return colors[status] || '#6b7280'
    }

    const filteredOrders = filter === 'all' 
        ? orders 
        : orders.filter(order => order.status === filter)

    if (loading) {
        return <div className="admin-loading">Loading orders...</div>
    }

    return (
        <div className="orders-management">
            <div className="orders-header">
                <h2>Orders Management</h2>
                <div className="orders-stats">
                    <span className="stat">Total: {orders.length}</span>
                    <span className="stat">Processing: {orders.filter(o => o.status === 'processing').length}</span>
                    <span className="stat">Shipped: {orders.filter(o => o.status === 'shipped').length}</span>
                    <span className="stat">Delivered: {orders.filter(o => o.status === 'delivered').length}</span>
                </div>
            </div>

            <div className="filter-tabs">
                <button 
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    All Orders
                </button>
                <button 
                    className={filter === 'processing' ? 'active' : ''}
                    onClick={() => setFilter('processing')}
                >
                    Processing
                </button>
                <button 
                    className={filter === 'shipped' ? 'active' : ''}
                    onClick={() => setFilter('shipped')}
                >
                    Shipped
                </button>
                <button 
                    className={filter === 'delivered' ? 'active' : ''}
                    onClick={() => setFilter('delivered')}
                >
                    Delivered
                </button>
            </div>

            <div className="orders-list">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="admin-order-card">
                        <div 
                            className="order-summary"
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        >
                            <div className="order-info">
                                <span className="order-id">#{order.orderId || order.id.slice(-8).toUpperCase()}</span>
                                <span className="order-customer">{order.customerInfo.fullName}</span>
                                <span className="order-email">{order.userEmail}</span>
                            </div>
                            <div className="order-meta">
                                <span className="order-date">{formatDate(order.orderDate)}</span>
                                <span className="order-total">${order.totals.total.toFixed(2)}</span>
                                <span 
                                    className="order-status-badge"
                                    style={{ backgroundColor: getStatusColor(order.status) }}
                                >
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        {expandedOrder === order.id && (
                            <div className="order-details-admin">
                                <div className="details-grid">
                                    <div className="detail-section">
                                        <h4>Items</h4>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="order-item">
                                                <span>{item.name}</span>
                                                <span>Qty: {item.quantity}</span>
                                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="detail-section">
                                        <h4>Shipping Address</h4>
                                        <p>{order.shippingAddress.address}</p>
                                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                                        <p>Phone: {order.customerInfo.phone}</p>
                                    </div>

                                    <div className="detail-section">
                                        <h4>Order Totals</h4>
                                        <div className="totals-breakdown">
                                            <div><span>Subtotal:</span><span>${order.totals.subtotal.toFixed(2)}</span></div>
                                            <div><span>Shipping:</span><span>${order.totals.shipping.toFixed(2)}</span></div>
                                            <div><span>Tax:</span><span>${order.totals.tax.toFixed(2)}</span></div>
                                            <div className="total"><span>Total:</span><span>${order.totals.total.toFixed(2)}</span></div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h4>Order Actions</h4>
                                        <div className="status-controls">
                                            <label>Update Status:</label>
                                            <select 
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            >
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>

                                        <div className="tracking-controls">
                                            <label>Tracking Number:</label>
                                            <input 
                                                type="text"
                                                defaultValue={order.trackingNumber || ''}
                                                placeholder="Enter tracking number"
                                                id={`tracking-${order.id}`}
                                            />
                                            <label>Estimated Delivery:</label>
                                            <input 
                                                type="date"
                                                defaultValue={order.estimatedDelivery ? order.estimatedDelivery.split('T')[0] : ''}
                                                id={`delivery-${order.id}`}
                                            />
                                            <button 
                                                className="update-tracking-btn"
                                                onClick={() => {
                                                    const tracking = document.getElementById(`tracking-${order.id}`).value
                                                    const delivery = document.getElementById(`delivery-${order.id}`).value
                                                    if (tracking) {
                                                        updateTrackingInfo(order.id, tracking, delivery)
                                                    } else {
                                                        alert('Please enter a tracking number')
                                                    }
                                                }}
                                            >
                                                Update Tracking
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Load More Button */}
            {orders.length >= loadLimit && (
                <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem' }}>
                    <button 
                        onClick={() => setLoadLimit(prev => prev + 50)}
                        style={{
                            padding: '0.75rem 2rem',
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '1rem'
                        }}
                    >
                        Load More Orders (showing {orders.length})
                    </button>
                </div>
            )}
        </div>
    )
}

export default OrdersManagement
