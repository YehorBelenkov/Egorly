import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "../../lib/firebaseConfig";
import { getGuestSession, getGuestCart, saveGuestCart } from "../../lib/guestUser";
import "./product_detail.css";
import Layout from "../../app/components/Layout";
import LiveBanner from "../../app/components/LiveBanner";

export default function ProductDetail() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(20);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch discount status from admin toggle
  useEffect(() => {
    const fetchDiscountStatus = async () => {
      try {
        const res = await fetch('/api/discount-toggle');
        if (res.ok) {
          const data = await res.json();
          setIsLive(data.enabled || false);
          setDiscountPercentage(data.percentage || 20);
        }
      } catch (err) {
        console.error('Failed to fetch discount status:', err);
      }
    };

    fetchDiscountStatus();
    
    // Poll every 5 seconds to check if admin toggled it
    const interval = setInterval(fetchDiscountStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0); // Track selected image index
  const [selectedVariant, setSelectedVariant] = useState(null); // Track selected variant
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const productData = docSnap.data();
          setProduct(productData);
          // Set first variant as default if variants exist
          if (productData.variants && productData.variants.length > 0) {
            setSelectedVariant(productData.variants[0]);
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        setProduct(null);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (e) => {
    const val = Math.max(1, parseInt(e.target.value) || 1);
    setQuantity(val);
  };

  // Swipe handlers for mobile image gallery
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Build combined image array to get total count
    let allImages = [];
    if (product.imageUrls && product.imageUrls.length > 0) {
      allImages = [...allImages, ...product.imageUrls];
    }
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        if (variant.customImageUrls && variant.customImageUrls.length > 0) {
          allImages = [...allImages, ...variant.customImageUrls];
        }
      });
    }
    const totalImages = allImages.length + (product.videoUrl ? 1 : 0);

    if (isLeftSwipe && selectedImage !== 'video') {
      // Swipe left - next image
      const nextIndex = selectedImage + 1;
      if (nextIndex < allImages.length) {
        setSelectedImage(nextIndex);
      } else if (product.videoUrl) {
        setSelectedImage('video');
      }
    }

    if (isRightSwipe) {
      // Swipe right - previous image
      if (selectedImage === 'video') {
        setSelectedImage(allImages.length - 1);
      } else if (selectedImage > 0) {
        setSelectedImage(selectedImage - 1);
      }
    }
  };

  const handleAddToCart = async (user) => {
    if (!product) return;
    
    // Check if product has variants and none is selected
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      alert('Please select a variant');
      return;
    }
    
    setAdding(true);

    try {
      const db = getFirestore(app);
      let items = [];

      if (user) {
        // Logged-in user - use Firestore
        const cartRef = doc(db, `users/${user.uid}/cart/default`);
        const cartSnap = await getDoc(cartRef);
        if (cartSnap.exists()) {
          items = cartSnap.data().items || [];
        }

        // Use variant-specific ID if variant is selected
        const cartItemId = selectedVariant ? `${id}_${selectedVariant.id}` : id;
        const existingIndex = items.findIndex((item) => item.id === cartItemId);
        
        if (existingIndex !== -1) {
          items[existingIndex].quantity += quantity;
        } else {
          items.push({
            id: cartItemId,
            productId: id,
            name: product.name,
            price: product.price, // Use product's markup price, not variant price
            imageUrl: selectedVariant?.customImageUrls?.[0] || product.imageUrls?.[0] || product.imageUrl || '',
            description: product.description,
            quantity,
            variant: selectedVariant ? {
              id: selectedVariant.id,
              sku: selectedVariant.sku, // Keep SKU for backend/CJ ordering
              name: selectedVariant.name,
              variantKey: selectedVariant.variantKey
            } : null,
            addedAt: new Date().toISOString(),
          });
        }

        await setDoc(cartRef, {
          items,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Guest user - use localStorage
        await getGuestSession(); // Ensure guest session exists
        const cartData = getGuestCart();
        items = cartData.items || [];

        const cartItemId = selectedVariant ? `${id}_${selectedVariant.id}` : id;
        const existingIndex = items.findIndex((item) => item.id === cartItemId);
        
        if (existingIndex !== -1) {
          items[existingIndex].quantity += quantity;
        } else {
          items.push({
            id: cartItemId,
            productId: id,
            name: product.name,
            price: product.price, // Use product's markup price, not variant price
            imageUrl: selectedVariant?.customImageUrls?.[0] || product.imageUrls?.[0] || product.imageUrl || '',
            description: product.description,
            quantity,
            variant: selectedVariant ? {
              id: selectedVariant.id,
              sku: selectedVariant.sku, // Keep SKU for backend/CJ ordering
              name: selectedVariant.name,
              variantKey: selectedVariant.variantKey
            } : null,
            addedAt: new Date().toISOString(),
          });
        }

        saveGuestCart({
          items,
          updatedAt: new Date().toISOString()
        });
      }

      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <Layout>
      {() => (
        <div className="product_detail_page_wrap">
          <div className="product_detail_main">
            <div className="product_container">Loading...</div>
          </div>
        </div>
      )}
    </Layout>
  );
  
  if (!product) return (
    <Layout>
      {() => (
        <div className="product_detail_page_wrap">
          <div className="product_detail_main">
            <div className="product_container">Product not found.</div>
          </div>
        </div>
      )}
    </Layout>
  );

  return (
    <Layout>
      {(user) => (
        <>
        <LiveBanner />
        <div className="product_detail_page_wrap">
      <div className="product_detail_main">
        <div className="product_container product_container_2col" style={{fontFamily: 'Segoe UI, Arial, Helvetica Neue, sans-serif'}}>
          
          {/* Image Gallery Column with thumbnails on the left */}
          <div className="product_detail_img_col">
            <div className="image_gallery_wrapper">
              {/* Thumbnail selector on the left */}
              {(() => {
                // Build combined image array: product images first, then variant images
                let allImages = [];
                
                // Add product images first
                if (product.imageUrls && product.imageUrls.length > 0) {
                  allImages = [...allImages, ...product.imageUrls];
                }
                
                // Add images from ALL variants
                if (product.variants && product.variants.length > 0) {
                  product.variants.forEach(variant => {
                    if (variant.customImageUrls && variant.customImageUrls.length > 0) {
                      allImages = [...allImages, ...variant.customImageUrls];
                    }
                  });
                }
                
                return (allImages.length > 0 || product.videoUrl) && (
                  <div className="thumbnail_sidebar">
                    {/* Images */}
                    {allImages.map((img, index) => (
                      <img
                        key={`img-${index}`}
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        onClick={() => setSelectedImage(index)}
                        className={`thumbnail_image ${selectedImage === index ? 'active' : ''}`}
                      />
                    ))}
                    
                    {/* Video as last item */}
                    {product.videoUrl && (
                      <div
                        key="video-thumb"
                        onClick={() => setSelectedImage('video')}
                        className={`thumbnail_image video_thumbnail ${selectedImage === 'video' ? 'active' : ''}`}
                      >
                        <div className="video_play_icon">▶</div>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              {/* Main product image or video */}
              <div 
                className="main_image_wrapper"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {isMobile ? (
                  // Mobile: Carousel with smooth sliding
                  (() => {
                    // Build combined image array
                    let allImages = [];
                    if (product.imageUrls && product.imageUrls.length > 0) {
                      allImages = [...allImages, ...product.imageUrls];
                    }
                    if (product.variants && product.variants.length > 0) {
                      product.variants.forEach(variant => {
                        if (variant.customImageUrls && variant.customImageUrls.length > 0) {
                          allImages = [...allImages, ...variant.customImageUrls];
                        }
                      });
                    }
                    
                    const currentIndex = selectedImage === 'video' ? allImages.length : selectedImage;
                    const translateX = -currentIndex * 100;
                    
                    return (
                      <div className="image_carousel_track" style={{ transform: `translateX(${translateX}%)` }}>
                        {allImages.map((img, index) => (
                          <div key={`slide-${index}`} className="carousel_image_slide">
                            <img
                              src={img}
                              alt={`${product.name} ${index + 1}`}
                            />
                          </div>
                        ))}
                        {product.videoUrl && (
                          <div key="slide-video" className="carousel_image_slide">
                            <video 
                              controls
                              preload="metadata"
                            >
                              <source src={product.videoUrl} type="video/mp4" />
                              <source src={product.videoUrl} type="video/webm" />
                              <source src={product.videoUrl} type="video/ogg" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  // Desktop: Single image display
                  selectedImage === 'video' && product.videoUrl ? (
                    <video 
                      key="video"
                      className="product_image"
                      controls
                      preload="metadata"
                    >
                      <source src={product.videoUrl} type="video/mp4" />
                      <source src={product.videoUrl} type="video/webm" />
                      <source src={product.videoUrl} type="video/ogg" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (() => {
                    let allImages = [];
                    if (product.imageUrls && product.imageUrls.length > 0) {
                      allImages = [...allImages, ...product.imageUrls];
                    }
                    if (product.variants && product.variants.length > 0) {
                      product.variants.forEach(variant => {
                        if (variant.customImageUrls && variant.customImageUrls.length > 0) {
                          allImages = [...allImages, ...variant.customImageUrls];
                        }
                      });
                    }
                    
                    return (
                      <img
                        key={selectedImage}
                        className="product_image"
                        src={allImages[selectedImage] || product.imageUrl || '/placeholder.png'}
                        alt={product.name || 'Product Image'}
                      />
                    );
                  })()
                )}
              </div>
              
              {/* Pagination Dots for Mobile */}
              {isMobile && (() => {
                let allImages = [];
                if (product.imageUrls && product.imageUrls.length > 0) {
                  allImages = [...allImages, ...product.imageUrls];
                }
                if (product.variants && product.variants.length > 0) {
                  product.variants.forEach(variant => {
                    if (variant.customImageUrls && variant.customImageUrls.length > 0) {
                      allImages = [...allImages, ...variant.customImageUrls];
                    }
                  });
                }
                const totalImages = allImages.length + (product.videoUrl ? 1 : 0);
                
                return totalImages > 0 && (
                  <div className="pagination_dots">
                    {allImages.map((_, index) => (
                      <button
                        key={`dot-${index}`}
                        className={`pagination_dot ${selectedImage === index ? 'active' : ''}`}
                        onClick={() => setSelectedImage(index)}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                    {product.videoUrl && (
                      <button
                        key="dot-video"
                        className={`pagination_dot ${selectedImage === 'video' ? 'active' : ''}`}
                        onClick={() => setSelectedImage('video')}
                        aria-label="View video"
                      />
                    )}
                  </div>
                );
              })()}
            </div>
            
            {/* Add to Cart Section */}
            <div className="add_to_cart_section">
              {/* Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="variant_selector_section" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', fontSize: '15px' }}>
                    Select Variant:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          
                          // Find the index of this variant's first image in allImages
                          let imageIndex = 0;
                          
                          // Start after product images
                          if (product.imageUrls && product.imageUrls.length > 0) {
                            imageIndex = product.imageUrls.length;
                          }
                          
                          // Add images from variants before this one
                          if (product.variants && product.variants.length > 0) {
                            for (let i = 0; i < product.variants.length; i++) {
                              if (product.variants[i].id === variant.id) {
                                break;
                              }
                              if (product.variants[i].customImageUrls && product.variants[i].customImageUrls.length > 0) {
                                imageIndex += product.variants[i].customImageUrls.length;
                              }
                            }
                          }
                          
                          setSelectedImage(imageIndex);
                        }}
                        style={{
                          padding: '8px 14px',
                          border: selectedVariant?.id === variant.id ? '2px solid #4CAF50' : '2px solid #ddd',
                          borderRadius: '6px',
                          backgroundColor: selectedVariant?.id === variant.id ? '#f0fdf4' : 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: selectedVariant?.id === variant.id ? '600' : '400',
                          transition: 'background-color 0.2s, border-color 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '110px',
                          minHeight: '44px'
                        }}
                        onMouseOver={(e) => {
                          if (selectedVariant?.id !== variant.id) {
                            e.currentTarget.style.borderColor = '#4CAF50';
                            e.currentTarget.style.backgroundColor = '#fafafa';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (selectedVariant?.id !== variant.id) {
                            e.currentTarget.style.borderColor = '#ddd';
                            e.currentTarget.style.backgroundColor = 'white';
                          }
                        }}
                      >
                        <span style={{ fontWeight: '600' }}>{variant.variantKey || variant.name}</span>
                        {variant.stock !== undefined && variant.stock !== null && (
                          <span style={{ 
                            fontSize: '12px', 
                            color: variant.stock > 0 ? '#10b981' : '#ef4444',
                            marginTop: '4px'
                          }}>
                            {variant.stock > 0 ? `In Stock` : 'Out of Stock'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div style={{ 
                    marginTop: '10px', 
                    marginBottom: '8px',
                    padding: '8px 10px', 
                    backgroundColor: selectedVariant ? '#f0f9ff' : 'transparent',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: selectedVariant ? '#0369a1' : 'transparent',
                    minHeight: '33px',
                    visibility: selectedVariant ? 'visible' : 'hidden'
                  }}>
                    ✓ Selected: <strong>{selectedVariant?.variantKey || selectedVariant?.name || 'None'}</strong>
                  </div>
                </div>
              )}
              
              <div className="product_quantity_row">
                <label htmlFor="quantity" className="product_qty_label">Quantity:</label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="product_qty_input"
                />
              </div>
              <button
                className="product_add_btn"
                onClick={() => handleAddToCart(user)}
                disabled={adding}
              >
                {adding ? "Adding..." : added ? "Added!" : "Add to Cart"}
              </button>
            </div>
          </div>
          
          {/* Details Column */}
          <div className="product_details_col">
            <h1 className="product_name">{product.name}</h1>
            <hr className="product_name_hr" />
            
            {/* Price Display with Live Discount */}
            <div className="product_price_container" style={{ marginBottom: '1rem' }}>
              {isLive ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <h2 className="product_price_original" style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    color: '#999',
                    textDecoration: 'line-through',
                    margin: 0
                  }}>
                    ${parseFloat(product.price || 0).toFixed(2)}
                  </h2>
                  <h2 className="product_price" style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #ff0844 0%, #ff4d6d 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: 0
                  }}>
                    ${(parseFloat(product.price || 0) * (1 - discountPercentage / 100)).toFixed(2)}
                  </h2>
                  <span style={{
                    background: 'linear-gradient(135deg, #ff0844 0%, #ff4d6d 100%)',
                    color: 'white',
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    letterSpacing: '0.5px'
                  }}>
                    {discountPercentage}% OFF - LIVE NOW!
                  </span>
                </div>
              ) : (
                <h2 className="product_price">
                  ${parseFloat(product.price || 0).toFixed(2)}
                </h2>
              )}
            </div>
            
            {/* Main Description */}
            {product.description && (
              <div className="product_desc_main" style={{ marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                {product.description}
              </div>
            )}
            
            {/* Description Sections */}
            {product.descriptionSections && product.descriptionSections.length > 0 && (
              <>
                {product.descriptionSections.map((section, i) => (
                  <div key={i} className="product_section">
                    <h3 className="section_title">{section.title}</h3>
                    <div className="section_text" style={{ whiteSpace: 'pre-wrap' }}>{section.content}</div>
                  </div>
                ))}
              </>
            )}
            
            {/* Product Attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="product_section">
                <h3 className="section_title">Specifications</h3>
                <div className="attributes_container">
                  {product.attributes.map((attr, i) => (
                    attr.value && attr.value.trim() ? (
                      <div key={i} className="attribute_row">
                        <div className="attribute_key">{attr.key}</div>
                        <div className="attribute_value">{attr.value}</div>
                      </div>
                    ) : (
                      <div key={i} className="attribute_badge">{attr.key}</div>
                    )
                  ))}
                </div>
              </div>
            )}
            
            {/* Packing List */}
            {product.packingList && product.packingList.length > 0 && (
              <div className="product_section">
                <h3 className="section_title">📦 What's Included</h3>
                <ul className="section_list">
                  {product.packingList.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Legacy fields - only show if they exist */}
            {product.howItIsMade && product.howItIsMade.length > 0 && (
              <div className="product_section">
                <h3 className="section_title made">How It's Made</h3>
                <ul className="section_list">
                  {product.howItIsMade.map((step, i) => (
                    <li key={i} dangerouslySetInnerHTML={{__html: step}} />
                  ))}
                </ul>
              </div>
            )}
            
            {product.nutritionalBenefits && product.nutritionalBenefits.length > 0 && (
              <div className="product_section">
                <h3 className="section_title nutrition">Nutritional Benefits</h3>
                <ul className="section_list">
                  {product.nutritionalBenefits.map((item, i) => (
                    <li key={i} dangerouslySetInnerHTML={{__html: item}} />
                  ))}
                </ul>
              </div>
            )}
            
            {product.ingredients && (
              <div className="product_section">
                <h3 className="section_title ingredients">Ingredients</h3>
                <div className="section_text">{product.ingredients}</div>
              </div>
            )}
            
            {/* Why You'll Love It - moved from right column */}
            {product.whyYoullLoveIt && product.whyYoullLoveIt.length > 0 && (
              <div className="product_section">
                <h3 className="section_title love">Why You'll Love It</h3>
                <ul className="section_list">
                  {product.whyYoullLoveIt.map((item, i) => (
                    <li key={i} dangerouslySetInnerHTML={{__html: item}} />
                  ))}
                </ul>
              </div>
            )}
            
            {/* Wholesale Info */}
            {product.wholesaleAvailable && (
              <div className="product_section wholesale_section">
                <h3 className="section_title">Wholesale Available</h3>
                <div className="section_text">
                  <strong>Min Order:</strong> {product.wholesaleMinOrder}<br/>
                  <strong>Wholesale Price:</strong> ${product.wholesalePrice} per unit
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
        </div>
        </>
      )}
    </Layout>
  );
}
