// CJ Dropshipping API - Get Shipping Price
import { getCJToken } from '../../../lib/cjAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { products, country, postalCode } = req.body;

  // Accept either products array OR single product params for backwards compatibility
  const productsArray = products || (req.body.variantId || req.body.productId ? [{
    variantId: req.body.variantId,
    productId: req.body.productId,
    quantity: req.body.quantity || 1
  }] : null);

  if (!productsArray || productsArray.length === 0 || !country) {
    return res.status(400).json({ 
      error: 'Missing required fields: products array and country are required' 
    });
  }

  const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

  try {
    console.log('=== CJ Shipping Price Request ===');
    console.log('Products count:', productsArray.length);
    console.log('Country:', country);
    console.log('Postal Code:', postalCode);

    // Get access token (cached or fresh)
    const accessToken = await getCJToken();
    console.log('✅ Got CJ access token');

    // Build products array with VIDs for CJ API
    const cjProducts = [];
    const productPrices = {}; // Store actual CJ prices
    
    for (const item of productsArray) {
      let vid = item.variantId;
      
      // If no variantId, try to get it from product
      if (!vid && item.productId) {
        console.log(`Fetching variant for product ${item.productId}...`);
        
        const productResponse = await fetch(`${CJ_API_URL}/product/query?pid=${item.productId}`, {
          method: 'GET',
          headers: {
            'CJ-Access-Token': accessToken,
          }
        });

        const productData = await productResponse.json();
        
        if (productData.result && productData.code === 200) {
          const product = productData.data;
          if (product.variants && product.variants.length > 0) {
            vid = product.variants[0].vid;
            console.log('✅ Got variant VID:', vid);
          }
        }
      }
      
      // Fetch actual CJ price for this variant
      if (vid) {
        try {
          const productResponse = await fetch(`${CJ_API_URL}/product/query?pid=${vid}`, {
            method: 'GET',
            headers: {
              'CJ-Access-Token': accessToken,
            }
          });

          const productData = await productResponse.json();
          
          if (productData.result && productData.code === 200) {
            const product = productData.data;
            // Get actual CJ selling price
            if (product.sellPrice) {
              productPrices[vid] = parseFloat(product.sellPrice);
              console.log(`  💰 Actual CJ Price for VID ${vid}: $${product.sellPrice}`);
            }
          }
        } catch (error) {
          console.warn(`  ⚠️ Could not fetch price for VID ${vid}:`, error.message);
        }
        
        cjProducts.push({
          vid: vid,
          quantity: parseInt(item.quantity || 1)
        });
        console.log(`  ✅ Added: VID ${vid}, Qty ${item.quantity || 1}`);
      } else {
        console.warn(`  ⚠️ Skipped item (no VID):`, item);
      }
    }
    
    if (cjProducts.length === 0) {
      return res.status(400).json({
        error: 'No valid products with variant IDs found'
      });
    }

    // Calculate shipping for all products in one request
    const shippingResponse = await fetch(`${CJ_API_URL}/logistic/freightCalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': accessToken,
      },
      body: JSON.stringify({
        startCountryCode: 'CN', // CJ ships from China
        endCountryCode: country,
        products: cjProducts,
        ...(postalCode && { zip: postalCode })
      })
    });

    const shippingData = await shippingResponse.json();

    console.log('Shipping API response:', shippingData.result ? '✅ Success' : '❌ Failed');
    console.log('Shipping data:', JSON.stringify(shippingData, null, 2));

    if (!shippingData.result || shippingData.code !== 200) {
      console.error('Shipping fetch failed:', shippingData.message);
      return res.status(400).json({ 
        error: 'Failed to fetch shipping prices',
        details: shippingData.message 
      });
    }

    // Format the response using correct field names from CJ API
    const shippingOptions = shippingData.data.map(option => ({
      name: option.logisticName,
      price: option.logisticPrice, // USD price
      priceCNY: option.logisticPriceCn, // CNY price
      currency: 'USD',
      deliveryTime: option.logisticAging, // e.g., "2-5" days
      logisticName: option.logisticName
    }));

    console.log('✅ Formatted shipping options:', shippingOptions.length, 'options');

    return res.status(200).json({
      success: true,
      shippingOptions,
      productPrices, // Include actual CJ prices
      destination: {
        country,
        postalCode
      }
    });

  } catch (error) {
    console.error('❌ CJ Shipping API Error:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch shipping data',
      details: error.message 
    });
  }
}
