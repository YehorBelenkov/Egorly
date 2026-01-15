import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './index.css';

const AddProduct = ({ onClose, idToken }) => {
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    quantity: '',
    images: [], // Changed to array for multiple images
    video: null, // Video file
    description: '',
    descriptionSections: [], // Multiple description sections with titles
    attributes: [], // Dynamic key-value pairs for any product specs
    packingList: [], // What's included in the package
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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

  const handleAddProduct = async () => {
    try {
      setLoading(true);
      setError('');

      // Upload all images to Firebase Storage IN PARALLEL (much faster)
      const storage = getStorage();
      
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
        description: productData.description,
        descriptionSections: productData.descriptionSections, // Multiple sections
        attributes: productData.attributes, // Dynamic attributes
        packingList: productData.packingList, // What's included
        imageUrls, // Multiple images
        videoUrl, // Video URL (or null)
      };

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
        throw new Error('Failed to add product');
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
