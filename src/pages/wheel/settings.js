import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../../lib/firebaseConfig';
import styles from './settings.module.css';

export default function WheelSettings() {
  const [prizes, setPrizes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedPrizeId, setSelectedPrizeId] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchProducts();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/wheel/settings');
      if (res.ok) {
        const data = await res.json();
        setPrizes(data.prizes || []);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const productsRef = collection(firestore, 'products');
      const q = query(productsRef, orderBy('name'), limit(100));
      const snapshot = await getDocs(q);
      const productsList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        price: doc.data().price,
        image: doc.data().image || doc.data().images?.[0] || doc.data().ImageUrls?.[0] || null,
        description: doc.data().description || ''
      }));
      setProducts(productsList);
      console.log('✅ Loaded products:', productsList.length);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/wheel/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizes })
      });

      if (res.ok) {
        setMessage('✅ Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addPrize = () => {
    const newId = prizes.length > 0 ? Math.max(...prizes.map(p => p.id)) + 1 : 1;
    setPrizes([...prizes, {
      id: newId,
      label: 'New Prize',
      type: 'discount',
      value: 10,
      productId: null,
      productImage: null
    }]);
  };

  const updatePrize = (id, field, value) => {
    setPrizes(prizes.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const deletePrize = (id) => {
    setPrizes(prizes.filter(p => p.id !== id));
  };

  const openProductModal = (prizeId) => {
    setSelectedPrizeId(prizeId);
    setShowProductModal(true);
  };

  const selectProduct = (product) => {
    if (selectedPrizeId) {
      updatePrize(selectedPrizeId, 'productId', product.id);
      updatePrize(selectedPrizeId, 'label', product.name);
      updatePrize(selectedPrizeId, 'value', product.price);
      updatePrize(selectedPrizeId, 'productImage', product.image);
      setShowProductModal(false);
      setSelectedPrizeId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>⚙️ Fortune Wheel Settings</h1>
        <p>Configure prizes and discounts for the wheel</p>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading settings...</p>
        </div>
      ) : (
        <>
          <div className={styles.prizesList}>
            <div className={styles.prizesHeader}>
              <h2>🎁 Available Prizes ({prizes.length})</h2>
              <button onClick={addPrize} className={styles.btnAdd}>
                + Add Prize
              </button>
            </div>

            {prizes.length === 0 ? (
              <div className={styles.empty}>
                <p>No prizes configured yet</p>
                <button onClick={addPrize} className={styles.btnPrimary}>
                  Add First Prize
                </button>
              </div>
            ) : (
              <div className={styles.prizesGrid}>
                {prizes.map(prize => (
                  <div key={prize.id} className={styles.prizeCard}>
                    <div className={styles.prizeForm}>
                      <div className={styles.prizeHeader}>
                        <span className={styles.prizeNumber}>Prize #{prize.id}</span>
                        <button 
                          onClick={() => deletePrize(prize.id)}
                          className={styles.btnDeleteSmall}
                        >
                          🗑️
                        </button>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Prize Type</label>
                        <select
                          value={prize.type}
                          onChange={(e) => updatePrize(prize.id, 'type', e.target.value)}
                          className={styles.selectType}
                        >
                          <option value="discount">💰 Discount</option>
                          <option value="money">💵 Cash Prize</option>
                          <option value="product">🎁 Physical Product</option>
                          <option value="shipping">📦 Free Shipping</option>
                          <option value="other">✨ Other</option>
                        </select>
                      </div>

                      {prize.type === 'product' && (
                        <div className={styles.formGroup}>
                          <label>Select Product ({products.length} available)</label>
                          <button
                            type="button"
                            onClick={() => openProductModal(prize.id)}
                            className={styles.btnSelectProduct}
                          >
                            {prize.productId ? (
                              <>
                                <span className={styles.productSelected}>✓</span>
                                {products.find(p => p.id === prize.productId)?.name || 'Product Selected'}
                              </>
                            ) : (
                              <>
                                <span className={styles.productIcon}>🛍️</span>
                                Choose from {products.length} products...
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className={styles.formGroup}>
                        <label>
                          {prize.type === 'discount' && 'Discount Label'}
                          {prize.type === 'money' && 'Cash Amount Label'}
                          {prize.type === 'product' && 'Product Name'}
                          {prize.type === 'shipping' && 'Prize Label'}
                          {prize.type === 'other' && 'Prize Label'}
                        </label>
                        <input
                          type="text"
                          value={prize.label}
                          onChange={(e) => updatePrize(prize.id, 'label', e.target.value)}
                          placeholder={
                            prize.type === 'discount' ? 'e.g., 20% OFF' :
                            prize.type === 'money' ? 'e.g., $50 Cash' :
                            prize.type === 'product' ? 'e.g., Premium T-Shirt' :
                            prize.type === 'shipping' ? 'e.g., Free Shipping' :
                            'e.g., Special Prize'
                          }
                          className={styles.inputLabel}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>
                          {prize.type === 'discount' && 'Discount Value (%)'}
                          {prize.type === 'money' && 'Cash Amount ($)'}
                          {prize.type === 'product' && 'Product Value ($)'}
                          {prize.type === 'shipping' && 'Shipping Value ($)'}
                          {prize.type === 'other' && 'Estimated Value ($)'}
                        </label>
                        <input
                          type="number"
                          value={prize.value || 0}
                          onChange={(e) => updatePrize(prize.id, 'value', parseFloat(e.target.value) || 0)}
                          placeholder={
                            prize.type === 'discount' ? '20' :
                            prize.type === 'money' ? '50' :
                            '0'
                          }
                          className={styles.inputValue}
                          min="0"
                          step={prize.type === 'money' || prize.type === 'product' ? '0.01' : '1'}
                        />
                      </div>

                      <div className={styles.prizePreview}>
                        <span className={styles.previewLabel}>Preview:</span>
                        <span className={styles.previewValue}>
                          {prize.type === 'discount' && `${prize.value}% OFF`}
                          {prize.type === 'money' && `$${prize.value} Cash`}
                          {prize.type === 'product' && `${prize.label} ($${prize.value})`}
                          {prize.type === 'shipping' && 'Free Shipping'}
                          {prize.type === 'other' && prize.label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button 
              onClick={handleSave}
              disabled={saving}
              className={styles.btnSave}
            >
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>
            <a href="/wheel" className={styles.btnBack}>
              ← Back to Wheel
            </a>
          </div>

          {message && (
            <div className={styles.message}>
              {message}
            </div>
          )}
        </>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className={styles.modalOverlay} onClick={() => setShowProductModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>🛍️ Select Product ({products.length} available)</h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowProductModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.productsTable}>
              {products.length === 0 ? (
                <div className={styles.noProducts}>
                  <p>📭 No products found in database</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr 
                        key={product.id}
                        className={styles.productRow}
                        onClick={() => selectProduct(product)}
                      >
                        <td>
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className={styles.productImage}
                            />
                          ) : (
                            <div className={styles.noImage}>📦</div>
                          )}
                        </td>
                        <td className={styles.productName}>
                          {product.name}
                          {product.description && (
                            <div className={styles.productDesc}>{product.description.substring(0, 80)}...</div>
                          )}
                        </td>
                        <td className={styles.productPrice}>${product.price}</td>
                        <td>
                          <button 
                            className={styles.btnSelect}
                            onClick={() => selectProduct(product)}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
