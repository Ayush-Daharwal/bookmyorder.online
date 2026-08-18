import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

export default function CustomCitySelect({ selectedCity, onSelectCity }) {
  const [cityInput, setCityInput] = useState(selectedCity || 'Bhopal');

  useEffect(() => {
    setCityInput(selectedCity || 'Bhopal');
  }, [selectedCity]);

  const handleChange = (e) => {
    const val = e.target.value;
    setCityInput(val);
    onSelectCity(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSelectCity(cityInput);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl p-2.5 border border-sand-200 shadow-sm flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#14382B] transition-all">
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
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your city (e.g. Bhopal, Indore, Delhi)..."
            className="w-full bg-transparent text-slate-900 text-xs font-bold focus:outline-none placeholder-slate-400"
          />
        </div>
      </div>
    </div>
  );
}
