import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { adminLoginApi } from '../services/api';

export default function AdminLoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('support.bookmyorder.online@gmail.com');
  const [password, setPassword] = useState('admin.bookmyorder@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await adminLoginApi({ email, password });
      localStorage.setItem('bmo_token', res.data.token);
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Super Admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-sand-200">
        
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#14382B] rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-lg">
            <ShieldCheck className="w-8 h-8 text-[#FF5722]" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Super Admin Portal</h2>
          <p className="text-xs text-slate-500 mt-1">Platform Analytics & Verification Suite</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl font-bold border border-red-200 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Super Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-sand-200 bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#14382B] text-slate-800 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-sand-200 bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#14382B] text-slate-800 font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#14382B] hover:bg-[#1B4D36] text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : (
              <>
                Access Admin Dashboard
                <ArrowRight className="w-4 h-4 text-[#FF5722]" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-6">
          Authorized platform personnel only. Configured in backend <code className="text-slate-700">.env</code>.
        </p>

      </div>
    </div>
  );
}
