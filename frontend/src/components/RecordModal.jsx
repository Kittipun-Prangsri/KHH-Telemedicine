import React, { useState } from 'react';
import { X } from "lucide-react";
import Field from "./Field";
import { CLINICS, BP_OPTS, FBS_OPTS, RIGHTS, FACILITIES, emptyForm } from "../constants";
import { uid } from "../utils";

const inputCls = "border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full";

export default function RecordModal({ initial, onClose, onSave }) {
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
            <div className="mt-3">
              <Field label="คลินิก/กลุ่มโรค">
                <div className="flex flex-wrap gap-2 mt-1">
                  {CLINICS.map(c => (
                    <button type="button" key={c} onClick={() => toggleClinic(c)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.clinicTags.includes(c) ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
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
