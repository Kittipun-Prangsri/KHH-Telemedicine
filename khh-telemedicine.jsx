import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Search, Upload, X, LayoutDashboard, ListChecks,
  Truck, PackageCheck, Clock, CheckCircle2, AlertTriangle, ChevronLeft,
  ChevronRight, Loader2, Inbox
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell
} from "recharts";
import * as XLSX from "xlsx";

const FACILITIES = ["นาดี", "เขาตาง๊อก", "ทับทิมสยาม05", "หนองแวง", "คกถ.", "หินกอง", "ชุมทอง", "น้ำคำ", "ราชันย์"];
const CLINICS = ["HT", "DM", "DLP", "Asthma", "สุขภาพจิต", "อื่นๆ"];
const RIGHTS = ["บัตรทอง", "ประกันสังคม", "ข้าราชการ/รัฐวิสาหกิจ", "ชำระเงินเอง", "อื่นๆ"];
const BP_OPTS = ["เขียว (BP<140/90)", "เหลือง (BP>140/90)"];
const FBS_OPTS = ["เขียว (80-140 mg%)", "เหลือง (141-200 mg%)", "แดง (>200 mg%)", "ไม่ระบุ"];

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const emptyForm = {
  hn: "", name: "", clinicTags: [], bp: "", fbs: "", rights: "",
  orderDate: "", nextAppt: "", facility: "", sentTo: "", dispatchDate: "",
  pharmacist: "", injection: "", receivedBy: "", patientReceivedDate: "", notes: ""
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmtThaiDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return "-";
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function getStatus(r) {
  if (r.patientReceivedDate) return { key: "done", label: "ผู้ป่วยรับยาแล้ว", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (r.receivedBy) return { key: "atStation", label: "หน่วยรับยาแล้ว", icon: PackageCheck, cls: "bg-teal-50 text-teal-700 border-teal-200" };
  if (r.dispatchDate) return { key: "dispatched", label: "จัดส่งไปหน่วยแล้ว", icon: Truck, cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (r.orderDate) return { key: "ordered", label: "รอจัดส่งยา", icon: Clock, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return { key: "new", label: "ยังไม่สั่งยา", icon: Clock, cls: "bg-slate-100 text-slate-500 border-slate-200" };
}

function riskDot(value) {
  if (!value) return "bg-slate-300";
  if (value.includes("แดง")) return "bg-rose-500";
  if (value.includes("เหลือง")) return "bg-amber-400";
  if (value.includes("เขียว")) return "bg-emerald-500";
  return "bg-slate-300";
}

function toDateInput(v) {
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
  }
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    if (!isNaN(d) && /\d{4}/.test(v)) return d.toISOString().slice(0, 10);
  }
  return "";
}

function mapImportedRow(row) {
  const clinicRaw = String(row["คลินิก/ผู้ป่วยนอก"] || "").trim();
  const tags = clinicRaw
    ? clinicRaw.split(/[\/\s]+/).map(t => t.trim()).filter(Boolean).filter(t => CLINICS.includes(t))
    : [];
  return {
    id: uid(),
    hn: String(row["HN"] || "").replace(/\.0$/, ""),
    name: String(row["ชื่อ-สกุล"] || "").trim(),
    clinicTags: tags.length ? tags : (clinicRaw ? ["อื่นๆ"] : []),
    bp: "", fbs: "",
    rights: String(row["สิทธิ์รักษา"] || "").trim(),
    orderDate: toDateInput(row["วันที่สั่งยา"]),
    nextAppt: toDateInput(row["นัดครั้งต่อไปที่รพ"]),
    facility: String(row["หน่วยงานที่ทำ"] || "").trim(),
    sentTo: String(row["ส่งยาไป"] || "").trim(),
    dispatchDate: toDateInput(row["วันที่จัดส่งยา"]),
    pharmacist: String(row["เภสัชกร"] || "").trim(),
    injection: String(row["ยาฉีด"] || "").trim(),
    receivedBy: String(row["จนท รพสต ที่รับยา(ตอนเปิดกล่อง)"] || "").trim(),
    patientReceivedDate: toDateInput(row["วันที่ผู้ป่วยรับยา"]),
    notes: String(row["หมายเหตุ"] || "").trim()
  };
}

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium ${isErr ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-teal-50 border-teal-200 text-teal-700"}`}>
      {toast.msg}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600 font-medium">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

function RecordModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || emptyForm);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleClinic = (c) => {
    setForm(f => ({
      ...f,
      clinicTags: f.clinicTags.includes(c) ? f.clinicTags.filter(x => x !== c) : [...f.clinicTags, c]
    }));
  };
  const submit = (e) => {
    e.preventDefault();
    if (!form.hn.trim() || !form.name.trim()) return;
    onSave({ ...form, id: form.id || uid() });
  };
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl">
          <h2 className="text-base font-semibold text-slate-800">{form.id ? "แก้ไขรายการ" : "เพิ่มรายการผู้ป่วย"}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">ข้อมูลผู้ป่วย</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="HN *"><input required className={inputCls} value={form.hn} onChange={e => set("hn", e.target.value)} placeholder="เลขประจำตัวผู้ป่วย" /></Field>
              <Field label="ชื่อ-สกุล *"><input required className={inputCls} value={form.name} onChange={e => set("name", e.target.value)} placeholder="ชื่อ นามสกุล" /></Field>
            </div>
            <Field label="คลินิก/กลุ่มโรค">
              <div className="flex flex-wrap gap-2 mt-1">
                {CLINICS.map(c => (
                  <button type="button" key={c} onClick={() => toggleClinic(c)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${form.clinicTags.includes(c) ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-300"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <Field label="ความดัน (BP)">
                <select className={inputCls} value={form.bp} onChange={e => set("bp", e.target.value)}>
                  <option value="">ไม่ระบุ</option>
                  {BP_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="น้ำตาล (FBS/DTX)">
                <select className={inputCls} value={form.fbs} onChange={e => set("fbs", e.target.value)}>
                  <option value="">ไม่ระบุ</option>
                  {FBS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="สิทธิ์การรักษา">
                <select className={inputCls} value={form.rights} onChange={e => set("rights", e.target.value)}>
                  <option value="">ไม่ระบุ</option>
                  {RIGHTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">การสั่งยา</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="วันที่สั่งยา"><input type="date" className={inputCls} value={form.orderDate} onChange={e => set("orderDate", e.target.value)} /></Field>
              <Field label="นัดครั้งต่อไปที่ รพ."><input type="date" className={inputCls} value={form.nextAppt} onChange={e => set("nextAppt", e.target.value)} /></Field>
              <Field label="ยาฉีด"><input className={inputCls} value={form.injection} onChange={e => set("injection", e.target.value)} placeholder="ระบุ (ถ้ามี)" /></Field>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">การจัดส่ง</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="หน่วยงานที่รับผิดชอบ">
                <select className={inputCls} value={form.facility} onChange={e => set("facility", e.target.value)}>
                  <option value="">เลือกหน่วยงาน</option>
                  {FACILITIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="ส่งยาไปที่"><input className={inputCls} value={form.sentTo} onChange={e => set("sentTo", e.target.value)} placeholder="ชื่อหน่วยปลายทาง" /></Field>
              <Field label="วันที่จัดส่งยา"><input type="date" className={inputCls} value={form.dispatchDate} onChange={e => set("dispatchDate", e.target.value)} /></Field>
              <Field label="เภสัชกรผู้จัดส่ง"><input className={inputCls} value={form.pharmacist} onChange={e => set("pharmacist", e.target.value)} placeholder="ชื่อเภสัชกร" /></Field>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">การรับยา</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="จนท. ที่รับยา (เปิดกล่อง)"><input className={inputCls} value={form.receivedBy} onChange={e => set("receivedBy", e.target.value)} placeholder="ชื่อเจ้าหน้าที่" /></Field>
              <Field label="วันที่ผู้ป่วยรับยา"><input type="date" className={inputCls} value={form.patientReceivedDate} onChange={e => set("patientReceivedDate", e.target.value)} /></Field>
            </div>
          </div>

          <Field label="หมายเหตุ"><textarea className={inputCls} rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="บันทึกเพิ่มเติม" /></Field>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 sticky bottom-0 bg-white rounded-b-xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50">ยกเลิก</button>
          <button type="submit" className="px-4 py-2 text-sm rounded-md bg-teal-600 text-white font-medium hover:bg-teal-700">บันทึก</button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDelete({ record, onCancel, onConfirm }) {
  if (!record) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2 text-rose-600 mb-2"><AlertTriangle size={20} /><h3 className="font-semibold">ลบรายการนี้?</h3></div>
        <p className="text-sm text-slate-600 mb-4">ลบข้อมูลของ <span className="font-medium text-slate-800">{record.name}</span> (HN {record.hn}) ออกจากระบบอย่างถาวร</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50">ยกเลิก</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-md bg-rose-600 text-white font-medium hover:bg-rose-700">ลบรายการ</button>
        </div>
      </div>
    </div>
  );
}

function PipelineHero({ counts }) {
  const stages = [
    { key: "ordered", label: "สั่งยาแล้ว", icon: Clock, tone: "slate" },
    { key: "dispatched", label: "จัดส่งไปหน่วยแล้ว", icon: Truck, tone: "amber" },
    { key: "atStation", label: "หน่วยรับยาแล้ว", icon: PackageCheck, tone: "teal" },
    { key: "done", label: "ผู้ป่วยรับยาแล้ว", icon: CheckCircle2, tone: "emerald" }
  ];
  const toneCls = {
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-100 text-amber-700",
    teal: "bg-teal-100 text-teal-700",
    emerald: "bg-emerald-100 text-emerald-700"
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-sm font-semibold text-slate-700 mb-4">เส้นทางการส่งยาถึงผู้ป่วย</p>
      <div className="flex items-center">
        {stages.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${toneCls[s.tone]}`}>
                  <Icon size={24} />
                </div>
                <p className="text-2xl font-bold text-slate-800">{counts[s.key] || 0}</p>
                <p className="text-xs text-slate-500 text-center max-w-[100px]">{s.label}</p>
              </div>
              {i < stages.length - 1 && <div className="h-0.5 flex-1 bg-slate-200 -mt-8" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, tone }) {
  const toneCls = {
    slate: "text-slate-800", amber: "text-amber-600", rose: "text-rose-600", teal: "text-teal-700", emerald: "text-emerald-700"
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${toneCls[tone] || "text-slate-800"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const PIE_COLORS = ["#0f766e", "#f59e0b", "#e11d48", "#0ea5e9", "#84cc16", "#7c3aed"];

export default function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterFacility, setFilterFacility] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("khh_records", true);
        setRecords(res ? JSON.parse(res.value) : []);
      } catch {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (next) => {
    setRecords(next);
    try {
      await window.storage.set("khh_records", JSON.stringify(next), true);
    } catch {
      showToast("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง", "error");
    }
  };

  const saveRecord = (rec) => {
    const exists = records.some(r => r.id === rec.id);
    const next = exists ? records.map(r => r.id === rec.id ? rec : r) : [rec, ...records];
    persist(next);
    setModalOpen(false);
    setEditRecord(null);
    showToast(exists ? "แก้ไขข้อมูลแล้ว" : "เพิ่มรายการแล้ว");
  };

  const confirmDelete = () => {
    persist(records.filter(r => r.id !== deleteTarget.id));
    showToast("ลบรายการแล้ว");
    setDeleteTarget(null);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const mapped = rows.map(mapImportedRow).filter(r => r.name || r.hn);
      if (!mapped.length) { showToast("ไม่พบข้อมูลที่นำเข้าได้ในไฟล์นี้", "error"); return; }
      await persist([...mapped, ...records]);
      showToast(`นำเข้าข้อมูลสำเร็จ ${mapped.length} รายการ`);
    } catch {
      showToast("นำเข้าข้อมูลไม่สำเร็จ ตรวจสอบรูปแบบไฟล์", "error");
    }
    e.target.value = "";
  };

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.hn.toLowerCase().includes(q)) return false;
      }
      if (filterFacility && r.facility !== filterFacility) return false;
      if (filterStatus && getStatus(r).key !== filterStatus) return false;
      return true;
    });
  }, [records, search, filterFacility, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kpis = useMemo(() => {
    const counts = { ordered: 0, dispatched: 0, atStation: 0, done: 0 };
    let overdue = 0;
    records.forEach(r => {
      const s = getStatus(r).key;
      if (s !== "new") counts[s] = (counts[s] || 0) + 1;
      if ((s === "ordered" || s === "dispatched") && r.orderDate) {
        const d = daysSince(r.orderDate);
        if (d !== null && d > 3) overdue++;
      }
    });
    const pipelineCounts = {
      ordered: counts.ordered + counts.dispatched + counts.atStation + counts.done,
      dispatched: counts.dispatched + counts.atStation + counts.done,
      atStation: counts.atStation + counts.done,
      done: counts.done
    };
    return { counts, overdue, pipelineCounts, total: records.length };
  }, [records]);

  const facilityData = useMemo(() => {
    const m = {};
    records.forEach(r => { if (r.facility) m[r.facility] = (m[r.facility] || 0) + 1; });
    return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [records]);

  const clinicData = useMemo(() => {
    const m = {};
    records.forEach(r => (r.clinicTags || []).forEach(c => { m[c] = (m[c] || 0) + 1; }));
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={20} /> กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      <Toast toast={toast} />
      {modalOpen && (
        <RecordModal
          initial={editRecord}
          onClose={() => { setModalOpen(false); setEditRecord(null); }}
          onSave={saveRecord}
        />
      )}
      <ConfirmDelete record={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />

      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-teal-800">KHH · ระบบติดตามการส่งยาทางไกล</h1>
            <p className="text-xs text-slate-500">เครือข่ายบริการปฐมภูมิ — ผู้ป่วยโรคเรื้อรัง</p>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setTab("dashboard")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${tab === "dashboard" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"}`}>
              <LayoutDashboard size={16} /> ภาพรวม
            </button>
            <button onClick={() => setTab("records")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${tab === "records" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"}`}>
              <ListChecks size={16} /> รายการผู้ป่วย
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {tab === "dashboard" ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KPICard label="ผู้ป่วยทั้งหมด" value={kpis.total} tone="slate" />
              <KPICard label="รอจัดส่งยา" value={kpis.counts.ordered} tone="slate" />
              <KPICard label="อยู่ระหว่างขนส่ง" value={kpis.counts.dispatched} tone="amber" />
              <KPICard label="รับยาครบแล้ว" value={kpis.counts.done} tone="emerald" />
              <KPICard label="เกินกำหนด 3 วัน" value={kpis.overdue} sub="ยังไม่จัดส่ง" tone="rose" />
            </div>

            <PipelineHero counts={kpis.pipelineCounts} />

            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-sm font-semibold text-slate-700 mb-3">จำนวนผู้ป่วยตามหน่วยบริการ</p>
                {facilityData.length ? (
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={facilityData} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0f766e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <EmptyMini text="ยังไม่มีข้อมูล" />}
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-sm font-semibold text-slate-700 mb-3">สัดส่วนกลุ่มโรค</p>
                {clinicData.length ? (
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={clinicData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={{ fontSize: 11 }}>
                          {clinicData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <EmptyMini text="ยังไม่มีข้อมูล" />}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex flex-wrap gap-2 flex-1">
                <div className="relative">
                  <Search size={15} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="ค้นหาชื่อ หรือ HN" className={`${inputCls} pl-8 w-56`} />
                </div>
                <select value={filterFacility} onChange={e => { setFilterFacility(e.target.value); setPage(1); }} className={inputCls}>
                  <option value="">ทุกหน่วยงาน</option>
                  {FACILITIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className={inputCls}>
                  <option value="">ทุกสถานะ</option>
                  <option value="ordered">รอจัดส่งยา</option>
                  <option value="dispatched">จัดส่งไปหน่วยแล้ว</option>
                  <option value="atStation">หน่วยรับยาแล้ว</option>
                  <option value="done">ผู้ป่วยรับยาแล้ว</option>
                </select>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer">
                  <Upload size={15} /> นำเข้าไฟล์ Excel/CSV
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
                </label>
                <button onClick={() => { setEditRecord(null); setModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-teal-600 text-white font-medium hover:bg-teal-700">
                  <Plus size={16} /> เพิ่มรายการ
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">HN</th>
                      <th className="text-left px-4 py-3 font-medium">ชื่อ-สกุล</th>
                      <th className="text-left px-4 py-3 font-medium">คลินิก</th>
                      <th className="text-left px-4 py-3 font-medium">ความเสี่ยง</th>
                      <th className="text-left px-4 py-3 font-medium">หน่วยงาน</th>
                      <th className="text-left px-4 py-3 font-medium">สถานะ</th>
                      <th className="text-left px-4 py-3 font-medium">นัดครั้งต่อไป</th>
                      <th className="text-right px-4 py-3 font-medium">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pageRows.map(r => {
                      const s = getStatus(r);
                      const Icon = s.icon;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500">{r.hn}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{r.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(r.clinicTags || []).map(c => <span key={c} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{c}</span>)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${riskDot(r.bp)}`} title={r.bp || "BP: ไม่ระบุ"} />
                              <span className={`w-2.5 h-2.5 rounded-full ${riskDot(r.fbs)}`} title={r.fbs || "FBS: ไม่ระบุ"} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{r.facility || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${s.cls}`}>
                              <Icon size={12} /> {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{fmtThaiDate(r.nextAppt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => { setEditRecord(r); setModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded"><Pencil size={15} /></button>
                              <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!pageRows.length && (
                <div className="py-14 text-center text-slate-400">
                  <Inbox className="mx-auto mb-2" size={28} />
                  <p className="text-sm">ยังไม่มีรายการ ลองเพิ่มรายการใหม่ หรือปรับตัวกรอง</p>
                </div>
              )}
              {filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
                  <span>หน้า {page} จาก {totalPages} ({filtered.length} รายการ)</span>
                  <div className="flex gap-1">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded border border-slate-200 disabled:opacity-40"><ChevronLeft size={15} /></button>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded border border-slate-200 disabled:opacity-40"><ChevronRight size={15} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyMini({ text }) {
  return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">{text}</div>;
}
