import { useState, useEffect } from 'react';
import { auth } from '../../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import Layout from "../../app/components/Layout";
import AddProduct from '../../app/adminComponents/AddProduct';
import ShowProducts from '../../app/adminComponents/ShowProducts';
import OrdersManagement from '../../app/adminComponents/OrdersManagement';
import TikTokScraper from '../../app/adminComponents/TikTokScraper';
import FortuneWheelAdmin from '../../app/adminComponents/FortuneWheelAdmin';
import ProfitsManagement from '../../app/adminComponents/ProfitsManagement';
import "./index.css";

const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [activeComponent, setActiveComponent] = useState(null);
  const [idToken, setIdToken] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async (user) => {
      try {
        const token = await user.getIdToken();
        setIdToken(token); // Save the token to state

        const res = await fetch('/api/admin', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setIsAdmin(true);
          // Refresh the token to include the admin claim
          const refreshedToken = await auth.currentUser.getIdToken(true);  // Use auth here
          setIdToken(refreshedToken);  // Update state with refreshed token
        } else {
          setError(data.error || 'Access denied.');
        }
      } catch (err) {
        setError('Failed to verify admin status.');
        console.error('Error checking admin status:', err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkAdminStatus(user);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!isAdmin) return <p>You do not have access to this page.</p>;

  const renderComponent = () => {
    switch (activeComponent) {
      case 'addProduct':
        return <AddProduct onClose={() => setActiveComponent(null)} idToken={idToken} />;
      case 'showProducts':
        return <ShowProducts idToken={idToken} />;
      case 'orders':
        return <OrdersManagement idToken={idToken} />;
      case 'profits':
        return <ProfitsManagement idToken={idToken} />;
      case 'scraper':
        return <TikTokScraper />;
      case 'fortuneWheel':
        return <FortuneWheelAdmin />;
      default:
        return (
          <div className="welcome-screen">
            <div className="welcome-icon">👋</div>
            <h1>Welcome, Admin!</h1>
            <p>Select an option from the menu to manage your e-commerce platform</p>
            <div className="quick-stats">
              <div className="stat-box">
                <div className="stat-box-icon">📦</div>
                <div className="stat-box-label">Products</div>
                <div className="stat-box-value">—</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-icon">🛒</div>
                <div className="stat-box-label">Orders</div>
                <div className="stat-box-value">—</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-icon">👥</div>
                <div className="stat-box-label">Customers</div>
                <div className="stat-box-value">—</div>
              </div>
            </div>
          </div>
        );
    }
  };

  const handleMenuClick = (component) => {
    setActiveComponent(component);
    setMobileMenuOpen(false);
  };

  return (
    <Layout>
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        ☰
      </button>
      
      <div 
        className={`menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />
      
      <div className="body_container">
        <div className={`menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="menu-header">
            <h1>Admin Panel</h1>
            <p className="menu-subtitle">Egorly</p>
          </div>
          <div className="actions">
            <button 
              className={`action ${activeComponent === 'showProducts' ? 'active' : ''}`}
              onClick={() => handleMenuClick('showProducts')}
            >
              <span className="action-icon">📦</span>
              Products
            </button>
            <button 
              className={`action ${activeComponent === 'addProduct' ? 'active' : ''}`}
              onClick={() => handleMenuClick('addProduct')}
            >
              <span className="action-icon">➕</span>
              Add Product
            </button>
            <button 
              className={`action ${activeComponent === 'orders' ? 'active' : ''}`}
              onClick={() => handleMenuClick('orders')}
            >
              <span className="action-icon">🛒</span>
              Orders
            </button>
            <button 
              className={`action ${activeComponent === 'profits' ? 'active' : ''}`}
              onClick={() => handleMenuClick('profits')}
            >
              <span className="action-icon">💰</span>
              Profits
            </button>
            <button 
              className={`action ${activeComponent === 'customers' ? 'active' : ''}`}
              onClick={() => handleMenuClick('customers')}
            >
              <span className="action-icon">👥</span>
              Customers
            </button>
            <button 
              className={`action ${activeComponent === 'scraper' ? 'active' : ''}`}
              onClick={() => handleMenuClick('scraper')}
            >
              <span className="action-icon">📊</span>
              TikTok Scraper
            </button>
            <button 
              className={`action ${activeComponent === 'fortuneWheel' ? 'active' : ''}`}
              onClick={() => handleMenuClick('fortuneWheel')}
            >
              <span className="action-icon">🎡</span>
              Fortune Wheel
            </button>
          </div>
        </div>
        <div className="container">{renderComponent()}</div>
      </div>
    </Layout>
  );
};

export default AdminPanel;