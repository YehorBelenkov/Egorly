import { useState } from 'react';
import Layout from "../../app/components/Layout";
import './cj-test.css';

const CJTest = () => {
  const [productId, setProductId] = useState('1424257508926689280');
  
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [error, setError] = useState(null);

  const extractProductId = (url) => {
    // Extract product ID from CJ URL like: ...p-1424257508926689280.html
    const match = url.match(/p-(\d+)/);
    return match ? match[1] : url;
  };

  const handleProductIdChange = (value) => {
    const id = extractProductId(value);
    setProductId(id);
  };

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    setProductData(null);

    try {
      const response = await fetch(`/api/cj/product-details?pid=${encodeURIComponent(productId)}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product');
      }

      console.log('📦 Product data received:', data);
      setProductData(data.product);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="cj-test-container">
        <div className="cj-test-header">
          <h1>🚚 CJ Dropshipping API Tester</h1>
          <p>Test product details and shipping price calculations</p>
        </div>

        <div className="cj-test-form">
          <div className="form-section">
            <h2>Product Information</h2>
            
            <div className="form-group">
              <label>Product ID, SKU, or URL</label>
              <input
                type="text"
                placeholder="Enter Product ID, SKU (e.g., CJSJ124411311KP), or paste full CJ URL"
                value={productId}
                onChange={(e) => handleProductIdChange(e.target.value)}
                className="form-input"
              />
              <small>
                • Product ID: 1424257508926689280<br/>
                • SKU: CJSJ124411311KP<br/>
                • Or paste full CJ product URL
              </small>
            </div>

            <button 
              onClick={fetchProductDetails}
              className="btn-primary"
              disabled={loading || !productId}
            >
              {loading ? '⏳ Loading...' : '📦 Get Product Details'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-box">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {productData && (
          <div className="result-box">
            <h2>📦 Product Details</h2>
            
            <div className="product-display">
              {productData.images?.[0] && (
                <img src={productData.images[0]} alt={productData.name} className="product-image" />
              )}
              
              <div className="product-info">
                <h3>{productData.name}</h3>
                <p className="product-id">ID: {productData.id}</p>
                <p className="product-price">${productData.price} USD</p>
                {productData.originalPrice && (
                  <p className="product-original-price">
                    Original: ${productData.originalPrice}
                  </p>
                )}
                
                {productData.variants?.length > 0 && (
                  <div className="variants-section">
                    <h4>Variants ({productData.variants.length})</h4>
                    <div className="variants-list">
                      {productData.variants.map((variant) => (
                        <div key={variant.id} className="variant-item">
                          {variant.image && (
                            <img 
                              src={variant.image} 
                              alt={variant.name} 
                              style={{
                                width: '60px', 
                                height: '60px', 
                                objectFit: 'cover', 
                                borderRadius: '4px',
                                marginRight: '12px'
                              }} 
                            />
                          )}
                          <div style={{flex: 1}}>
                            <div style={{fontWeight: '500', marginBottom: '4px'}}>{variant.name}</div>
                            {variant.variantKey && (
                              <small style={{color: '#3b82f6', display: 'block', marginBottom: '2px'}}>Key: {variant.variantKey}</small>
                            )}
                            {variant.sku && (
                              <small style={{color: '#94a3b8', display: 'block', marginBottom: '2px'}}>SKU: {variant.sku}</small>
                            )}
                            {variant.id && (
                              <small style={{color: '#94a3b8', display: 'block', marginBottom: '2px'}}>VID: {variant.id}</small>
                            )}
                            {variant.stock !== undefined && (
                              <small style={{color: variant.stock > 0 ? '#10b981' : '#ef4444', display: 'block', marginBottom: '2px'}}>
                                Stock: {variant.stock === null ? 'Unknown' : variant.stock}
                              </small>
                            )}
                            {variant.weight && (
                              <small style={{color: '#94a3b8', display: 'block', marginBottom: '2px'}}>Weight: {variant.weight}g</small>
                            )}
                            {variant.dimensions && (
                              <small style={{color: '#94a3b8', display: 'block', marginBottom: '2px'}}>
                                Size: {variant.dimensions.length}×{variant.dimensions.width}×{variant.dimensions.height}mm
                              </small>
                            )}
                            {variant.volume && (
                              <small style={{color: '#94a3b8', display: 'block', marginBottom: '2px'}}>Volume: {variant.volume}mm³</small>
                            )}
                          </div>
                          <div style={{textAlign: 'right', minWidth: '100px'}}>
                            <span className="variant-price" style={{display: 'block', fontSize: '16px', fontWeight: '600'}}>${variant.price}</span>
                            {variant.suggestedPrice && (
                              <small style={{color: '#10b981', display: 'block', marginTop: '4px'}}>Suggested: ${variant.suggestedPrice}</small>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="product-meta">
                  {productData.sku && <p><strong>SKU:</strong> {productData.sku}</p>}
                  <p><strong>Category:</strong> {productData.category}</p>
                  <p><strong>Weight:</strong> {productData.weight}g</p>
                  {productData.searchedBy && (
                    <p><strong>Found by:</strong> {productData.searchedBy}</p>
                  )}
                  {productData.sourceUrl && (
                    <p>
                      <a href={productData.sourceUrl} target="_blank" rel="noopener noreferrer">
                        View on CJ Dropshipping →
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="api-info">
          <h3>💡 API Information</h3>
          <div className="info-grid">
            <div className="info-card">
              <h4>Product Details API</h4>
              <code>POST /api/cj/product-details</code>
              <p style={{margin: '0.5rem 0', fontSize: '0.9rem', color: '#64748b'}}>
                Accepts Product ID or SKU
              </p>
              <pre>{`// By Product ID
{
  "productId": "1424257508926689280"
}

// By SKU
{
  "productId": "CJSJ124411311KP"
}`}</pre>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CJTest;
