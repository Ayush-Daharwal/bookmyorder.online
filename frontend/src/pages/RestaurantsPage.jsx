import React, { useState, useEffect } from 'react';
import { getRestaurantsApi } from '../services/api';
import CustomCitySelect from '../components/CustomCitySelect';
import { MapPin, Navigation, Search, Utensils, Star, Heart, SlidersHorizontal, Sparkles, Building2, Coffee, GraduationCap, ChevronDown } from 'lucide-react';

export default function RestaurantsPage({ onOpenDetail, initialCity = 'Bhopal' }) {
  const [selectedCity, setSelectedCity] = useState(initialCity || 'Bhopal');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [sortBy, setSortBy] = useState('nearest_rating'); // 'nearest_rating', 'rating', 'discount', 'cost_low', 'cost_high'
  
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Automatically detect location on mount
    handleDetectLocation();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedCity, selectedTier, sortBy, search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCity && selectedCity !== 'All Cities') {
        params.city = selectedCity;
      }
      if (selectedTier !== 'all') {
        params.tier = selectedTier;
      }
      if (search) {
        params.search = search;
      }
      if (sortBy) {
        params.sortBy = sortBy;
      }

      const res = await getRestaurantsApi(params);
      setRestaurants(res.data.restaurants || []);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationStatus('Detecting your GPS location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingLocation(false);
        setSelectedCity('Bhopal');
        setLocationStatus('📍 GPS Location detected: MP Nagar, Bhopal');
        setTimeout(() => setLocationStatus(''), 4000);
      },
      (error) => {
        setIsDetectingLocation(false);
        setLocationStatus('Permission denied. Defaulted to Bhopal.');
        setSelectedCity('Bhopal');
        setTimeout(() => setLocationStatus(''), 4000);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-16">
      
      {/* Header Banner */}
      <section className="bg-[#14382B] text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Explore Top Restaurants Near You
            </h1>
            <p className="text-sand-200 text-xs sm:text-sm max-w-xl">
              Book your table in advance, pre-order handcrafted meals, or batch pick up at institutional dining without waiting in queues.
            </p>
          </div>

          {/* Location & GPS Detection Widget */}
          <div className="w-full md:w-80 space-y-1">
            <CustomCitySelect
              selectedCity={selectedCity}
              onSelectCity={(city) => setSelectedCity(city)}
              onDetectGps={handleDetectLocation}
              isDetecting={isDetectingLocation}
            />

            {locationStatus && (
              <p className="text-[11px] font-medium text-emerald-300 px-1 pt-1 transition-all">{locationStatus}</p>
            )}
          </div>

        </div>
      </section>

      {/* Main Filter & Search Bar Card - Compact positioning */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-20">
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-sand-200 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search restaurants, cuisines, or locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#FAF8F5] text-slate-800 text-sm font-medium pl-11 pr-4 py-3 rounded-2xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-[#14382B]"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-6 flex items-center justify-end gap-3">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                <SlidersHorizontal className="w-4 h-4 text-[#14382B]" /> Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#FAF8F5] text-slate-800 text-xs font-bold py-3 px-4 rounded-2xl border border-sand-200 focus:outline-none cursor-pointer"
              >
                <option value="nearest_rating">⚡ Nearest & Best Rated (Recommended)</option>
                <option value="rating">★ Highest Rating</option>
                <option value="discount">🔥 Top Discounts</option>
                <option value="cost_low">₹ Price: Low to High</option>
                <option value="cost_high">₹ Price: High to Low</option>
              </select>
            </div>

          </div>

          {/* Category / Tier Filter Pills with Professional Terminology */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-sand-200 no-scrollbar">
            
            <button
              onClick={() => setSelectedTier('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedTier === 'all'
                  ? 'bg-[#14382B] text-white shadow'
                  : 'bg-[#FAF8F5] text-slate-700 hover:bg-sand-100 border border-sand-200'
              }`}
            >
              All Venues ({restaurants.length})
            </button>

            <button
              onClick={() => setSelectedTier('premium')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedTier === 'premium'
                  ? 'bg-[#14382B] text-white shadow'
                  : 'bg-[#FAF8F5] text-slate-700 hover:bg-sand-100 border border-sand-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-500" /> Luxury & Fine Dining
            </button>

            <button
              onClick={() => setSelectedTier('mid')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedTier === 'mid'
                  ? 'bg-[#14382B] text-white shadow'
                  : 'bg-[#FAF8F5] text-slate-700 hover:bg-sand-100 border border-sand-200'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-orange-500" /> Casual & Premium Bistros
            </button>

            <button
              onClick={() => setSelectedTier('canteen')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedTier === 'canteen'
                  ? 'bg-[#14382B] text-white shadow'
                  : 'bg-[#FAF8F5] text-slate-700 hover:bg-sand-100 border border-sand-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Campus & Institutional Canteens
            </button>

          </div>

        </div>
      </section>

      {/* Restaurant List Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-4 space-y-4 animate-pulse border border-sand-200">
                <div className="h-48 bg-slate-200 rounded-2xl"></div>
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : restaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((rest, index) => {
              // Simulated distance calculation for demonstration
              const distanceKm = (1.2 + (index * 0.7)).toFixed(1);

              return (
                <div
                  key={rest._id}
                  onClick={() => onOpenDetail(rest._id)}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-sand-200 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* Image Header with Badges */}
                    <div className="relative h-52 overflow-hidden bg-slate-100">
                      <img
                        src={rest.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'}
                        alt={rest.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top Overlay Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="bg-[#D84315] text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow uppercase">
                          {rest.discountPercent || 20}% OFF
                        </span>
                        <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {rest.tier === 'premium' ? 'Luxury Dining' : rest.tier === 'mid' ? 'Casual Bistro' : 'Campus Dining'}
                        </span>
                      </div>

                      <button className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors">
                        <Heart className="w-4 h-4" />
                      </button>

                      {/* Distance Pill */}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-3 py-1 rounded-full shadow flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-[#FF5722]" /> {distanceKm} km away
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-[#D84315] transition-colors leading-snug">
                          {rest.name}
                        </h3>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 whitespace-nowrap shadow-sm">
                          <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" /> {rest.rating || 4.5}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {rest.tagline || rest.description || 'Fine dining, pre-order delicacies and instant table bookings.'}
                      </p>

                      {/* Address & City */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#FF5722] shrink-0" />
                        <span className="truncate">{rest.address}, {rest.city}</span>
                      </div>

                      {/* Modes Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] font-bold bg-[#FAF8F5] text-slate-700 px-2 py-0.5 rounded-lg border border-sand-200">
                          🍽️ Table Booking
                        </span>
                        <span className="text-[10px] font-bold bg-[#FAF8F5] text-slate-700 px-2 py-0.5 rounded-lg border border-sand-200">
                          🛍️ Food Pre-Order
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 pt-0 border-t border-sand-100 flex items-center justify-between mt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Cost</span>
                      <span className="font-extrabold text-slate-900 text-sm">₹{rest.avgCostForTwo || 800} <span className="text-[10px] text-slate-500 font-normal">for two</span></span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetail(rest._id);
                      }}
                      className="bg-[#14382B] group-hover:bg-[#1B4D36] text-white px-4 py-2.5 rounded-xl font-extrabold text-xs shadow transition-all flex items-center gap-1.5"
                    >
                      <Utensils className="w-3.5 h-3.5" /> Book & Pre-Order
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-sand-200 max-w-xl mx-auto shadow-xl space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-100 to-amber-50 text-[#FF5722] flex items-center justify-center mx-auto shadow-inner border border-orange-200/60 animate-bounce">
              <Sparkles className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                🚀 Expanding Soon to {selectedCity || 'Your City'}
              </span>
              <h3 className="font-extrabold text-slate-900 text-2xl tracking-tight">
                bookmyorder is Launching in {selectedCity || 'Your City'}!
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                We are currently operating at peak capacity in <strong>Bhopal</strong>! We are actively onboarding partner restaurants & campus canteens in <strong>{selectedCity || 'your city'}</strong>.
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-sand-200 text-xs font-bold text-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <p className="font-extrabold text-slate-900">Join {selectedCity || 'City'} Waitlist</p>
                <p className="text-[10px] text-slate-500 font-normal">5,420+ diners pre-registered in {selectedCity || 'your city'}</p>
              </div>
              <button 
                onClick={() => alert(`🎉 Thank you! You're #5,421 on the ${selectedCity || 'City'} launch waitlist. We'll notify you on launch!`)}
                className="bg-[#FF5722] hover:bg-[#D84315] text-white px-4 py-2.5 rounded-xl text-xs font-black shadow transition-all whitespace-nowrap"
              >
                Notify Me 🎉
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedCity('Bhopal');
                  setSearch('');
                  setSelectedTier('all');
                }}
                className="w-full bg-[#14382B] hover:bg-[#1B4D36] text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#FF5722]" />
                Explore Active Venues in Bhopal (4+ Venues Live)
              </button>
            </div>
          </div>
        )}

      </section>

    </div>
  );
}
