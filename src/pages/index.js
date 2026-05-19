import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../app/components/Layout";
import Head from "next/head";
import "./index.css";
import { app } from "../lib/firebaseConfig";
import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(20);

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

  return (
    <Layout>
      {(user) => (
        <>
          <Head>
            <link rel="icon" href="/images/Egorly.jpg" />
            <title>{"Egorly - Where Gaming Meets Giveaways"}</title>
            <meta
              name="description"
              content={isLive ? `Join our live gaming streams on TikTok! Get ${discountPercentage}% off sitewide when we're live, spin the fortune wheel for prizes, and shop exclusive products!` : `Join our live gaming streams on TikTok! Spin the fortune wheel for prizes, and shop exclusive products!`}
            />
          </Head>

          <div className="welcome_container">
            {/* Watch Stream Button */}
            <a 
              href="https://www.tiktok.com/@yourusername" 
              target="_blank" 
              rel="noopener noreferrer"
              className="stream_button"
            >
              <span className="stream_button_text">Watch Us Live on TikTok</span>
              <div className="stream_particles">
                <span className="particle"></span>
                <span className="particle"></span>
                <span className="particle"></span>
                <span className="particle"></span>
                <span className="particle"></span>
              </div>
            </a>

            {/* LIVE NOW Banner */}
            {isLive && (
              <div className="live_banner">
                <div className="live_pulse"></div>
                <span className="live_text">🔴 LIVE NOW - {discountPercentage}% OFF EVERYTHING!</span>
              </div>
            )}
            
            {/* Animated Background Circles */}
            <div className="animated-bg-circles">
              <ul className="bg-circles">
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
              </ul>
            </div>
            
            <div className="welcome_content">
              <div className="welcome_inner">
                <img
                  className="welcome_logo"
                  src="/images/Egorly.jpg"
                  alt="Egorly Logo"
                />
                <div className="welcome_txt">
                  <h1 className="welcome_h1">Where Gaming Meets Giveaways</h1>
                  <p className="welcome_p">
                    Watch me game live on TikTok{isLive ? `, get ` : ''}{isLive && <strong style={{color: '#ffd700'}}>{discountPercentage}% OFF everything</strong>}{isLive ? ` while I'm streaming, ` : ', '}and spin the fortune wheel for a chance to <strong style={{color: '#ffd700'}}>win real prizes!</strong>
                  </p>
                  <p className="welcome_description">
                    Every stream is a party. I'm gaming, you're watching, and everyone gets a shot at the fortune wheel. 
                    Real prizes. Real discounts. Real community. No gimmicks—just good vibes and great deals while I conquer Deadlock, CS2, Arc Raiders, and whatever game comes next.
                  </p>
                  <button 
                    onClick={() => {
                      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="explore_more_btn"
                  >
                    Shop Now
                  </button>
                </div>
                
                {/* Feature cards with effects */}
                <div className="hero_features">
                  <div className="feature_card">
                    <div className="feature_glow"></div>
                    <div className="feature_content">
                      <div className="feature_title">Gaming Streams</div>
                      <div className="feature_desc">Watch live gameplay</div>
                    </div>
                  </div>
                  <div className="feature_card">
                    <div className="feature_glow"></div>
                    <div className="feature_content">
                      <div className="feature_title">Fortune Wheel</div>
                      <div className="feature_desc">Spin for prizes</div>
                    </div>
                  </div>
                  <div className="feature_card">
                    <div className="feature_glow"></div>
                    <div className="feature_content">
                      <div className="feature_title">Win Prizes</div>
                      <div className="feature_desc">Real rewards</div>
                    </div>
                  </div>
                  {isLive && (
                    <div className="feature_card">
                      <div className="feature_glow"></div>
                      <div className="feature_content">
                        <div className="feature_title">{discountPercentage}% OFF Live</div>
                        <div className="feature_desc">Active Now</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="products_container" id="products">
            <div className="section_header">
              <h1 className="prod_h1">Shop The Collection</h1>
              <p className="section_subtitle">{isLive ? `Quality products, unbeatable prices—${discountPercentage}% OFF while we're live!` : 'Quality products at great prices'}</p>
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
                        {isLive ? (
                          <>
                            <h1 className="original_price">
                              ${parseFloat(product.price).toFixed(2)}
                            </h1>
                            <h1 className="discounted_price">
                              ${(parseFloat(product.price) * (1 - discountPercentage / 100)).toFixed(2)}
                            </h1>
                            <span className="discount_badge">{discountPercentage}% OFF</span>
                          </>
                        ) : (
                          <h1 className="current_price">
                            ${parseFloat(product.price).toFixed(2)}
                          </h1>
                        )}
                      </div>
                    </div>
                  </a>
                  <button
                    className="cart_btn"
                    onClick={() => router.push(`/product/${product.id}`)}
                    disabled={product.soldOut}
                  >
                    {product.soldOut ? "Sold Out" : "View Product"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}