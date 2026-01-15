import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "../../lib/firebaseConfig";
import { getGuestSession, getGuestCart, saveGuestCart } from "../../lib/guestUser";
import "./product_detail.css";
import Layout from "../../app/components/Layout";

export default function ProductDetail() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0); // Track selected image index

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct(docSnap.data());
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

  const handleAddToCart = async (user) => {
    if (!product) return;
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

        const existingIndex = items.findIndex((item) => item.id === id);
        if (existingIndex !== -1) {
          items[existingIndex].quantity += quantity;
        } else {
          items.push({
            id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrls?.[0] || product.imageUrl || '',
            description: product.description,
            quantity,
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

        const existingIndex = items.findIndex((item) => item.id === id);
        if (existingIndex !== -1) {
          items[existingIndex].quantity += quantity;
        } else {
          items.push({
            id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrls?.[0] || product.imageUrl || '',
            description: product.description,
            quantity,
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
        <div className="product_detail_page_wrap">
      <div className="product_detail_main">
        <div className="product_container product_container_2col" style={{fontFamily: 'Segoe UI, Arial, Helvetica Neue, sans-serif'}}>
          
          {/* Image Gallery Column with thumbnails on the left */}
          <div className="product_detail_img_col">
            <div className="image_gallery_wrapper">
              {/* Thumbnail selector on the left */}
              {((product.imageUrls && product.imageUrls.length > 0) || product.videoUrl) && (
                <div className="thumbnail_sidebar">
                  {/* First image */}
                  {product.imageUrls && product.imageUrls[0] && (
                    <img
                      key="img-0"
                      src={product.imageUrls[0]}
                      alt={`${product.name} 1`}
                      onClick={() => setSelectedImage(0)}
                      className={`thumbnail_image ${selectedImage === 0 ? 'active' : ''}`}
                    />
                  )}
                  
                  {/* Video as second item */}
                  {product.videoUrl && (
                    <div
                      key="video-thumb"
                      onClick={() => setSelectedImage('video')}
                      className={`thumbnail_image video_thumbnail ${selectedImage === 'video' ? 'active' : ''}`}
                    >
                      <div className="video_play_icon">▶</div>
                    </div>
                  )}
                  
                  {/* Rest of the images (from index 1 onwards) */}
                  {product.imageUrls && product.imageUrls.slice(1).map((img, index) => (
                    <img
                      key={`img-${index + 1}`}
                      src={img}
                      alt={`${product.name} ${index + 2}`}
                      onClick={() => setSelectedImage(index + 1)}
                      className={`thumbnail_image ${selectedImage === index + 1 ? 'active' : ''}`}
                    />
                  ))}
                </div>
              )}
              
              {/* Main product image or video */}
              <div className="main_image_wrapper">
                {selectedImage === 'video' && product.videoUrl ? (
                  <video 
                    className="product_image"
                    controls
                    autoPlay
                  >
                    <source src={product.videoUrl} type="video/mp4" />
                    <source src={product.videoUrl} type="video/webm" />
                    <source src={product.videoUrl} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    className="product_image"
                    src={(product.imageUrls && product.imageUrls[selectedImage]) || product.imageUrl || '/placeholder.png'}
                    alt={product.name || 'Product Image'}
                  />
                )}
              </div>
            </div>
            
            {/* Add to Cart Section */}
            <div className="add_to_cart_section">
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
            <h2 className="product_price">${parseFloat(product.price || 0).toFixed(2)}</h2>
            
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
      )}
    </Layout>
  );
}
