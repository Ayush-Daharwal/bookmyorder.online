import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ProviderPortal from './pages/ProviderPortal';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import RestaurantsPage from './pages/RestaurantsPage';
import AiFoodAssistant from './components/AiFoodAssistant';
import { getMeApi, getRestaurantsApi } from './services/api';
import { Store, Utensils, MapPin, Clock, Search, ShieldCheck, Calendar, Users, Heart, ShoppingBag, Tag, ChevronRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('home'); // 'home', 'detail', 'provider', 'profile', 'admin'
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  const [restaurants, setRestaurants] = useState([]);
  const [selectedHeroRestaurant, setSelectedHeroRestaurant] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');

  // Search Filter State (matching reference UI)
  const [location, setLocation] = useState('Bhopal, MP');
  const [searchDate, setSearchDate] = useState('2026-05-17');
  const [searchTime, setSearchTime] = useState('7:00 PM');
  const [searchGuests, setSearchGuests] = useState('2 People');

  useEffect(() => {
    checkUser();
    fetchRestaurants();
  }, [selectedTier]);

  const checkUser = async () => {
    const token = localStorage.getItem('bmo_token');
    if (!token) return;
    try {
      const res = await getMeApi();
      setUser(res.data.user);
    } catch (err) {
      localStorage.removeItem('bmo_token');
    }
  };

  const fetchRestaurants = async () => {
    try {
      const params = {};
      if (selectedTier !== 'all') params.tier = selectedTier;
      if (search) params.search = search;
      const res = await getRestaurantsApi(params);
      setRestaurants(res.data.restaurants || []);
    } catch (err) {
      console.error('Restaurant fetch error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bmo_token');
    setUser(null);
    setCurrentTab('home');
  };

  const handleOpenDetail = (id) => {
    setSelectedRestaurantId(id);
    setCurrentTab('detail');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF8F5] text-slate-800 antialiased">
      
      {/* Header Navigation */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {currentTab === 'home' && (
          <div>
            
            {/* HERO SECTION: Exact Match to Reference Image 1 */}
            <section className="relative bg-[#FAF8F5] pt-8 pb-12 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Left Column: Heading & Search Box (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Subtitle Badge */}
                    <p className="text-xs sm:text-sm font-bold text-[#C65D21] flex items-center gap-1.5 tracking-wide">
                      Your Table. Your Food. Your Way. <span className="text-terracotta-500">🧡</span>
                    </p>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                      Book Tables, <br />
                      Pre-Order Food.
                    </h1>

                    {/* Search & Reservation Bar Card */}
                    <div className="bg-white p-5 rounded-3xl shadow-xl border border-sand-200 space-y-4">
                      
                      {/* Search Mode Toggle Buttons */}
                      <div className="flex items-center gap-3 border-b border-sand-200 pb-3">
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14382B] text-white font-bold text-xs shadow">
                          <Utensils className="w-4 h-4" />
                          Book a Table
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-sand-100 text-slate-700 font-bold text-xs transition-all border border-sand-200">
                          <ShoppingBag className="w-4 h-4 text-[#FF5722]" />
                          Pre-Order Food
                        </button>
                      </div>

                      {/* Restaurant Selection Dropdown (Select Venue to Check Tables & Menu) */}
                      <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-sand-200">
                        <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">
                          Select Specific Restaurant (To View Tables & Menu)
                        </label>
                        <div className="flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-[#14382B] shrink-0" />
                          <select
                            value={selectedHeroRestaurant}
                            onChange={(e) => setSelectedHeroRestaurant(e.target.value)}
                            className="bg-transparent w-full text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                          >
                            <option value="">🌐 All Partner Restaurants (Browse Venues)</option>
                            {restaurants.map((r) => (
                              <option key={r._id} value={r._id}>
                                📍 {r.name} — {r.city} ({r.tier === 'premium' ? 'Luxury Dining' : r.tier === 'mid' ? 'Casual Bistro' : 'Campus Canteen'})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Location, Date, Time, People Controls */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        
                        <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-sand-200">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Location</label>
                          <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-800">
                            <MapPin className="w-4 h-4 text-[#FF5722]" />
                            <input
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="bg-transparent w-full focus:outline-none text-xs"
                            />
                          </div>
                        </div>

                        <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-sand-200">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Date</label>
                          <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-800">
                            <Calendar className="w-4 h-4 text-[#14382B]" />
                            <input
                              type="text"
                              value={searchDate}
                              onChange={(e) => setSearchDate(e.target.value)}
                              className="bg-transparent w-full focus:outline-none text-xs"
                            />
                          </div>
                        </div>

                        <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-sand-200">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Time</label>
                          <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-800">
                            <Clock className="w-4 h-4 text-[#14382B]" />
                            <select
                              value={searchTime}
                              onChange={(e) => setSearchTime(e.target.value)}
                              className="bg-transparent w-full focus:outline-none cursor-pointer text-xs"
                            >
                              <option value="7:00 PM">7:00 PM</option>
                              <option value="8:00 PM">8:00 PM</option>
                              <option value="1:00 PM">1:00 PM</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-sand-200">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">People</label>
                          <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-800">
                            <Users className="w-4 h-4 text-[#14382B]" />
                            <select
                              value={searchGuests}
                              onChange={(e) => setSearchGuests(e.target.value)}
                              className="bg-transparent w-full focus:outline-none cursor-pointer text-xs"
                            >
                              <option value="2 People">2 People</option>
                              <option value="4 People">4 People</option>
                              <option value="6 People">6 People</option>
                            </select>
                          </div>
                        </div>

                      </div>

                      {/* Action Search Button */}
                      <button
                        onClick={() => {
                          if (selectedHeroRestaurant) {
                            handleOpenDetail(selectedHeroRestaurant);
                          } else {
                            setCurrentTab('restaurants');
                          }
                        }}
                        className="w-full bg-[#D84315] hover:bg-[#BF360C] text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Utensils className="w-4 h-4" />
                        {selectedHeroRestaurant ? 'Check Vacant Tables & Menu' : 'Find a Table & Pre-Order'}
                      </button>

                      {/* Trust Badges */}
                      <div className="flex items-center justify-between pt-2 text-[11px] font-bold text-slate-600 border-t border-sand-200">
                        <span className="flex items-center gap-1 text-slate-700">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Instant Confirmation
                        </span>
                        <span className="flex items-center gap-1 text-slate-700">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> No Hidden Charges
                        </span>
                        <span className="flex items-center gap-1 text-slate-700">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Trusted by 10K+ Diners
                        </span>
                      </div>

                    </div>

                  </div>

                  {/* Right Column: Exact Arched Jharokha Silhouette Image Mask (5 cols) */}
                  <div className="lg:col-span-5 relative flex justify-center items-center">
                    <div className="relative w-full max-w-lg aspect-[4/5] flex justify-center items-center">
                      
                      {/* Background Organic Line Strokes */}
                      <svg className="absolute inset-0 w-full h-full text-sand-300 pointer-events-none" viewBox="0 0 500 600" fill="none">
                        <path d="M 40 160 C 20 60, 180 10, 320 40 C 480 80, 500 240, 460 400 C 420 540, 160 580, 60 500 C 10 440, 10 240, 40 160 Z" stroke="#E8E1D1" strokeWidth="2" strokeDasharray="6 6" fill="none" />
                      </svg>

                      {/* Main Arched Jharokha Silhouette Image */}
                      <svg viewBox="0 0 500 600" className="w-full h-full drop-shadow-2xl">
                        <defs>
                          <clipPath id="jharokhaArchClip">
                            <path d="
                              M 60,200 
                              C 60,130 110,60 250,20 
                              C 390,60 440,130 440,200 
                              C 470,300 470,450 430,530 
                              C 390,580 110,580 70,530 
                              C 30,450 30,300 60,200 Z
                            " />
                          </clipPath>
                        </defs>
                        
                        <image 
                          href="/hero-dining.png" 
                          x="0" 
                          y="0" 
                          width="500" 
                          height="600" 
                          preserveAspectRatio="xMidYMid slice" 
                          clipPath="url(#jharokhaArchClip)" 
                        />

                        <path d="
                          M 60,200 
                          C 60,130 110,60 250,20 
                          C 390,60 440,130 440,200 
                          C 470,300 470,450 430,530 
                          C 390,580 110,580 70,530 
                          C 30,450 30,300 60,200 Z
                        " fill="none" stroke="#FFFFFF" strokeWidth="12" />
                      </svg>

                      {/* Floating Dark Green Badge overlay */}
                      <div className="absolute top-12 right-2 sm:right-6 bg-[#14382B] text-white p-4 rounded-full shadow-2xl border-2 border-white/30 flex flex-col items-center justify-center text-center w-28 h-28 transform hover:scale-105 transition-transform z-10">
                        <Heart className="w-4 h-4 text-terracotta-500 mb-0.5" />
                        <p className="font-serif italic text-xs leading-tight text-sand-100">Good Food</p>
                        <p className="font-bold text-[10px] text-[#FF5722] uppercase tracking-wider">Great Mood</p>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            </section>

            {/* 4 Feature Banner Pills */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-slate-800">
                
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-sand-200">
                    <Utensils className="w-6 h-6 text-[#14382B]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Wide Restaurant Choice</h4>
                    <p className="text-xs text-slate-500">Top restaurants near you</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-sand-200">
                    <Calendar className="w-6 h-6 text-[#14382B]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Easy Table Booking</h4>
                    <p className="text-xs text-slate-500">Book in just a few clicks</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-sand-200">
                    <ShoppingBag className="w-6 h-6 text-[#14382B]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Pre-Order & Save Time</h4>
                    <p className="text-xs text-slate-500">Order ahead, dine better</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-sand-200">
                    <Tag className="w-6 h-6 text-[#14382B]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Exclusive Offers</h4>
                    <p className="text-xs text-slate-500">Best deals for you</p>
                  </div>
                </div>

              </div>
            </section>

            {/* Promoted Partner Showcase (Popular Restaurants Section) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      ⭐ Promoted Partner Showcase
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">Featured Venues</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Popular Partner Restaurants</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentTab('restaurants')}
                    className="text-xs font-bold text-[#D84315] hover:text-[#BF360C] flex items-center gap-1 transition-colors cursor-pointer bg-orange-50 px-3.5 py-2 rounded-xl border border-orange-200"
                  >
                    View All Restaurants <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {restaurants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...restaurants]
                    .sort((a, b) => {
                      // Sorted by Promoted -> Nearest -> Rating -> Price High to Low
                      if (b.rating !== a.rating) return b.rating - a.rating;
                      return (b.avgCostForTwo || 0) - (a.avgCostForTwo || 0);
                    })
                    .map((rest, index) => (
                      <div
                        key={rest._id}
                        onClick={() => handleOpenDetail(rest._id)}
                        className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border-2 border-amber-200/80 transition-all cursor-pointer group relative"
                      >
                        <div className="relative h-44 overflow-hidden bg-slate-100">
                          <img
                            src={rest.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'}
                            alt={rest.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          
                          {/* Top Badges */}
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                            <span className="bg-[#D84315] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow uppercase tracking-wider">
                              ⭐ PROMOTED PARTNER
                            </span>
                            <span className="bg-black/70 backdrop-blur-md text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-400/40">
                              Demo Partner Listing
                            </span>
                          </div>

                          <span className="absolute bottom-2.5 left-2.5 bg-white/95 text-slate-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow">
                            {rest.discountPercent || 20}% OFF
                          </span>
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-base group-hover:text-[#D84315] transition-colors truncate">
                              {rest.name}
                            </h3>
                            <span className="text-xs font-bold text-[#14382B] flex items-center gap-0.5">
                              ★ {rest.rating || 4.5}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="truncate">{rest.tagline || 'Rooftop & Bistro'}</span>
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <MapPin className="w-3 h-3 text-[#D84315]" /> {rest.city}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-sand-100 flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>₹{rest.avgCostForTwo || 800} <span className="text-[10px] text-slate-400 font-normal">for two</span></span>
                            <span className="text-[10px] text-[#14382B] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              ~{(1.1 + index * 0.8).toFixed(1)} km away
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-sand-200 max-w-lg mx-auto">
                  <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-900 text-base">No restaurants listed for this filter.</p>
                  <p className="text-xs text-slate-500 mt-1">Register a partner venue in Partner POS & KDS above!</p>
                </div>
              )}
            </section>

          </div>
        )}

        {currentTab === 'restaurants' && (
          <RestaurantsPage
            onOpenDetail={handleOpenDetail}
            initialCity={location ? location.split(',')[0].trim() : 'Bhopal'}
          />
        )}

        {currentTab === 'detail' && selectedRestaurantId && (
          <RestaurantDetailPage
            restaurantId={selectedRestaurantId}
            onBack={() => setCurrentTab('home')}
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {currentTab === 'provider' && (
          <ProviderPortal user={user} onOpenAuth={() => setIsAuthOpen(true)} />
        )}

        {currentTab === 'profile' && (
          <CustomerProfilePage user={user} onOpenAuth={() => setIsAuthOpen(true)} />
        )}

        {currentTab === 'admin' && (
          user && user.role === 'admin' ? (
            <AdminDashboardPage adminUser={user} onLogout={handleLogout} />
          ) : (
            <AdminLoginPage onLoginSuccess={(u) => setUser(u)} />
          )
        )}

      </main>

      {/* Floating Gemini AI Assistant Widget */}
      <AiFoodAssistant selectedRestaurantId={selectedRestaurantId} />

      {/* Footer */}
      <Footer onOpenAdminLogin={() => setCurrentTab('admin')} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          fetchRestaurants();
        }}
      />

    </div>
  );
}
