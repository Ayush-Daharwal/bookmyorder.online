import React from 'react';
import { Clock, AlertTriangle, X, Calendar } from 'lucide-react';

export default function PastTimeModal({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  nearestDate,
  nearestTime,
  onSelectNearestTime,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-sand-200 relative overflow-hidden transform scale-100 transition-all">
        
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-sand-100 hover:bg-sand-200 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-4 pt-2">
          
          {/* Icon Badge */}
          <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          {/* Heading */}
          <div>
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5" /> Invalid Booking Time
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              Cannot Book Past Time
            </h3>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 leading-relaxed px-2">
            The selected time <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">{selectedTime || 'Selected Time'}</span> on <span className="font-bold text-slate-800">{selectedDate || 'today'}</span> is in the past! Please select a valid upcoming time slot to proceed.
          </p>

          {/* Time Tip Card */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-sand-200 text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Calendar className="w-4 h-4 text-[#14382B]" />
              <span>Recommended Action:</span>
            </div>
            <p className="text-[11px] text-slate-500 pl-6">
              The nearest available slot is <span className="font-bold text-slate-800">{nearestTime}</span> on <span className="font-bold text-slate-800">{nearestDate}</span>.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onSelectNearestTime}
            className="w-full bg-[#14382B] hover:bg-[#0d271e] text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            Use {nearestTime} on {nearestDate}
          </button>

        </div>
      </div>
    </div>
  );
}
