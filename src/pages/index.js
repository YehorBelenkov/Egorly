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