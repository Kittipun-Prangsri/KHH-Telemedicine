import React, { useState, useMemo } from "react";
import {
  ArrowLeft, Activity, Calendar, User, ShieldCheck, MapPin, 
  Plus, TrendingUp, Info, CheckCircle2, Clock, Truck, PackageCheck, AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { getStatus, fmtThaiDate } from "../utils";

// LCG random generator helper to seed data deterministically by HN
const generateInitialReadings = (patient) => {
  const isHT = patient?.clinicTags?.includes("HT");
  const isDM = patient?.clinicTags?.includes("DM");
  
  const hnStr = patient?.hn ? String(patient.hn) : "";
  const seed = hnStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) || 123;
  const lcg = (s) => {
    let temp = s;
    return () => {
      temp = (temp * 1664525 + 1013904223) % 4294967296;
      return temp / 4294967296;
    };
  };
  const rand = lcg(seed);

  const readings = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    
    // BP generation (systolic / diastolic)
    let sys = 115 + Math.round(rand() * 20); // 115 - 135
    let dia = 75 + Math.round(rand() * 12);  // 75 - 87
    if (isHT) {
      sys += 15 + Math.round(rand() * 15);  // 130 - 165
      dia += 8 + Math.round(rand() * 10);   // 83 - 107
    }

    // FBS generation
    let fbsVal = 85 + Math.round(rand() * 25); // 85 - 110
    if (isDM) {
      fbsVal += 45 + Math.round(rand() * 70); // 130 - 200
    }

    readings.push({
      date: dateStr,
      sys,
      dia,
      fbs: fbsVal
    });
  }

  return readings;
};

export default function PatientDetail({ patient, onBack }) {
  const patientHn = patient?.hn ? String(patient.hn) : "";
  const patientId = patient?.id ? String(patient.id) : "default";
  const storageKey = `khh_readings_${patientHn || patientId}`;
  
  // Load readings from localstorage or generate initial data
  const [readings, setReadings] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Error parsing stored patient readings", e);
      }
    }
    const initial = generateInitialReadings(patient);
    localStorage.setItem(storageKey, JSON.stringify(initial));
    return initial;
  });

  // Form state for adding new readings
  const [newReading, setNewReading] = useState({
    date: new Date().toISOString().split("T")[0],
    sys: "",
    dia: "",
    fbs: ""
  });
  const [formError, setFormError] = useState("");

  const statusInfo = useMemo(() => {
    if (!patient) return { key: "new", label: "ไม่มีข้อมูล", icon: Clock, cls: "bg-slate-100 text-slate-500 border-slate-200" };
    return getStatus(patient);
  }, [patient]);

  // Construct Telemedicine Timeline steps
  const timelineSteps = useMemo(() => {
    const steps = [];
    if (!patient) return steps;
    
    // Step 1: Order
    steps.push({
      title: "ลงทะเบียนและรับคำสั่งยา",
      desc: patient.orderDate 
        ? `ยืนยันใบสั่งยาสำเร็จและนำเข้าสู่ระบบจัดส่งเมื่อ ${fmtThaiDate(patient.orderDate)}`
        : "รอการบันทึกคำสั่งยาจากแพทย์/โรงพยาบาล",
      date: patient.orderDate || null,
      active: !!patient.orderDate,
      icon: Clock,
      color: "text-slate-500 bg-slate-100 border-slate-200"
    });

    // Step 2: Dispatch
    steps.push({
      title: "ตรวจสอบและจัดส่งกล่องยาออก",
      desc: patient.dispatchDate 
        ? `เภสัชกร ${patient.pharmacist || "-"} ตรวจสอบความถูกต้องและจัดส่งยาออกเมื่อ ${fmtThaiDate(patient.dispatchDate)}`
        : "รอเภสัชกรเตรียมและจัดส่งกล่องยา",
      date: patient.dispatchDate || null,
      active: !!patient.dispatchDate,
      icon: Truck,
      color: patient.dispatchDate ? "text-amber-600 bg-amber-50 border-amber-200" : "text-slate-400 bg-slate-50 border-slate-200"
    });

    // Step 3: At Station
    steps.push({
      title: "หน่วยปฐมภูมิ (รพ.สต.) ได้รับยา",
      desc: patient.receivedBy 
        ? `เจ้าหน้าที่ ${patient.receivedBy} ณ รพ.สต.${patient.facility || "ปลายทาง"} ได้ทำการเปิดกล่องและตรวจรับยาเข้าระบบแล้ว`
        : `รอ รพ.สต.${patient.facility || "ปลายทาง"} ยืนยันการรับกล่องยา`,
      date: patient.dispatchDate && patient.receivedBy ? patient.dispatchDate : null,
      active: !!patient.receivedBy,
      icon: PackageCheck,
      color: patient.receivedBy ? "text-teal-600 bg-teal-50 border-teal-200" : "text-slate-400 bg-slate-50 border-slate-200"
    });

    // Step 4: Done
    steps.push({
      title: "ผู้ป่วยรับมอบยาเรียบร้อย",
      desc: patient.patientReceivedDate 
        ? `ผู้ป่วยลงลายมือชื่อรับมอบกล่องยาเรียบร้อยแล้วเมื่อ ${fmtThaiDate(patient.patientReceivedDate)}`
        : "อยู่ระหว่างการส่งมอบยาให้ถึงตัวผู้ป่วย ณ บ้าน/จุดบริการ",
      date: patient.patientReceivedDate || null,
      active: !!patient.patientReceivedDate,
      icon: CheckCircle2,
      color: patient.patientReceivedDate ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-slate-400 bg-slate-50 border-slate-200"
    });

    // Step 5: Next Appointment
    steps.push({
      title: "นัดติดตามอาการ ณ รพ.คลองหาดครั้งต่อไป",
      desc: patient.nextAppt 
        ? `มีนัดหมายเข้าพบแพทย์เพื่อติดตามอาการโรคเรื้อรัง ณ โรงพยาบาลหลักในวันที่ ${fmtThaiDate(patient.nextAppt)}`
        : "ยังไม่มีการนัดหมายครัั้งถัดไป",
      date: patient.nextAppt || null,
      active: !!patient.nextAppt,
      icon: Calendar,
      color: patient.nextAppt ? "text-indigo-600 bg-indigo-50 border-indigo-200" : "text-slate-400 bg-slate-50 border-slate-200"
    });

    return steps;
  }, [patient]);

  // Format data for chart display
  const chartData = useMemo(() => {
    return (readings || []).map(r => {
      const d = new Date(r.date);
      const formattedDate = !isNaN(d.getTime()) 
        ? `${d.getDate()} ${["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][d.getMonth()]}`
        : r.date;
      return {
        ...r,
        formattedDate,
        sys: Number(r.sys),
        dia: Number(r.dia),
        fbs: Number(r.fbs)
      };
    });
  }, [readings]);

  // Add a reading handler
  const handleAddReading = (e) => {
    e.preventDefault();
    setFormError("");

    const sysNum = parseInt(newReading.sys);
    const diaNum = parseInt(newReading.dia);
    const fbsNum = parseInt(newReading.fbs);

    if (!newReading.date) {
      setFormError("กรุณาระบุวันที่วัดผล");
      return;
    }
    if (isNaN(sysNum) || sysNum <= 0 || isNaN(diaNum) || diaNum <= 0) {
      setFormError("กรุณากรอกความดันโลหิต (SYS/DIA) ให้ถูกต้อง");
      return;
    }
    if (isNaN(fbsNum) || fbsNum <= 0) {
      setFormError("กรุณากรอกระดับน้ำตาล FBS ให้ถูกต้อง");
      return;
    }

    const updated = [...(readings || []), {
      date: newReading.date,
      sys: sysNum,
      dia: diaNum,
      fbs: fbsNum
    }].sort((a, b) => new Date(a.date) - new Date(b.date));

    setReadings(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Reset Form (except date to preserve workflow speed)
    setNewReading(prev => ({
      ...prev,
      sys: "",
      dia: "",
      fbs: ""
    }));
  };

  const getStatusText = (sys, dia, fbs) => {
    let bpStatus = "ปกติ";
    let bpColor = "text-emerald-600";
    if (sys >= 140 || dia >= 90) {
      bpStatus = "สูง (เหลือง)";
      bpColor = "text-amber-500 font-bold";
    }
    if (sys >= 160 || dia >= 100) {
      bpStatus = "สูงมาก (แดง)";
      bpColor = "text-rose-500 font-bold";
    }

    let fbsStatus = "ปกติ";
    let fbsColor = "text-emerald-600";
    if (fbs > 140) {
      fbsStatus = "สูง (เหลือง)";
      fbsColor = "text-amber-500 font-bold";
    }
    if (fbs > 200) {
      fbsStatus = "สูงมาก (แดง)";
      fbsColor = "text-rose-500 font-bold";
    }

    return { bpStatus, bpColor, fbsStatus, fbsColor };
  };

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="mx-auto text-rose-500 mb-2" size={32} />
        <p className="font-semibold">ไม่พบข้อมูลผู้ป่วยรายนี้</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
          กลับไปหน้ารายการ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-fadeIn pb-12">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-all duration-200"
            title="กลับไปยังหน้ารายการ"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">{patient.name || "ไม่ระบุชื่อ"}</h2>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusInfo.cls}`}>
                <statusInfo.icon size={11} />
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              เลขประจำตัวผู้ป่วย (HN): <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold">{patient.hn || "-"}</span>
              <span className="text-slate-300">|</span>
              <MapPin size={13} className="text-slate-400" />
              หน่วยดูแล: <span className="text-slate-700 font-bold">{patient.facility || "ไม่ระบุ"}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">วันนัดครั้งถัดไป</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{fmtThaiDate(patient.nextAppt)}</p>
          </div>
          <Calendar size={18} className="text-teal-600 ml-2" />
        </div>
      </div>

      {/* Patient Profile Demographics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="bg-teal-50 text-teal-600 p-2.5 rounded-xl border border-teal-100">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">สิทธิ์การรักษา</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">{patient.rights || "ไม่ระบุ"}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="bg-sky-50 text-sky-600 p-2.5 rounded-xl border border-sky-100">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">คลินิก / กลุ่มโรค</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {patient.clinicTags?.map(t => (
                <span key={t} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200/40">{t}</span>
              )) || "-"}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl border border-rose-100">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">ความเสี่ยงในระบบ</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-500 font-medium">BP: {patient.bp || "-"}</span>
              <span className="text-[10px] text-slate-500 font-medium">FBS: {patient.fbs || "-"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl border border-amber-100">
            <Info size={20} />
          </div>
          <div className="truncate flex-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase">หมายเหตุ</p>
            <p className="text-xs text-slate-600 mt-0.5 font-medium truncate" title={patient.notes}>{patient.notes || "-"}</p>
          </div>
        </div>
      </div>

      {/* Main Core Area: Charts + Form on Left, Timeline + History list on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Line Charts & Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* BP Chart */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">กราฟแนวโน้มความดันโลหิต (Blood Pressure Trend)</h3>
                <p className="text-xs text-slate-400 mt-0.5">หน่วยวัด: mmHg (เป้าหมาย &lt; 140/90 mmHg)</p>
              </div>
              <div className="flex gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-rose-500 inline-block border-t border-rose-500" />Systolic</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block border-t border-blue-500" />Diastolic</span>
              </div>
            </div>
            
            <div style={{ height: 220 }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                    formatter={(value, name) => [value, name === "sys" ? "SYS (ความดันบน)" : "DIA (ความดันล่าง)"]}
                  />
                  <Line type="monotone" dataKey="sys" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="dia" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FBS Chart */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">กราฟแนวโน้มระดับน้ำตาลในเลือด (Blood Sugar/FBS)</h3>
                <p className="text-xs text-slate-400 mt-0.5">หน่วยวัด: mg/dL (เป้าหมาย 80-130 mg/dL สำหรับผู้ป่วย DM)</p>
              </div>
              <div className="flex gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block border-t border-emerald-500" />Fasting Blood Sugar</span>
              </div>
            </div>
            
            <div style={{ height: 220 }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis domain={['dataMin - 20', 'dataMax + 20']} tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                    formatter={(value) => [value, "FBS (น้ำตาล)"]}
                  />
                  <Line type="monotone" dataKey="fbs" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Add Reading Interactive Form */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-teal-500/10 p-1.5 rounded-lg text-teal-400 border border-teal-500/20">
                <Plus size={16} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wide">เพิ่มบันทึกผลการตรวจสุขภาพ (Add Health Check Reading)</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">กรอกข้อมูลผลการวัดความดันและระดับน้ำตาลเพื่อนำไปพลอตแนวโน้มและวิเคราะห์ภาวะแทรกซ้อน</p>

            <form onSubmit={handleAddReading} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">วันที่ตรวจ</label>
                <input 
                  type="date"
                  required
                  value={newReading.date}
                  onChange={e => setNewReading(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-850 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">ความดันบน (SYS)</label>
                <input 
                  type="number"
                  required
                  placeholder="เช่น 120"
                  value={newReading.sys}
                  onChange={e => setNewReading(prev => ({ ...prev, sys: e.target.value }))}
                  className="w-full bg-slate-850 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">ความดันล่าง (DIA)</label>
                <input 
                  type="number"
                  required
                  placeholder="เช่น 80"
                  value={newReading.dia}
                  onChange={e => setNewReading(prev => ({ ...prev, dia: e.target.value }))}
                  className="w-full bg-slate-850 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">น้ำตาล FBS (mg/dL)</label>
                <input 
                  type="number"
                  required
                  placeholder="เช่น 100"
                  value={newReading.fbs}
                  onChange={e => setNewReading(prev => ({ ...prev, fbs: e.target.value }))}
                  className="w-full bg-slate-850 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200"
                />
              </div>
              
              <div className="sm:col-span-4 flex justify-between items-center mt-2 border-t border-slate-800 pt-3">
                {formError ? (
                  <p className="text-xs text-rose-400 font-semibold flex items-center gap-1"><AlertCircle size={14} /> {formError}</p>
                ) : <span />}
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: Timeline & History Log */}
        <div className="space-y-6">

          {/* Telemedicine Flow Timeline */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">ไทม์ไลน์จัดส่งยา (Telemedicine Status Timeline)</h3>
            
            <div className="relative border-l-2 border-slate-200/80 ml-3.5 space-y-6">
              {timelineSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative pl-7 group">
                    <span className={`absolute -left-[14px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                      step.active 
                        ? `${step.color} shadow-sm scale-110` 
                        : "text-slate-300 bg-white border-slate-200"
                    }`}>
                      <Icon size={12} className="stroke-[2.5]" />
                    </span>
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${step.active ? "text-slate-800" : "text-slate-400"}`}>
                          {step.title}
                        </h4>
                        {step.active && step.date && (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            {fmtThaiDate(step.date)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visit History Log Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">บันทึกประวัติการตรวจ (Clinical Readings Log)</h3>
            
            <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold tracking-wider uppercase border-b border-slate-150 sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5">วันที่</th>
                    <th className="px-3 py-2.5 text-center">BP</th>
                    <th className="px-3 py-2.5 text-center">FBS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                  {(readings || []).slice().reverse().map((r, i) => {
                    const { bpStatus, bpColor, fbsStatus, fbsColor } = getStatusText(r.sys, r.dia, r.fbs);
                    return (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-slate-700">{fmtThaiDate(r.date)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="font-mono font-bold block">{r.sys}/{r.dia}</span>
                          <span className={`text-[9px] ${bpColor} block`}>{bpStatus}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="font-mono font-bold block">{r.fbs} <span className="text-[10px] text-slate-400 font-normal">mg%</span></span>
                          <span className={`text-[9px] ${fbsColor} block`}>{fbsStatus}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
