import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './index.css';

const AddProduct = ({ onClose, idToken }) => {
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    quantity: '',
    cjProductId: '', // CJ Dropshipping Product ID (PID)
    images: [], // Changed to array for multiple images
    video: null, // Video file
    description: '',
    descriptionSections: [], // Multiple description sections with titles
    attributes: [], // Dynamic key-value pairs for any product specs
    packingList: [], // What's included in the package
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // CJ product and variants data
  const [cjProduct, setCjProduct] = useState(null);
  const [fetchingCJ, setFetchingCJ] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({}); // { variantId: { selected: true, customImages: [] } }
  
  // Manual variants (for non-CJ products like Alibaba)
  const [manualVariants, setManualVariants] = useState([]);
  const [newManualVariant, setNewManualVariant] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    variantKey: '',
    images: []
  });
  
  // For adding new attributes
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');
  
  // For adding new description sections
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  
  // For adding packing list items
  const [newPackingItem, setNewPackingItem] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData({ ...productData, [name]: value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setProductData({ ...productData, images: [...productData.images, ...files] });
  };

  const handleRemoveImage = (index) => {
    const updatedImages = productData.images.filter((_, i) => i !== index);
    setProductData({ ...productData, images: updatedImages });
  };
  
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    setProductData({ ...productData, video: file });
  };
  
  const handleRemoveVideo = () => {
    setProductData({ ...productData, video: null });
  };

  const handleAddAttribute = () => {
    if (newAttributeKey.trim()) {
      setProductData({
        ...productData,
        attributes: [...productData.attributes, { key: newAttributeKey, value: newAttributeValue }],
      });
      setNewAttributeKey('');
      setNewAttributeValue('');
    }
  };

  const handleRemoveAttribute = (index) => {
    const updatedAttributes = productData.attributes.filter((_, i) => i !== index);
    setProductData({ ...productData, attributes: updatedAttributes });
  };

  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      setProductData({
        ...productData,
        descriptionSections: [...productData.descriptionSections, { title: newSectionTitle, content: newSectionContent }],
      });
      setNewSectionTitle('');
      setNewSectionContent('');
    }
  };

  const handleRemoveSection = (index) => {
    const updatedSections = productData.descriptionSections.filter((_, i) => i !== index);
    setProductData({ ...productData, descriptionSections: updatedSections });
  };

  const handleAddPackingItem = () => {
    if (newPackingItem.trim()) {
      setProductData({
        ...productData,
        packingList: [...productData.packingList, newPackingItem],
      });
      setNewPackingItem('');
    }
  };

  const handleRemovePackingItem = (index) => {
    const updatedList = productData.packingList.filter((_, i) => i !== index);
    setProductData({ ...productData, packingList: updatedList });
  };

  const fetchCJProduct = async () => {
    if (!productData.cjProductId || !productData.cjProductId.trim()) {
      alert('Please enter a CJ Product ID (PID) first');
      return;
    }

    try {
      setFetchingCJ(true);
      setError('');
      
      const response = await fetch(`/api/cj/product-details?pid=${encodeURIComponent(productData.cjProductId)}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch CJ product details');
      }

      // Store CJ product data
      setCjProduct(result.product);
      
      // Auto-fill product name if empty
      if (!productData.name && result.product.name) {
        setProductData({ ...productData, name: result.product.name });
      }
      
      // Initialize selectedVariants with all variants unselected
      const initialSelection = {};
      result.product.variants?.forEach(variant => {
        initialSelection[variant.id] = {
          selected: false,
          customImages: []
        };
      });
      setSelectedVariants(initialSelection);
      
    } catch (err) {
      setError(err.message);
      setCjProduct(null);
      setSelectedVariants({});
    } finally {
      setFetchingCJ(false);
    }
  };

  const handleVariantToggle = (variantId) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        selected: !prev[variantId].selected
      }
    }));
  };

  const handleVariantImageChange = (variantId, e) => {
    const files = Array.from(e.target.files);
    setSelectedVariants(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        customImages: [...(prev[variantId].customImages || []), ...files]
      }
    }));
  };

  const handleRemoveVariantImage = (variantId, imageIndex) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        customImages: prev[variantId].customImages.filter((_, i) => i !== imageIndex)
      }
    }));
  };

  // Manual Variant Handlers
  const handleManualVariantInputChange = (field, value) => {
    setNewManualVariant(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManualVariantImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewManualVariant(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const handleRemoveManualVariantImage = (imageIndex) => {
    setNewManualVariant(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== imageIndex)
    }));
  };

  const handleAddManualVariant = () => {
    if (!newManualVariant.name.trim()) {
      alert('Please enter a variant name');
      return;
    }
    
    const variant = {
      id: `manual_${Date.now()}`, // Generate unique ID
      name: newManualVariant.name,
      sku: newManualVariant.sku || `SKU-${Date.now()}`,
      price: parseFloat(newManualVariant.price) || 0,
      stock: parseInt(newManualVariant.stock) || 0,
      variantKey: newManualVariant.variantKey || newManualVariant.name,
      images: newManualVariant.images,
      isManual: true
    };

    setManualVariants(prev => [...prev, variant]);
    
    // Reset form
    setNewManualVariant({
      name: '',
      sku: '',
      price: '',
      stock: '',
      variantKey: '',
      images: []
    });
  };

  const handleRemoveManualVariant = (index) => {
    setManualVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditManualVariant = (index) => {
    const variant = manualVariants[index];
    setNewManualVariant({
      name: variant.name,
      sku: variant.sku,
      price: variant.price.toString(),
      stock: variant.stock.toString(),
      variantKey: variant.variantKey,
      images: variant.images
    });
    handleRemoveManualVariant(index);
  };

  const handleAddProduct = async () => {
    try {
      setLoading(true);
      setError('');

      const storage = getStorage();

      // Process CJ variants (selected ones)
      const cjVariantsToAdd = Object.entries(selectedVariants)
        .filter(([_, data]) => data.selected)
        .map(([variantId, data]) => {
          const variant = cjProduct?.variants?.find(v => v.id === variantId);
          return { ...variant, customImages: data.customImages };
        });

      // Process CJ variants: upload custom images for each variant
      const processedCJVariants = await Promise.all(
        cjVariantsToAdd.map(async (variant) => {
          if (variant.customImages && variant.customImages.length > 0) {
            const uploadPromises = variant.customImages.map(async (image, index) => {
              const storageRef = ref(storage, `products/${productData.cjProductId}_${variant.id}_${Date.now()}_${index}_${image.name}`);
              await uploadBytes(storageRef, image);
              return getDownloadURL(storageRef);
            });
            const uploadedUrls = await Promise.all(uploadPromises);
            return { ...variant, customImageUrls: uploadedUrls, customImages: undefined };
          }
          return { ...variant, customImages: undefined };
        })
      );

      // Process manual variants: upload images
      const processedManualVariants = await Promise.all(
        manualVariants.map(async (variant) => {
          if (variant.images && variant.images.length > 0) {
            const uploadPromises = variant.images.map(async (image, index) => {
              const storageRef = ref(storage, `products/manual_${variant.id}_${Date.now()}_${index}_${image.name}`);
              await uploadBytes(storageRef, image);
              return getDownloadURL(storageRef);
            });
            const uploadedUrls = await Promise.all(uploadPromises);
            return { 
              ...variant, 
              customImageUrls: uploadedUrls, 
              images: undefined,
              image: uploadedUrls[0] || null // Set first image as main variant image
            };
          }
          return { ...variant, images: undefined };
        })
      );

      // Combine all variants
      const allVariants = [...processedCJVariants, ...processedManualVariants];

      // Upload main product images to Firebase Storage IN PARALLEL
      const uploadPromises = productData.images.map(async (image, index) => {
        const storageRef = ref(storage, `products/${Date.now()}_${index}_${image.name}`);
        await uploadBytes(storageRef, image);
        return getDownloadURL(storageRef);
      });
      
      const imageUrls = await Promise.all(uploadPromises);
      
      // Upload video if exists
      let videoUrl = null;
      if (productData.video) {
        const videoRef = ref(storage, `products/videos/${Date.now()}_${productData.video.name}`);
        await uploadBytes(videoRef, productData.video);
        videoUrl = await getDownloadURL(videoRef);
      }

      // Create product data object
      const product = {
        name: productData.name,
        price: parseFloat(productData.price),
        quantity: parseInt(productData.quantity, 10),
        cjProductId: productData.cjProductId || null, // CJ Dropshipping Product ID
        variants: allVariants, // All variants (CJ + Manual)
        description: productData.description,
        descriptionSections: productData.descriptionSections, // Multiple sections
        attributes: productData.attributes, // Dynamic attributes
        packingList: productData.packingList, // What's included
        imageUrls, // Multiple images
        videoUrl, // Video URL (or null)
      };

      console.log('Submitting product data:', product);

      // Send product data to backend to add to Firestore
      const productRes = await fetch('/api/addprod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(product),
      });

      if (!productRes.ok) {
        const errorData = await productRes.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to add product');
      }

      alert('Product added successfully!');
      onClose();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-container">
      <div className="add-product-header">
        <h2>Add New Product</h2>
        <button className="close-btn" onClick={onClose} disabled={loading}>✕</button>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      <div className="form-sections">
        {/* Basic Information Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">📝</span>
            Basic Information
          </h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={productData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Price ($) *</label>
              <input
                type="number"
                name="price"
                value={productData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
              <small style={{color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block'}}>
                {cjProduct ? 'Price can be auto-filled from CJ variants below' : 'Enter price manually or fetch CJ product'}
              </small>
            </div>
            
            <div className="form-group">
              <label>CJ Product ID (PID)</label>
              <input
                type="text"
                name="cjProductId"
                value={productData.cjProductId}
                onChange={handleInputChange}
                placeholder="e.g., 1424257508926689280"
              />
              <small style={{color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block'}}>
                Product ID from CJ Dropshipping
              </small>
              <button 
                type="button"
                onClick={fetchCJProduct}
                disabled={fetchingCJ || !productData.cjProductId}
                style={{
                  marginTop: '8px',
                  padding: '8px 16px',
                  backgroundColor: fetchingCJ ? '#ccc' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: fetchingCJ || !productData.cjProductId ? 'not-allowed' : 'pointer'
                }}
              >
                {fetchingCJ ? 'Fetching...' : '🔍 Fetch Product & Variants'}
              </button>
            </div>
            
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={productData.quantity}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>
        </div>

        {/* CJ Variants Selection Section */}
        {cjProduct && cjProduct.variants && cjProduct.variants.length > 0 && (
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">🎨</span>
              Select Product Variants
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Choose which variants to add and upload custom images for each
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {cjProduct.variants.map((variant) => (
                <div 
                  key={variant.id}
                  style={{
                    border: selectedVariants[variant.id]?.selected ? '2px solid #4CAF50' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: selectedVariants[variant.id]?.selected ? '#f0fdf4' : '#fafafa'
                  }}
                >
                  {/* Variant Header with Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedVariants[variant.id]?.selected || false}
                      onChange={() => handleVariantToggle(variant.id)}
                      style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    
                    {variant.image && (
                      <img 
                        src={variant.image} 
                        alt={variant.name}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }}
                      />
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{variant.name}</div>
                      {variant.variantKey && (
                        <div style={{ fontSize: '13px', color: '#3b82f6', marginBottom: '2px' }}>Key: {variant.variantKey}</div>
                      )}
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>VID: {variant.id}</div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>SKU: {variant.sku}</div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>Price: ${variant.price}</div>
                      {variant.stock !== undefined && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: variant.stock > 0 ? '#10b981' : '#ef4444',
                          marginBottom: '2px',
                          fontWeight: '500'
                        }}>
                          Stock: {variant.stock === null ? 'Unknown' : variant.stock}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Image Upload for Selected Variant */}
                  {selectedVariants[variant.id]?.selected && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '12px', 
                      backgroundColor: 'white', 
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                        📸 Upload Custom Images for this Variant
                      </label>
                      
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleVariantImageChange(variant.id, e)}
                        style={{ 
                          display: 'block',
                          marginBottom: '10px',
                          fontSize: '13px',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          width: '100%'
                        }}
                      />
                      
                      {selectedVariants[variant.id]?.customImages?.length > 0 && (
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                          gap: '10px',
                          marginTop: '10px'
                        }}>
                          {selectedVariants[variant.id].customImages.map((image, imgIndex) => (
                            <div key={imgIndex} style={{ position: 'relative' }}>
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Custom ${imgIndex + 1}`}
                                style={{ 
                                  width: '100%', 
                                  height: '80px', 
                                  objectFit: 'cover', 
                                  borderRadius: '4px',
                                  border: '2px solid #ddd'
                                }}
                              />
                              <button
                                onClick={() => handleRemoveVariantImage(variant.id, imgIndex)}
                                style={{
                                  position: 'absolute',
                                  top: '2px',
                                  right: '2px',
                                  background: 'rgba(255, 0, 0, 0.9)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  padding: 0
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Variants Section (for non-CJ products like Alibaba) */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">🎨</span>
            Manual Variants (Alibaba, etc.)
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Add variants manually for products from Alibaba or other suppliers
          </p>

          {/* Add New Manual Variant Form */}
          <div style={{
            border: '2px dashed #e0e0e0',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#fafafa',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', fontWeight: '600' }}>Add New Variant</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Variant Name *
                </label>
                <input
                  type="text"
                  value={newManualVariant.name}
                  onChange={(e) => handleManualVariantInputChange('name', e.target.value)}
                  placeholder="e.g., Red - Small, Blue - Large"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  SKU
                </label>
                <input
                  type="text"
                  value={newManualVariant.sku}
                  onChange={(e) => handleManualVariantInputChange('sku', e.target.value)}
                  placeholder="e.g., SKU-RED-SM (auto-generated if empty)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newManualVariant.price}
                  onChange={(e) => handleManualVariantInputChange('price', e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={newManualVariant.stock}
                  onChange={(e) => handleManualVariantInputChange('stock', e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                  Variant Key
                </label>
                <input
                  type="text"
                  value={newManualVariant.variantKey}
                  onChange={(e) => handleManualVariantInputChange('variantKey', e.target.value)}
                  placeholder="e.g., color:red;size:small (uses name if empty)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Variant Images */}
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                📸 Variant Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleManualVariantImageChange}
                style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '13px',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '100%'
                }}
              />

              {newManualVariant.images.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '10px',
                  marginTop: '10px'
                }}>
                  {newManualVariant.images.map((image, imgIndex) => (
                    <div key={imgIndex} style={{ position: 'relative' }}>
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${imgIndex + 1}`}
                        style={{
                          width: '100%',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '2px solid #ddd'
                        }}
                      />
                      <button
                        onClick={() => handleRemoveManualVariantImage(imgIndex)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(255, 0, 0, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: 0
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddManualVariant}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                width: '100%'
              }}
            >
              ➕ Add This Variant
            </button>
          </div>

          {/* Display Added Manual Variants */}
          {manualVariants.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', fontWeight: '600' }}>
                Added Manual Variants ({manualVariants.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {manualVariants.map((variant, index) => (
                  <div
                    key={variant.id}
                    style={{
                      border: '2px solid #4CAF50',
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: '#f0fdf4'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      {variant.images && variant.images.length > 0 && (
                        <img
                          src={URL.createObjectURL(variant.images[0])}
                          alt={variant.name}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid #ddd'
                          }}
                        />
                      )}

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                          {variant.name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>
                          SKU: {variant.sku}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>
                          Price: ${variant.price}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>
                          Stock: {variant.stock}
                        </div>
                        {variant.variantKey && (
                          <div style={{ fontSize: '13px', color: '#3b82f6', marginBottom: '2px' }}>
                            Key: {variant.variantKey}
                          </div>
                        )}
                        {variant.images && variant.images.length > 1 && (
                          <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                            📷 {variant.images.length} images
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEditManualVariant(index)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleRemoveManualVariant(index)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">📄</span>
            Main Description
          </h3>
          
          <div className="form-group full-width">
            <label>Main Description (Optional)</label>
            <textarea
              name="description"
              value={productData.description}
              onChange={handleInputChange}
              rows="6"
              placeholder="Enter main product description... (Optional)"
            />
          </div>
        </div>

        {/* Description Sections - Multiple */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">📝</span>
            Description Sections
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Add multiple sections with titles (e.g., "Features", "What's Included", "Specifications"). Content is optional.
          </p>
          
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Section title (e.g., Features, What's Included) *Required"
              style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
            <textarea
              value={newSectionContent}
              onChange={(e) => setNewSectionContent(e.target.value)}
              placeholder="Section content (optional)..."
              rows="4"
              style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
            <button 
              className="add-item-btn"
              onClick={handleAddSection}
              style={{ width: '100%' }}
            >
              + Add Section
            </button>
          </div>

          {productData.descriptionSections.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              {productData.descriptionSections.map((section, index) => (
                <div key={index} style={{ padding: '15px', background: '#f9f9f9', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '16px', color: '#333' }}>{section.title}</strong>
                    <button 
                      className="delete-item-btn"
                      onClick={() => handleRemoveSection(index)}
                    >
                      🗑️
                    </button>
                  </div>
                  <p style={{ margin: 0, color: '#666', whiteSpace: 'pre-wrap' }}>{section.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Attributes Section - Dynamic */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">⚙️</span>
            Product Attributes
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Add any product specifications (Material, Battery, Size, Color, etc.). Value is optional.
          </p>
          
          <div className="list-input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
            <input
              type="text"
              value={newAttributeKey}
              onChange={(e) => setNewAttributeKey(e.target.value)}
              placeholder="Attribute name (e.g., Material, Battery) *Required"
            />
            <input
              type="text"
              value={newAttributeValue}
              onChange={(e) => setNewAttributeValue(e.target.value)}
              placeholder="Value (e.g., Metal, 600mA) - Optional"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddAttribute();
                }
              }}
            />
            <button 
              className="add-item-btn"
              onClick={handleAddAttribute}
            >
              + Add
            </button>
          </div>

          {productData.attributes.length > 0 && (
            <div className="item-list" style={{ marginTop: '15px' }}>
              {productData.attributes.map((attr, index) => (
                <div key={index} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f5f5f5', borderRadius: '5px', marginBottom: '8px' }}>
                  <div>
                    <strong>{attr.key}:</strong> {attr.value}
                  </div>
                  <button 
                    className="delete-item-btn"
                    onClick={() => handleRemoveAttribute(index)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Packing List Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">📦</span>
            Packing List
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            What's included in the package? (Optional)
          </p>
          
          <div className="list-input-group">
            <input
              type="text"
              value={newPackingItem}
              onChange={(e) => setNewPackingItem(e.target.value)}
              placeholder="Add item (e.g., 1x Bluetooth Speaker, 1x USB Cable)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddPackingItem();
                }
              }}
            />
            <button 
              className="add-item-btn"
              onClick={handleAddPackingItem}
            >
              + Add
            </button>
          </div>

          {productData.packingList.length > 0 && (
            <ul className="item-list" style={{ marginTop: '15px' }}>
              {productData.packingList.map((item, index) => (
                <li key={index} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f5f5f5', borderRadius: '5px', marginBottom: '8px' }}>
                  <span>{item}</span>
                  <button 
                    className="delete-item-btn"
                    onClick={() => handleRemovePackingItem(index)}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Image Upload Section - Multiple Images */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">🖼️</span>
            Product Images
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Upload multiple product images (first image will be the main image)
          </p>
          
          <div className="image-upload-area">
            <input 
              type="file" 
              id="image-upload"
              onChange={handleImageChange}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
            <label htmlFor="image-upload" className="upload-label" style={{ cursor: 'pointer', display: 'block', padding: '20px', border: '2px dashed #ccc', borderRadius: '8px', textAlign: 'center' }}>
              <div className="upload-placeholder">
                <span className="upload-icon">📸</span>
                <p>Click to upload product images</p>
                <span className="upload-hint">PNG, JPG - Multiple files allowed</span>
              </div>
            </label>
          </div>

          {productData.images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginTop: '15px' }}>
              {productData.images.map((image, index) => (
                <div key={index} style={{ position: 'relative', border: '2px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt={`Preview ${index + 1}`}
                    style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                  />
                  <button 
                    onClick={() => handleRemoveImage(index)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'rgba(255, 0, 0, 0.8)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '25px',
                      height: '25px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '5px',
                      left: '5px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}>
                      Main
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Video Upload Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">🎥</span>
            Product Video
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Upload a video showcasing the product (optional)
          </p>
          
          {!productData.video ? (
            <div className="video-upload-area">
              <input 
                type="file" 
                id="video-upload"
                onChange={handleVideoChange}
                accept="video/*"
                style={{ display: 'none' }}
              />
              <label htmlFor="video-upload" className="upload-label" style={{ cursor: 'pointer', display: 'block', padding: '20px', border: '2px dashed #ccc', borderRadius: '8px', textAlign: 'center' }}>
                <div className="upload-placeholder">
                  <span className="upload-icon">🎬</span>
                  <p>Click to upload product video</p>
                  <span className="upload-hint">MP4, MOV, AVI - Single file only</span>
                </div>
              </label>
            </div>
          ) : (
            <div style={{ border: '2px solid #ddd', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
              <video 
                src={URL.createObjectURL(productData.video)}
                controls
                style={{ width: '100%', maxHeight: '300px' }}
              />
              <button 
                onClick={handleRemoveVideo}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255, 0, 0, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Remove Video
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="form-actions">
        <button 
          className="cancel-btn" 
          onClick={onClose} 
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          className="submit-btn" 
          onClick={handleAddProduct} 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Adding Product...
            </>
          ) : (
            <>
              <span>✓</span>
              Add Product
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddProduct;
