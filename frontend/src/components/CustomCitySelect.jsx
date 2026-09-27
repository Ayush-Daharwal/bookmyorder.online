import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Compass, Check, AlertCircle, Sparkles } from 'lucide-react';

const KNOWN_CITIES = [
  'Bhopal', 'Indore', 'Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad',
  'Chennai', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Lucknow', 'Chandigarh',
  'Noida', 'Gurgaon', 'Gwalior', 'Jabalpur', 'Ujjain', 'Nagpur', 'Surat',
  'Kanpur', 'Patna', 'Agra', 'Varanasi', 'Nashik', 'Vadodara', 'Rajkot',
  'Kochi', 'Thiruvananthapuram', 'Coimbatore', 'Mysuru', 'Visakhapatnam'
];

// Levenshtein distance for fuzzy matching typos
function getLevenshteinDistance(a, b) {
  const str1 = a.toLowerCase();
  const str2 = b.toLowerCase();
  const matrix = Array.from({ length: str1.length + 1 }, () =>
    Array(str2.length + 1).fill(0)
  );

  for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[str1.length][str2.length];
}

// Find fuzzy city suggestions for misspelled user input
function getFuzzyCitySuggestions(inputStr) {
  if (!inputStr || inputStr.trim().length === 0) return [];
  const query = inputStr.trim().toLowerCase();

  // 1. Exact or substring startsWith matches
  const exactMatches = KNOWN_CITIES.filter((city) =>
    city.toLowerCase().startsWith(query) || city.toLowerCase().includes(query)
  );

  // 2. Fuzzy matches based on Levenshtein distance
  const fuzzyScored = KNOWN_CITIES.map((city) => {
    const dist = getLevenshteinDistance(query, city);
    return { city, dist };
  })
    .filter((item) => item.dist <= Math.max(2, Math.floor(query.length / 2)))
    .sort((a, b) => a.dist - b.dist)
    .map((item) => item.city);

  // Combine and deduplicate
  const combined = Array.from(new Set([...exactMatches, ...fuzzyScored]));
  return combined.slice(0, 5);
}

export default function CustomCitySelect({ selectedCity, onSelectCity, onDetectGps, isDetecting }) {
  const [cityInput, setCityInput] = useState(selectedCity || 'Bhopal');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setCityInput(selectedCity || 'Bhopal');
  }, [selectedCity]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setCityInput(val);
    onSelectCity(val);

    if (val.trim().length > 0) {
      const matches = getFuzzyCitySuggestions(val);
      setSuggestions(matches);
      setIsOpen(matches.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelectSuggestion = (city) => {
    setCityInput(city);
    onSelectCity(city);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        onSelectCity(cityInput);
        setIsOpen(false);
      }
    }
  };

  const handleDirectDetectLocation = () => {
    setDetectingGps(true);
    setGpsStatus('Acquiring GPS location...');

    if (onDetectGps) {
      onDetectGps();
      setTimeout(() => {
        setDetectingGps(false);
        setGpsStatus('📍 Location updated');
      }, 1200);
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by browser');
      setDetectingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Default to Bhopal or nearest city based on coordinates
        let detected = 'Bhopal';
        if (latitude > 22.5 && latitude < 23.5 && longitude > 75.5 && longitude < 76.5) {
          detected = 'Indore';
        } else if (latitude > 28.0 && latitude < 29.0 && longitude > 76.8 && longitude < 77.5) {
          detected = 'Delhi';
        } else if (latitude > 18.8 && latitude < 19.3 && longitude > 72.7 && longitude < 73.0) {
          detected = 'Mumbai';
        } else if (latitude > 12.8 && latitude < 13.2 && longitude > 77.4 && longitude < 77.8) {
          detected = 'Bengaluru';
        }

        setCityInput(detected);
        onSelectCity(detected);
        setGpsStatus(`📍 Detected: ${detected}`);
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsStatus('Location permission denied');
        setDetectingGps(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="bg-white rounded-2xl p-2.5 border border-sand-200 shadow-sm flex items-center justify-between gap-2 focus-within:ring-2 focus-within:ring-[#14382B] transition-all">
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5722] flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none mb-1">
              Your City Location
            </label>
            <input
              type="text"
              value={cityInput}
              onChange={handleInputChange}
              onFocus={() => {
                if (cityInput) {
                  const matches = getFuzzyCitySuggestions(cityInput);
                  setSuggestions(matches);
                  setIsOpen(matches.length > 0);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type city (e.g. Bhopal, Indore)..."
              className="w-full bg-transparent text-slate-900 text-xs font-bold focus:outline-none placeholder-slate-400"
            />
          </div>
        </div>

        {/* GPS Detect Location Button */}
        <button
          type="button"
          onClick={handleDirectDetectLocation}
          disabled={detectingGps || isDetecting}
          className="bg-sand-100 hover:bg-sand-200 text-slate-800 p-2 sm:px-3 sm:py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 shrink-0 border border-sand-200 cursor-pointer transition-all disabled:opacity-50"
          title="Detect Current GPS Location Directly"
        >
          <Compass className={`w-3.5 h-3.5 text-[#14382B] ${detectingGps || isDetecting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {detectingGps || isDetecting ? 'Detecting...' : 'Detect GPS'}
          </span>
        </button>

      </div>

      {gpsStatus && (
        <p className="text-[10px] font-bold text-emerald-600 mt-1 px-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          {gpsStatus}
        </p>
      )}

      {/* Auto-Suggest Dropdown for Misspelled City Inputs (Fuzzy Matching) */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-sand-200 overflow-hidden z-50 divide-y divide-sand-100">
          <div className="px-3 py-1.5 bg-sand-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Suggested Matching Cities</span>
            <span className="text-[9px] text-emerald-700">Fuzzy Typo Correction</span>
          </div>

          {suggestions.map((city) => (
            <div
              key={city}
              onClick={() => handleSelectSuggestion(city)}
              className="px-4 py-2.5 hover:bg-sand-50 cursor-pointer flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
                <span>{city}</span>
              </div>
              {city.toLowerCase() === cityInput.toLowerCase() ? (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Exact Match ✔
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-normal italic">
                  Did you mean <strong>{city}</strong>?
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
