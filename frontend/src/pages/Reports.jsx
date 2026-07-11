import React, { useState, useMemo } from 'react';
import { Printer, Filter, MapPin, Calendar, HeartPulse, FileText, CheckCircle2, PackageCheck, Truck, Clock } from 'lucide-react';
import { FACILITIES, CLINICS } from '../constants';
import { getStatus, fmtThaiDate } from '../utils';

export default function Reports({ records }) {
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // กรองข้อมูลตามที่เลือก
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedFacility && r.facility !== selectedFacility) return false;
      if (selectedClinic && !(r.clinicTags || []).includes(selectedClinic)) return false;
      if (selectedStatus && getStatus(r).key !== selectedStatus) return false;
      return true;
    });
  }, [records, selectedFacility, selectedClinic, selectedStatus]);

  // นับสถิติสำหรับกลุ่มที่กรอง
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    let ordered = 0, dispatched = 0, atStation = 0, done = 0;
    
    filteredRecords.forEach(r => {
      const statusKey = getStatus(r).key;
      if (statusKey === 'ordered') ordered++;
      else if (statusKey === 'dispatched') dispatched++;
      else if (statusKey === 'atStation') atStation++;
      else if (statusKey === 'done') done++;
    });

    return { total, ordered, dispatched, atStation, done };
  }, [filteredRecords]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn max-w-5xl print:p-0 print:m-0">
      {/* ส่วนควบคุมและตัวกรอง (ซ่อนเวลาพิมพ์) */}
      <div className="print:hidden space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText size={22} className="text-teal-600" />
            รายงานและพิมพ์ PDF (Reports & PDF Export)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">ออกรายงานสรุปผู้ป่วยแยกตามหน่วยงาน คลินิก หรือสถานะจัดส่งยา พร้อมพิมพ์เป็นเอกสาร A4</p>
        </div>

        {/* กล่องตัวกรองรายงาน */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Filter size={14} /> ตัวกรองรายงาน (Report Filters)
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">หน่วยงานปฐมภูมิ (รพ.สต.)</label>
              <select
                value={selectedFacility}
                onChange={e => setSelectedFacility(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">ทั้งหมดทุกแห่ง</option>
                {FACILITIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">คลินิก / กลุ่มโรค</label>
              <select
                value={selectedClinic}
                onChange={e => setSelectedClinic(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">ทั้งหมดทุกกลุ่มโรค</option>
                {CLINICS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">สถานะจัดส่ง</label>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">ทุกสถานะ</option>
                <option value="ordered">รอจัดส่งยา</option>
                <option value="dispatched">จัดส่งไปหน่วยแล้ว</option>
                <option value="atStation">หน่วยรับยาแล้ว</option>
                <option value="done">ผู้ป่วยรับยาแล้ว</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500">
              พบข้อมูลที่ตรงตามเงื่อนไข <span className="text-teal-600 font-extrabold text-sm">{filteredRecords.length}</span> รายการ
            </span>
            <button
              onClick={handlePrint}
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-teal-900/10 cursor-pointer"
            >
              <Printer size={16} /> พิมพ์รายงาน (Print PDF)
            </button>
          </div>
        </div>
      </div>

      {/* เอกสาร A4 สำหรับพิมพ์ (Print-Ready Document) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 print:p-0 print:border-none print:shadow-none shadow-md space-y-6 mx-auto max-w-[210mm] min-h-[297mm]">
        {/* หัวเอกสารตราโรงพยาบาล */}
        <div className="flex justify-between items-start border-b-2 border-teal-600 pb-5">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 print:bg-white">
              <HeartPulse size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">รายงานสรุปข้อมูลผู้ป่วย Telemedicine</h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">โรงพยาบาลคลองหาด อำเภอคลองหาด จังหวัดสระแก้ว</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 font-medium">
            <p className="flex items-center gap-1 justify-end font-bold text-slate-600">
              <Calendar size={12} /> ข้อมูล ณ วันที่: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="mt-1">ระบบงานหลักปฐมภูมิเครือข่าย KHH</p>
          </div>
        </div>

        {/* รายละเอียดตัวกรองรายงาน */}
        <div className="grid grid-cols-2 bg-slate-50 border border-slate-200/40 rounded-xl px-4 py-3 text-xs text-slate-600 print:bg-slate-50">
          <div>
            <p><strong>หน่วยงานรับยา:</strong> {selectedFacility || 'ทุกหน่วยงาน (รพ.สต.)'}</p>
            <p className="mt-1"><strong>คลินิก/กลุ่มโรค:</strong> {selectedClinic || 'ทุกคลินิกบริการ'}</p>
          </div>
          <div className="text-right">
            <p><strong>สถานะจัดส่ง:</strong> {selectedStatus ? getStatus({ patientReceivedDate: selectedStatus === 'done' ? '1' : null, receivedBy: selectedStatus === 'atStation' ? '1' : null, dispatchDate: selectedStatus === 'dispatched' ? '1' : null, orderDate: selectedStatus === 'ordered' ? '1' : null }).label : 'ทุกสถานะ'}</p>
            <p className="mt-1"><strong>จำนวนข้อมูลรวม:</strong> {filteredRecords.length} รายการ</p>
          </div>
        </div>

        {/* ตารางข้อมูลรายงาน */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="border border-slate-200 px-3 py-2.5 text-center w-12">ลำดับ</th>
                <th className="border border-slate-200 px-3 py-2.5 w-18">HN</th>
                <th className="border border-slate-200 px-3 py-2.5">ชื่อ - สกุล</th>
                <th className="border border-slate-200 px-3 py-2.5 w-16 text-center">กลุ่มโรค</th>
                <th className="border border-slate-200 px-3 py-2.5 w-24">หน่วยบริการ</th>
                <th className="border border-slate-200 px-3 py-2.5 w-20">วันที่สั่งยา</th>
                <th className="border border-slate-200 px-3 py-2.5">สถานะจัดส่ง</th>
                <th className="border border-slate-200 px-3 py-2.5 w-20">ผู้ป่วยรับยา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredRecords.map((r, index) => {
                const s = getStatus(r);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/30">
                    <td className="border border-slate-200 px-3 py-2 text-center font-bold text-slate-500">{index + 1}</td>
                    <td className="border border-slate-200 px-3 py-2 font-mono font-bold text-[11px] text-slate-600">{r.hn}</td>
                    <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-800">{r.name}</td>
                    <td className="border border-slate-200 px-3 py-2 text-center text-[10px] font-bold text-slate-500">
                      {(r.clinicTags || []).join(', ') || '-'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600">{r.facility || '-'}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-500">{fmtThaiDate(r.orderDate)}</td>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">
                      <span className="text-[11px]">{s.label}</span>
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-500">
                      {r.patientReceivedDate ? fmtThaiDate(r.patientReceivedDate) : '-'}
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="8" className="border border-slate-200 px-4 py-8 text-center text-slate-400 italic">
                    ไม่พบข้อมูลผู้ป่วยตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* สรุปสถิติด้านล่างเอกสาร */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase">รอจัดส่งยา</p>
            <p className="text-base font-extrabold text-slate-700">{stats.ordered} ราย</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase">อยู่ระหว่างนำส่ง</p>
            <p className="text-base font-extrabold text-amber-600">{stats.dispatched} / {stats.atStation} ราย</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase">ผู้ป่วยรับแล้ว</p>
            <p className="text-base font-extrabold text-emerald-600">{stats.done} ราย</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase">รวมข้อมูลทั้งหมด</p>
            <p className="text-base font-extrabold text-teal-600">{stats.total} ราย</p>
          </div>
        </div>

        {/* ส่วนลงชื่อของเจ้าหน้าที่ท้ายรายงาน */}
        <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4 text-xs font-semibold text-slate-500">
          <div>
            <p>พิมพ์โดย: _____________________________________</p>
            <p className="mt-1.5 ml-12">( เจ้าหน้าที่ผู้ปฏิบัติงานจัดส่งยา )</p>
          </div>
          <div className="text-left md:text-right pr-6">
            <p>ตรวจทานโดย: _____________________________________</p>
            <p className="mt-1.5 ml-12 md:text-center md:inline-block">( หัวหน้ากลุ่มงานเภสัชกรรม / ผู้ตรวจสอบ )</p>
          </div>
        </div>
      </div>
    </div>
  );
}
