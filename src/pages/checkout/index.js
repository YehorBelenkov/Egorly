import CheckoutNav from "../../app/components/checkout_navbar";
import Layout from "../../app/components/Layout";
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

    // shipping rates
    const [shippingRates, setShippingRates] = useState([])
    const [selectedShipping, setSelectedShipping] = useState(null)
    const [loadingRates, setLoadingRates] = useState(false)
    const [showShippingOptions, setShowShippingOptions] = useState(false)

    // Array of allowed courier service IDs (from testing page)
    const allowedCouriers = [
        "7505df80-af51-46a0-b2ee-ac9eacfcd3e4",
        "c3e97b11-2842-44f1-84d1-afaa6b3f0a7c",
        "e30d3997-d7b1-4c1d-afd2-ea1556aa943b",
        "70fa1197-3021-4aee-b08c-a70d6e7ac198"
    ]

    // Convert country name to country code if needed
    const getCountryCode = (countryInput) => {
        const countryMap = {
            'United States': 'US',
            'USA': 'US',
            'America': 'US',
            'Canada': 'CA',
            'Mexico': 'MX',
            'United Kingdom': 'GB',
            'UK': 'GB',
            'Australia': 'AU',
            'Germany': 'DE',
            'France': 'FR',
            'Italy': 'IT',
            'Spain': 'ES'
        }
        
        const input = countryInput?.trim()
        if (!input) return 'US'
        
        // If it's already a 2-letter code, return as is
        if (input.length === 2 && /^[A-Z]{2}$/.test(input)) {
            return input
        }
        
        // Try to find in map, otherwise default to US
        return countryMap[input] || 'US'
    }

    // Convert state name to abbreviation if needed
    const getStateAbbreviation = (stateInput) => {
        const stateMap = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
            'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
            'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
            'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
            'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
            'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
            'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
            'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
            'District of Columbia': 'DC'
        }
        
        const input = stateInput?.trim()
        if (!input) return input
        
        // If it's already an abbreviation (2 letters), return as is
        if (input.length === 2 && /^[A-Z]{2}$/i.test(input)) {
            return input.toUpperCase()
        }
        
        // Try to find full name in map
        return stateMap[input] || input
    }

    const addressRef = useRef(null)
    const autocompleteRef = useRef(null)

    // auto-dismiss toast
    useEffect(()=>{
        if(!toast) return
        const t = setTimeout(()=> setToast(null), 3500)
        return ()=> clearTimeout(t)
    },[toast])

    // compute subtotal
    useEffect(()=>{
        const s = cart.items.reduce((acc, it) => acc + (parseFloat(it.price||0) * (it.quantity||0)), 0)
        setSubtotal(s)
    },[cart.items])

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



    // Watch for delayed browser autofill (some browsers autofill after a delay)
    useEffect(() => {
        const checkForAutofill = () => {
            if (addressRef.current) {
                const value = addressRef.current.value
                if (value && value !== address && value.includes(',') && value.length > 20) {
                    console.log('Detected delayed browser autofill:', value)
                    setAddress(value)
                    parseFullAddress(value)
                }
            }
        }

        // Check after various delays to catch different browser behaviors
        const timeouts = [500, 1000, 2000].map(delay => 
            setTimeout(checkForAutofill, delay)
        )

        return () => {
            timeouts.forEach(clearTimeout)
        }
    }, [])

    // Auto-validate manually entered addresses when all fields are complete
    useEffect(() => {
        // Reset validation when address changes
        setAddressValidated(false)
        
        // Auto-validate if all fields are filled and look valid (basic check)
        if (address && city && stateVal && zip && basicValidateAddress()) {
            // If Google Places is available, try to validate with it
            if (window.google && window.google.maps && window.google.maps.places && GOOGLE_KEY) {
                validateWithGooglePlaces(address, city, stateVal, zip)
            } else {
                // No Google Places, but basic validation passed
                setAddressValidated(true)
            }
        }
    }, [address, city, stateVal, zip, country])

    // Initialize Google Places Autocomplete if API key provided
    useEffect(()=>{
        if(!GOOGLE_KEY) {
            console.warn('Google Maps API key not found. Address autocomplete disabled.')
            return
        }

        // load script dynamically if needed
        if(typeof window === 'undefined') return
        if(window.google && window.google.maps && window.google.maps.places) {
            attachAutocomplete()
            return
        }

        const existing = document.querySelector('script[data-google-places]')
        if(existing) {
            existing.addEventListener('load', attachAutocomplete)
            return
        }

        console.log('Loading Google Places API...')
        const s = document.createElement('script')
        s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&v=weekly&loading=async`
        s.async = true
        s.defer = true
        s.setAttribute('data-google-places','1')
        s.onload = () => {
            console.log('Google Places API loaded successfully')
            console.log('Google object:', window.google)
            console.log('Google.maps:', window.google?.maps)
            console.log('Google.maps.places:', window.google?.maps?.places)
            attachAutocomplete()
        }
        s.onerror = (error) => {
            console.error('Failed to load Google Places API')
            console.error('Error details:', error)
            alert('ERROR: Google Maps API failed to load. Check:\n1. Is Places API enabled in Google Cloud Console?\n2. Is the API key valid?\n3. Check browser console for details')
        }
        document.head.appendChild(s)

        function attachAutocomplete(){
            try{
                if(!addressRef.current) {
                    console.warn('Address input ref not ready')
                    return
                }
                
                console.log('Attaching Google Places Autocomplete to input')
                console.log('Input element:', addressRef.current)
                
                // Check if Google Places is available
                if (!window.google || !window.google.maps || !window.google.maps.places) {
                    console.error('Google Places API not loaded properly')
                    return
                }
                
                autocompleteRef.current = new window.google.maps.places.Autocomplete(addressRef.current, { 
                    componentRestrictions: { country: 'us' },
                    fields: ['address_components', 'formatted_address', 'geometry', 'name']
                })
                
                console.log('Autocomplete instance created:', autocompleteRef.current)
                
                // Test if autocomplete is working by checking if it has methods
                if (!autocompleteRef.current.addListener) {
                    console.error('Autocomplete instance is invalid')
                    return
                }
                
                autocompleteRef.current.addListener('place_changed', () => {
                    const place = autocompleteRef.current.getPlace()
                    console.log('Place selected:', place)
                    
                    if(!place || !place.address_components) {
                        console.warn('No address components found')
                        return
                    }
                    
                    // Parse components properly
                    let streetNumber = ''
                    let streetName = ''
                    let cityName = ''
                    let stateName = ''
                    let postalCode = ''
                    let countryCode = 'US'
                    
                    place.address_components.forEach(component => {
                        const types = component.types
                        
                        if (types.includes('street_number')) {
                            streetNumber = component.long_name
                        }
                        if (types.includes('route')) {
                            streetName = component.long_name
                        }
                        if (types.includes('locality')) {
                            cityName = component.long_name
                        }
                        if (types.includes('administrative_area_level_1')) {
                            stateName = component.short_name || component.long_name
                        }
                        if (types.includes('postal_code')) {
                            postalCode = component.long_name
                        }
                        if (types.includes('country')) {
                            countryCode = component.short_name
                        }
                    })
                    
                    // Build proper street address (number + street name only)
                    const streetAddress = [streetNumber, streetName].filter(Boolean).join(' ')
                    
                    console.log('Google Places parsed:', {
                        streetAddress,
                        city: cityName,
                        state: stateName, 
                        postalCode,
                        country: countryCode
                    })
                    
                    // Set individual fields
                    setAddress(streetAddress)
                    setCity(cityName)
                    setStateVal(stateName)
                    setZip(postalCode)
                    setCountry(countryCode)
                    
                    // consider valid if geometry exists and we have essential components
                    setAddressValidated(!!place.geometry && !!streetAddress && !!cityName && !!stateName && !!postalCode)
                })
                
                console.log('Google Places Autocomplete attached successfully')
            }catch(e){ 
                console.error('Error attaching autocomplete:', e) 
            }
        }
        
        return () => {
            // Cleanup autocomplete listener
            if (autocompleteRef.current && window.google) {
                window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
            }
        }
    }, [GOOGLE_KEY])

    // Function to parse full address from browser autofill
    const parseFullAddress = (fullAddress) => {
        try {
            // Common patterns: "123 Main St, City, ST 12345" or "123 Main St, City, ST 12345, USA"
            const parts = fullAddress.split(',').map(part => part.trim())
            
            if (parts.length >= 3) {
                const streetAddress = parts[0] // "123 Main St"
                const cityName = parts[1] // "City"
                const stateZipPart = parts[2] // "ST 12345" or "ST 12345, USA"
                
                // Extract state and ZIP from the third part
                const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s+(\d{5}(-\d{4})?)/)
                
                if (stateZipMatch) {
                    const [, state, zipCode] = stateZipMatch
                    
                    console.log('Parsed address components:', {
                        street: streetAddress,
                        city: cityName,
                        state: state,
                        zip: zipCode
                    })
                    
                    // Update all fields
                    setAddress(streetAddress)
                    setCity(cityName)
                    setStateVal(state)
                    setZip(zipCode)
                    setCountry('US')
                    
                    // Try to validate with Google Places if available
                    if (window.google && window.google.maps && window.google.maps.places) {
                        validateWithGooglePlaces(streetAddress, cityName, state, zipCode)
                    } else {
                        // Mark as validated if no Google Places available
                        setAddressValidated(true)
                    }
                    
                    setToast({type:'success', message:'Address automatically parsed from autofill!'})
                } else {
                    console.log('Could not parse state/ZIP from:', stateZipPart)
                    setToast({type:'info', message:'Please complete the address in the individual fields below.'})
                }
            } else {
                console.log('Address does not have enough parts:', parts)
                setToast({type:'info', message:'Please use the individual address fields below.'})
            }
        } catch (error) {
            console.error('Error parsing address:', error)
            setToast({type:'info', message:'Please use the individual address fields below.'})
        }
    }

    // Function to validate parsed address with Google Places
    const validateWithGooglePlaces = (street, city, state, zip) => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            setAddressValidated(true) // Fallback if no Google Places
            return
        }

        try {
            const geocoder = new window.google.maps.Geocoder()
            const fullAddress = `${street}, ${city}, ${state} ${zip}, USA`
            
            console.log('Validating address with Google:', fullAddress)
            
            geocoder.geocode({ address: fullAddress }, (results, status) => {
                if (status === 'OK' && results && results.length > 0) {
                    const result = results[0]
                    console.log('Google Places validation successful:', result)
                    
                    // Check if the result is reasonably close to what we expect
                    const addressComponents = result.address_components
                    const hasStreet = addressComponents.some(comp => comp.types.includes('route'))
                    const hasCity = addressComponents.some(comp => comp.types.includes('locality'))
                    const hasState = addressComponents.some(comp => comp.types.includes('administrative_area_level_1'))
                    const hasZip = addressComponents.some(comp => comp.types.includes('postal_code'))
                    
                    if (hasStreet && hasCity && hasState && hasZip) {
                        setAddressValidated(true)
                        setToast({type:'success', message:'Address validated with Google Places!'})
                    } else {
                        console.log('Address components incomplete:', { hasStreet, hasCity, hasState, hasZip })
                        setAddressValidated(false)
                        setToast({type:'warning', message:'Please verify your address or select from Google suggestions.'})
                    }
                } else {
                    console.log('Google Places validation failed:', status)
                    setAddressValidated(false)
                    setToast({type:'warning', message:'Could not validate address. Please select from Google suggestions in the Street Address field.'})
                }
            })
        } catch (error) {
            console.error('Error validating with Google Places:', error)
            setAddressValidated(false)
            setToast({type:'warning', message:'Please select from Google suggestions in the Street Address field.'})
        }
    }

    function basicValidateAddress(){
        // Basic checks when no Google validation available
        if(!address || address.length < 3) return false
        if(!city || city.length < 2) return false
        if(!stateVal || stateVal.length < 2) return false
        if(!zip || zip.length < 5) return false
        
        // Street address should have at least a number
        if(!/[0-9]/.test(address)) return false
        
        return true
    }

    const fetchShippingRates = async () => {
        // Validate all required fields
        const missingFields = []
        if (!address?.trim()) missingFields.push('Address')
        if (!city?.trim()) missingFields.push('City')
        if (!stateVal?.trim()) missingFields.push('State')
        if (!zip?.trim()) missingFields.push('ZIP Code')
        if (!email?.trim()) missingFields.push('Email')
        if (!phone?.trim()) missingFields.push('Phone')
        if (!fullName?.trim()) missingFields.push('Full Name')
        
        if (missingFields.length > 0) {
            setToast({type:'error', message:`Please fill in: ${missingFields.join(', ')}`})
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setToast({type:'error', message:'Please enter a valid email address.'})
            return
        }

        // Basic phone validation (US format)
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
        if (!phoneRegex.test(phone)) {
            setToast({type:'error', message:'Please enter a valid phone number.'})
            return
        }

        // Basic address validation - prefer Google Places but allow basic validation as fallback
        const valid = GOOGLE_KEY ? (addressValidated || basicValidateAddress()) : basicValidateAddress()
        if (!valid) {
            setToast({type:'error', message:'Please fill in complete address information or select from Google suggestions.'})
            return
        }

        setLoadingRates(true)
        setShippingRates([])
        setSelectedShipping(null)

        try {
            // Calculate total weight based on cart items
            const totalWeight = cart.items.reduce((acc, item) => {
                const itemWeight = 0.5 // assuming 0.5 lb per fish snack item
                return acc + (itemWeight * (item.quantity || 1))
            }, 1) // minimum 1 lb
            
            const totalValue = cart.items.reduce((acc, item) => {
                return acc + (parseFloat(item.price || 0) * (item.quantity || 1))
            }, 0)

            const requestData = {
                destination_address: {
                    country_alpha2: getCountryCode(country),
                    line_1: address.trim(),
                    state: getStateAbbreviation(stateVal),
                    city: city.trim(),
                    postal_code: zip.trim(),
                    contact_name: fullName.trim(),
                    contact_phone: phone.trim(),
                    contact_email: email.trim()
                }
            }

            // Debug the address components
            console.log('Address components before API call:', {
                original: { address, city, stateVal, zip, country },
                processed: {
                    line_1: address.trim(),
                    city: city.trim(), 
                    state: getStateAbbreviation(stateVal),
                    postal_code: zip.trim(),
                    country_alpha2: getCountryCode(country)
                }
            })
            
            console.log('Sending shipping request:', requestData)

            const response = await fetch('/api/shipping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })

            const data = await response.json()
            console.log('Shipping API response:', { status: response.status, data })
            console.log('Full API response structure:', JSON.stringify(data, null, 2))

            // Check if response is successful and has rates
            if (response.ok) {
                // Handle different possible response structures
                let rates = null
                
                if (data.rates && Array.isArray(data.rates)) {
                    rates = data.rates
                } else if (data.data && data.data.rates && Array.isArray(data.data.rates)) {
                    rates = data.data.rates
                } else if (Array.isArray(data)) {
                    rates = data
                }
                
                if (rates && rates.length > 0) {
                    // Filter and sort rates like in testing page
                    const filtered = rates.filter(rate =>
                        rate.courier_service && rate.courier_service.id && 
                        allowedCouriers.includes(rate.courier_service.id)
                    )
                    const sortedRates = filtered.sort((a, b) => a.shipment_charge - b.shipment_charge)
                    
                    console.log('Available rates:', rates.length)
                    console.log('Filtered rates:', sortedRates)
                    
                    if (sortedRates.length > 0) {
                        setShippingRates(sortedRates)
                        setShowShippingOptions(true)
                        setToast({type:'success', message:'Shipping options loaded successfully!'})
                    } else {
                        console.log('No rates match allowed couriers:', allowedCouriers)
                        setToast({type:'error', message:'No shipping options available for your location with our preferred carriers.'})
                    }
                } else {
                    console.error('No rates found in API response')
                    console.error('API Error Details:', data)
                    
                    let errorMessage = 'No shipping rates available.'
                    
                    if (data.error) {
                        if (typeof data.error === 'string') {
                            errorMessage = data.error
                        } else if (data.error.message) {
                            errorMessage = data.error.message
                        } else if (data.error.details) {
                            errorMessage = data.error.details
                        } else if (data.error.code) {
                            errorMessage = `Shipping error (${data.error.code}): Please check your address details.`
                        }
                    }
                    
                    setToast({type:'error', message: errorMessage})
                }
            } else {
                console.error('API request failed with status:', response.status)
                console.error('API Error Details:', data)
                setToast({type:'error', message: 'Shipping service temporarily unavailable. Please try again later.'})
            }
        } catch (error) {
            console.error('Fetch error:', error)
            setToast({type:'error', message:'Network error. Please check your connection and try again.'})
            console.error('Shipping rates error:', error)
        } finally {
            setLoadingRates(false)
        }
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
        // validate required fields
        if(!fullName || !email || !phone || !address){ setToast({type:'error', message:'Please fill all required fields.'}); return }
        
        // Check validation: if Google Places is available, prefer it, but fall back to basic validation
        const valid = GOOGLE_KEY ? (addressValidated || basicValidateAddress()) : basicValidateAddress()
        if(!valid){ setToast({type:'error', message:'Address looks invalid. Please choose a suggested address or enter full details.'}); return }
        
        if(!showShippingOptions) {
            // Fetch shipping rates first
            await fetchShippingRates()
            return
        }
        
        if(!selectedShipping) {
            setToast({type:'error', message:'Please select a shipping method.'}); 
            return 
        }
        
        // Redirect to payment page
        setToast({type:'success', message:'Redirecting to secure payment...'})
        
        // Store order data for payment page (you can access this in payment page)
        const orderData = {
            userId: user?.uid || guestId,
            isGuest: !user,
            customerInfo: { fullName, email, phone },
            shippingAddress: { address, city, state: stateVal, zip, country },
            cartItems: cart.items,
            shipping: selectedShipping,
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
            <CheckoutNav/>
            <Head>
                <title>Secure Checkout - Egorly</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rubik:wght@500;600;700&display=swap" rel="stylesheet"/>
            </Head>

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
                                            placeholder="Enter your street address" 
                                            value={address} 
                                            onChange={e => {
                                                const value = e.target.value
                                                setAddress(value)
                                                
                                                // Auto-parse if browser autofill puts full address in street field
                                                if (value.includes(',') && value.length > 20 && !city && !stateVal && !zip) {
                                                    console.log('Detected browser autofill, parsing address:', value)
                                                    parseFullAddress(value)
                                                }
                                            }}
                                            onBlur={() => {
                                                // Check again on blur in case autofill happened after onChange
                                                const value = address
                                                if (value && value.includes(',') && value.length > 20 && !city && !stateVal && !zip) {
                                                    console.log('Parsing address on blur:', value)
                                                    parseFullAddress(value)
                                                }
                                            }}
                                            className={address ? 'filled' : ''}
                                        />
                                        <label htmlFor="addressInput">Street Address *</label>
                                        {addressValidated && <div className="validation_check">✓</div>}
                                    </div>
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

                            {showShippingOptions && (
                                <div className="form_section">
                                    <div className="section_header">
                                        <h2>Shipping Options</h2>
                                        <p>Choose how fast you want your delicious snacks delivered</p>
                                    </div>

                                    <div className="shipping_options">
                                        {/* Free Local Pickup Option - Always Available */}
                                        <div 
                                            className={`shipping_option ${selectedShipping?.courier_service?.id === 'free-pickup' ? 'selected' : ''}`}
                                            onClick={() => setSelectedShipping({
                                                courier_service: { id: 'free-pickup', name: 'Local Pickup / Testing' },
                                                shipment_charge: 0,
                                                min_delivery_time: 0,
                                                max_delivery_time: 0
                                            })}
                                        >
                                            <div className="shipping_info">
                                                <div className="shipping_service">
                                                    <h4>🏪 Local Pickup / Testing</h4>
                                                    <p>Free - Pick up at our location (Perfect for testing)</p>
                                                </div>
                                                <div className="shipping_price free">
                                                    FREE
                                                </div>
                                            </div>
                                            <div className="shipping_radio">
                                                <div className={`radio_circle ${selectedShipping?.courier_service?.id === 'free-pickup' ? 'checked' : ''}`}>
                                                    {selectedShipping?.courier_service?.id === 'free-pickup' && <div className="radio_dot"></div>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Real Shipping Options */}
                                        {shippingRates && shippingRates.length > 0 ? (
                                            shippingRates.map((rate, index) => {
                                                // Safety checks to ensure all required properties exist
                                                if (!rate || !rate.courier_service || !rate.courier_service.name || 
                                                    typeof rate.shipment_charge === 'undefined' || 
                                                    typeof rate.min_delivery_time === 'undefined' ||
                                                    typeof rate.max_delivery_time === 'undefined') {
                                                    return null
                                                }
                                                
                                                return (
                                                    <div 
                                                        key={rate.courier_service.id || index} 
                                                        className={`shipping_option ${selectedShipping?.courier_service?.id === rate.courier_service.id ? 'selected' : ''}`}
                                                        onClick={() => setSelectedShipping(rate)}
                                                    >
                                                        <div className="shipping_info">
                                                            <div className="shipping_service">
                                                                <h4>{String(rate.courier_service.name)}</h4>
                                                                <p>{String(rate.min_delivery_time)} - {String(rate.max_delivery_time)} business days</p>
                                                            </div>
                                                            <div className="shipping_price">
                                                                ${Number(rate.shipment_charge).toFixed(2)}
                                                            </div>
                                                        </div>
                                                        <div className="shipping_radio">
                                                            <div className={`radio_circle ${selectedShipping?.courier_service?.id === rate.courier_service.id ? 'checked' : ''}`}>
                                                                {selectedShipping?.courier_service?.id === rate.courier_service.id && <div className="radio_dot"></div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="no_shipping_rates">
                                                <p>No other shipping options available at the moment. Select Local Pickup above!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="form_actions">
                                <button className="continue_btn" onClick={handleConfirm} disabled={loadingRates}>
                                    {loadingRates ? (
                                        <>
                                            <div className="loading_spinner"></div>
                                            <span>Loading Shipping Options...</span>
                                        </>
                                    ) : showShippingOptions ? (
                                        <>
                                            <span>Continue to Payment</span>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </>
                                    ) : (
                                        <>
                                            <span>Get Shipping Options</span>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                                                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        </>
                                    )}
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
                                        <div className="summary_item" key={it.productId ?? it.id ?? index}>
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
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="calc_row">
                                    <span>Shipping</span>
                                    <span className={selectedShipping ? '' : 'free_shipping'}>
                                        {selectedShipping && typeof selectedShipping.shipment_charge === 'number' ? 
                                            `$${selectedShipping.shipment_charge.toFixed(2)}` : 'TBD'}
                                    </span>
                                </div>
                                {selectedShipping && selectedShipping.courier_service && (
                                    <div className="calc_row shipping_method">
                                        <span>{String(selectedShipping.courier_service.name)}</span>
                                        <span className="delivery_time">{String(selectedShipping.min_delivery_time)}-{String(selectedShipping.max_delivery_time)} days</span>
                                    </div>
                                )}
                                <div className="calc_row total_row">
                                    <span>Total</span>
                                    <span>${(subtotal + (selectedShipping && typeof selectedShipping.shipment_charge === 'number' ? selectedShipping.shipment_charge : 0)).toFixed(2)}</span>
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