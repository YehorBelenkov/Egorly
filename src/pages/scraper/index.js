import { useState, useEffect } from 'react';
import { auth } from '../../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import Layout from "../../app/components/Layout";

const ScraperAdmin = () => {
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
      <div className="scraper-admin-container">
        <div className="admin-header">
          <h1>📊 TikTok Live Scraper</h1>
          <p className="admin-subtitle">Monitor and track your TikTok live stream engagement in real-time</p>
        </div>

        <div className="iframe-container">
          <iframe 
            src="http://localhost:3001/scraper" 
            title="TikTok Scraper"
            className="admin-iframe"
          />
        </div>

        <div className="admin-instructions">
          <h3>📋 How to Use</h3>
          <ol>
            <li>Enter your TikTok username in the field above</li>
            <li>Click "Connect to Live Stream" to start monitoring</li>
            <li>The scraper will track:
              <ul>
                <li>💝 Gifts sent by viewers</li>
                <li>❤️ Likes and reactions</li>
                <li>👥 New followers</li>
                <li>💬 Comments and chat messages</li>
              </ul>
            </li>
            <li>Top engaged users will be available for the Fortune Wheel</li>
            <li>Click "Disconnect" when your stream ends</li>
          </ol>
        </div>

        <div className="admin-note">
          <strong>Note:</strong> The TikTok Scraper is served from the EcoBy application running on port 3001.
          Make sure it's running with <code>npm run dev</code> in the EcoBy folder.
        </div>
      </div>
    </Layout>
  );
};

export default ScraperAdmin;
