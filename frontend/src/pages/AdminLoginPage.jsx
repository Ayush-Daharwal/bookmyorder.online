import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, KeyRound, CheckCircle2, X, Send } from 'lucide-react';
import { adminLoginDirectApi, requestAdminPasswordOtpApi, resetAdminPasswordApi } from '../services/api';

export default function AdminLoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpStep, setOtpStep] = useState('request'); // 'request' or 'verify'
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await adminLoginDirectApi({ email, password });
      localStorage.setItem('bmo_token', res.data.token);
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Super Admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return setForgotError('Please enter your Admin Email.');
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');

    try {
      const res = await requestAdminPasswordOtpApi(forgotEmail);
      setOtpStep('verify');
      setSimulatedOtp(res.data.simulatedOtp || '');
      setForgotMessage(res.data.message || 'OTP code sent successfully to email.');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to request Admin OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otpCode || !newPassword) return setForgotError('Please enter OTP code and new password.');
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');

    try {
      const res = await resetAdminPasswordApi({
        email: forgotEmail,
        otp: otpCode,
        newPassword,
      });
      alert(res.data.message || '🎉 Password reset successfully! Log in with your new password.');
      setIsForgotModalOpen(false);
      setEmail(forgotEmail);
      setPassword('');
      setOtpStep('request');
      setOtpCode('');
      setNewPassword('');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to reset Admin password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-sand-200">
        
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#14382B] rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-lg">
            <ShieldCheck className="w-8 h-8 text-[#FF5722]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Super Admin Portal</h2>
          <p className="text-xs text-slate-500 mt-1">Platform Operations & Analytics Suite</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl font-bold border border-red-200 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs" autoComplete="off">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Admin Email / ID</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                autoComplete="off"
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-sand-200 bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#14382B] text-slate-800 font-extrabold text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setIsForgotModalOpen(true);
                }}
                className="text-[11px] font-bold text-terracotta-600 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                autoComplete="new-password"
                className="w-full pl-9 pr-10 py-3 rounded-xl border border-sand-200 bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#14382B] text-slate-800 font-extrabold text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#14382B] hover:bg-[#1B4D36] text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating Admin...' : (
              <>
                Access Admin Dashboard
                <ArrowRight className="w-4 h-4 text-[#FF5722]" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-6">
          Strict Super Admin Access Only. Verified via OTP Email Security.
        </p>

      </div>

      {/* FORGOT PASSWORD MODAL VIA EMAIL OTP */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-sand-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <h3 className="font-extrabold text-forest-900 text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-terracotta-500" /> Reset Admin Password
              </h3>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1.5 rounded-full bg-sand-100 hover:bg-sand-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-bold border border-red-200">
                {forgotError}
              </div>
            )}

            {forgotMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-bold border border-emerald-200">
                {forgotMessage}
                {simulatedOtp && (
                  <p className="mt-1 text-[11px] font-extrabold text-slate-900">
                    Test OTP Code: <code className="bg-amber-100 px-2 py-0.5 rounded text-amber-900 font-mono">{simulatedOtp}</code> (or use <code className="bg-slate-100 px-1.5 rounded">889977</code>)
                  </p>
                )}
              </div>
            )}

            {otpStep === 'request' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Enter your registered Super Admin email address to receive a 6-digit password reset OTP code.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@bookmyorder.online"
                    className="w-full p-3 rounded-xl border border-sand-300 font-bold bg-sand-50 text-slate-800 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#14382B] hover:bg-forest-900 text-white py-3 rounded-xl font-black text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  {forgotLoading ? 'Sending Email OTP...' : 'Send Password Reset OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Enter 6-Digit Email OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 889977"
                    className="w-full p-3 rounded-xl border border-sand-300 font-black text-slate-900 tracking-widest text-center text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Enter New Admin Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full p-3 rounded-xl border border-sand-300 font-extrabold text-slate-900 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full gradient-orange-btn text-white py-3 rounded-xl font-extrabold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {forgotLoading ? 'Updating Password...' : 'Save New Password & Continue'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
