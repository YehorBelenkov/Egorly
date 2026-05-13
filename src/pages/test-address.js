import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export default function TestAddress() {
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [zip, setZip] = useState('')
    const [country, setCountry] = useState('US')
    const [message, setMessage] = useState('')
    
    const addressRef = useRef(null)

    useEffect(() => {
        if (!GOOGLE_KEY) {
            setMessage('❌ Google Maps API Key is missing! Add it to .env.local')
            return
        }

        setMessage('✓ API Key detected. Loading Google Places...')

        // Listen for Google Maps errors
        window.gm_authFailure = () => {
            setMessage('❌ API KEY ERROR! See instructions below to fix.')
        }

        // Check if already loaded
        if (window.google?.maps?.places) {
            setMessage('✓ Google Places API already loaded')
            initAutocomplete()
            return
        }

        // Load Google Places script
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&callback=Function.prototype`
        script.async = true
        script.defer = true
        script.onload = () => {
            if (window.google?.maps?.places) {
                setMessage('✓ Google Places API loaded successfully!')
                initAutocomplete()
            } else {
                setMessage('❌ Google loaded but Places API not available')
            }
        }
        script.onerror = () => {
            setMessage('❌ Failed to load Google Places API. Check your API key and billing.')
        }
        document.head.appendChild(script)
    }, [])

    const initAutocomplete = () => {
        if (!addressRef.current) {
            setMessage('❌ Address input ref not ready')
            return
        }

        if (!window.google?.maps?.places) {
            setMessage('❌ Google Places not available')
            return
        }

        try {
            const autocomplete = new window.google.maps.places.Autocomplete(addressRef.current, {
                componentRestrictions: { country: 'us' },
                fields: ['address_components', 'formatted_address'],
                types: ['address']
            })

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace()
                
                if (!place.address_components) {
                    setMessage('⚠️ No address components in selected place')
                    return
                }

                let street = ''
                let cityVal = ''
                let stateVal = ''
                let zipVal = ''
                let countryVal = 'US'

                place.address_components.forEach(component => {
                    const types = component.types
                    
                    if (types.includes('street_number')) {
                        street = component.long_name + ' '
                    }
                    if (types.includes('route')) {
                        street += component.long_name
                    }
                    if (types.includes('locality')) {
                        cityVal = component.long_name
                    }
                    if (types.includes('administrative_area_level_1')) {
                        stateVal = component.short_name
                    }
                    if (types.includes('postal_code')) {
                        zipVal = component.long_name
                    }
                    if (types.includes('country')) {
                        countryVal = component.short_name
                    }
                })

                setAddress(street.trim())
                setCity(cityVal)
                setState(stateVal)
                setZip(zipVal)
                setCountry(countryVal)
                setMessage('✓ Address auto-filled successfully!')
            })

            setMessage('✓ Autocomplete initialized! Start typing an address...')
        } catch (error) {
            setMessage('❌ Error initializing autocomplete: ' + error.message)
        }
    }

    return (
        <>
            <Head>
                <title>Google Places Address Test</title>
            </Head>
            
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.title}>🗺️ Google Places API Test</h1>
                    
                    <div style={styles.statusBox}>
                        <p style={styles.status}>{message}</p>
                        <p style={styles.hint}>
                            {GOOGLE_KEY ? 
                                `API Key: ${GOOGLE_KEY.substring(0, 10)}...` : 
                                'No API Key found'
                            }
                        </p>
                    </div>

                    <div style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Street Address</label>
                            <input
                                ref={addressRef}
                                type="text"
                                placeholder="Start typing your address..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                style={styles.input}
                                autoComplete="off"
                            />
                            <p style={styles.helpText}>
                                Type an address like "123 Main St" and select from dropdown
                            </p>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>City</label>
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>State</label>
                                <input
                                    type="text"
                                    placeholder="State"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>ZIP Code</label>
                                <input
                                    type="text"
                                    placeholder="ZIP"
                                    value={zip}
                                    onChange={(e) => setZip(e.target.value)}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Country</label>
                                <input
                                    type="text"
                                    placeholder="Country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        <div style={styles.resultBox}>
                            <h3 style={styles.resultTitle}>Current Address Data:</h3>
                            <pre style={styles.pre}>
{JSON.stringify({
    street: address,
    city: city,
    state: state,
    zip: zip,
    country: country
}, null, 2)}
                            </pre>
                        </div>
                    </div>

                    {message.includes('ERROR') && (
                        <div style={styles.errorBox}>
                            <h3 style={styles.errorTitle}>🔧 How to Fix API Key Issues:</h3>
                            <ol style={styles.stepList}>
                                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" style={styles.link}>Google Cloud Console</a></li>
                                <li>Select your project (or create a new one)</li>
                                <li>Enable these APIs:
                                    <ul>
                                        <li><strong>Maps JavaScript API</strong></li>
                                        <li><strong>Places API</strong></li>
                                        <li><strong>Geocoding API</strong> (optional but recommended)</li>
                                    </ul>
                                </li>
                                <li>Go to <strong>Credentials</strong> → Create API Key</li>
                                <li><strong>Important:</strong> Set up billing (Google requires it even for free tier)</li>
                                <li>Optional: Add HTTP referrer restrictions for security:
                                    <ul>
                                        <li>localhost:3000/*</li>
                                        <li>yourdomain.com/*</li>
                                    </ul>
                                </li>
                                <li>Copy your API key to <code>.env.local</code>:
                                    <pre style={styles.codeBlock}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE</pre>
                                </li>
                                <li>Restart your dev server</li>
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
        maxWidth: '700px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: '20px',
        textAlign: 'center'
    },
    statusBox: {
        background: '#f7fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '30px'
    },
    status: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#2d3748',
        margin: '0 0 8px 0'
    },
    hint: {
        fontSize: '12px',
        color: '#718096',
        margin: '0',
        fontFamily: 'monospace'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: '1'
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#4a5568'
    },
    input: {
        padding: '12px 16px',
        fontSize: '16px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        outline: 'none',
        transition: 'border-color 0.2s',
        fontFamily: 'inherit'
    },
    helpText: {
        fontSize: '12px',
        color: '#718096',
        margin: '0'
    },
    row: {
        display: 'flex',
        gap: '16px'
    },
    resultBox: {
        marginTop: '20px',
        background: '#1a202c',
        borderRadius: '8px',
        padding: '20px'
    },
    resultTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#63b3ed',
        margin: '0 0 12px 0'
    },
    pre: {
        margin: '0',
        color: '#68d391',
        fontSize: '14px',
        fontFamily: 'monospace',
        overflow: 'auto'
    },
    errorBox: {
        marginTop: '30px',
        background: '#fff5f5',
        border: '2px solid #fc8181',
        borderRadius: '8px',
        padding: '24px'
    },
    errorTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#c53030',
        margin: '0 0 16px 0'
    },
    stepList: {
        margin: '0',
        paddingLeft: '20px',
        color: '#2d3748',
        lineHeight: '1.8'
    },
    link: {
        color: '#3182ce',
        textDecoration: 'none',
        fontWeight: '600'
    },
    codeBlock: {
        background: '#2d3748',
        color: '#68d391',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '13px',
        margin: '8px 0',
        display: 'block',
        fontFamily: 'monospace'
    }
}
