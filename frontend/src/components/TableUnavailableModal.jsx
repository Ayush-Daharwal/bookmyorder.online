import React from 'react';
import { Utensils, AlertCircle, Clock, ChevronRight, X, Sparkles } from 'lucide-react';

export default function TableUnavailableModal({
  isOpen,
  onClose,
  restaurantName,
  requestedTime,
  requestedDate,
  nearestSlots = [],
  onSelectNearestTime
}) {
  if (!isOpen) return null;

  const defaultNearest = nearestSlots.length > 0 ? nearestSlots[0] : '08:00 PM';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sand-200 relative overflow-hidden transform scale-100 transition-all">
        
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-sand-100 hover:bg-sand-200 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-5 pt-2">
          
          {/* Icon Badge */}
          <div className="w-16 h-16 bg-rose-50 border-2 border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-inner">
            <Utensils className="w-8 h-8 animate-pulse" />
          </div>

          {/* Title & Warning */}
          <div>
            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <AlertCircle className="w-3.5 h-3.5" /> Fully Booked Slot
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              Table Not Available at {requestedTime}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {restaurantName || 'This restaurant'} is already booked by another user for <span className="font-bold text-slate-800">{requestedTime}</span> on <span className="font-bold text-slate-800">{requestedDate || 'today'}</span>.
            </p>
          </div>

          {/* Nearest Available Time Section */}
          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-sand-200 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Nearest Available Slots:
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Instant Confirmation
              </span>
            </div>

            {/* Time Slot Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {nearestSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => onSelectNearestTime(slot)}
                  className="bg-white hover:bg-emerald-50 border border-sand-300 hover:border-emerald-500 text-slate-800 hover:text-emerald-900 p-2.5 rounded-xl font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>{slot}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Quick Book Button */}
          <button
            onClick={() => onSelectNearestTime(defaultNearest)}
            className="w-full bg-[#D84315] hover:bg-[#BF360C] text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Directly Book at {defaultNearest} & Pre-Order Menu</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 underline transition-colors"
          >
            Choose a different date or venue
          </button>

        </div>
      </div>
    </div>
  );
}
