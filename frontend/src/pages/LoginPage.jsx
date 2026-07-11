import React, { useState, useRef, useEffect } from 'react';
import {
  HeartPulse, User, Lock, Eye, EyeOff,
  Loader2, AlertCircle, ShieldCheck, Stethoscope, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [providerId, setProviderId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!providerId.trim()) {
      setError('กรุณาระบุ Provider ID');
      return;
    }
    if (!password) {
      setError('กรุณากรอกรหัสผ่าน / PIN');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(providerId.trim(), password);
    } catch (err) {
      const msg = err?.response?.data?.error || 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden font-sans">

      {/* ======= ฝั่งซ้าย: Illustration Panel ======= */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden select-none">

        {/* Decorative radial blur */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-teal-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 bg-teal-300/10 rounded-full blur-3xl" />

        {/* Animated Pulse Ring */}
        <div className="relative mb-10">
          <div className="w-36 h-36 rounded-full bg-teal-500/10 border border-teal-400/20 flex items-center justify-center animate-pulse">
            <div className="w-24 h-24 rounded-full bg-teal-500/15 border border-teal-400/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-teal-600/20 border border-teal-400/50 flex items-center justify-center">
                <HeartPulse size={32} className="text-teal-300 stroke-[1.8]" />
              </div>
            </div>
          </div>
        </div>

        {/* System Branding */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            KHH Telemedicine
          </h1>
          <p className="text-teal-300/80 text-sm font-medium leading-relaxed">
            ระบบติดตามการจัดส่งยาและดูแลผู้ป่วย<br />
            โรงพยาบาลคลองหาด จังหวัดสระแก้ว
          </p>
        </div>

        {/* Feature badges */}
        <div className="space-y-3 w-full max-w-xs">
          {[
            { icon: Activity, text: 'ติดตามสถานะจัดส่งยาแบบ Realtime' },
            { icon: Stethoscope, text: 'จัดการข้อมูลผู้ป่วยคลินิกเรื้อรัง' },
            { icon: ShieldCheck, text: 'เชื่อมต่อ Google Sheets อัตโนมัติ' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="text-teal-400 shrink-0">
                <Icon size={16} className="stroke-[2]" />
              </div>
              <span className="text-sm text-slate-300 font-medium">{text}</span>
            </div>
          ))}
        </div>

        {/* Version badge */}
        <p className="absolute bottom-6 text-slate-600 text-[11px] font-semibold">
          KHH Primary Care Platform v1.2 • {new Date().getFullYear()}
        </p>
      </div>

      {/* ======= ฝั่งขวา: Login Form ======= */}
      <div className="w-full lg:w-1/2 bg-slate-50 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile logo (only on small screens) */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center text-white">
              <HeartPulse size={20} />
            </div>
            <span className="font-extrabold text-slate-800 text-lg">KHH Telemedicine</span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">เข้าสู่ระบบ</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              ใช้รหัส Provider ID และรหัสผ่านสำหรับเจ้าหน้าที่
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">

            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 animate-fadeIn">
                <AlertCircle size={16} className="shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Provider ID Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Provider ID
              </label>
              <div className={`flex items-center gap-3 bg-white border-2 rounded-xl px-4 py-3 transition-all duration-200 ${
                focused === 'id'
                  ? 'border-teal-500 shadow-sm shadow-teal-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <User size={16} className={`shrink-0 transition-colors ${focused === 'id' ? 'text-teal-600' : 'text-slate-400'}`} />
                <input
                  id="login-provider-id"
                  type="text"
                  value={providerId}
                  onChange={e => setProviderId(e.target.value.toUpperCase())}
                  onFocus={() => setFocused('id')}
                  onBlur={() => setFocused('')}
                  placeholder="เช่น KHH001 หรือ ADMIN"
                  className="flex-1 bg-transparent text-sm font-mono font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {/* Password / PIN Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                รหัสผ่าน / PIN
              </label>
              <div className={`flex items-center gap-3 bg-white border-2 rounded-xl px-4 py-3 transition-all duration-200 ${
                focused === 'pwd'
                  ? 'border-teal-500 shadow-sm shadow-teal-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <Lock size={16} className={`shrink-0 transition-colors ${focused === 'pwd' ? 'text-teal-600' : 'text-slate-400'}`} />
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pwd')}
                  onBlur={() => setFocused('')}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="text-slate-400 hover:text-teal-600 transition-colors shrink-0"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium px-1">
                ใช้ PIN 6 หลักหรือรหัสผ่านที่ได้รับจากผู้ดูแลระบบ
              </p>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || !providerId || !password}
              className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all duration-200 shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> กำลังตรวจสอบ...</>
                : 'เข้าสู่ระบบ →'
              }
            </button>
          </form>

          {/* Quick Access Hint */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">ข้อมูลทดสอบ (Demo)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'KHH001', label: 'เจ้าหน้าที่ (Admin)', role: 'admin' },
                { id: 'KHH002', label: 'รพ.สต. (Viewer)', role: 'viewer' },
              ].map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setProviderId(u.id); setPassword('123456'); setError(''); }}
                  className="text-left px-3 py-2 bg-white border border-teal-200/60 rounded-lg hover:border-teal-400 hover:bg-teal-50/50 transition-all cursor-pointer group"
                >
                  <p className="text-[11px] font-extrabold text-teal-700 font-mono">{u.id}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{u.label}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-teal-600/70 font-medium">PIN เริ่มต้น: <span className="font-mono font-bold">123456</span> • คลิกเพื่อกรอกอัตโนมัติ</p>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} />
            เฉพาะเจ้าหน้าที่โรงพยาบาลคลองหาด (KHH) เท่านั้น
          </p>
        </div>
      </div>
    </div>
  );
}
