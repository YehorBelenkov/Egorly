import { useEffect, useRef, useState } from 'react';

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function TestGooglePlaces() {
    const addressRef = useRef(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [addressDetails, setAddressDetails] = useState(null);

    useEffect(() => {
        if (!GOOGLE_KEY) {
            console.error('Google Maps API key not found');
            return;
        }

        // Check if script already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
            attachAutocomplete();
            return;
        }

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log('✅ Google Maps API loaded successfully');
            attachAutocomplete();
        };
        script.onerror = () => {
            console.error('❌ Failed to load Google Maps API');
        };
        document.head.appendChild(script);

        function attachAutocomplete() {
            if (!addressRef.current) {
                console.error('Address input not found');
                return;
            }

            console.log('🔧 Attaching autocomplete to input');

            const autocomplete = new window.google.maps.places.Autocomplete(addressRef.current, {
                types: ['address'],
                componentRestrictions: { country: 'us' }
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                console.log('📍 Place selected:', place);

                if (!place.address_components) {
                    console.warn('No address components found');
                    return;
                }

                // Parse address components
                let streetNumber = '';
                let route = '';
                let city = '';
                let state = '';
                let zip = '';
                let country = '';

                place.address_components.forEach(component => {
                    const types = component.types;
                    if (types.includes('street_number')) streetNumber = component.long_name;
                    if (types.includes('route')) route = component.long_name;
                    if (types.includes('locality')) city = component.long_name;
                    if (types.includes('administrative_area_level_1')) state = component.short_name;
                    if (types.includes('postal_code')) zip = component.long_name;
                    if (types.includes('country')) country = component.short_name;
                });

                const details = {
                    formatted: place.formatted_address,
                    street: `${streetNumber} ${route}`.trim(),
                    city,
                    state,
                    zip,
                    country
                };

                setSelectedAddress(place.formatted_address || '');
                setAddressDetails(details);
            });

            console.log('✅ Autocomplete attached successfully');
        }
    }, []);

    return (
        <div style={{ padding: '50px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ color: '#0059AA', marginBottom: '10px' }}>🧪 Google Places API Test</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>
                Start typing an address below. If Google Places is working, you should see address suggestions appear.
            </p>

            <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
                    Address Input:
                </label>
                <input
                    ref={addressRef}
                    type="text"
                    placeholder="Start typing an address (e.g., 123 Main St)"
                    style={{
                        width: '100%',
                        padding: '15px',
                        fontSize: '16px',
                        border: '2px solid #0059AA',
                        borderRadius: '8px',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {selectedAddress && (
                <div style={{
                    background: '#f0f9ff',
                    border: '2px solid #0059AA',
                    borderRadius: '12px',
                    padding: '20px',
                    marginTop: '20px'
                }}>
                    <h2 style={{ color: '#0059AA', marginTop: 0 }}>✅ Selected Address:</h2>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{selectedAddress}</p>

                    {addressDetails && (
                        <div style={{ marginTop: '20px' }}>
                            <h3 style={{ color: '#0059AA' }}>Parsed Details:</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>Street:</td>
                                        <td style={{ padding: '8px' }}>{addressDetails.street}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>City:</td>
                                        <td style={{ padding: '8px' }}>{addressDetails.city}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>State:</td>
                                        <td style={{ padding: '8px' }}>{addressDetails.state}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>ZIP:</td>
                                        <td style={{ padding: '8px' }}>{addressDetails.zip}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>Country:</td>
                                        <td style={{ padding: '8px' }}>{addressDetails.country}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div style={{
                marginTop: '40px',
                padding: '20px',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px'
            }}>
                <h3 style={{ marginTop: 0, color: '#856404' }}>💡 Troubleshooting:</h3>
                <ul style={{ color: '#856404', lineHeight: '1.8' }}>
                    <li>Open browser console (F12) to see debug messages</li>
                    <li>Check if you see "✅ Google Maps API loaded successfully"</li>
                    <li>If no suggestions appear, verify Places API is enabled in Google Cloud Console</li>
                    <li>Make sure billing is enabled on your Google Cloud project</li>
                    <li>API Key: {GOOGLE_KEY ? `${GOOGLE_KEY.substring(0, 20)}...` : 'NOT FOUND'}</li>
                </ul>
            </div>
        </div>
    );
}
