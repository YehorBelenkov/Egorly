import { useState } from 'react';
import Layout from "../../app/components/Layout";
import "./winners.css";

const Winners = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    tiktokUsername: '',
    screenshotUrl: '',
    contactDescription: '',
    contactMethod: 'email',
    paymentMethod: 'paypal'
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setNotFound(false);
    setSelectedWinner(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/winners');
      const data = await response.json();
      
      if (!data || data.length === 0) {
        setNotFound(true);
        setWinners([]);
      } else {
        const filtered = data.filter(winner => 
          winner.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (filtered.length === 0) {
          setNotFound(true);
          setWinners([]);
        } else {
          setWinners(filtered);
          setNotFound(false);
        }
      }
      
      setSearched(true);
    } catch (error) {
      console.error('Error fetching winners:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimClick = (winner) => {
    setSelectedWinner(winner);
    setFormData(prev => ({
      ...prev,
      tiktokUsername: winner.username
    }));
    setShowClaimForm(true);
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:3001/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winnerId: selectedWinner.id,
          ...formData
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setShowClaimForm(false);
          setSubmitSuccess(false);
          setSelectedWinner(null);
          setFormData({
            tiktokUsername: '',
            screenshotUrl: '',
            contactDescription: '',
            contactMethod: 'email',
            paymentMethod: 'paypal'
          });
        }, 2000);
      } else {
        alert('Failed to submit claim. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Error submitting claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="winners-page">
        <div className="winners-header">
          <div className="winners-header-content">
            <h1 className="winners-title">🏆 Prize Winners</h1>
            <p className="winners-subtitle">
              Check if you won a prize from our TikTok live streams!
            </p>
          </div>
        </div>

        <div className="winners-search-section">
          <form onSubmit={handleSearch} className="winners-search-form">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Enter your TikTok username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button 
                type="submit" 
                className="search-button"
                disabled={loading || !searchTerm.trim()}
              >
                {loading ? '🔍 Searching...' : '🔍 Search'}
              </button>
            </div>
          </form>
        </div>

        {searched && notFound && (
          <div className="no-results">
            <div className="no-results-icon">😢</div>
            <h2>No Winners Found</h2>
            <p>We couldn't find any winners with the username "{searchTerm}"</p>
            <p className="no-results-hint">
              Make sure you entered your exact TikTok username and check back during or after our live streams!
            </p>
          </div>
        )}

        {loading && (
          <div className="winners-loading">
            <div className="spinner"></div>
            <p>Searching for winners...</p>
          </div>
        )}

        {winners.length > 0 && (
          <div className="winners-list">
            <h2 className="winners-list-title">🎉 Congratulations! You Won!</h2>
            <div className="winners-grid">
              {winners.map((winner) => (
                <div key={winner.id} className="winner-card">
                  <div className="winner-card-header">
                    <div className="winner-trophy">🏆</div>
                    <h3 className="winner-username">@{winner.username}</h3>
                  </div>
                  
                  <div className="winner-prize-info">
                    <div className="prize-badge">{winner.prizeType}</div>
                    <h4 className="prize-name">{winner.prizeName}</h4>
                    <p className="prize-value">{winner.prizeValue}</p>
                  </div>

                  <div className="winner-meta">
                    <p className="won-date">Won on {formatDate(winner.wonAt)}</p>
                    {winner.claimed ? (
                      <div className="claimed-badge">✓ Claimed</div>
                    ) : (
                      <button 
                        className="claim-button"
                        onClick={() => handleClaimClick(winner)}
                      >
                        🎁 Claim Prize
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showClaimForm && (
          <div className="claim-modal-overlay" onClick={() => setShowClaimForm(false)}>
            <div className="claim-modal" onClick={(e) => e.stopPropagation()}>
              <button 
                className="modal-close"
                onClick={() => setShowClaimForm(false)}
              >
                ×
              </button>

              <h2 className="modal-title">🎁 Claim Your Prize</h2>
              <p className="modal-subtitle">
                Prize: <strong>{selectedWinner?.prizeName}</strong>
              </p>

              {submitSuccess ? (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <h3>Claim Submitted Successfully!</h3>
                  <p>We'll contact you soon to deliver your prize.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitClaim} className="claim-form">
                  <div className="form-group">
                    <label htmlFor="tiktokUsername">TikTok Username</label>
                    <input
                      type="text"
                      id="tiktokUsername"
                      value={formData.tiktokUsername}
                      onChange={(e) => setFormData({...formData, tiktokUsername: e.target.value})}
                      required
                      readOnly
                      className="form-input readonly"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="screenshotUrl">Screenshot URL (optional)</label>
                    <input
                      type="url"
                      id="screenshotUrl"
                      placeholder="Link to screenshot showing you won"
                      value={formData.screenshotUrl}
                      onChange={(e) => setFormData({...formData, screenshotUrl: e.target.value})}
                      className="form-input"
                    />
                    <small className="form-hint">Upload your screenshot to imgur.com and paste the link</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactMethod">Preferred Contact Method</label>
                    <select
                      id="contactMethod"
                      value={formData.contactMethod}
                      onChange={(e) => setFormData({...formData, contactMethod: e.target.value})}
                      required
                      className="form-select"
                    >
                      <option value="email">Email</option>
                      <option value="telegram">Telegram</option>
                      <option value="tiktok">TikTok DM</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactDescription">Contact Information</label>
                    <textarea
                      id="contactDescription"
                      placeholder="Provide your email, Telegram username, or other contact details..."
                      value={formData.contactDescription}
                      onChange={(e) => setFormData({...formData, contactDescription: e.target.value})}
                      required
                      rows={3}
                      className="form-textarea"
                    />
                  </div>

                  {selectedWinner?.prizeType === 'Money' && (
                    <div className="form-group">
                      <label htmlFor="paymentMethod">Payment Method</label>
                      <select
                        id="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        required
                        className="form-select"
                      >
                        <option value="paypal">PayPal</option>
                        <option value="venmo">Venmo</option>
                        <option value="cashapp">Cash App</option>
                        <option value="zelle">Zelle</option>
                      </select>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="submit-button"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : '✓ Submit Claim'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Winners;
