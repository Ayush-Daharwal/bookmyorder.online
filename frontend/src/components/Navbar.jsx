import React, { useState } from 'react';
import { Utensils, MapPin, User, LogOut, Store, ShieldCheck, Sparkles } from 'lucide-react';

export default function Navbar({ user, onOpenAuth, onLogout, currentTab, setCurrentTab }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-sand-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img 
            src="/logo.png" 
            alt="bookmyorder - Skip The Queue" 
            className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-sand-100 p-1.5 rounded-full border border-sand-200">
          <button
            onClick={() => setCurrentTab('home')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              currentTab === 'home' 
                ? 'bg-forest-800 text-white shadow' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Find Restaurants
          </button>
          
          <button
            onClick={() => setCurrentTab('provider')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'provider' 
                ? 'bg-forest-800 text-white shadow' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4 text-terracotta-500" />
            Partner POS & KDS
          </button>

          {user && (
            <button
              onClick={() => setCurrentTab('profile')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                currentTab === 'profile' 
                  ? 'bg-forest-800 text-white shadow' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Bookings
            </button>
          )}
        </nav>

        {/* User Account / Auth Action */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-sand-100 px-3.5 py-1.5 rounded-full border border-sand-200">
                <div className="w-7 h-7 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-terracotta-600 font-medium capitalize leading-none">{user.role}</p>
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
              className="gradient-orange-btn text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Sign In / Register
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
