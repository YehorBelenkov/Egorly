'use client';

import { useState, useEffect } from 'react';
import './page.css';

interface Winner {
  id: number;
  userId: number;
  username: string;
  prizeName: string;
  prizeType: string;
  prizeValue: string;
  wonAt: string;
  claimed?: boolean;
}

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    tiktokUsername: '',
    screenshotUrl: '',
    contactDescription: '',
    contactMethod: 'email',
    paymentMethod: 'paypal'
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setNotFound(false);
    setSelectedWinner(null);
    
    try {
      const response = await fetch('/api/winners');
      const data = await response.json();
      
      // Fetch claims
      const claimsResponse = await fetch('/api/claims');
      const claims = await claimsResponse.json();
      const claimedWinnerIds = new Set(claims.map((c: any) => c.winnerId));
      
      // Find winner by username (case-insensitive)
      const winner = data.find((w: Winner) => 
        w.username.toLowerCase() === searchTerm.toLowerCase().replace('@', '')
      );
      
      if (winner) {
        setSelectedWinner({
          ...winner,
          claimed: claimedWinnerIds.has(winner.id)
        });
        setNotFound(false);
      } else {
        setNotFound(true);
        setSelectedWinner(null);
      }
    } catch (error) {
      console.error('Error searching for winner:', error);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleClaimPrize = () => {
    setShowClaimForm(true);
    setSubmitSuccess(false);
  };

  const handleBackToSearch = () => {
    setSearched(false);
    setNotFound(false);
    setSelectedWinner(null);
    setSearchTerm('');
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWinner) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: selectedWinner.id,
          ...formData
        })
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({
          tiktokUsername: '',
          screenshotUrl: '',
          contactDescription: '',
          contactMethod: 'email',
          paymentMethod: 'paypal'
        });
        
        // Close form after 2 seconds
        setTimeout(() => {
          setShowClaimForm(false);
          setSelectedWinner(null);
          handleBackToSearch();
        }, 2000);
        
        // Close form after 2 seconds
        setTimeout(() => {
          setShowClaimForm(false);
          setSelectedWinner(null);
          handleBackToSearch();
        }, 2000);
      } else {
        alert('Error submitting claim. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Error submitting claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPrizeEmoji = (prizeType: string) => {
    switch (prizeType) {
      case 'money': return '💰';
      case 'product': return '🎁';
      case 'promo_code': return '🎫';
      default: return '🏆';
    }
  };

  return (
    <div className="winners-page">
      <div className="winners-container">
        {/* Header */}
        <div className="winners-header">
          <h1 className="winners-title">🏆 Claim Your Prize</h1>
          <p className="winners-subtitle">Enter your TikTok username to check if you're a winner</p>
        </div>

        {/* Search Card */}
        {!searched && (
          <div className="search-card">
            <form onSubmit={handleSearch}>
              <label className="search-label">
                Your TikTok Username
              </label>
              <div className="search-input-wrapper">
                <span className="search-icon">@</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="yourusername"
                  className="search-input"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchTerm.trim()}
                className="search-button"
              >
                {loading ? 'Searching...' : 'Check Prize Status'}
              </button>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p className="loading-text">Checking records...</p>
          </div>
        )}

        {/* Winner Found */}
        {searched && selectedWinner && !loading && (
          <div className="winner-result">
            <div className="winner-badge">
              <span>🎉</span>
              <span>Congratulations!</span>
            </div>

            <h2 className="winner-username">@{selectedWinner.username}</h2>

            <div className="prize-display">
              <div className="prize-icon">{getPrizeEmoji(selectedWinner.prizeType)}</div>
              <p className="prize-name">{selectedWinner.prizeName}</p>
              {selectedWinner.prizeType === 'money' && (
                <p className="prize-value">${selectedWinner.prizeValue}</p>
              )}
              {selectedWinner.prizeType === 'promo_code' && (
                <p className="prize-description">Code: {selectedWinner.prizeValue}</p>
              )}
              {selectedWinner.prizeType === 'product' && (
                <p className="prize-description">{selectedWinner.prizeValue}</p>
              )}
            </div>

            <p className="won-date">
              Won on {new Date(selectedWinner.wonAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>

            {selectedWinner.claimed ? (
              <div className="claim-status">
                <span className="claimed-badge">
                  <span>✓</span>
                  <span>Already Claimed</span>
                </span>
              </div>
            ) : (
              <button
                onClick={handleClaimPrize}
                className="claim-button"
              >
                Claim This Prize
              </button>
            )}

            <div className="back-button" onClick={handleBackToSearch}>
              ← Search Again
            </div>
          </div>
        )}

        {/* Not Found */}
        {searched && notFound && !loading && (
          <div className="not-found">
            <div className="not-found-icon">😕</div>
            <h3 className="not-found-title">No Prize Found</h3>
            <p className="not-found-text">
              We couldn't find any prizes for @{searchTerm}. Make sure you're using the correct TikTok username.
            </p>
            <div className="back-button" onClick={handleBackToSearch}>
              ← Try Again
            </div>
          </div>
        )}
      </div>

      {/* Claim Form Modal */}
      {showClaimForm && selectedWinner && (
        <div className="modal-overlay">
          <div className="modal-content">
            {submitSuccess ? (
              <div className="success-message">
                <div className="success-icon">🎉</div>
                <h2 className="success-title">Claim Submitted!</h2>
                <p className="success-text">We'll contact you soon about your prize.</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <div>
                    <h2 className="modal-title">Claim Your Prize</h2>
                    <p className="modal-prize-info">{selectedWinner.prizeName}</p>
                  </div>
                  <button
                    onClick={() => setShowClaimForm(false)}
                    className="modal-close"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmitClaim}>
                  {/* TikTok Username */}
                  <div className="form-group">
                    <label className="form-label">TikTok Username *</label>
                    <input
                      type="text"
                      required
                      value={formData.tiktokUsername}
                      onChange={(e) => setFormData({ ...formData, tiktokUsername: e.target.value })}
                      placeholder="@yourusername"
                      className="form-input"
                    />
                  </div>

                  {/* Screenshot URL */}
                  <div className="form-group">
                    <label className="form-label">Screenshot URL (Proof of Account) *</label>
                    <input
                      type="url"
                      required
                      value={formData.screenshotUrl}
                      onChange={(e) => setFormData({ ...formData, screenshotUrl: e.target.value })}
                      placeholder="https://imgur.com/your-screenshot.png"
                      className="form-input"
                    />
                    <p className="form-hint">Upload to imgur.com or similar and paste the link</p>
                  </div>

                  {/* Contact Method */}
                  <div className="form-group">
                    <label className="form-label">Best Way to Contact You *</label>
                    <select
                      required
                      value={formData.contactMethod}
                      onChange={(e) => setFormData({ ...formData, contactMethod: e.target.value })}
                      className="form-select"
                    >
                      <option value="email">Email</option>
                      <option value="telegram">Telegram</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok DM</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>

                  {/* Contact Description */}
                  <div className="form-group">
                    <label className="form-label">Contact Details *</label>
                    <textarea
                      required
                      value={formData.contactDescription}
                      onChange={(e) => setFormData({ ...formData, contactDescription: e.target.value })}
                      placeholder="Provide your email, phone number, or social media handle..."
                      rows={3}
                      className="form-textarea"
                    />
                  </div>

                  {/* Payment Method (for money prizes) */}
                  {selectedWinner.prizeType === 'money' && (
                    <div className="form-group">
                      <label className="form-label">Payment Method *</label>
                      <select
                        required
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="form-select"
                      >
                        <option value="paypal">PayPal</option>
                        <option value="venmo">Venmo</option>
                        <option value="cashapp">Cash App</option>
                        <option value="zelle">Zelle</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="crypto">Cryptocurrency</option>
                      </select>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="form-submit"
                  >
                    {submitting ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
