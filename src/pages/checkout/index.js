import Layout from "../../app/components/Layout";
import LiveBanner from "../../app/components/LiveBanner";
import "./index.css";
import Head from 'next/head';
import { useEffect, useState, useRef } from 'react'
import { app } from '../../lib/firebaseConfig'
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { getGuestSession, getGuestCart } from '../../lib/guestUser'

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

function CheckoutInner({ user }) {
    // ALL useState calls must be at the top, before ANY conditional returns
    const [cart, setCart] = useState({ items: [], updatedAt: null })
    const [subtotal, setSubtotal] = useState(0)
    const [toast, setToast] = useState(null)
    const [guestId, setGuestId] = useState(null)
    const [isLive, setIsLive] = useState(false)
    const [discountPercentage, setDiscountPercentage] = useState(20)

    // saved addresses
    const [savedAddresses, setSavedAddresses] = useState([])
    const [showSavedAddresses, setShowSavedAddresses] = useState(false)
    const [useNewAddress, setUseNewAddress] = useState(true)

    // shipping form
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [stateVal, setStateVal] = useState('')
    const [zip, setZip] = useState('')
    const [country, setCountry] = useState('US')
    const [addressValidated, setAddressValidated] = useState(false)

    // delivery estimate
    const [deliveryEstimate, setDeliveryEstimate] = useState(null)
    const [loadingEstimate, setLoadingEstimate] = useState(false)

    const addressRef = useRef(null)
    const autocompleteRef = useRef(null)

    // Fetch discount status
    useEffect(() => {
        const fetchDiscountStatus = async () => {
            try {
                const res = await fetch('/api/discount-toggle');
                if (res.ok) {
                    const data = await res.json();
                    setIsLive(data.enabled || false);
                    setDiscountPercentage(data.percentage || 20);
                }
            } catch (err) {
                console.error('Failed to fetch discount status:', err);
            }
        };

        fetchDiscountStatus();
        // No polling needed - just check once on load
    }, []);

    // auto-dismiss toast
    useEffect(()=>{
        if(!toast) return
        const t = setTimeout(()=> setToast(null), 3500)
        return ()=> clearTimeout(t)
    },[toast])

    // compute subtotal
    useEffect(()=>{
        let s = cart.items.reduce((acc, it) => acc + (parseFloat(it.price||0) * (it.quantity||0)), 0)
        // Apply live discount if streaming
        if (isLive) {
            s = s * (1 - discountPercentage / 100);
        }
        setSubtotal(s)
    },[cart.items, isLive, discountPercentage])

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
                    // Guest user - use localStorage
                    const gId = await getGuestSession()
                    setGuestId(gId)
                    const cartData = getGuestCart()
                    const items = (cartData.items || []).map(it => ({ ...it }))
                    setCart({ items, updatedAt: cartData.updatedAt || null })
                }
            }catch(e){ console.error('fetchCart', e) }
        }
        fetchCart()
    }, [user])

    // Fetch saved addresses (only for logged-in users)
    useEffect(() => {
        if (!user) return
        const fetchAddresses = async () => {
            try {
                const db = getFirestore(app)
                const addressRef = collection(db, `users/${user.uid}/address`)
                const addressSnapshot = await getDocs(addressRef)
                const addressList = addressSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setSavedAddresses(addressList)
                if (addressList.length > 0) {
                    setShowSavedAddresses(true)
                    setUseNewAddress(false)
                }
            } catch (e) {
                console.error('fetchAddresses', e)
            }
        }
        fetchAddresses()
    }, [user])



    // Fetch delivery estimate when address is complete
    const fetchDeliveryEstimate = async () => {
        if (!address || !city || !stateVal || !zip || cart.items.length === 0) return
        
        setLoadingEstimate(true)
        try {
            console.log('🛒 Calculating shipping for ALL cart items:', cart.items.length)
            
            // Prepare all products for single API call
            const productsForShipping = cart.items.map(item => ({
                variantId: item.variant?.id || item.variantId,
                quantity: item.quantity || 1
            })).filter(p => p.variantId); // Only include items with variant ID
            
            if (productsForShipping.length === 0) {
                console.warn('⚠️ No items with variant IDs found');
                setDeliveryEstimate({ days: '7-12', method: 'Standard International Shipping' });
                setLoadingEstimate(false);
                return;
            }
            
            console.log('📦 Sending products to shipping API:', productsForShipping);
            
            // Single API call for all products
            const response = await fetch('/api/cj/shipping-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    products: productsForShipping,
                    country: country,
                    postalCode: zip
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error('❌ Shipping API error:', data);
                setDeliveryEstimate({ days: '7-12', method: 'Standard International Shipping' });
                setLoadingEstimate(false);
                return;
            }
            
            console.log('Shipping API response:', data);
            
            if (data.success && data.shippingOptions && data.shippingOptions.length > 0) {
                // Select the CHEAPEST shipping option
                const cheapestOption = data.shippingOptions.reduce((cheapest, option) => {
                    return option.price < cheapest.price ? option : cheapest
                });
                
                // Use actual CJ prices from API response
                const cjPrices = data.productPrices || {};
                
                // Calculate comprehensive breakdown
                let totalProductCost = 0;
                let totalSellingPrice = 0;
                const shippingBreakdown = [];
                
                for (const item of cart.items) {
                    if (!item.variant?.id) continue;
                    
                    // Use actual CJ price from API, fallback to cached price
                    const actualCost = cjPrices[item.variant.id] || item.variant?.price || (parseFloat(item.price) * 0.26);
                    const itemQuantity = item.quantity || 1;
                    const itemTotalCost = actualCost * itemQuantity;
                    
                    totalProductCost += itemTotalCost;
                    totalSellingPrice += parseFloat(item.price) * itemQuantity;
                    
                    shippingBreakdown.push({
                        name: item.name,
                        variantKey: item.variant?.variantKey || '',
                        quantity: itemQuantity,
                        productCost: actualCost,
                        totalCost: itemTotalCost,
                        sellingPrice: parseFloat(item.price),
                        totalSellingPrice: parseFloat(item.price) * itemQuantity,
                        usingRealTimePrice: !!cjPrices[item.variant.id]
                    });
                }
                
                // Display comprehensive breakdown
                console.log('\n' + '='.repeat(60));
                console.log('📊 COMPLETE ORDER BREAKDOWN');
                console.log('='.repeat(60));
                
                shippingBreakdown.forEach((item, i) => {
                    const priceSource = item.usingRealTimePrice ? '🔴 LIVE CJ PRICE' : '⚠️ Cached Price';
                    console.log(`\n${i + 1}. ${item.name} ${item.variantKey ? `(${item.variantKey})` : ''}`);
                    console.log(`   🛍️  Quantity: ${item.quantity}`);
                    console.log(`   💰 Unit Price: $${item.sellingPrice.toFixed(2)}`);
                    console.log(`   💵 Total Price: $${item.totalSellingPrice.toFixed(2)}`);
                    console.log(`   📦 CJ Cost: $${item.productCost.toFixed(2)} × ${item.quantity} = $${item.totalCost.toFixed(2)} ${priceSource}`);
                });
                
                console.log('\n' + '-'.repeat(60));
                console.log('💵 TOTAL SELLING PRICE: $' + totalSellingPrice.toFixed(2));
                console.log('📦 TOTAL PRODUCT COST: $' + totalProductCost.toFixed(2) + ' ← Should match CJ');
                console.log('🚚 TOTAL SHIPPING COST: $' + cheapestOption.price.toFixed(2) + ' ← Should match CJ');
                console.log('💰 ESTIMATED PROFIT: $' + (totalSellingPrice - totalProductCost - cheapestOption.price).toFixed(2));
                console.log('📊 PROFIT MARGIN: ' + (((totalSellingPrice - totalProductCost - cheapestOption.price) / totalSellingPrice) * 100).toFixed(1) + '%');
                console.log('🚚 SHIPPING METHOD: ' + cheapestOption.name + ' (' + cheapestOption.deliveryTime + ' days)');
                console.log('='.repeat(60) + '\n');
                
                // Use generic shipping method name for customers (hide CJ carrier names)
                const genericMethodName = cheapestOption.deliveryTime.includes('-') 
                    ? `Standard International Shipping`
                    : `Express International Shipping`;
                
                setDeliveryEstimate({
                    days: cheapestOption.deliveryTime,
                    method: genericMethodName, // Generic name for customers
                    price: cheapestOption.price
                });
            } else {
                console.log('⚠️ Using generic delivery estimate');
                setDeliveryEstimate({
                    days: '7-12',
                    method: 'Standard International Shipping'
                });
            }
        } catch (error) {
            console.error('Error fetching delivery estimate:', error);
            setDeliveryEstimate({
                days: '7-12',
                method: 'Standard International Shipping'
            });
        } finally {
            setLoadingEstimate(false);
        }
    }

    // Simple validation: mark as validated when all required fields are filled
    useEffect(() => {
        if (address && city && stateVal && zip) {
            setAddressValidated(true)
            // Fetch delivery estimate when address is complete
            fetchDeliveryEstimate()
        } else {
            setAddressValidated(false)
            setDeliveryEstimate(null)
        }
    }, [address, city, stateVal, zip, country, cart.items])

    // Load Google Places script
    useEffect(() => {
        if (!GOOGLE_KEY || typeof window === 'undefined') return

        // Check if already loaded
        if (window.google?.maps?.places) {
            initAutocomplete()
            return
        }

        // Check if script already exists
        if (document.querySelector('script[src*="maps.googleapis.com"]')) return

        // Load script
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places`
        script.async = true
        script.onload = () => initAutocomplete()
        document.head.appendChild(script)
    }, [])

    // Initialize autocomplete on address input
    const initAutocomplete = () => {
        setTimeout(() => {
            if (!addressRef.current || !window.google?.maps?.places) return

            const autocomplete = new window.google.maps.places.Autocomplete(addressRef.current, {
                componentRestrictions: { country: 'us' },
                fields: ['address_components'],
                types: ['address']
            })

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace()
                if (!place.address_components) return

                let street = '', city = '', state = '', zip = ''

                place.address_components.forEach(c => {
                    if (c.types.includes('street_number')) street = c.long_name + ' '
                    if (c.types.includes('route')) street += c.long_name
                    if (c.types.includes('locality')) city = c.long_name
                    if (c.types.includes('administrative_area_level_1')) state = c.short_name
                    if (c.types.includes('postal_code')) zip = c.long_name
                })

                setAddress(street.trim())
                setCity(city)
                setStateVal(state)
                setZip(zip)
            })

            autocompleteRef.current = autocomplete
        }, 100)
    }

    const handleSelectSavedAddress = (selectedAddress) => {
        setAddress(selectedAddress.addressLine1 || '')
        setCity(selectedAddress.city || '')
        setStateVal(selectedAddress.state || '')
        setZip(selectedAddress.postalCode || '')
        setCountry(selectedAddress.country || 'US')
        setAddressValidated(true)
        setUseNewAddress(false)
    }

    const handleUseNewAddress = () => {
        setUseNewAddress(true)
        setAddress('')
        setCity('')
        setStateVal('')
        setZip('')
        setCountry('US')
        setAddressValidated(false)
    }

    const handleConfirm = async (e) =>{
        e.preventDefault()
        
        // Validate required fields
        if(!fullName || !email || !phone || !address || !city || !stateVal || !zip){ 
            setToast({type:'error', message:'Please fill all required fields.'}); 
            return 
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setToast({type:'error', message:'Please enter a valid email address.'})
            return
        }

        // Basic phone validation
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
        if (!phoneRegex.test(phone)) {
            setToast({type:'error', message:'Please enter a valid phone number.'})
            return
        }
        
        // Validate address is complete
        if(!addressValidated){ 
            setToast({type:'error', message:'Please select an address from Google suggestions or complete all address fields.'}); 
            return 
        }
        
        // Redirect to payment page
        setToast({type:'success', message:'Redirecting to secure payment...'})
        
        // Store order data for payment page
        const orderData = {
            userId: user?.uid || guestId,
            isGuest: !user,
            customerInfo: { fullName, email, phone },
            shippingAddress: { address, city, state: stateVal, zip, country },
            cartItems: cart.items,
            deliveryEstimate: deliveryEstimate,
            shippingCost: deliveryEstimate?.price || null, // Save actual shipping cost
            orderDate: new Date().toISOString()
        }
        
        console.log('Storing order data for payment:', orderData)
        console.log('Cart items count:', cart.items.length)
        
        // Store in sessionStorage so payment page can access it
        sessionStorage.setItem('orderData', JSON.stringify(orderData))
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = '/payment'
        }, 1000)
    }

    return (
        <>
            <Head>
                <title>Secure Checkout - Egorly</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rubik:wght@500;600;700&display=swap" rel="stylesheet"/>
            </Head>
            <LiveBanner />

            <div className="checkout_wrapper">
                <div className="checkout_container">
                    <div className="checkout_header">
                        <div className="progress_indicator">
                            <div className="step active">
                                <div className="step_circle">1</div>
                                <span>Information</span>
                            </div>
                            <div className="step_line"></div>
                            <div className="step">
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
                        <div className="checkout_form">
                            <div className="form_section">
                                <div className="section_header">
                                    <h2>Contact Information</h2>
                                    <p>We'll use this to send you order updates</p>
                                </div>
                                
                                <div className="input_group">
                                    <div className="input_field">
                                        <input type="email" id="emailInput" placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)} className={email ? 'filled' : ''}/>
                                        <label htmlFor="emailInput">Email Address *</label>
                                    </div>
                                </div>

                                <div className="input_row">
                                    <div className="input_field">
                                        <input type="text" id="nameInput" placeholder="Enter your full name" value={fullName} onChange={e=>setFullName(e.target.value)} className={fullName ? 'filled' : ''}/>
                                        <label htmlFor="nameInput">Full Name *</label>
                                    </div>
                                    <div className="input_field">
                                        <input type="tel" id="phoneInput" placeholder="Enter your phone number" value={phone} onChange={e=>setPhone(e.target.value)} className={phone ? 'filled' : ''}/>
                                        <label htmlFor="phoneInput">Phone Number *</label>
                                    </div>
                                </div>
                            </div>

                            <div className="form_section">
                                <div className="section_header">
                                    <h2>Shipping Address</h2>
                                    <p>Where should we deliver your delicious fish snacks?</p>
                                </div>

                                {savedAddresses.length > 0 && (
                                    <div className="saved_addresses_section">
                                        <div className="address_options">
                                            <button 
                                                className={`address_option_btn ${!useNewAddress ? 'active' : ''}`}
                                                onClick={() => setUseNewAddress(false)}
                                                type="button"
                                            >
                                                📍 Use Saved Address
                                            </button>
                                            <button 
                                                className={`address_option_btn ${useNewAddress ? 'active' : ''}`}
                                                onClick={handleUseNewAddress}
                                                type="button"
                                            >
                                                ➕ Use New Address
                                            </button>
                                        </div>

                                        {!useNewAddress && (
                                            <div className="saved_addresses_list">
                                                {savedAddresses.map((addr) => (
                                                    <div 
                                                        key={addr.id} 
                                                        className={`saved_address_card ${
                                                            address === addr.addressLine1 && 
                                                            city === addr.city && 
                                                            stateVal === addr.state && 
                                                            zip === addr.postalCode 
                                                            ? 'selected' : ''
                                                        }`}
                                                        onClick={() => handleSelectSavedAddress(addr)}
                                                    >
                                                        <div className="address_content">
                                                            <h4>{addr.addressLine1}</h4>
                                                            {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                                                            <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                                                            <p>{addr.country}</p>
                                                        </div>
                                                        <div className="address_radio">
                                                            <div className={`radio_circle ${
                                                                address === addr.addressLine1 && 
                                                                city === addr.city && 
                                                                stateVal === addr.state && 
                                                                zip === addr.postalCode 
                                                                ? 'checked' : ''
                                                            }`}>
                                                                {address === addr.addressLine1 && 
                                                                city === addr.city && 
                                                                stateVal === addr.state && 
                                                                zip === addr.postalCode && (
                                                                    <div className="radio_dot"></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {useNewAddress && (
                                    <>
                                        <div className="input_group">
                                    <div className="input_field address_field">
                                        <input 
                                            ref={addressRef}
                                            type="text" 
                                            id="addressInput" 
                                            placeholder="Start typing your address..." 
                                            value={address} 
                                            onChange={e => setAddress(e.target.value)}
                                            className={address ? 'filled' : ''}
                                            autoComplete="off"
                                        />
                                        <label htmlFor="addressInput">Street Address *</label>
                                        {addressValidated && <div className="validation_check">✓</div>}
                                    </div>
                                    
                                    {loadingEstimate && (
                                        <div className="delivery_estimate loading">
                                            <div className="estimate_icon">📦</div>
                                            <span>Calculating delivery time...</span>
                                        </div>
                                    )}
                                    
                                    {!loadingEstimate && deliveryEstimate && (
                                        <div className="delivery_estimate">
                                            <div className="estimate_icon">🚚</div>
                                            <div className="estimate_info">
                                                <strong>Estimated Delivery: {deliveryEstimate.days} business days</strong>
                                                <span className="estimate_method">via Standard International Shipping</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="input_row">
                                    <div className="input_field">
                                        <input type="text" id="cityInput" placeholder="City" value={city} onChange={e=>setCity(e.target.value)} className={city ? 'filled' : ''}/>
                                        <label htmlFor="cityInput">City *</label>
                                    </div>
                                    <div className="input_field">
                                        <input type="text" id="stateInput" placeholder="State or Region" value={stateVal} onChange={e=>setStateVal(e.target.value)} className={stateVal ? 'filled' : ''}/>
                                        <label htmlFor="stateInput">State / Region *</label>
                                    </div>
                                    <div className="input_field zip_field">
                                        <input type="text" id="zipInput" placeholder="ZIP" value={zip} onChange={e=>setZip(e.target.value)} className={zip ? 'filled' : ''}/>
                                        <label htmlFor="zipInput">ZIP Code *</label>
                                    </div>
                                </div>

                                <div className="input_group">
                                    <div className="input_field">
                                        <input type="text" id="countryInput" placeholder="Country" value={country} onChange={e=>setCountry(e.target.value)} className={country ? 'filled' : ''}/>
                                        <label htmlFor="countryInput">Country *</label>
                                    </div>
                                </div>

                                {!GOOGLE_KEY && (
                                    <div className="address_tip">
                                        💡 <strong>Tip:</strong> Double-check your address for faster delivery
                                    </div>
                                )}
                                    </>
                                )}
                            </div>

                            <div className="form_actions">
                                <button className="continue_btn" onClick={handleConfirm}>
                                    <span>Continue to Payment</span>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                
                                {/* Test Invoice Preview Button */}
                                <button 
                                    type="button"
                                    style={{
                                        marginTop: '10px',
                                        padding: '10px 20px',
                                        backgroundColor: '#f0f0f0',
                                        border: '1px solid #ccc',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                    onClick={() => {
                                        // Store test data in sessionStorage
                                        sessionStorage.setItem('testInvoiceData', JSON.stringify({
                                            cart: cart.items,
                                            customerInfo: { fullName, email, phone },
                                            shippingAddress: { address, city, state: stateVal, zip, country },
                                            deliveryEstimate,
                                            subtotal
                                        }));
                                        window.location.href = '/test-invoice';
                                    }}
                                >
                                    🧪 Check Invoice View (Test)
                                </button>
                            </div>
                        </div>

                        <div className="order_summary">
                            <div className="summary_header">
                                <h3>Order Summary</h3>
                                <span className="item_count">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="summary_items">
                                {cart.items && cart.items.length > 0 ? (
                                    cart.items.map((it, index) => (
                                        <div 
                                            className="summary_item" 
                                            key={it.variant?.id || `${it.productId}-${index}`}
                                            onClick={() => window.location.href = `/product/${it.productId || it.id}`}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="item_image">
                                                <img src={it.imageUrl || it.image || '/images/calamari_product_salt.png'} alt={it.name || it.title || 'product'} />
                                                <span className="item_quantity">{it.quantity || 1}</span>
                                            </div>
                                            <div className="item_details">
                                                <h4>{it.name || it.title || 'Product'}</h4>
                                                <p className="item_price">${(parseFloat(it.price||0)).toFixed(2)} each</p>
                                            </div>
                                            <div className="item_total">
                                                ${(parseFloat(it.price||0) * (it.quantity||1)).toFixed(2)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty_cart_message">
                                        <p>Your cart is empty</p>
                                        <p><a href="/" style={{color: '#0059AA', textDecoration: 'none'}}>← Continue Shopping</a></p>
                                    </div>
                                )}
                            </div>

                            <div className="summary_calculations">
                                <div className="calc_row">
                                    <span>Subtotal</span>
                                    <span>
                                        {isLive && (
                                            <span style={{
                                                textDecoration: 'line-through',
                                                color: '#999',
                                                marginRight: '0.5rem',
                                                fontSize: '0.9rem'
                                            }}>
                                                ${(cart.items.reduce((acc, it) => acc + (parseFloat(it.price||0) * (it.quantity||0)), 0)).toFixed(2)}
                                            </span>
                                        )}
                                        ${subtotal.toFixed(2)}
                                        {isLive && (
                                            <span style={{
                                                background: 'linear-gradient(135deg, #ff0844 0%, #ff4d6d 100%)',
                                                color: 'white',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '12px',
                                                fontSize: '0.7rem',
                                                fontWeight: '700',
                                                marginLeft: '0.5rem',
                                                letterSpacing: '0.3px'
                                            }}>
                                                20% OFF
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="calc_row shipping_note">
                                    <span>Shipping</span>
                                    <span className="included_note">Included in product price</span>
                                </div>
                                <div className="calc_row total_row">
                                    <span>Total</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="security_badges">
                                <div className="security_item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 1l3.09 6.26L22 9l-5 4.87L18.18 21 12 17.77 5.82 21 7 13.87 2 9l6.91-1.74L12 1z"/>
                                    </svg>
                                    <span>Secure Checkout</span>
                                </div>
                                <div className="security_item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V6a2 2 0 012-2h6a2 2 0 012 2v1M7 7v4"/>
                                    </svg>
                                    <span>SSL Encrypted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <div className={`modern_toast ${toast.type === 'success' ? 'toast_success' : 'toast_error'}`}>
                    <div className="toast_icon">
                        {toast.type === 'success' ? '✓' : '!'}
                    </div>
                    <span>{toast.message}</span>
                </div>
            )}
        </>
    )
}

export default function Checkout() {
    return (
        <Layout>
            {(user) => <CheckoutInner user={user} />}
        </Layout>
    )
}