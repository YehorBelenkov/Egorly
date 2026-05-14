import { useEffect, useState } from 'react'
import Layout from '../../app/components/Layout'
import LiveBanner from '../../app/components/LiveBanner'
import Head from 'next/head'
import '../../pages/index.css'
import './cart.css'
import { app } from '../../lib/firebaseConfig'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import { getGuestSession, getGuestCart, saveGuestCart } from '../../lib/guestUser'
import { getIsLive, calculateLivePrice } from '../../lib/liveStatus'

function getItemKey(item){
  return item.id ?? item.productId ?? item.productIdString ?? null
}

function CartInner({ user }){
  const [cart, setCart] = useState({ items: [], updatedAt: null })
  const [loadingIds, setLoadingIds] = useState([])
  const [toast, setToast] = useState(null)
  const [guestId, setGuestId] = useState(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(()=>{
    const fetchCart = async ()=>{
      try{
        const db = getFirestore(app)
        
        if (user) {
          // Logged-in user
          const cartRef = doc(db, `users/${user.uid}/cart/default`)
          const snap = await getDoc(cartRef)
          if(snap.exists()) {
            const data = snap.data()
            const items = (data.items || []).map(it => ({ ...it }))
            setCart({ items, updatedAt: data.updatedAt || null })
          } else {
            setCart({ items: [], updatedAt: null })
          }
        } else {
          // Guest user - use localStorage
          const gId = await getGuestSession()
          setGuestId(gId)
          const cartData = getGuestCart()
          const items = (cartData.items || []).map(it => ({ ...it }))
          setCart({ items, updatedAt: cartData.updatedAt || null })
        }
      }catch(e){ console.error('fetchCart', e) }
    }
    fetchCart()
  }, [user])

  useEffect(()=>{
    if(!toast) return
    const t = setTimeout(()=> setToast(null), 3500)
    return ()=> clearTimeout(t)
  }, [toast])

  useEffect(() => {
    setIsLive(getIsLive());
  }, []);

  const saveCart = async (items)=>{
    try{
      if (user) {
        // Logged-in user - use Firestore
        const db = getFirestore(app)
        const cartRef = doc(db, `users/${user.uid}/cart/default`)
        await setDoc(cartRef, { items, updatedAt: new Date().toISOString() })
      } else {
        // Guest user - use localStorage
        if (!guestId) {
          setToast({type:'error', message:'Session error. Please refresh the page.'})
          return
        }
        saveGuestCart({ items, updatedAt: new Date().toISOString() })
      }
      
      setCart({ items, updatedAt: new Date().toISOString() })
      setToast({type:'success', message:'Cart updated'})
    }catch(e){ console.error('saveCart', e); setToast({type:'error', message:'Failed to update cart'}) }
  }

  const changeQty = async (itemKey, newQty) =>{
    if(newQty < 1) return
    setLoadingIds(s => [...s, itemKey])
    try{
      const items = cart.items.map(i => (getItemKey(i) === itemKey ? { ...i, quantity: newQty } : i))
      await saveCart(items)
    }finally{
      setLoadingIds(s => s.filter(id => id !== itemKey))
    }
  }

  const removeItem = async (itemKey) =>{
    setLoadingIds(s => [...s, itemKey])
    try{
      const items = cart.items.filter(i => getItemKey(i) !== itemKey)
      await saveCart(items)
    }finally{
      setLoadingIds(s => s.filter(id => id !== itemKey))
    }
  }

  const clearCart = async () =>{
    await saveCart([])
  }

  let subtotal = cart.items.reduce((s, it) => s + (parseFloat(it.price || 0) * (it.quantity || 0)), 0)
  const originalSubtotal = subtotal;
  if (isLive) {
    subtotal = calculateLivePrice(subtotal);
  }

  return (
    <>
      <LiveBanner />
      <div className="cart_wrapper">
        <div className="cart_container">
          <div className="cart_header">
            <h1>🛒 Your Shopping Cart</h1>
            <p>{cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart</p>
            {!user && (
              <p style={{fontSize: '0.9rem', color: '#6c757d', marginTop: '0.5rem'}}>
                💡 <a href="/login" style={{color: '#0059aa', textDecoration: 'none'}}>Log in</a> or <a href="/register" style={{color: '#0059aa', textDecoration: 'none'}}>create an account</a> to save your cart
              </p>
            )}
          </div>

          {cart.items.length === 0 ? (
            <div className="cart_empty_state">
              <div className="empty_icon">🛍️</div>
              <h2>Your cart is empty</h2>
              <p>Start adding some delicious fish snacks!</p>
              <a href="/" className="browse_btn">Browse Products</a>
            </div>
          ) : (
            <div className="cart_content_grid">
              <div className="cart_items_section">
                {cart.items.map(item => {
                  const key = getItemKey(item) || JSON.stringify(item)
                  const loading = loadingIds.includes(key)
                  const lineTotal = (parseFloat(item.price||0) * (item.quantity||1)).toFixed(2)
                  return (
                    <div className='cart_item_card' key={key}>
                      <div 
                        className='item_image_container'
                        onClick={() => window.location.href = `/product/${item.productId || item.id}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <img src={item.imageUrl || '/images/calamari_product_salt.png'} alt={item.name} />
                      </div>
                      
                      <div 
                        className='item_details'
                        onClick={() => window.location.href = `/product/${item.productId || item.id}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <h3 className='item_name'>{item.name}</h3>
                        <p className='item_description'>{item.description}</p>
                        <div className='item_price_mobile'>${parseFloat(item.price||0).toFixed(2)}</div>
                      </div>

                      <div className='item_quantity'>
                        <label>Quantity</label>
                        <div className="quantity_controls">
                          <button 
                            className="qty_btn" 
                            disabled={loading} 
                            onClick={() => changeQty(key, Math.max(1, (item.quantity||1)-1))}
                          >
                            −
                          </button>
                          <input className="qty_input" value={item.quantity||1} readOnly />
                          <button 
                            className="qty_btn" 
                            disabled={loading} 
                            onClick={() => changeQty(key, (item.quantity||1)+1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className='item_total'>
                        <label>Total</label>
                        <div className="item_total_price">${lineTotal}</div>
                      </div>

                      <button 
                        className='remove_btn' 
                        disabled={loading} 
                        onClick={() => removeItem(key)}
                        title="Remove from cart"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="cart_summary_section">
                <div className="summary_card">
                  <h2>Order Summary</h2>
                  
                  <div className="summary_row">
                    <span>Subtotal ({cart.items.length} items)</span>
                    <span className="summary_value">
                      {isLive && (
                        <span style={{
                          textDecoration: 'line-through',
                          color: '#999',
                          marginRight: '0.5rem',
                          fontSize: '0.9rem'
                        }}>
                          ${originalSubtotal.toFixed(2)}
                        </span>
                      )}
                      ${subtotal.toFixed(2)}
                      {isLive && (
                        <span style={{
                          background: 'linear-gradient(135deg, #ff0844 0%, #ff4d6d 100%)',
                          color: 'white',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          marginLeft: '0.5rem',
                          letterSpacing: '0.3px'
                        }}>
                          20% OFF
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <div className="summary_divider"></div>
                  
                  <div className="summary_row total_row">
                    <span>Total</span>
                    <span className="summary_total">${subtotal.toFixed(2)}</span>
                  </div>

                  <a className="checkout_button" href="/checkout">
                    Proceed to Checkout
                  </a>
                  
                  <button className="clear_cart_btn" onClick={() => clearCart()}>
                    Clear Cart
                  </button>

                  <div className="continue_shopping">
                    <a href="/">← Continue Shopping</a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {toast && (
            <div className={`modern_cart_toast ${toast.type==='success'?'toast_success':'toast_error'}`}>
              <span className="toast_icon">{toast.type==='success' ? '✓' : '⚠'}</span>
              {toast.message}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function CartPage(){
  return (
    <Layout>
      {(user) => <CartInner user={user} />}
    </Layout>
  )
}
