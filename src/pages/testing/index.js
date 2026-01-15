import { useState } from 'react';

export default function ShippingForm() {
    const [formData, setFormData] = useState({
        line1: '',
        line2: '',
        state: '',
        city: '',
        postalCode: '',
        country: 'US',
        companyName: '',
        contactName: '',
        contactPhone: '',
        contactEmail: ''
    });

    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filteredRates, setFilteredRates] = useState([]);

    // Array holding the allowed courier service IDs
    const allowedCouriers = [
        "7505df80-af51-46a0-b2ee-ac9eacfcd3e4",
        "c3e97b11-2842-44f1-84d1-afaa6b3f0a7c",
        "e30d3997-d7b1-4c1d-afd2-ea1556aa943b",
        "70fa1197-3021-4aee-b08c-a70d6e7ac198"
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const requestData = {
                destination_address: {
                    country_alpha2: formData.country,
                    line_1: formData.line1,
                    line_2: formData.line2 || '',
                    state: formData.state,
                    city: formData.city,
                    postal_code: formData.postalCode,
                    company_name: formData.companyName || '',
                    contact_name: formData.contactName || '',
                    contact_phone: formData.contactPhone,
                    contact_email: formData.contactEmail
                }
            };

            const response = await fetch('/api/shipping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            if (response.ok) {
                setResponse(data);

                // Filter the rates based on the allowed courier service IDs
                const filtered = data.rates.filter(rate =>
                    allowedCouriers.includes(rate.courier_service.id)
                );

                // Sort the filtered rates by shipment_charge (cheapest to highest)
                const sortedRates = filtered.sort((a, b) => a.shipment_charge - b.shipment_charge);

                // Set the filtered and sorted rates
                setFilteredRates(sortedRates);
            } else {
                setError(data.error || 'An error occurred.');
            }
        } catch {
            setError('Failed to fetch shipping rates.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px' }}>
            <h2>Shipping Form</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px', maxWidth: '500px' }}>
                <input
                    type="text"
                    name="line1"
                    value={formData.line1}
                    onChange={handleInputChange}
                    required
                    placeholder="Address Line 1"
                />
                <input
                    type="text"
                    name="line2"
                    value={formData.line2}
                    onChange={handleInputChange}
                    placeholder="Address Line 2 (Optional)"
                />
                <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    placeholder="State"
                />
                <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    placeholder="City"
                />
                <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                    placeholder="Postal Code"
                />
                <input
                    type="text"
                    name="country"
                    value={formData.country}
                    readOnly
                    placeholder="Country"
                />
                <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Company Name (Optional)"
                />
                <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    placeholder="Contact Name (Optional)"
                />
                <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    required
                    placeholder="Contact Phone"
                />
                <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="Contact Email"
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {response && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Shipping Rates</h3>
                    <ul>
                        {filteredRates.map((rate, index) => (
                            <li key={index} style={{ marginBottom: '10px' }}>
                                <p><strong>Service:</strong> {rate.courier_service.name}</p>
                                <p><strong>Price:</strong> ${rate.shipment_charge.toFixed(2)}</p>
                                <p><strong>Delivery Time:</strong> {rate.min_delivery_time} - {rate.max_delivery_time} days</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}