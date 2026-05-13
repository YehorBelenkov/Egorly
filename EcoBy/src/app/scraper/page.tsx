'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import './page.css';

interface Event {
  id: string;
  type: 'gift' | 'follow' | 'like' | 'comment' | 'share' | 'connect' | 'disconnect' | 'error';
  username?: string;
  message: string;
  timestamp: Date;
  details?: any;
}

interface User {
  username: string;
  engagementScore: number;
  giftCount: number;
  followCount: number;
  commentCount: number;
  likeCount: number;
}

export default function ScraperTestPage() {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentStreamer, setCurrentStreamer] = useState('');
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Poll for updated user data every 2 seconds
  useEffect(() => {
    // Always fetch users on mount
    fetchTopUsers();
    
    // Set up polling interval (every 2 seconds)
    const pollInterval = setInterval(fetchTopUsers, 2000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, []); // Run once on mount and keep polling

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const res = await fetch('/api/scraper/connect');
      const data = await res.json();
      if (data.isConnected) {
        setIsConnected(true);
        setCurrentStreamer(data.username);
      }
    } catch (err) {
      console.error('Failed to check status:', err);
    }
  };

  const fetchTopUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setTopUsers(data.slice(0, 50)); // Show top 50 users
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleConnect = async () => {
    if (!username.trim()) {
      setError('Please enter a TikTok username');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      const res = await fetch('/api/scraper/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsConnected(true);
        setCurrentStreamer(username.trim());
        setUsername('');
        setError('');
        setConnectionAttempts(0);
        
        // Check connection status after 3 seconds
        setTimeout(async () => {
          const statusRes = await fetch('/api/scraper/connect');
          const statusData = await statusRes.json();
          if (!statusData.isConnected) {
            setError('Connection established but websocket failed. Try another streamer or check if they are live.');
            setIsConnected(false);
          }
        }, 3000);
        
        fetchTopUsers();
      } else {
        setError(data.error || 'Failed to connect');
        setConnectionAttempts(prev => prev + 1);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Connection failed';
      setError(errorMsg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/scraper/disconnect', { method: 'POST' });
      setIsConnected(false);
      setCurrentStreamer('');
    } catch (err: any) {
      setError('Failed to disconnect');
    }
  };

  return (
    <div className="scraper-container min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="scraper-title text-5xl md:text-6xl font-extrabold text-white mb-3 flex items-center tracking-tight">
              <span className="text-6xl mr-4">🎯</span>
              TikTok Live Scraper
            </h1>
            <p className="scraper-subtitle text-xl text-gray-200 font-medium">
              Connect to any live TikTok stream and watch real-time engagement data
            </p>
          </div>
          <Link
            href="/admin"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-lg font-semibold"
          >
            Back to Admin
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="scraper-stat-card md:col-span-2 p-6 bg-gradient-to-br from-gray-800/70 to-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`}></div>
                <div>
                  <div className="text-sm text-gray-300 uppercase tracking-wide font-semibold">Status</div>
                  <div className="text-white font-bold text-2xl">
                    {isConnected ? `@${currentStreamer}` : 'Not Connected'}
                  </div>
                </div>
              </div>
              {isConnected && (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-lg hover:shadow-red-500/50 font-semibold"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-sm rounded-xl border border-purple-500/50 shadow-xl">
            <div className="text-center">
              <p className="text-gray-200 text-sm uppercase tracking-wide mb-2 font-semibold">Total Users</p>
              <p className="text-6xl font-extrabold text-white mb-1">{topUsers.length}</p>
              {topUsers.length > 0 && (
                <p className="text-xs text-green-400 flex items-center justify-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  Capturing data
                </p>
              )}
              {isConnected && topUsers.length === 0 && (
                <p className="text-xs text-yellow-400 animate-pulse">Waiting for events...</p>
              )}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-600/30 to-cyan-600/30 backdrop-blur-sm rounded-xl border border-blue-500/50 shadow-xl">
            <div className="text-center">
              <p className="text-gray-300 text-xs uppercase tracking-wide mb-1">Top Scorer</p>
              {topUsers.length > 0 ? (
                <>
                  <p className="text-2xl font-bold text-white mb-1 truncate">{topUsers[0]?.username || '-'}</p>
                  <p className="text-xs text-blue-400">
                    <span className="font-bold text-lg">{topUsers[0]?.engagementScore || 0}</span> points
                  </p>
                </>
              ) : (
                <p className="text-3xl text-gray-500 py-2">-</p>
              )}
            </div>
          </div>
        </div>

        {/* Connection Form */}
        {!isConnected && (
          <div className="mb-6 p-6 bg-gradient-to-br from-gray-800/70 to-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <span className="text-3xl mr-2">🔗</span>
              Connect to Live Stream
            </h2>
            <p className="text-gray-400 mb-4 text-sm">
              ⚡ Enter the username of a TikTok streamer who is currently LIVE (must be actively streaming)
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                placeholder="Enter TikTok username (without @)"
                className="flex-1 px-4 py-3 bg-gray-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700 placeholder-gray-500"
                disabled={isConnecting}
              />
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isConnecting ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">⏳</span>
                    Connecting...
                  </span>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
            {error && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start">
                <span className="text-xl mr-2">⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* User Tracker Table */}
        <div className="bg-gradient-to-br from-gray-800/70 to-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white flex items-center">
              <span className="mr-2 text-3xl">🏆</span>
              Live User Tracker
            </h2>
            <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/30">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">Auto-updating every 2s</span>
            </div>
          </div>
          
          <div className="h-[700px] overflow-auto custom-scrollbar">
            {topUsers.length === 0 ? (
              <div className="text-center text-gray-500 py-20 bg-gray-900/30 rounded-lg border border-dashed border-gray-700">
                <p className="text-6xl mb-4 animate-bounce-slow">📊</p>
                <p className="text-xl font-semibold text-gray-400">No users tracked yet</p>
                <p className="text-sm mt-2 text-gray-500">Connect to a live stream to start tracking engagement</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 shadow-lg">
                  <tr className="border-b-2 border-gray-600">
                    <th className="px-4 py-4 text-left text-base font-extrabold text-gray-200 uppercase tracking-wider">#</th>
                    <th className="px-4 py-4 text-left text-base font-extrabold text-gray-200 uppercase tracking-wider">Username</th>
                    <th className="px-4 py-4 text-center text-base font-extrabold text-yellow-300 uppercase tracking-wider">🎁 Gifts</th>
                    <th className="px-4 py-4 text-center text-base font-extrabold text-green-300 uppercase tracking-wider">✅ Follows</th>
                    <th className="px-4 py-4 text-center text-base font-extrabold text-blue-300 uppercase tracking-wider">💬 Comments</th>
                    <th className="px-4 py-4 text-center text-base font-extrabold text-red-300 uppercase tracking-wider">❤️ Likes</th>
                    <th className="px-4 py-4 text-center text-base font-extrabold text-purple-300 uppercase tracking-wider">⭐ Score</th>
                  </tr>
                </thead>
                  <tbody>
                    {topUsers.map((user, index) => (
                      <tr
                        key={user.username}
                        className={`border-b border-gray-700/50 hover:bg-purple-600/10 transition-all duration-200 ${
                          index < 3 ? 'bg-gradient-to-r from-purple-900/20 to-transparent' : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          <span className={`font-bold text-xl ${
                            index === 0 ? 'text-yellow-400 drop-shadow-glow-yellow' :
                            index === 1 ? 'text-gray-300 drop-shadow-glow-gray' :
                            index === 2 ? 'text-orange-400 drop-shadow-glow-orange' :
                            'text-gray-500'
                          }`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`font-semibold ${
                            index < 3 ? 'text-white text-lg' : 'text-gray-300'
                          }`}>
                            {user.username}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg font-bold border border-yellow-500/30">
                            {user.giftCount}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg font-bold border border-green-500/30">
                            {user.followCount}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg font-bold border border-blue-500/30">
                            {user.commentCount}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg font-bold border border-red-500/30">
                            {user.likeCount}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center justify-center min-w-[4rem] px-4 py-2 rounded-full font-bold text-lg shadow-lg ${
                            index === 0 ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/50' :
                            index < 3 ? 'bg-purple-600 text-white shadow-purple-500/30' :
                            'bg-purple-600/50 text-white'
                          }`}>
                            {user.engagementScore}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        {/* Tips */}
        <div className="mt-6 p-6 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-sm rounded-xl border border-blue-700/50 shadow-xl">
          <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🔍</span>
              <div>
                <div className="text-blue-200 font-semibold">Find Live Streams</div>
                <div className="text-blue-300/70 text-sm">Search TikTok for users who are currently LIVE</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="text-blue-200 font-semibold">Real-time Only</div>
                <div className="text-blue-300/70 text-sm">Tracks events AFTER connection (no historical data)</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="text-blue-200 font-semibold">Scoring System</div>
                <div className="text-blue-300/70 text-sm">Gifts (100pts) • Follows (50pts) • Comments (10pts) • Likes (1pt)</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🔄</span>
              <div>
                <div className="text-blue-200 font-semibold">Auto-Update</div>
                <div className="text-blue-300/70 text-sm">Table refreshes every 2 seconds with latest data</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
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
