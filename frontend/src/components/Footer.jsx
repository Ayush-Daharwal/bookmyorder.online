import React from 'react';
import { ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';

export default function Footer({ onOpenAdminLogin }) {
  return (
    <footer className="bg-forest-900 text-sand-100 pt-16 pb-12 border-t border-forest-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-forest-800">

          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <img
              src="/logo.png"
              alt="bookmyorder"
              className="h-10 w-auto bg-white p-1.5 rounded-lg object-contain"
            />
            <p className="text-sand-200 text-sm leading-relaxed">
              Skip The Queue & Dine Fine. Production-ready dining pre-reservation & smart kitchen forecasting platform.
            </p>
          </div>

          {/* Dining Workflows */}
          <div>
            <h4 className="font-bold text-white mb-4 text-base">Supported Workflows</h4>
            <ul className="space-y-2.5 text-sm text-sand-200">
              <li className="hover:text-terracotta-500 transition-colors cursor-pointer">Premium Table & Dish Pre-order</li>
              <li className="hover:text-terracotta-500 transition-colors cursor-pointer">Table-Only Reserve & Dine</li>
              <li className="hover:text-terracotta-500 transition-colors cursor-pointer">Mid-Level Bistro Pickup</li>
              <li className="hover:text-terracotta-500 transition-colors cursor-pointer">College Canteen Demand Forecasting</li>
            </ul>
          </div>

          {/* Partner & Staff */}
          <div>
            <h4 className="font-bold text-white mb-4 text-base">For Restaurant Owners</h4>
            <ul className="space-y-2.5 text-sm text-sand-200">
              <li className="hover:text-terracotta-500 transition-colors cursor-pointer">Register Restaurant Partner</li>
              <li className="hover:text-terracotta-500 transition-colors cursor-pointer">Kitchen Display System (KDS)</li>
              <li className="hover:text-terracotta-500 transition-colors cursor-pointer">Aadhar & License Verification</li>
              <li className="hover:text-terracotta-500 transition-colors cursor-pointer">Staff POS Walk-in Station</li>
            </ul>
          </div>

          {/* Platform Access */}
          <div>
            <h4 className="font-bold text-white mb-4 text-base">Super Admin Portal</h4>
            <p className="text-xs text-sand-200 mb-4 leading-relaxed">
              Restricted management suite for 20+ analytical parameters, payouts & moderation.
            </p>
            <button
              onClick={onOpenAdminLogin}
              className="w-full bg-forest-800 hover:bg-forest-700 text-terracotta-500 font-bold py-2.5 px-4 rounded-xl border border-forest-700 transition-all text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Super Admin Console
            </button>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-sand-200 gap-4">
          <p>© 2026 bookmyorder.online. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>FSSAI Compliance</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
