import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ProviderPortal from './pages/ProviderPortal';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import { getMeApi, getRestaurantsApi } from './services/api';
import { Store, Utensils, Sparkles, MapPin, Clock, Search, ShieldCheck, Calendar, Users, Heart, ShoppingBag } from 'lucide-react';


export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('home'); // 'home', 'detail', 'provider', 'profile'
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');

  // Search Filter State (matching original UI)
  const [location, setLocation] = useState('Bhopal, MP');
  const [searchDate, setSearchDate] = useState('2026-08-18');
  const [searchTime, setSearchTime] = useState('07:30 PM');
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
    <div className="min-h-screen flex flex-col justify-between bg-sand-50">
      
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
            
            {/* HERO SECTION: Luxury Arched Dining Aesthetic matching reference image */}
            <section className="relative bg-sand-50 pt-8 pb-16 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Left Column: Heading & Search Box (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-sand-100 border border-sand-200 px-4 py-1.5 rounded-full text-xs font-bold text-forest-800 shadow-sm">
                      <Sparkles className="w-4 h-4 text-terracotta-500" />
                      <span>SKIP THE QUEUE — Premier Dining & Canteen Reservation</span>
                    </div>

                    {/* Headline (Concise, clean, healthy vibe - no extra sentences) */}
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                      Book Tables, <br />
                      <span className="text-forest-800">Pre-Order Food.</span>
                    </h1>

                    {/* Search & Reservation Bar Card (Exact design matching reference) */}
                    <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-xl border border-sand-200 space-y-4">
                      
                      {/* Search Mode Toggle */}
                      <div className="flex items-center gap-3 border-b border-sand-200 pb-3">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 text-white font-bold text-xs shadow">
                          <Utensils className="w-4 h-4" />
                          Book a Table
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sand-100 hover:bg-sand-200 text-slate-700 font-bold text-xs transition-all">
                          <ShoppingBag className="w-4 h-4 text-terracotta-500" />
                          Pre-Order Food
                        </button>
                      </div>

                      {/* Location, Date, Time, Guests Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        
                        <div className="bg-sand-50 p-2.5 rounded-2xl border border-sand-200">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Location</label>
                          <div className="flex items-center gap-1 mt-0.5 font-bold text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
                            <input
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="bg-transparent w-full focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="bg-sand-50 p-2.5 rounded-2xl border border-sand-200">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Date</label>
                          <div className="flex items-center gap-1 mt-0.5 font-bold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-forest-800" />
                            <input
                              type="date"
                              value={searchDate}
                              onChange={(e) => setSearchDate(e.target.value)}
                              className="bg-transparent w-full focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="bg-sand-50 p-2.5 rounded-2xl border border-sand-200">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Time Slot</label>
                          <div className="flex items-center gap-1 mt-0.5 font-bold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-forest-800" />
                            <select
                              value={searchTime}
                              onChange={(e) => setSearchTime(e.target.value)}
                              className="bg-transparent w-full focus:outline-none cursor-pointer"
                            >
                              <option value="01:00 PM">01:00 PM</option>
                              <option value="07:30 PM">07:30 PM</option>
                              <option value="08:30 PM">08:30 PM</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-sand-50 p-2.5 rounded-2xl border border-sand-200">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Guests</label>
                          <div className="flex items-center gap-1 mt-0.5 font-bold text-slate-800">
                            <Users className="w-3.5 h-3.5 text-forest-800" />
                            <select
                              value={searchGuests}
                              onChange={(e) => setSearchGuests(e.target.value)}
                              className="bg-transparent w-full focus:outline-none cursor-pointer"
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
                        onClick={fetchRestaurants}
                        className="w-full gradient-orange-btn text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        Find a Table & Pre-Order
                      </button>

                      {/* Trust Badges */}
                      <div className="flex items-center justify-between pt-2 text-[11px] font-bold text-slate-600 border-t border-sand-200">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <ShieldCheck className="w-4 h-4" /> Instant Confirmation
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700">
                          <ShieldCheck className="w-4 h-4" /> Zero Hidden Charges
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700">
                          <ShieldCheck className="w-4 h-4" /> Trusted by 10K+ Diners
                        </span>
                      </div>

                    </div>

                  </div>

                  {/* Right Column: Luxury Arched Dining Frame (5 cols) */}
                  <div className="lg:col-span-5 relative flex justify-center">
                    <div className="relative w-full max-w-md">
                      
                      {/* Decorative Outline Frame */}
                      <div className="absolute -inset-2 rounded-[40px] border-2 border-dashed border-sand-300 pointer-events-none" />
                      
                      {/* Main Arched Dining Image Container */}
                      <div className="relative rounded-[36px] overflow-hidden border-4 border-white shadow-2xl bg-white">
                        <img
                          src="/hero-dining.png"
                          alt="Luxury Dining Table - bookmyorder"
                          className="w-full h-[400px] sm:h-[460px] object-cover object-center transform hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      </div>

                      {/* Floating Badge overlay matching reference */}
                      <div className="absolute bottom-6 right-6 bg-forest-900/90 backdrop-blur-md text-white p-4 rounded-full shadow-2xl border border-white/20 flex flex-col items-center justify-center text-center w-24 h-24">
                        <Heart className="w-4 h-4 text-terracotta-500 mb-1" />
                        <p className="font-serif italic text-xs leading-tight">Good Food</p>
                        <p className="font-bold text-[10px] text-terracotta-500 uppercase tracking-wider">Great Mood</p>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            </section>

            {/* Popular Restaurants Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-extrabold text-forest-900">Popular Restaurants & Canteens</h2>
                  <p className="text-xs text-slate-500 mt-1">Select a venue to launch the 3-Mode Table & Food Prebook Engine</p>
                </div>
                
                <div className="flex gap-2 text-xs font-bold">
                  {['all', 'premium', 'mid', 'canteen'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      className={`px-4 py-2 rounded-full uppercase tracking-wider transition-all ${
                        selectedTier === t
                          ? 'bg-forest-800 text-white shadow'
                          : 'bg-white text-slate-600 hover:bg-sand-100 border border-sand-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {restaurants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {restaurants.map((rest) => (
                    <div
                      key={rest._id}
                      onClick={() => handleOpenDetail(rest._id)}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-sand-200 transition-all cursor-pointer group"
                    >
                      <div className="relative h-44 overflow-hidden bg-slate-100">
                        <img
                          src={rest.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'}
                          alt={rest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-3 left-3 bg-terracotta-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow uppercase">
                          {rest.discountPercent || 15}% OFF
                        </span>
                        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-forest-900 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                          ★ {rest.rating || 4.5}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-forest-900 text-base group-hover:text-terracotta-600 transition-colors truncate">
                          {rest.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{rest.tagline}</p>
                        
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-sand-200">
                          <span className="text-slate-600 font-semibold">{rest.city}</span>
                          <span className="font-extrabold text-forest-800">Avg ₹{rest.avgCostForTwo}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-sand-200 max-w-lg mx-auto">
                  <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-forest-900 text-base">No restaurants listed for this filter.</p>
                  <p className="text-xs text-slate-500 mt-1">Register a partner venue in Partner POS & KDS above!</p>
                </div>
              )}
            </section>

          </div>
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

      </main>

      {/* Footer */}
      <Footer onOpenAdminLogin={() => alert('Super Admin Login modal will be connected in Prompt 3')} />

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
