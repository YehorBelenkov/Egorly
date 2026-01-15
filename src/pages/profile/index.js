import { useState, useEffect } from 'react'
import Layout from '../../app/components/Layout'
import Head from 'next/head'
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, getDocs, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { auth, app } from '../../lib/firebaseConfig'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth'
import './profile.css'

const ProfileInner = ({ user, onLogout }) => {
    const [userData, setUserData] = useState(null)
    const [recentOrders, setRecentOrders] = useState([])
    const [allOrders, setAllOrders] = useState([])
    const [addresses, setAddresses] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [editForm, setEditForm] = useState({
        fullName: '',
        phoneNumber: ''
    })
    const [saveMessage, setSaveMessage] = useState('')
    
    // Address management states
    const [isAddingAddress, setIsAddingAddress] = useState(false)
    const [isEditingAddress, setIsEditingAddress] = useState(false)
    const [editingAddressId, setEditingAddressId] = useState(null)
    const [addressForm, setAddressForm] = useState({
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States'
    })
    const [addressMessage, setAddressMessage] = useState('')
    
    // Password change states
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [passwordMessage, setPasswordMessage] = useState('')
    const [useEmailReset, setUseEmailReset] = useState(false)

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        const fetchUserData = async () => {
            try {
                const db = getFirestore(app)
                
                // Fetch user profile data
                const userRef = doc(db, 'users', user.uid)
                const userDoc = await getDoc(userRef)
                if (userDoc.exists()) {
                    const data = userDoc.data()
                    setUserData(data)
                    setEditForm({
                        fullName: data.fullName || '',
                        phoneNumber: data.phoneNumber || ''
                    })
                }

                // Fetch recent orders (last 3)
                const ordersRef = collection(db, `users/${user.uid}/orders`)
                const ordersQuery = query(ordersRef, orderBy('orderDate', 'desc'), limit(3))
                const ordersSnapshot = await getDocs(ordersQuery)
                const ordersList = ordersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setRecentOrders(ordersList)

                // Fetch all orders for Orders tab
                const allOrdersQuery = query(ordersRef, orderBy('orderDate', 'desc'))
                const allOrdersSnapshot = await getDocs(allOrdersQuery)
                const allOrdersList = allOrdersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setAllOrders(allOrdersList)

                // Fetch addresses
                const addressRef = collection(db, `users/${user.uid}/address`)
                const addressSnapshot = await getDocs(addressRef)
                const addressList = addressSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setAddresses(addressList)

            } catch (error) {
                console.error('Error fetching profile data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUserData()
    }, [user])

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
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

    const getStatusIcon = (status) => {
        const icons = {
            'processing': '⏳',
            'shipped': '🚚',
            'delivered': '✅',
            'cancelled': '❌'
        }
        return icons[status] || '📦'
    }

    const toggleOrderExpand = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId)
    }

    const handleEditProfileClick = () => {
        setIsEditingProfile(true)
        setSaveMessage('')
    }

    const handleCancelEdit = () => {
        setIsEditingProfile(false)
        setEditForm({
            fullName: userData?.fullName || '',
            phoneNumber: userData?.phoneNumber || ''
        })
        setSaveMessage('')
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSaveProfile = async () => {
        try {
            setSaveMessage('Saving...')
            const db = getFirestore(app)
            const userRef = doc(db, 'users', user.uid)
            
            await updateDoc(userRef, {
                fullName: editForm.fullName,
                phoneNumber: editForm.phoneNumber,
                updatedAt: new Date().toISOString()
            })

            setUserData(prev => ({
                ...prev,
                fullName: editForm.fullName,
                phoneNumber: editForm.phoneNumber
            }))

            setIsEditingProfile(false)
            setSaveMessage('✓ Profile updated successfully!')
            
            setTimeout(() => {
                setSaveMessage('')
            }, 3000)
        } catch (error) {
            console.error('Error updating profile:', error)
            setSaveMessage('✗ Failed to update profile. Please try again.')
        }
    }

    // Address management handlers
    const handleAddressInputChange = (e) => {
        const { name, value } = e.target
        setAddressForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleAddAddressClick = () => {
        setIsAddingAddress(true)
        setAddressForm({
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'United States'
        })
        setAddressMessage('')
    }

    const handleEditAddressClick = (address) => {
        setIsEditingAddress(true)
        setEditingAddressId(address.id)
        setAddressForm({
            addressLine1: address.addressLine1 || '',
            addressLine2: address.addressLine2 || '',
            city: address.city || '',
            state: address.state || '',
            postalCode: address.postalCode || '',
            country: address.country || 'United States'
        })
        setAddressMessage('')
    }

    const handleSaveAddress = async () => {
        // Validate required fields
        if (!addressForm.addressLine1.trim()) {
            setAddressMessage('✗ Address Line 1 is required.')
            return
        }
        if (!addressForm.city.trim()) {
            setAddressMessage('✗ City is required.')
            return
        }
        if (!addressForm.state.trim()) {
            setAddressMessage('✗ State is required.')
            return
        }
        if (!addressForm.postalCode.trim()) {
            setAddressMessage('✗ Postal Code is required.')
            return
        }
        if (!addressForm.country.trim()) {
            setAddressMessage('✗ Country is required.')
            return
        }

        try {
            setAddressMessage('Saving...')
            const db = getFirestore(app)
            const addressesRef = collection(db, `users/${user.uid}/address`)

            if (isEditingAddress && editingAddressId) {
                // Update existing address
                const addressRef = doc(db, `users/${user.uid}/address`, editingAddressId)
                await updateDoc(addressRef, {
                    ...addressForm,
                    updatedAt: new Date().toISOString()
                })

                setAddresses(prev => prev.map(addr => 
                    addr.id === editingAddressId 
                        ? { ...addr, ...addressForm }
                        : addr
                ))

                setIsEditingAddress(false)
                setEditingAddressId(null)
                setAddressMessage('✓ Address updated successfully!')
            } else {
                // Add new address
                const newAddressData = {
                    ...addressForm,
                    createdAt: new Date().toISOString()
                }
                const docRef = await addDoc(addressesRef, newAddressData)
                
                setAddresses(prev => [...prev, { id: docRef.id, ...newAddressData }])
                setIsAddingAddress(false)
                setAddressMessage('✓ Address added successfully!')
            }

            setTimeout(() => {
                setAddressMessage('')
            }, 3000)
        } catch (error) {
            console.error('Error saving address:', error)
            setAddressMessage('✗ Failed to save address. Please try again.')
        }
    }

    const handleCancelAddress = () => {
        setIsAddingAddress(false)
        setIsEditingAddress(false)
        setEditingAddressId(null)
        setAddressForm({
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'United States'
        })
        setAddressMessage('')
    }

    const handleDeleteAddress = async (addressId) => {
        if (!confirm('Are you sure you want to delete this address?')) return

        try {
            setAddressMessage('Deleting...')
            const db = getFirestore(app)
            const addressRef = doc(db, `users/${user.uid}/address`, addressId)
            await deleteDoc(addressRef)

            setAddresses(prev => prev.filter(addr => addr.id !== addressId))
            setAddressMessage('✓ Address deleted successfully!')

            setTimeout(() => {
                setAddressMessage('')
            }, 3000)
        } catch (error) {
            console.error('Error deleting address:', error)
            setAddressMessage('✗ Failed to delete address. Please try again.')
        }
    }

    // Password change handlers
    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleChangePasswordClick = () => {
        setIsChangingPassword(true)
        setUseEmailReset(false)
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        })
        setPasswordMessage('')
    }

    const handlePasswordChange = async () => {
        try {
            setPasswordMessage('Updating password...')

            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                setPasswordMessage('✗ New passwords do not match.')
                return
            }

            if (passwordForm.newPassword.length < 6) {
                setPasswordMessage('✗ Password must be at least 6 characters.')
                return
            }

            const currentUser = auth.currentUser
            const credential = EmailAuthProvider.credential(
                currentUser.email,
                passwordForm.currentPassword
            )

            // Reauthenticate user
            await reauthenticateWithCredential(currentUser, credential)

            // Update password
            await updatePassword(currentUser, passwordForm.newPassword)

            setPasswordMessage('✓ Password updated successfully!')
            setIsChangingPassword(false)
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })

            setTimeout(() => {
                setPasswordMessage('')
            }, 3000)
        } catch (error) {
            console.error('Error changing password:', error)
            if (error.code === 'auth/wrong-password') {
                setPasswordMessage('✗ Current password is incorrect.')
            } else if (error.code === 'auth/requires-recent-login') {
                setPasswordMessage('✗ Please log in again before changing your password.')
            } else {
                setPasswordMessage('✗ Failed to change password. ' + error.message)
            }
        }
    }

    const handleSendPasswordResetEmail = async () => {
        try {
            setPasswordMessage('Sending reset email...')
            await sendPasswordResetEmail(auth, user.email)
            setPasswordMessage('✓ Password reset email sent! Check your inbox.')
            setIsChangingPassword(false)

            setTimeout(() => {
                setPasswordMessage('')
            }, 5000)
        } catch (error) {
            console.error('Error sending reset email:', error)
            setPasswordMessage('✗ Failed to send reset email. Please try again.')
        }
    }

    const handleCancelPasswordChange = () => {
        setIsChangingPassword(false)
        setUseEmailReset(false)
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        })
        setPasswordMessage('')
    }

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="loading-spinner"></div>
                <p>Loading your profile...</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="profile-empty">
                <div className="empty-icon">🔒</div>
                <h2>Please log in to view your profile</h2>
                <button onClick={() => window.location.href = '/login'} className="login-btn">
                    Go to Login
                </button>
            </div>
        )
    }

    return (
        <>
            <Head>
                <title>My Profile - Egorly</title>
            </Head>
            
            <div className="profile-container">
                {/* Profile Header */}
                <div className="profile-header">
                    <div className="profile-avatar">
                        <div className="avatar-circle">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className="profile-info">
                        <h1>Welcome back!</h1>
                        <p className="user-email">{user.email}</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="profile-tabs">
                    <button 
                        className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <span className="tab-icon">📊</span>
                        Overview
                    </button>
                    <button 
                        className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <span className="tab-icon">📦</span>
                        My Orders
                    </button>
                    <button 
                        className={`tab ${activeTab === 'addresses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('addresses')}
                    >
                        <span className="tab-icon">📍</span>
                        Addresses
                    </button>
                    <button 
                        className={`tab ${activeTab === 'account' ? 'active' : ''}`}
                        onClick={() => setActiveTab('account')}
                    >
                        <span className="tab-icon">⚙️</span>
                        Account
                    </button>
                </div>

                {/* Tab Content */}
                <div className="profile-content">
                    {activeTab === 'overview' && (
                        <div className="overview-section">
                            {/* Quick Stats */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">📦</div>
                                    <div className="stat-info">
                                        <span className="stat-value">{recentOrders.length}</span>
                                        <span className="stat-label">Recent Orders</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">📍</div>
                                    <div className="stat-info">
                                        <span className="stat-value">{addresses.length}</span>
                                        <span className="stat-label">Saved Addresses</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Orders Preview */}
                            <div className="section-card">
                                <div className="section-header">
                                    <h2>Recent Orders</h2>
                                    <button 
                                        className="view-all-btn"
                                        onClick={() => setActiveTab('orders')}
                                    >
                                        View All →
                                    </button>
                                </div>
                                {recentOrders.length > 0 ? (
                                    <div className="orders-preview">
                                        {recentOrders.map((order) => (
                                            <div key={order.id} className="order-preview-card">
                                                <div className="order-preview-header">
                                                    <span className="order-preview-id">
                                                        #{order.orderId || order.id.slice(-8).toUpperCase()}
                                                    </span>
                                                    <span 
                                                        className="order-preview-status"
                                                        style={{ backgroundColor: getStatusColor(order.status) }}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="order-preview-date">
                                                    {formatDate(order.orderDate)}
                                                </p>
                                                <p className="order-preview-total">
                                                    ${order.totals.total.toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <p>No orders yet</p>
                                        <button onClick={() => window.location.href = '/'}>
                                            Start Shopping
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="section-card">
                                <h2>Quick Actions</h2>
                                <div className="quick-actions">
                                    <button 
                                        className="action-btn"
                                        onClick={() => window.location.href = '/'}
                                    >
                                        <span>🛍️</span>
                                        Continue Shopping
                                    </button>
                                    <button 
                                        className="action-btn"
                                        onClick={() => setActiveTab('orders')}
                                    >
                                        <span>📦</span>
                                        Track Orders
                                    </button>
                                    <button 
                                        className="action-btn"
                                        onClick={() => setActiveTab('addresses')}
                                    >
                                        <span>📍</span>
                                        Manage Addresses
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="orders-section">
                            {allOrders.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📦</div>
                                    <p>No orders yet</p>
                                    <p>When you place orders, they'll appear here</p>
                                    <button onClick={() => window.location.href = '/'}>
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                <div className="orders-list">
                                    {allOrders.map((order) => (
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
                            )}
                        </div>
                    )}

                    {activeTab === 'addresses' && (
                        <div className="addresses-section">
                            <div className="section-header">
                                <h2>Saved Addresses</h2>
                                {!isAddingAddress && !isEditingAddress && (
                                    <button className="add-btn" onClick={handleAddAddressClick}>
                                        + Add New Address
                                    </button>
                                )}
                            </div>
                            
                            {addressMessage && (
                                <div className={`save-message ${addressMessage.includes('✓') ? 'success' : addressMessage.includes('✗') ? 'error' : ''}`}>
                                    {addressMessage}
                                </div>
                            )}

                            {(isAddingAddress || isEditingAddress) && (
                                <div className="section-card">
                                    <h3>{isEditingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                                    <div className="edit-form">
                                        <div className="form-group">
                                            <label htmlFor="addressLine1">Address Line 1 *</label>
                                            <input
                                                type="text"
                                                id="addressLine1"
                                                name="addressLine1"
                                                value={addressForm.addressLine1}
                                                onChange={handleAddressInputChange}
                                                placeholder="Street address, P.O. box"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="addressLine2">Address Line 2</label>
                                            <input
                                                type="text"
                                                id="addressLine2"
                                                name="addressLine2"
                                                value={addressForm.addressLine2}
                                                onChange={handleAddressInputChange}
                                                placeholder="Apartment, suite, unit, building, floor, etc."
                                            />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="city">City *</label>
                                                <input
                                                    type="text"
                                                    id="city"
                                                    name="city"
                                                    value={addressForm.city}
                                                    onChange={handleAddressInputChange}
                                                    placeholder="City"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="state">State *</label>
                                                <input
                                                    type="text"
                                                    id="state"
                                                    name="state"
                                                    value={addressForm.state}
                                                    onChange={handleAddressInputChange}
                                                    placeholder="State"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="postalCode">Postal Code *</label>
                                                <input
                                                    type="text"
                                                    id="postalCode"
                                                    name="postalCode"
                                                    value={addressForm.postalCode}
                                                    onChange={handleAddressInputChange}
                                                    placeholder="ZIP / Postal code"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="country">Country *</label>
                                                <input
                                                    type="text"
                                                    id="country"
                                                    name="country"
                                                    value={addressForm.country}
                                                    onChange={handleAddressInputChange}
                                                    placeholder="Country"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="form-actions">
                                            <button className="save-btn" onClick={handleSaveAddress}>
                                                {isEditingAddress ? 'Update Address' : 'Save Address'}
                                            </button>
                                            <button className="cancel-btn" onClick={handleCancelAddress}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isAddingAddress && !isEditingAddress && (
                                <>
                                    {addresses.length > 0 ? (
                                        <div className="addresses-grid">
                                            {addresses.map((address) => (
                                                <div key={address.id} className="address-card">
                                                    <h3>{address.addressLine1}</h3>
                                                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                                                    <p>{address.city}, {address.state}</p>
                                                    <p>{address.postalCode}</p>
                                                    <p>{address.country}</p>
                                                    <div className="address-actions">
                                                        <button 
                                                            className="edit-btn" 
                                                            onClick={() => handleEditAddressClick(address)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className="delete-btn" 
                                                            onClick={() => handleDeleteAddress(address.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">📍</div>
                                            <p>No saved addresses yet</p>
                                            <button onClick={handleAddAddressClick}>Add Your First Address</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="account-section">
                            <div className="section-card">
                                <h2>Account Information</h2>
                                {saveMessage && (
                                    <div className={`save-message ${saveMessage.includes('✓') ? 'success' : saveMessage.includes('✗') ? 'error' : ''}`}>
                                        {saveMessage}
                                    </div>
                                )}
                                {isEditingProfile ? (
                                    <div className="edit-form">
                                        <div className="form-group">
                                            <label htmlFor="fullName">Full Name</label>
                                            <input
                                                type="text"
                                                id="fullName"
                                                name="fullName"
                                                value={editForm.fullName}
                                                onChange={handleInputChange}
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="phoneNumber">Phone Number</label>
                                            <input
                                                type="tel"
                                                id="phoneNumber"
                                                name="phoneNumber"
                                                value={editForm.phoneNumber}
                                                onChange={handleInputChange}
                                                placeholder="Enter your phone number"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                value={user.email}
                                                disabled
                                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                            />
                                            <small style={{ color: '#666', fontSize: '0.85rem' }}>Email cannot be changed</small>
                                        </div>
                                        <div className="form-actions">
                                            <button className="save-btn" onClick={handleSaveProfile}>
                                                Save Changes
                                            </button>
                                            <button className="cancel-btn" onClick={handleCancelEdit}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="account-info-grid">
                                            <div className="info-row">
                                                <span className="info-label">Email:</span>
                                                <span className="info-value">{user.email}</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">Full Name:</span>
                                                <span className="info-value">
                                                    {userData?.fullName || 'Not set'}
                                                </span>
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">Phone:</span>
                                                <span className="info-value">
                                                    {userData?.phoneNumber || 'Not set'}
                                                </span>
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">Member Since:</span>
                                                <span className="info-value">
                                                    {userData?.createdAt ? formatDate(userData.createdAt) : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        <button className="edit-profile-btn" onClick={handleEditProfileClick}>
                                            Edit Profile
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="section-card">
                                <h2>Security</h2>
                                {passwordMessage && (
                                    <div className={`save-message ${passwordMessage.includes('✓') ? 'success' : passwordMessage.includes('✗') ? 'error' : ''}`}>
                                        {passwordMessage}
                                    </div>
                                )}
                                {isChangingPassword ? (
                                    <div className="edit-form">
                                        {!useEmailReset ? (
                                            <>
                                                <div className="form-group">
                                                    <label htmlFor="currentPassword">Current Password *</label>
                                                    <input
                                                        type="password"
                                                        id="currentPassword"
                                                        name="currentPassword"
                                                        value={passwordForm.currentPassword}
                                                        onChange={handlePasswordInputChange}
                                                        placeholder="Enter your current password"
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="newPassword">New Password *</label>
                                                    <input
                                                        type="password"
                                                        id="newPassword"
                                                        name="newPassword"
                                                        value={passwordForm.newPassword}
                                                        onChange={handlePasswordInputChange}
                                                        placeholder="Enter new password (min 6 characters)"
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="confirmPassword">Confirm New Password *</label>
                                                    <input
                                                        type="password"
                                                        id="confirmPassword"
                                                        name="confirmPassword"
                                                        value={passwordForm.confirmPassword}
                                                        onChange={handlePasswordInputChange}
                                                        placeholder="Re-enter new password"
                                                        required
                                                    />
                                                </div>
                                                <div className="form-actions">
                                                    <button className="save-btn" onClick={handlePasswordChange}>
                                                        Update Password
                                                    </button>
                                                    <button className="cancel-btn" onClick={handleCancelPasswordChange}>
                                                        Cancel
                                                    </button>
                                                </div>
                                                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                                    <button 
                                                        className="link-btn" 
                                                        onClick={() => setUseEmailReset(true)}
                                                        style={{ 
                                                            background: 'none', 
                                                            border: 'none', 
                                                            color: '#667eea', 
                                                            textDecoration: 'underline', 
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        Forgot your current password?
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                                                    We'll send a password reset link to <strong>{user.email}</strong>. 
                                                    Click the link in the email to reset your password.
                                                </p>
                                                <div className="form-actions">
                                                    <button className="save-btn" onClick={handleSendPasswordResetEmail}>
                                                        Send Reset Email
                                                    </button>
                                                    <button className="cancel-btn" onClick={() => setUseEmailReset(false)}>
                                                        Back
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <button className="change-password-btn" onClick={handleChangePasswordClick}>
                                        Change Password
                                    </button>
                                )}
                            </div>

                            <div className="section-card">
                                <h2>Session</h2>
                                <button className="logout-btn" onClick={onLogout}>
                                    <span>🚪</span>
                                    Log Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

const Profile = () => {
    return (
        <Layout>
            {(user, onLogout) => <ProfileInner user={user} onLogout={onLogout} />}
        </Layout>
    )
}

export default Profile
