import React, { useState } from 'react';
import { X, Smartphone, ShieldCheck, UserCheck, Sparkles, ArrowRight } from 'lucide-react';
import { requestOtpApi, verifyOtpApi } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('1234');
  const [name, setName] = useState('Ayush Daharwal');
  const [city, setCity] = useState('Bhopal');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (!isOpen) return null;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await requestOtpApi(phone);
      setInfo(`Simulated OTP sent! Use code: ${res.data.simulatedOtp || '1234'}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await verifyOtpApi({ phone, otp, name, city, role });
      localStorage.setItem('bmo_token', res.data.token);
      onAuthSuccess(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-sand-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-sand-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <img src="/logo.png" alt="bookmyorder" className="h-10 mx-auto mb-3 object-contain" />
          <h3 className="text-xl font-bold text-forest-900">
            {step === 1 ? 'Mobile OTP Authentication' : 'Enter 4-Digit Security Code'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Fast, passwordless sign-in for diners & restaurant partners
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-4 p-3 bg-forest-50 text-forest-800 text-xs rounded-xl font-medium border border-forest-200">
            {info}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500 font-bold text-sm">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-14 pr-4 py-3 rounded-2xl border border-sand-200 focus:outline-none focus:border-terracotta-500 text-sm font-semibold text-slate-900 bg-sand-50"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-sand-200 focus:outline-none focus:border-terracotta-500 text-sm font-medium bg-sand-50"
              >
                <option value="customer">Diner / Customer</option>
                <option value="provider">Restaurant Partner / Owner</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-orange-btn text-white py-3.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Sending Code...' : 'Request OTP Code'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-500 bg-sand-100 px-3 py-1 rounded-full">
                ⚡ Demo Hint: Default test OTP is <strong>1234</strong>
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter 4-Digit OTP</label>
              <input
                type="text"
                required
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-widest text-xl font-extrabold py-3 rounded-2xl border border-sand-200 focus:outline-none focus:border-terracotta-500 bg-sand-50"
                placeholder="1 2 3 4"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-sand-200 focus:outline-none focus:border-terracotta-500 text-sm bg-sand-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-sand-200 focus:outline-none focus:border-terracotta-500 text-sm bg-sand-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-800 hover:bg-forest-700 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
              <ShieldCheck className="w-4 h-4 text-terracotta-500" />
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 text-center"
            >
              Change Phone Number
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
