export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { destination_address, origin_address } = req.body;

            // Ensure that the required fields are provided
            if (!destination_address || !destination_address.line_1 || !destination_address.state || !destination_address.city || !destination_address.postal_code || !destination_address.contact_phone || !destination_address.contact_email) {
                return res.status(400).json({ error: 'Missing required fields in destination address.' });
            }

            // Prepare the request body for Easyship API
            const options = {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: 'Bearer prod_s6hQV2O9DhlU/WI97xENmX3F3fOP+iHcR/r7LqQjBOw='
                },
                body: JSON.stringify({
                    origin_address: origin_address || {
                        line_1: '6920 Mccrary rd ext',
                        state: 'AL',
                        city: 'Mobile',
                        postal_code: '36619',
                        contact_email: 'yehorbelenkov@gmail.com',
                        contact_phone: '7738922843',
                        contact_name: 'Yehor',
                        // company_name: 'NA',
                        // line_2: '7720 Ashley Ct'
                    },
                    destination_address: destination_address,
                    incoterms: 'DDU',
                    insurance: { is_insured: false },
                    courier_settings: { show_courier_logo_url: false, apply_shipping_rules: true },
                    shipping_settings: { units: { weight: 'lb', dimensions: 'cm' } },
                    parcels: [
                        {
                            box: { length: 7, width: 7, height: 7 },
                            items: [
                                {
                                    contains_battery_pi966: false,
                                    contains_battery_pi967: false,
                                    contains_liquids: false,
                                    origin_country_alpha2: 'US',
                                    quantity: 1,
                                    dimensions: { length: 5, width: 5, height: 5 },
                                    declared_currency: 'USD',
                                    description: 'Dried calamari snacks',
                                    category: 'food',
                                    hs_code: '1605',
                                    actual_weight: 15,
                                    declared_customs_value: 30
                                }
                            ],
                            total_actual_weight: 11
                        }
                    ]
                })
            };

            const response = await fetch('https://public-api.easyship.com/2024-09/rates', options);
            const data = await response.json();

            if (data) {
                // Return the response data from Easyship API
                res.status(200).json(data);
            } else {
                res.status(500).json({ error: 'Failed to fetch shipping rates from Easyship API' });
            }
        } catch (err) {
            console.error('Error fetching rates:', err);
            res.status(500).json({ error: 'Error during API request', details: err.message });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}