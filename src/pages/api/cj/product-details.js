// CJ Dropshipping API - Get Product Details
import { getCJToken, cjRequest } from '../../../lib/cjAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pid } = req.query;

  if (!pid) {
    return res.status(400).json({ 
      error: 'Missing pid parameter' 
    });
  }

  const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

  try {
    const data = await cjRequest(async () => {
      // Get access token
      const accessToken = await getCJToken();

      // Query by Product ID (as documented)
      const response = await fetch(`${CJ_API_URL}/product/query?pid=${pid}`, {
        method: 'GET',
        headers: {
          'CJ-Access-Token': accessToken,
        }
      });

      const responseData = await response.json();

      if (!responseData.result || responseData.code !== 200) {
        // Attach data to error for token detection
        const error = new Error(responseData.message || 'Product not found with this SKU');
        error.data = responseData;
        error.code = responseData.code;
        
        console.error('CJ Product API Error:', {
          code: responseData.code,
          message: responseData.message,
          pid
        });
        
        throw error;
      }

      return responseData;
    });

    // Return full CJ API response for debugging
    console.log('✅ CJ API Response:', JSON.stringify(data, null, 2));

    // CJ API returns product data under "data" key
    const product = data.data;
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        pid
      });
    }

    // Format the response to match expected structure
    const formattedProduct = {
      id: product.cjProductId || product.pid,
      sku: product.productSku,
      name: product.productNameEn,
      description: product.description || '',
      price: product.variants?.[0]?.variantSellPrice || product.sellPrice || 0,
      originalPrice: product.originalPrice,
      currency: 'USD',
      images: product.productImage ? 
        (Array.isArray(product.productImage) ? product.productImage : 
         typeof product.productImage === 'string' ? product.productImage.split(',').map(url => url.trim()) : 
         [product.productImage]) : [],
      variants: product.variants?.map(v => ({
        id: v.vid,
        sku: v.variantSku,
        name: v.variantNameEn,
        price: v.variantSellPrice,
        suggestedPrice: v.variantSugSellPrice,
        image: v.variantImage,
        stock: v.inventoryNum,
        weight: v.variantWeight,
        volume: v.variantVolume,
        unit: v.variantUnit,
        variantKey: v.variantKey,
        standard: v.variantStandard,
        dimensions: {
          length: v.variantLength,
          width: v.variantWidth,
          height: v.variantHeight
        }
      })) || [],
      category: product.categoryName || 'N/A',
      categoryId: product.categoryId,
      weight: product.packingWeight || product.productWeight || product.variants?.[0]?.variantWeight || 0,
      dimensions: {
        length: product.packLength,
        width: product.packWidth,
        height: product.packHeight
      },
      sourceUrl: `https://www.cjdropshipping.com/product/product-p-${product.cjProductId || pid}.html`,
      searchedBy: 'PID'
    };

    return res.status(200).json({
      success: true,
      product: formattedProduct
    });

  } catch (error) {
    console.error('CJ API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch product data',
      details: error.message 
    });
  }
}
