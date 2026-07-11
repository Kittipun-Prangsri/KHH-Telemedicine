import { THAI_MONTHS, CLINICS } from "./constants";
import { CheckCircle2, PackageCheck, Truck, Clock } from "lucide-react";

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function fmtThaiDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return "-";
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export function getStatus(r) {
  if (r.patientReceivedDate) return { key: "done", label: "ผู้ป่วยรับยาแล้ว", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (r.receivedBy) return { key: "atStation", label: "หน่วยรับยาแล้ว", icon: PackageCheck, cls: "bg-teal-50 text-teal-700 border-teal-200" };
  if (r.dispatchDate) return { key: "dispatched", label: "จัดส่งไปหน่วยแล้ว", icon: Truck, cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (r.orderDate) return { key: "ordered", label: "รอจัดส่งยา", icon: Clock, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return { key: "new", label: "ยังไม่สั่งยา", icon: Clock, cls: "bg-slate-100 text-slate-500 border-slate-200" };
}

export function riskDot(value) {
  if (!value) return "bg-slate-300";
  if (value.includes("แดง")) return "bg-rose-500";
  if (value.includes("เหลือง")) return "bg-amber-400";
  if (value.includes("เขียว")) return "bg-emerald-500";
  return "bg-slate-300";
}

export function toDateInput(v) {
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

export function mapImportedRow(row) {
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
