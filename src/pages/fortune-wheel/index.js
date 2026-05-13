import { useState, useEffect } from 'react';
import { auth } from '../../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import Layout from "../../app/components/Layout";

const FortuneWheelAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async (user) => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setIsAdmin(true);
        } else {
          setError('Access denied. Admin privileges required.');
          setTimeout(() => router.push('/'), 2000);
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
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <Layout>
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Verifying access...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="admin-error">
          <h2>⚠️ {error}</h2>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="admin-error">
          <h2>🚫 Access Denied</h2>
          <p>You do not have permission to access this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="fortune-wheel-admin-container">
        <div className="admin-header">
          <h1>🎡 Fortune Wheel</h1>
          <p className="admin-subtitle">Manage prizes and spin the wheel for your TikTok followers</p>
        </div>

        <div className="iframe-container">
          <iframe 
            src="http://localhost:3001/wheel" 
            title="Fortune Wheel"
            className="admin-iframe"
          />
        </div>

        <div className="admin-instructions">
          <h3>📋 How to Use</h3>
          <ol>
            <li>Make sure the TikTok scraper is running and connected</li>
            <li>Add prizes using the interface above</li>
            <li>Click "Select Random User" to pick a participant from your live stream</li>
            <li>Click "Spin Wheel" to determine which prize they win</li>
            <li>Winners are automatically saved to the database</li>
          </ol>
        </div>

        <div className="admin-note">
          <strong>Note:</strong> The Fortune Wheel is served from the EcoBy application running on port 3001.
          Make sure it's running with <code>npm run dev</code> in the EcoBy folder.
        </div>
      </div>
    </Layout>
  );
};

export default FortuneWheelAdmin;
