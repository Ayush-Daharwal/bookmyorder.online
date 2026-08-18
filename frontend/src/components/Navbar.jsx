import React from 'react';
import { Store, User, LogOut } from 'lucide-react';

export default function Navbar({ user, onOpenAuth, onLogout, currentTab, setCurrentTab }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-sand-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo - Blends seamlessly into pure white background */}
        <div 
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img 
            src="/logo.png" 
            alt="bookmyorder - Skip The Queue" 
            className="h-12 sm:h-16 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-1.5 rounded-full border border-sand-200">
          <button
            onClick={() => setCurrentTab('home')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              currentTab === 'home' 
                ? 'bg-[#14382B] text-white shadow' 
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => {
              setCurrentTab('restaurants');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              currentTab === 'restaurants' 
                ? 'bg-[#14382B] text-white shadow' 
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Restaurants
          </button>
          
          <button
            onClick={() => setCurrentTab('provider')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'provider' 
                ? 'bg-[#14382B] text-white shadow' 
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4 text-[#FF5722]" />
            Partner POS & KDS
          </button>

          {user && (
            <button
              onClick={() => setCurrentTab('profile')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                currentTab === 'profile' 
                  ? 'bg-[#14382B] text-white shadow' 
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              My Bookings
            </button>
          )}
        </nav>

        {/* User Account / Sign In */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#FAF8F5] px-3.5 py-1.5 rounded-full border border-sand-200">
                <div className="w-8 h-8 rounded-full bg-[#14382B] text-white flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[#FF5722] font-medium capitalize leading-none">{user.role}</p>
                </div>
              </div>
              
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 text-slate-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-[#14382B] hover:bg-[#1B4D36] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow transition-all flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Login / Sign Up
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
