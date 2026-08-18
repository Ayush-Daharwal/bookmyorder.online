import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, ChevronDown, Check, Search } from 'lucide-react';

const POPULAR_CITIES = [
  { name: 'Bhopal', state: 'MP', tag: 'Lake City' },
  { name: 'Indore', state: 'MP', tag: 'Cleanest City' },
  { name: 'Delhi NCR', state: 'DL', tag: 'Capital Hub' },
  { name: 'Mumbai', state: 'MH', tag: 'Financial Hub' },
  { name: 'Bangalore', state: 'KA', tag: 'Tech Hub' },
  { name: 'Pune', state: 'MH', tag: 'Cultural Hub' },
  { name: 'Gwalior', state: 'MP', tag: 'Heritage' },
  { name: 'Jabalpur', state: 'MP', tag: 'Marble City' },
];

export default function CustomCitySelect({ selectedCity, onSelectCity, onDetectGps, isDetecting }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(selectedCity || 'Bhopal');
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSearchQuery(selectedCity || 'Bhopal');
  }, [selectedCity]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCityPick = (cityName) => {
    setSearchQuery(cityName);
    onSelectCity(cityName);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSelectCity(val);
    setIsOpen(true);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      
      {/* Input Field Box */}
      <div className="bg-white rounded-2xl p-2.5 border border-sand-200 shadow-sm flex items-center justify-between gap-2 focus-within:ring-2 focus-within:ring-[#14382B] transition-all">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5722] flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none mb-1">
              Your City Location
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              placeholder="Type or select city..."
              className="w-full bg-transparent text-slate-900 text-xs font-bold focus:outline-none placeholder-slate-400"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Styled Custom Dropdown Card */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 space-y-2">
          
          {/* GPS Quick Detect Button */}
          {onDetectGps && (
            <button
              type="button"
              onClick={() => {
                onDetectGps();
                setIsOpen(false);
              }}
              disabled={isDetecting}
              className="w-full bg-[#FF5722] hover:bg-[#D84315] text-white p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              {isDetecting ? 'Detecting GPS Location...' : '📍 Detect My Live Location'}
            </button>
          )}

          {/* Quick Filter Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3 h-3 text-[#FF5722]" /> Available Cities
            </span>
            <span className="text-[10px] font-semibold text-slate-500">{filteredCities.length} cities</span>
          </div>

          {/* City Options List */}
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredCities.length > 0 ? (
              filteredCities.map((c) => {
                const isSelected = selectedCity?.toLowerCase() === c.name.toLowerCase();

                return (
                  <div
                    key={c.name}
                    onClick={() => handleCityPick(c.name)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#14382B] text-emerald-400 font-bold border border-emerald-500/30'
                        : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📍</span>
                      <div>
                        <p className="text-xs font-bold leading-tight">{c.name}</p>
                        <span className="text-[9px] text-slate-400 font-medium">{c.tag} • {c.state}</span>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                );
              })
            ) : (
              <div
                onClick={() => handleCityPick(searchQuery)}
                className="p-3 rounded-xl bg-slate-800 text-center cursor-pointer hover:bg-slate-700 transition-colors"
              >
                <p className="text-xs font-bold text-emerald-400">Use "{searchQuery}"</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click to search restaurants in {searchQuery}</p>
              </div>
            )}
          </div>

          {/* All Cities Option */}
          <div
            onClick={() => handleCityPick('All Cities')}
            className="pt-2 border-t border-slate-800 text-center"
          >
            <button className="text-[11px] font-bold text-slate-300 hover:text-white transition-colors">
              🌐 Show Restaurants Across All Cities
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
