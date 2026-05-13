'use client';

import Link from "next/link";
import './page.css';

export default function Home() {
  return (
    <div className="home-container relative flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="relative z-10 max-w-6xl">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="text-8xl">🎰</div>
        </div>

        <h1 className="home-title text-6xl md:text-7xl font-extrabold text-white mb-6 text-center tracking-tight">
          TikTok Fortune Wheel
        </h1>
        <p className="home-subtitle text-2xl text-gray-300 mb-16 text-center max-w-3xl mx-auto leading-relaxed">
          Track your most active TikTok viewers and reward them with exciting prizes
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto mb-12">
          <Link
            href="/wheel"
            className="home-card group relative bg-gradient-to-br from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white font-bold py-16 px-10 rounded-3xl shadow-2xl text-center"
          >
            <div className="relative">
              <div className="text-7xl mb-4">🎡</div>
              <h2 className="text-4xl mb-3 font-extrabold">Fortune Wheel</h2>
              <p className="text-lg text-pink-100">Select a random winner from your viewers</p>
            </div>
          </Link>
          
          <Link
            href="/admin"
            className="home-card group relative bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-16 px-10 rounded-3xl shadow-2xl text-center"
          >
            <div className="relative">
              <div className="text-7xl mb-4">⚙️</div>
              <h2 className="text-4xl mb-3 font-extrabold">Admin Panel</h2>
              <p className="text-lg text-blue-100">Manage users, prizes, and settings</p>
            </div>
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="home-feature-card p-6 bg-white/10 rounded-2xl border border-white/20 text-center">
            <div className="text-5xl mb-3">📊</div>
            <div className="text-white font-bold text-xl mb-2">Real-time Tracking</div>
            <div className="text-gray-300 text-base">Monitor live engagement data from TikTok streams</div>
          </div>
          <div className="home-feature-card p-6 bg-white/10 rounded-2xl border border-white/20 text-center">
            <div className="text-5xl mb-3">🎁</div>
            <div className="text-white font-bold text-xl mb-2">Custom Prizes</div>
            <div className="text-gray-300 text-base">Create and manage unique rewards for winners</div>
          </div>
          <div className="home-feature-card p-6 bg-white/10 rounded-2xl border border-white/20 text-center">
            <div className="text-5xl mb-3">✨</div>
            <div className="text-white font-bold text-xl mb-2">Fair Selection</div>
            <div className="text-gray-300 text-base">Engagement-based algorithm for winner selection</div>
          </div>
        </div>
      </div>
    </div>
  );
}
