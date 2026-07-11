import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings2, Database, FileSpreadsheet, Server, CheckCircle2,
  AlertTriangle, XCircle, Loader2, Save, RefreshCw, ExternalLink,
  Eye, EyeOff, Copy, Check, Wifi, WifiOff, Clock
} from 'lucide-react';
import { getSettings, updateSettings, testGoogleSheetConnection } from '../api';

const inputCls =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 font-mono';

function StatusBadge({ ok, label }) {
  if (ok === null) return null;
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={10} /> {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
      <XCircle size={10} /> ไม่ได้ตั้งค่า
    </span>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children, tone = 'slate' }) {
  const toneStyles = {
    slate:   'border-l-slate-400  bg-slate-50  text-slate-600',
    teal:    'border-l-teal-500   bg-teal-50   text-teal-600',
    emerald: 'border-l-emerald-500 bg-emerald-50 text-emerald-600',
    amber:   'border-l-amber-500  bg-amber-50  text-amber-600',
  };

  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden`}>
      <div className={`border-l-4 ${toneStyles[tone].split(' ').slice(0,1).join('')} px-6 py-4 border-b border-slate-100`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${toneStyles[tone].split(' ').slice(1).join(' ')}`}>
            <Icon size={18} className="stroke-[2.2]" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{title}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false, masked = false }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const displayValue = masked && !visible ? value : value;

  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap pt-0.5">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-xs text-right text-slate-700 font-medium truncate max-w-[320px] ${mono ? 'font-mono' : ''}`}>
          {displayValue || <span className="text-slate-400 italic">ไม่ได้ตั้งค่า</span>}
        </span>
        {value && (
          <button onClick={handleCopy} className="text-slate-400 hover:text-teal-600 transition-colors shrink-0" title="คัดลอก">
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        )}
        {masked && (
          <button onClick={() => setVisible(v => !v)} className="text-slate-400 hover:text-teal-600 transition-colors shrink-0">
            {visible ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}

function UptimeFormat({ seconds }) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h} ชั่วโมง`);
  if (m > 0) parts.push(`${m} นาที`);
  parts.push(`${s} วินาที`);
  return <span>{parts.join(' ')}</span>;
}

export default function Settings({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // {success, message}

  // Editable form state
  const [sheetUrl, setSheetUrl] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      setData(res);
      setSheetUrl(res.googleSheets?.webappUrl || '');
      setTestResult(null);
    } catch (err) {
      showToast('ไม่สามารถโหลดการตั้งค่าได้', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ googleSheetWebappUrl: sheetUrl });
      showToast('บันทึกการตั้งค่าสำเร็จ มีผลทันที!', 'success');
      await fetchSettings();
    } catch (err) {
      showToast('ไม่สามารถบันทึกการตั้งค่าได้', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSheet = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testGoogleSheetConnection();
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ทดสอบได้' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <Loader2 className="animate-spin text-teal-500" size={32} />
        <p className="text-sm font-medium">กำลังโหลดการตั้งค่า...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-fadeIn max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings2 size={22} className="text-teal-600" />
            การตั้งค่าระบบ (Settings)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">จัดการการเชื่อมต่อและกำหนดค่าระบบ KHH Telemedicine</p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw size={14} />
          รีเฟรช
        </button>
      </div>

      {/* Google Sheets Integration */}
      <SectionCard
        icon={FileSpreadsheet}
        title="การเชื่อมต่อ Google Sheets"
        subtitle="ซิงค์ข้อมูลผู้ป่วยไปยังชีต Telemed69 โดยอัตโนมัติ"
        tone="teal"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Google Apps Script Web App URL
            </label>
            <StatusBadge ok={data?.googleSheets?.isConfigured} label="เชื่อมต่อแล้ว" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/…/exec"
              className={inputCls}
            />
          </div>

          <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500 border border-slate-200/50 leading-relaxed">
            <p className="font-bold text-slate-600 mb-1">📌 วิธีรับ Web App URL:</p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>เปิด Google Sheet → <strong>ส่วนขยาย → Apps Script</strong></li>
              <li>คัดลอกโค้ดจากไฟล์ <code className="bg-slate-100 px-1 rounded">backend/db/google-apps-script.js</code> ไปวาง</li>
              <li>คลิก <strong>ใช้งานจริง → เว็บแอป</strong> แล้วตั้งสิทธิ์เป็น <strong>"ทุกคน"</strong></li>
              <li>คัดลอก URL ที่ได้มาวางในช่องด้านบน</li>
            </ol>
            <a
              href="https://docs.google.com/spreadsheets/d/1j25Lz41DsmYkbQ8KOTI0Wfr0duo9kZvmC_N5zxMAKu8/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-teal-600 font-bold hover:underline"
            >
              <ExternalLink size={11} /> เปิด Google Sheet ที่เชื่อมต่อ
            </a>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-xs font-semibold border ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {testResult.success ? <Wifi size={14} className="shrink-0 mt-0.5" /> : <WifiOff size={14} className="shrink-0 mt-0.5" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleTestSheet}
              disabled={testing || !sheetUrl.startsWith('http')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all"
            >
              {testing ? <Loader2 size={13} className="animate-spin" /> : <Wifi size={13} />}
              ทดสอบการเชื่อมต่อ
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 shadow-sm transition-all"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Supabase Database Info */}
      <SectionCard
        icon={Database}
        title="ฐานข้อมูล Supabase"
        subtitle="ข้อมูลการเชื่อมต่อ Cloud Database (อ่านได้อย่างเดียว)"
        tone="emerald"
      >
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500">สถานะการเชื่อมต่อ</span>
            <StatusBadge ok={data?.supabase?.isConfigured} label="Active" />
          </div>
          <InfoRow label="Supabase URL" value={data?.supabase?.url} mono />
          <InfoRow label="Anon Key (masked)" value={data?.supabase?.anonKeyMasked} mono masked />
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100">
          <a
            href={`https://supabase.com/dashboard/project/${data?.supabase?.url?.split('//')[1]?.split('.')[0] || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:underline"
          >
            <ExternalLink size={11} /> เปิด Supabase Dashboard
          </a>
        </div>
      </SectionCard>

      {/* System Info */}
      <SectionCard
        icon={Server}
        title="ข้อมูลระบบ (System Information)"
        subtitle="สถานะและรายละเอียดของ Backend Server"
        tone="amber"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50/70 border border-slate-200/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Server Port</p>
            <p className="text-2xl font-extrabold text-slate-800">:{data?.system?.port || '3001'}</p>
          </div>
          <div className="bg-slate-50/70 border border-slate-200/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Node.js Version</p>
            <p className="text-2xl font-extrabold text-slate-800">{data?.system?.nodeVersion || '-'}</p>
          </div>
          <div className="bg-slate-50/70 border border-slate-200/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Environment</p>
            <p className="text-lg font-bold text-slate-800 capitalize">{data?.system?.environment || '-'}</p>
          </div>
          <div className="bg-slate-50/70 border border-slate-200/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock size={10} /> Server Uptime
            </p>
            <p className="text-sm font-bold text-teal-700">
              {data?.system?.uptime != null
                ? <UptimeFormat seconds={data.system.uptime} />
                : '-'
              }
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
