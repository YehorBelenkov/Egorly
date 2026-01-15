import { useEffect, useState } from 'react';
import { firestore, storage } from '../../../lib/firebaseConfig';  // Use firestore and storage
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';  // Firestore functions
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';  // Firebase Storage functions
import './index.css';

const ShowProducts = ({ idToken }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null); // State to hold product being edited
  const [editedProduct, setEditedProduct] = useState({}); // State for the edited product data
  
  // For adding new attributes
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');
  
  // For adding new description sections
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  
  // For adding packing list items
  const [newPackingItem, setNewPackingItem] = useState('');
  
  // For new images and video
  const [newImages, setNewImages] = useState([]);
  const [newVideo, setNewVideo] = useState(null);

  // Fetch products data from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'products'));  // Use firestore instead of db
        const productList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);  // Set fetched products into state
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts(); // Fetch products when the component loads
  }, []);

  // Handle delete action
  const handleDelete = async (productId, product) => {
    try {
      // Delete the product from Firestore
      await deleteDoc(doc(firestore, 'products', productId));  // Use firestore for delete

      // Delete all images from Firebase Storage
      if (product.imageUrls && product.imageUrls.length > 0) {
        for (const imageUrl of product.imageUrls) {
          try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          } catch (err) {
            console.error('Error deleting image:', err);
          }
        }
      }
      // Also delete old single imageUrl if exists
      if (product.imageUrl) {
        try {
          const imageRef = ref(storage, product.imageUrl);
          await deleteObject(imageRef);
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }
      
      // Delete video if exists
      if (product.videoUrl) {
        try {
          const videoRef = ref(storage, product.videoUrl);
          await deleteObject(videoRef);
        } catch (err) {
          console.error('Error deleting video:', err);
        }
      }

      // Update state after deletion
      setProducts(products.filter(product => product.id !== productId));
      alert('Product and its media deleted successfully!');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Error deleting product or media.');
    }
  };

  // Handle edit button click
  const handleEdit = (product) => {
    setEditingProduct(product); // Set the product to be edited
    setEditedProduct({ 
      ...product,
      // Ensure arrays exist
      imageUrls: product.imageUrls || [],
      descriptionSections: product.descriptionSections || [],
      attributes: product.attributes || [],
      packingList: product.packingList || [],
    }); // Initialize edited product state with current product data
    
    // Reset new item states
    setNewAttributeKey('');
    setNewAttributeValue('');
    setNewSectionTitle('');
    setNewSectionContent('');
    setNewPackingItem('');
    setNewImages([]);
    setNewVideo(null);
  };

  // Handle input change for editing product details
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle saving the edited product
  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updatedData = {
        ...editedProduct,
        soldOut: editedProduct.soldOut || false,
        wholesaleAvailable: editedProduct.wholesaleAvailable || false,
        wholesaleMinOrder: editedProduct.wholesaleAvailable ? editedProduct.wholesaleMinOrder : null,
        wholesalePrice: editedProduct.wholesaleAvailable ? editedProduct.wholesalePrice : null,
      };
      
      // Upload new images if any
      if (newImages.length > 0) {
        const imageUploadPromises = newImages.map(async (image) => {
          const imageRef = ref(storage, `products/${Date.now()}_${image.name}`);
          await uploadBytes(imageRef, image);
          return await getDownloadURL(imageRef);
        });
        
        const newImageUrls = await Promise.all(imageUploadPromises);
        updatedData.imageUrls = [...(editedProduct.imageUrls || []), ...newImageUrls];
      }
      
      // Upload new video if any
      if (newVideo) {
        const videoRef = ref(storage, `products/videos/${Date.now()}_${newVideo.name}`);
        await uploadBytes(videoRef, newVideo);
        updatedData.videoUrl = await getDownloadURL(videoRef);
      }
  
      await updateDoc(doc(firestore, 'products', editedProduct.id), updatedData);
  
      setProducts(products.map(product =>
        product.id === editedProduct.id ? { ...product, ...updatedData } : product
      ));
  
      setEditingProduct(null); // Close modal
      setNewImages([]);
      setNewVideo(null);
      alert('Product updated successfully!');
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Error saving product.');
    } finally {
      setLoading(false);
    }
  };

  // Handle canceling the edit
  const handleCancel = () => {
    setEditingProduct(null); // Close the edit modal without saving
    setNewImages([]);
    setNewVideo(null);
  };
  
  // Helper functions for editing arrays
  const handleAddAttribute = () => {
    if (newAttributeKey.trim()) {
      setEditedProduct({
        ...editedProduct,
        attributes: [...(editedProduct.attributes || []), { key: newAttributeKey, value: newAttributeValue }],
      });
      setNewAttributeKey('');
      setNewAttributeValue('');
    }
  };

  const handleRemoveAttribute = (index) => {
    const updatedAttributes = editedProduct.attributes.filter((_, i) => i !== index);
    setEditedProduct({ ...editedProduct, attributes: updatedAttributes });
  };

  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      setEditedProduct({
        ...editedProduct,
        descriptionSections: [...(editedProduct.descriptionSections || []), { title: newSectionTitle, content: newSectionContent }],
      });
      setNewSectionTitle('');
      setNewSectionContent('');
    }
  };

  const handleRemoveSection = (index) => {
    const updatedSections = editedProduct.descriptionSections.filter((_, i) => i !== index);
    setEditedProduct({ ...editedProduct, descriptionSections: updatedSections });
  };

  const handleAddPackingItem = () => {
    if (newPackingItem.trim()) {
      setEditedProduct({
        ...editedProduct,
        packingList: [...(editedProduct.packingList || []), newPackingItem],
      });
      setNewPackingItem('');
    }
  };

  const handleRemovePackingItem = (index) => {
    const updatedList = editedProduct.packingList.filter((_, i) => i !== index);
    setEditedProduct({ ...editedProduct, packingList: updatedList });
  };
  
  const handleRemoveExistingImage = async (index) => {
    const imageUrl = editedProduct.imageUrls[index];
    try {
      // Delete from storage
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      
      // Update state
      const updatedImages = editedProduct.imageUrls.filter((_, i) => i !== index);
      setEditedProduct({ ...editedProduct, imageUrls: updatedImages });
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Error deleting image.');
    }
  };
  
  const handleRemoveNewImage = (index) => {
    const updatedImages = newImages.filter((_, i) => i !== index);
    setNewImages(updatedImages);
  };
  
  const handleRemoveVideo = async () => {
    if (editedProduct.videoUrl) {
      try {
        const videoRef = ref(storage, editedProduct.videoUrl);
        await deleteObject(videoRef);
        setEditedProduct({ ...editedProduct, videoUrl: null });
      } catch (err) {
        console.error('Error deleting video:', err);
        alert('Error deleting video.');
      }
    }
  };

  return (
    <div>
      <h2>All Products</h2>
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Storage</th>
              <th>Wholesale</th>
              <th>Min Order</th>
              <th>Wholesale Price</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="6">No products available.</td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id}>
                  <td>
                    <img src={(product.imageUrls && product.imageUrls[0]) || product.imageUrl} alt={product.name} width="50" />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.price}</td>
                  <td>{product.quantity}</td>
                  <td>
                    {product.soldOut ? <span style={{ color: 'red', fontWeight: 'bold' }}>Sold Out</span> : 'Available'}
                  </td>
                  <td>{product.wholesaleAvailable ? "Yes" : "No"}</td>
                  <td>{product.wholesaleAvailable ? product.wholesaleMinOrder : "-"}</td>
                  <td>{product.wholesaleAvailable ? `$${product.wholesalePrice}` : "-"}</td>
                  <td>
                    <button className='editbtn' onClick={() => handleEdit(product)}>Edit</button>
                  </td>
                  <td>
                    <button className='delbtn' onClick={() => handleDelete(product.id, product)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {editingProduct && (
        <div className="modal" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
            </div>
            
            <div className="modal-body">
              {/* Images Section */}
              <div className="edit-section">
                <h3>Product Images</h3>
                <div className="existing-images">
                  {editedProduct.imageUrls && editedProduct.imageUrls.length > 0 ? (
                    <div className="image-grid">
                      {editedProduct.imageUrls.map((url, index) => (
                        <div key={index} className="image-preview">
                          <img src={url} alt={`Product ${index + 1}`} />
                          <button type="button" className="remove-btn" onClick={() => handleRemoveExistingImage(index)}>×</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No images uploaded yet</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Add New Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setNewImages([...newImages, ...Array.from(e.target.files)])}
                  />
                  {newImages.length > 0 && (
                    <div className="new-images-preview">
                      {newImages.map((file, index) => (
                        <div key={index} className="image-preview">
                          <img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} />
                          <button type="button" className="remove-btn" onClick={() => handleRemoveNewImage(index)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Video Section */}
              <div className="edit-section">
                <h3>Product Video</h3>
                {editedProduct.videoUrl ? (
                  <div className="video-preview">
                    <video src={editedProduct.videoUrl} controls width="300" />
                    <button type="button" className="remove-btn" onClick={handleRemoveVideo}>Remove Video</button>
                  </div>
                ) : newVideo ? (
                  <div className="video-preview">
                    <video src={URL.createObjectURL(newVideo)} controls width="300" />
                    <button type="button" className="remove-btn" onClick={() => setNewVideo(null)}>Remove Video</button>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Upload Video</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setNewVideo(e.target.files[0])}
                    />
                  </div>
                )}
              </div>

              {/* Basic Information Section */}
              <div className="edit-section">
                <h3>Basic Information</h3>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editedProduct.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={editedProduct.description || ""}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Enter product description..."
                  />
                </div>
              </div>
              
              {/* Description Sections */}
              <div className="edit-section">
                <h3>Description Sections</h3>
                {editedProduct.descriptionSections && editedProduct.descriptionSections.length > 0 && (
                  <div className="items-list">
                    {editedProduct.descriptionSections.map((section, index) => (
                      <div key={index} className="item-row">
                        <div className="section-info">
                          <strong>{section.title}</strong>
                          {section.content && <p>{section.content}</p>}
                        </div>
                        <button type="button" className="remove-btn" onClick={() => handleRemoveSection(index)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="add-item-form">
                  <input
                    type="text"
                    placeholder="Section title (required)"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="Section content (optional)"
                    value={newSectionContent}
                    onChange={(e) => setNewSectionContent(e.target.value)}
                    rows="3"
                  />
                  <button type="button" onClick={handleAddSection}>Add Section</button>
                </div>
              </div>
              
              {/* Attributes Section */}
              <div className="edit-section">
                <h3>Product Specifications</h3>
                {editedProduct.attributes && editedProduct.attributes.length > 0 && (
                  <div className="items-list">
                    {editedProduct.attributes.map((attr, index) => (
                      <div key={index} className="item-row">
                        <span><strong>{attr.key}:</strong> {attr.value || 'N/A'}</span>
                        <button type="button" className="remove-btn" onClick={() => handleRemoveAttribute(index)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="add-item-form">
                  <input
                    type="text"
                    placeholder="Specification name (e.g., Brand, Color)"
                    value={newAttributeKey}
                    onChange={(e) => setNewAttributeKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Value (optional)"
                    value={newAttributeValue}
                    onChange={(e) => setNewAttributeValue(e.target.value)}
                  />
                  <button type="button" onClick={handleAddAttribute}>Add Specification</button>
                </div>
              </div>
              
              {/* Packing List Section */}
              <div className="edit-section">
                <h3>Packing List</h3>
                {editedProduct.packingList && editedProduct.packingList.length > 0 && (
                  <div className="items-list">
                    {editedProduct.packingList.map((item, index) => (
                      <div key={index} className="item-row">
                        <span>{item}</span>
                        <button type="button" className="remove-btn" onClick={() => handleRemovePackingItem(index)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="add-item-form">
                  <input
                    type="text"
                    placeholder="Item included in package"
                    value={newPackingItem}
                    onChange={(e) => setNewPackingItem(e.target.value)}
                  />
                  <button type="button" onClick={handleAddPackingItem}>Add Item</button>
                </div>
              </div>

              {/* Pricing & Inventory Section */}
              <div className="edit-section">
                <h3>Pricing & Inventory</h3>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    value={editedProduct.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Quantity in Stock</label>
                  <input
                    type="number"
                    name="quantity"
                    value={editedProduct.quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="soldOut"
                    name="soldOut"
                    checked={editedProduct.soldOut || false}
                    onChange={(e) => setEditedProduct(prevState => ({
                      ...prevState,
                      soldOut: e.target.checked
                    }))}
                  />
                  <label htmlFor="soldOut">Mark as Sold Out</label>
                </div>
              </div>

              {/* Wholesale Options Section */}
              <div className="edit-section">
                <h3>Wholesale Options</h3>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="wholesaleAvailable"
                    name="wholesaleAvailable"
                    checked={editedProduct.wholesaleAvailable || false}
                    onChange={(e) => setEditedProduct(prevState => ({
                      ...prevState,
                      wholesaleAvailable: e.target.checked
                    }))}
                  />
                  <label htmlFor="wholesaleAvailable">Available for Wholesale</label>
                </div>

                {editedProduct.wholesaleAvailable && (
                  <div className="wholesale-fields">
                    <div className="form-group">
                      <label>Minimum Order Quantity</label>
                      <input
                        type="number"
                        name="wholesaleMinOrder"
                        value={editedProduct.wholesaleMinOrder || ""}
                        onChange={handleInputChange}
                        placeholder="Enter minimum order quantity"
                      />
                    </div>
                    <div className="form-group">
                      <label>Wholesale Price ($)</label>
                      <input
                        type="number"
                        name="wholesalePrice"
                        value={editedProduct.wholesalePrice || ""}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-buttons">
              <button className="savebtn" onClick={handleSave}>Save Changes</button>
              <button className="cancelbtn" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowProducts;