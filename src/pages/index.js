import { useState, useEffect } from "react";
import Layout from "../app/components/Layout";
import Head from "next/head";
import "./index.css";
import { app } from "../lib/firebaseConfig";
import { getGuestSession, getGuestCart, saveGuestCart } from "../lib/guestUser";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]); // track which product ids are being saved
  const [toast, setToast] = useState(null); // {type: 'success'|'error', message: ''}

  useEffect(() => {
    const db = getFirestore(app);

    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = async (product, user) => {
    const db = getFirestore(app);
    
    try {
      setLoadingIds((s) => [...s, product.id]);
      let items = [];

      if (user) {
        // Logged-in user - use Firestore
        const cartRef = doc(db, `users/${user.uid}/cart/default`);
        const cartSnap = await getDoc(cartRef);
        if (cartSnap.exists()) {
          items = cartSnap.data().items || [];
        }

        const existingIndex = items.findIndex((item) => item.id === product.id);
        if (existingIndex !== -1) {
          items[existingIndex].quantity += 1;
        } else {
          items.push({
            ...product,
            quantity: 1,
            addedAt: new Date().toISOString(),
          });
        }

        await setDoc(cartRef, {
          items,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Guest user - use localStorage only
        await getGuestSession(); // Ensure guest session exists
        const cartData = getGuestCart();
        items = cartData.items || [];

        const existingIndex = items.findIndex((item) => item.id === product.id);
        if (existingIndex !== -1) {
          items[existingIndex].quantity += 1;
        } else {
          items.push({
            ...product,
            quantity: 1,
            addedAt: new Date().toISOString(),
          });
        }

        saveGuestCart({
          items,
          updatedAt: new Date().toISOString()
        });
      }

      setToast({ type: "success", message: `${product.name} added to cart.` });
    } catch (err) {
      console.error("Error updating cart:", err);
      setToast({ type: "error", message: "Failed to add to cart. Try again." });
    } finally {
      setLoadingIds((s) => s.filter((id) => id !== product.id));
    }
  };

  // auto-dismiss toast after 3.5s and cleanup on unmount or when toast changes
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <Layout>
      {(user) => (
        <>
          <Head>
            <link rel="icon" href="/images/bariga_logo.png" />
            <title>{"Egorly"}</title>
            <meta
              name="description"
              content="Explore a world of premium dried calamari and sea food snacks..."
            />
          </Head>

          <div className="welcome_container">
            <div className="welcome_content">
              <div className="welcome_inner">
                <img
                  className="welcome_logo"
                  src="/images/bariga_logo.png"
                  alt="Logo"
                />
                <div className="welcome_txt">
                  <h1 className="welcome_h1">Premium Dried Calamari</h1>
                  {user ? (
                    <p className="welcome_p">Welcome back, {user.email}!</p>
                  ) : (
                    <p className="welcome_p">
                      Discover our world of premium dried calamari and seafood snacks
                    </p>
                  )}
                  <a href="#products" className="explore_more_btn">Shop Now</a>
                </div>
                
                {/* Simple feature icons */}
                <div className="hero_icons">
                  <div className="icon_item">
                    <div className="icon_circle">🌊</div>
                    <span>Fresh</span>
                  </div>
                  <div className="icon_item">
                    <div className="icon_circle">⚡</div>
                    <span>Fast</span>
                  </div>
                  <div className="icon_item">
                    <div className="icon_circle">✨</div>
                    <span>Quality</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="products_container" id="products">
            <div className="section_header">
              <h1 className="prod_h1">Our Products</h1>
              <p className="section_subtitle">Handpicked selection of premium dried calamari</p>
            </div>

            <div className="product_display">
              {products.map((product) => (
                <div className="product_container" key={product.id}>
                  <p className="oz_g">
                    {product.wholesaleAvailable
                      ? "Wholesale Available"
                      : "Regular Product"}
                  </p>

                  <a href={`/product/${product.id}`} style={{textDecoration:'none', color:'inherit'}}>
                    <img
                      className="prod_img"
                      src={product.imageUrls?.[0] || product.imageUrl || '/images/placeholder.png'}
                      alt={product.name}
                    />
                    <div className="info_prod">
                      <h1 className="prod_name">{product.name}</h1>
                      <p className="prod_small_des">{product.description}</p>
                      <div className="price_display_order_con">
                        <h1 className="current_price">
                          ${parseFloat(product.price).toFixed(2)}
                        </h1>
                      </div>
                    </div>
                  </a>
                  <button
                    className="cart_btn"
                    onClick={() => addToCart(product, user)}
                    disabled={product.soldOut || loadingIds.includes(product.id)}
                  >
                    {product.soldOut
                      ? "Sold Out"
                      : loadingIds.includes(product.id)
                      ? "Adding..."
                      : "Add to Cart"}
                  </button>
                </div>
              ))}
            </div>
          </div>
            {/* Toast */}
            {toast && (
              <div className={`site_toast ${toast.type === 'success' ? 'toast_success' : 'toast_error'}`}>
                {toast.message}
              </div>
            )}
        </>
      )}
    </Layout>
  );
}