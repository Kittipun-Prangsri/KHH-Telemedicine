import React, { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Search, Upload, ChevronLeft, ChevronRight, Inbox
} from "lucide-react";
import * as XLSX from "xlsx";
import { FACILITIES } from "../constants";
import { getStatus, fmtThaiDate, riskDot, mapImportedRow } from "../utils";

const inputCls = "border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200";

export default function Records({ records, onAddClick, onEditClick, onDeleteClick, onImportClick, showToast }) {
  const [search, setSearch] = useState("");
  const [filterFacility, setFilterFacility] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12; // Increased size because of full-screen layout

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

  return (
    <div className="space-y-5 w-full animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800">จัดการข้อมูลผู้ป่วย (Patient Records)</h2>
          <p className="text-xs text-slate-500 mt-0.5">ค้นหา นำเข้าข้อมูล และปรับปรุงรายละเอียดข้อมูลการจัดส่งยา</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onImportClick}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all duration-200"
          >
            <Upload size={15} /> นำเข้าข้อมูลแบบกลุ่ม
          </button>
          <button 
            onClick={onAddClick} 
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 shadow-sm shadow-teal-100 hover:shadow-md hover:shadow-teal-100 transition-all duration-200"
          >
            <Plus size={16} /> เพิ่มรายการผู้ป่วย
          </button>
        </div>
      </div>

      {/* Filter and Search Action Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1); }} 
            placeholder="ค้นหารหัส HN หรือชื่อ-นามสกุล..." 
            className={`${inputCls} pl-9 w-full`} 
          />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <select 
            value={filterFacility} 
            onChange={e => { setFilterFacility(e.target.value); setPage(1); }} 
            className={`${inputCls} min-w-[150px]`}
          >
            <option value="">ทุกหน่วยงานปฐมภูมิ</option>
            {FACILITIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          
          <select 
            value={filterStatus} 
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }} 
            className={`${inputCls} min-w-[150px]`}
          >
            <option value="">ทุกสถานะจัดส่ง</option>
            <option value="ordered">รอจัดส่งยา</option>
            <option value="dispatched">จัดส่งไปหน่วยแล้ว</option>
            <option value="atStation">หน่วยรับยาแล้ว</option>
            <option value="done">ผู้ป่วยรับยาแล้ว</option>
          </select>
          
          {(search || filterFacility || filterStatus) && (
            <button 
              onClick={() => { setSearch(""); setFilterFacility(""); setFilterStatus(""); setPage(1); }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1.5 rounded hover:bg-rose-50 transition-colors"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Main Table Grid Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[400px]">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
              <tr>
                <th className="px-5 py-4 font-bold">HN</th>
                <th className="px-5 py-4 font-bold">ชื่อ-สกุล</th>
                <th className="px-5 py-4 font-bold">คลินิก / กลุ่มโรค</th>
                <th className="px-5 py-4 font-bold text-center">ความเสี่ยง (BP / FBS)</th>
                <th className="px-5 py-4 font-bold">หน่วยปฐมภูมิ</th>
                <th className="px-5 py-4 font-bold">สิทธิ์การรักษา</th>
                <th className="px-5 py-4 font-bold">สถานะขนส่ง</th>
                <th className="px-5 py-4 font-bold">นัดรพ. ครั้งต่อไป</th>
                <th className="px-5 py-4 font-bold text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pageRows.map(r => {
                const s = getStatus(r);
                const Icon = s.icon;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500 font-bold">{r.hn}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{r.name}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(r.clinicTags || []).map(c => (
                          <span key={c} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/40">
                            {c}
                          </span>
                        ))}
                        {(!r.clinicTags || r.clinicTags.length === 0) && <span className="text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100" title={`ความดันโลหิต (BP): ${r.bp || "ไม่ระบุ"}`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${riskDot(r.bp)}`} />
                          <span className="text-[10px] text-slate-400 font-bold">BP</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100" title={`ระดับน้ำตาลในเลือด (FBS): ${r.fbs || "ไม่ระบุ"}`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${riskDot(r.fbs)}`} />
                          <span className="text-[10px] text-slate-400 font-bold">FBS</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-600">{r.facility || "-"}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{r.rights || "-"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${s.cls}`}>
                        <Icon size={12} className="stroke-[2.5]" />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium text-xs">{fmtThaiDate(r.nextAppt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => onEditClick(r)} 
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg border border-transparent hover:border-teal-200/50 transition-all duration-200"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => onDeleteClick(r)} 
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200/50 transition-all duration-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {!pageRows.length && (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center flex-1">
            <Inbox className="mb-2 text-slate-300" size={36} />
            <p className="text-sm font-semibold">ไม่พบรายการข้อมูลผู้ป่วย</p>
            <p className="text-xs text-slate-400 mt-1">ลองพิมพ์ค้นหาแบบอื่นหรือล้างค่าตัวกรองของคุณ</p>
          </div>
        )}
        
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-sm text-slate-500 bg-slate-50/50">
            <span className="font-medium text-xs">แสดงรายการที่ {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} จากทั้งหมด {filtered.length} รายการ</span>
            <div className="flex gap-1.5">
              <button 
                disabled={page <= 1} 
                onClick={() => setPage(p => p - 1)} 
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:hover:bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => p + 1)} 
                className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:hover:bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
