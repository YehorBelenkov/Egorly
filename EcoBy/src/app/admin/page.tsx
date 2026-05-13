'use client';

import { useState, useEffect } from 'react';
import { TikTokUser, Prize, Winner } from '@/types';
import './page.css';

export default function AdminPage() {
  const [users, setUsers] = useState<TikTokUser[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'prizes' | 'winners'>('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, prizesRes, winnersRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/prizes'),
        fetch('/api/winners')
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (prizesRes.ok) setPrizes(await prizesRes.json());
      if (winnersRes.ok) setWinners(await winnersRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePrizeActive = async (prize: Prize) => {
    try {
      const response = await fetch('/api/prizes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prize.id, isActive: !prize.isActive })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating prize:', error);
    }
  };

  const deletePrize = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prize?')) return;

    try {
      const response = await fetch(`/api/prizes?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting prize:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <div className="text-white text-2xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navbar */}
      <nav className="admin-navbar">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🎰</div>
            <div>
              <h1 className="text-2xl font-bold text-white">TikTok Fortune</h1>
              <p className="text-sm text-purple-300">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="/wheel" className="nav-button nav-button-primary">
              🎡 Fortune Wheel
            </a>
            <a href="/scraper" className="nav-button nav-button-secondary">
              🎯 Scraper
            </a>
            <a href="/" className="nav-button nav-button-outline">
              🏠 Home
            </a>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="admin-content">
        <div className="admin-main-container">
          
          {/* Stats Overview */}
          <div className="stats-grid">
            <div className="stat-card stat-card-purple">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <p className="stat-label">Total Users</p>
                <p className="stat-value">{users.length}</p>
              </div>
            </div>
            <div className="stat-card stat-card-green">
              <div className="stat-icon">🎁</div>
              <div className="stat-content">
                <p className="stat-label">Active Prizes</p>
                <p className="stat-value">{prizes.filter(p => p.isActive).length}</p>
              </div>
            </div>
            <div className="stat-card stat-card-pink">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <p className="stat-label">Total Winners</p>
                <p className="stat-value">{winners.length}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="admin-tabs">
            <button
              onClick={() => setActiveTab('users')}
              className={`admin-tab ${activeTab === 'users' ? 'admin-tab-active' : ''}`}
            >
              <span className="tab-icon">👥</span>
              Users
              <span className="tab-count">({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('prizes')}
              className={`admin-tab ${activeTab === 'prizes' ? 'admin-tab-active' : ''}`}
            >
              <span className="tab-icon">🎁</span>
              Prizes
              <span className="tab-count">({prizes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('winners')}
              className={`admin-tab ${activeTab === 'winners' ? 'admin-tab-active' : ''}`}
            >
              <span className="tab-icon">🏆</span>
              Winners
              <span className="tab-count">({winners.length})</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="content-card">
            
            {/* Users Tab */}
            {activeTab === 'users' && (
              <>
                <div className="content-header">
                  <h2 className="content-title">
                    <span className="title-icon">👥</span>
                    TikTok Users
                  </h2>
                  <p className="content-subtitle">Most active viewers from your live streams</p>
                </div>

                {users.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4 animate-bounce-slow">📭</div>
                <p className="text-gray-400 text-lg mb-4 font-semibold">No users tracked yet</p>
                <p className="text-gray-500 mb-4">Connect to a live stream to start tracking engagement:</p>
                <a
                  href="/scraper"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-lg font-semibold"
                >
                  Go to Scraper →
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-gray-800/70 backdrop-blur-sm sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-purple-400 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">🎁 Gifts</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-green-400 uppercase tracking-wider">✅ Follows</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-blue-400 uppercase tracking-wider">💬 Comments</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-red-400 uppercase tracking-wider">❤️ Likes</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {users.map((user, index) => (
                      <tr key={user.id} className={`hover:bg-purple-600/10 transition-all ${
                        index < 3 ? 'bg-purple-900/20' : ''
                      }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-bold text-xl ${
                            index === 0 ? 'text-yellow-400 drop-shadow-glow-yellow' :
                            index === 1 ? 'text-gray-300 drop-shadow-glow-gray' :
                            index === 2 ? 'text-orange-400 drop-shadow-glow-orange' :
                            'text-gray-500'
                          }`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`font-semibold ${index < 3 ? 'text-white text-lg' : 'text-gray-300'}`}>
                            {user.username}
                          </div>
                          {user.nickname && (
                            <div className="text-sm text-gray-500">{user.nickname}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center justify-center min-w-[4rem] px-4 py-2 rounded-full font-bold text-lg ${
                            index === 0 ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50' :
                            index < 3 ? 'bg-purple-600 text-white shadow-lg' :
                            'bg-purple-600/50 text-white'
                          }`}>
                            {user.engagementScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg font-bold border border-yellow-500/30">
                            {user.giftCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg font-bold border border-green-500/30">
                            {user.followCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg font-bold border border-blue-500/30">
                            {user.commentCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg font-bold border border-red-500/30">
                            {user.likeCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(user.lastSeen).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
              </>
            )}

            {/* Prizes Tab */}
            {activeTab === 'prizes' && (
              <>
                <div className="content-header">
                  <h2 className="content-title">
                    <span className="title-icon">🎁</span>
                    Prize Pool
                  </h2>
                  <p className="content-subtitle">Manage available prizes for the fortune wheel</p>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Prize</th>
                        <th className="text-center">Type</th>
                        <th className="text-center">Value</th>
                        <th className="text-center">Probability</th>
                        <th className="text-center">Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                  {prizes.map((prize) => (
                    <tr key={prize.id} className="hover:bg-green-600/10 transition-all">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white text-lg">{prize.name}</div>
                        {prize.description && (
                          <div className="text-sm text-gray-400 mt-1">{prize.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-4 py-2 inline-flex text-sm font-bold rounded-lg ${
                          prize.type === 'money' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          prize.type === 'product' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {prize.type === 'money' ? '💵 Money' : prize.type === 'product' ? '📦 Product' : '🎟️ Promo Code'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-white font-mono font-bold text-lg bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
                          {prize.value}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <div className="relative w-16 h-16">
                            <svg className="transform -rotate-90 w-16 h-16">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-gray-700"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={`${(prize.probability / 100) * 175.9} 175.9`}
                                className="text-green-400"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{prize.probability}%</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => togglePrizeActive(prize)}
                          className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg ${
                            prize.isActive
                              ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50 hover:bg-green-500/30'
                              : 'bg-gray-700/50 text-gray-400 border-2 border-gray-600 hover:bg-gray-700'
                          }`}
                        >
                          {prize.isActive ? '✓ Active' : '✗ Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => deletePrize(prize.id)}
                          className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 font-semibold transition-all"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              </>
            )}

            {/* Winners Tab */}
            {activeTab === 'winners' && (
              <>
                <div className="content-header">
                  <h2 className="content-title">
                    <span className="title-icon">🏆</span>
                    Winners History
                  </h2>
                  <p className="content-subtitle">All past giveaway winners</p>
                </div>

                {winners.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4 animate-bounce-slow">🎰</div>
                <p className="text-gray-400 text-lg mb-4 font-semibold">No winners yet</p>
                <p className="text-gray-500 mb-4">Spin the wheel to select your first winner!</p>
                <a
                  href="/wheel"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg font-semibold"
                >
                  Go to Wheel →
                </a>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>🏆 Winner</th>
                      <th>🎁 Prize</th>
                      <th className="text-center">Type</th>
                      <th className="text-center">Value</th>
                      <th>Won At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winners.map((winner, index) => (
                      <tr key={winner.id} className="hover:bg-pink-600/10 transition-all">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">
                              {index < 3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : '🎖️'}
                            </span>
                            <span className="font-semibold text-white text-lg">{winner.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-white text-lg">{winner.prizeName}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-4 py-2 inline-flex text-sm font-bold rounded-lg ${
                            winner.prizeType === 'money' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            winner.prizeType === 'product' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}>
                            {winner.prizeType === 'money' ? '💵 Money' : winner.prizeType === 'product' ? '📦 Product' : '🎟️ Promo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-white font-mono font-bold text-lg bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
                            {winner.prizeValue}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <div className="flex items-center">
                            <span className="mr-2">📅</span>
                            {new Date(winner.wonAt).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.5);
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(147, 51, 234, 0.6), rgba(219, 39, 119, 0.6));
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(147, 51, 234, 0.8), rgba(219, 39, 119, 0.8));
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
        .drop-shadow-glow-yellow {
          filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.5));
        }
        .drop-shadow-glow-gray {
          filter: drop-shadow(0 0 8px rgba(209, 213, 219, 0.5));
        }
        .drop-shadow-glow-orange {
          filter: drop-shadow(0 0 8px rgba(251, 146, 60, 0.5));
        }
      `}</style>
    </div>
  );
}
