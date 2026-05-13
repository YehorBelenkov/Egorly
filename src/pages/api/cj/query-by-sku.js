// CJ Dropshipping API - Query Product by SKU (Get VIDs)
import { getCJAccessToken, callCJApiWithRetry } from '../../../lib/cjAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sku } = req.query;

  if (!sku) {
    return res.status(400).json({ 
      error: 'Missing required field: sku' 
    });
  }

  const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

  try {
    // Use retry wrapper to automatically handle token refresh on auth errors
    const result = await callCJApiWithRetry(async () => {
      // Get access token (cached or fresh)
      const accessToken = await getCJAccessToken();

      // Query product by SKU to get VIDs - GET with query params, not POST
      const response = await fetch(`${CJ_API_URL}/product/queryBySku?sku=${encodeURIComponent(sku)}`, {
        method: 'GET',
        headers: {
          'CJ-Access-Token': accessToken,
        }
      });

      const data = await response.json();

      if (!data.result || data.code !== 200) {
        // Attach data to error for token detection
        const error = new Error(data.message || 'Product not found with this SKU');
        error.data = data;
        error.code = data.code;
        
        console.error('CJ Query By SKU Error:', {
          code: data.code,
          message: data.message,
          sku
        });
        
        throw error;
      }

      return data.data;
    });

    // Format the response with VIDs
    const product = result;
    
    const formattedResponse = {
      success: true,
      product: {
        cjProductId: product.cjProductId,
        productName: product.productNameEn,
        productSku: sku,
        productImage: product.productImage,
        variants: product.variantList?.map(v => ({
          cjVariantId: v.cjVariantId, // VID - most important!
          vid: v.cjVariantId, // Alias for easier access
          sku: v.sku,
          variantName: v.variantNameEn,
          price: v.price,
          image: v.variantImage,
          weight: v.variantWeight,
          dimensions: {
            length: v.variantLength,
            width: v.variantWidth,
            height: v.variantHeight
          }
        })) || []
      }
    };

    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('CJ API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to query product by SKU',
      details: error.message 
    });
  }
}
