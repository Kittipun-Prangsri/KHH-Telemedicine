import React, { useState } from 'react';
import { X, Upload, Clipboard, Check, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toDateInput, mapImportedRow, uid } from '../utils';
import { CLINICS } from '../constants';

export default function ImportModal({ onClose, onImport, showToast }) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'paste'
  const [pasteText, setPasteText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');

  // Handle Excel file parse
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      
      const mapped = rows.map(mapImportedRow).filter(r => r.name || r.hn);
      if (!mapped.length) {
        showToast("ไม่พบข้อมูลผู้ป่วยที่สามารถนำเข้าได้ในไฟล์นี้", "error");
        setParsedData([]);
      } else {
        setParsedData(mapped);
        showToast(`วิเคราะห์ข้อมูลสำเร็จพบ ${mapped.length} รายการ`, "success");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการเปิดไฟล์ กรุณาตรวจสอบรูปแบบไฟล์", "error");
      setParsedData([]);
    }
  };

  // Helper to detect and parse pasted TSV string from Excel
  const handlePasteParse = () => {
    if (!pasteText.trim()) {
      showToast("กรุณาวางข้อมูลก่อนกดวิเคราะห์", "error");
      return;
    }
    
    try {
      const lines = pasteText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        setParsedData([]);
        return;
      }
      
      const headers = lines[0].split('\t').map(h => h.trim());
      const hasHeader = headers.some(h => h.toLowerCase().includes('hn') || h.includes('ชื่อ') || h.includes('สกุล'));
      const startIndex = hasHeader ? 1 : 0;
      
      const getHeaderIndex = (names) => {
        return headers.findIndex(h => names.some(n => h.toLowerCase().includes(n)));
      };
      
      // Attempt smart index mapping
      const hnIdx = hasHeader ? getHeaderIndex(['hn', 'เลขประจำตัว']) : 0;
      const nameIdx = hasHeader ? getHeaderIndex(['ชื่อ', 'นามสกุล', 'ชื่อ-สกุล']) : 1;
      const clinicIdx = hasHeader ? getHeaderIndex(['คลินิก', 'กลุ่มโรค', 'ผู้ป่วยนอก']) : 2;
      const rightsIdx = hasHeader ? getHeaderIndex(['สิทธิ์', 'สิทธิ']) : 3;
      const orderDateIdx = hasHeader ? getHeaderIndex(['วันที่สั่งยา', 'สั่งยา']) : 4;
      const nextApptIdx = hasHeader ? getHeaderIndex(['นัดครั้งต่อไป', 'วันนัด']) : 5;
      const facilityIdx = hasHeader ? getHeaderIndex(['หน่วยงานที่ทำ', 'หน่วยงาน', 'รพ.สต']) : 6;
      const sentToIdx = hasHeader ? getHeaderIndex(['ส่งยาไป']) : 7;
      const dispatchDateIdx = hasHeader ? getHeaderIndex(['วันที่จัดส่งยา', 'จัดส่งยา']) : 8;
      const pharmacistIdx = hasHeader ? getHeaderIndex(['เภสัชกร']) : 9;
      const injectionIdx = hasHeader ? getHeaderIndex(['ยาฉีด']) : 10;
      const receivedByIdx = hasHeader ? getHeaderIndex(['จนท รพสต', 'ผู้รับยา']) : 11;
      const patientReceivedDateIdx = hasHeader ? getHeaderIndex(['วันที่ผู้ป่วยรับยา', 'ผู้ป่วยรับยา']) : 12;
      const notesIdx = hasHeader ? getHeaderIndex(['หมายเหตุ']) : 13;

      const rows = [];
      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        if (cols.length < 2) continue; // Needs HN and Name at least

        const getValue = (idx, def = "") => {
          if (idx === -1 || idx >= cols.length) return def;
          return cols[idx].trim();
        };

        const clinicRaw = getValue(clinicIdx);
        const tags = clinicRaw
          ? clinicRaw.split(/[\/\s]+/).map(t => t.trim()).filter(Boolean).filter(t => CLINICS.includes(t))
          : [];

        rows.push({
          id: uid(),
          hn: getValue(hnIdx).replace(/\.0$/, ""),
          name: getValue(nameIdx),
          clinicTags: tags.length ? tags : (clinicRaw ? ["อื่นๆ"] : []),
          bp: "", 
          fbs: "",
          rights: getValue(rightsIdx),
          orderDate: toDateInput(getValue(orderDateIdx)),
          nextAppt: toDateInput(getValue(nextApptIdx)),
          facility: getValue(facilityIdx),
          sentTo: getValue(sentToIdx),
          dispatchDate: toDateInput(getValue(dispatchDateIdx)),
          pharmacist: getValue(pharmacistIdx),
          injection: getValue(injectionIdx),
          receivedBy: getValue(receivedByIdx),
          patientReceivedDate: toDateInput(getValue(patientReceivedDateIdx)),
          notes: getValue(notesIdx)
        });
      }

      if (rows.length === 0) {
        showToast("ไม่สามารถประมวลผลข้อมูลได้ กรุณาตรวจสอบคอลัมน์", "error");
        setParsedData([]);
      } else {
        setParsedData(rows);
        showToast(`วิเคราะห์ข้อมูลสำเร็จพบ ${rows.length} รายการ`, "success");
      }
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูลที่คัดลอกมา", "error");
      setParsedData([]);
    }
  };

  const handleImportSubmit = () => {
    if (parsedData.length === 0) return;
    onImport(parsedData);
    onClose();
  };

  const downloadTemplate = () => {
    const headers = [
      "HN", "ชื่อ-สกุล", "คลินิก/ผู้ป่วยนอก", "สิทธิ์รักษา", "วันที่สั่งยา", 
      "นัดครั้งต่อไปที่รพ", "หน่วยงานที่ทำ", "ส่งยาไป", "วันที่จัดส่งยา", "เภสัชกร", 
      "ยาฉีด", "จนท รพสต ที่รับยา(ตอนเปิดกล่อง)", "วันที่ผู้ป่วยรับยา", "หมายเหตุ"
    ];
    const dummyRows = [
      {
        "HN": "12345/69",
        "ชื่อ-สกุล": "นายสมชาย ใจดี",
        "คลินิก/ผู้ป่วยนอก": "HT/DM",
        "สิทธิ์รักษา": "บัตรทอง",
        "วันที่สั่งยา": "2026-07-10",
        "นัดครั้งต่อไปที่รพ": "2026-10-10",
        "หน่วยงานที่ทำ": "นาดี",
        "ส่งยาไป": "รพ.สต.นาดี",
        "วันที่จัดส่งยา": "2026-07-11",
        "เภสัชกร": "ภญ.สมศรี รักเรียน",
        "ยาฉีด": "Insulin",
        "จนท รพสต ที่รับยา(ตอนเปิดกล่อง)": "นางสมใจ งานดี",
        "วันที่ผู้ป่วยรับยา": "2026-07-12",
        "หมายเหตุ": "ผู้ป่วยมารับตรงเวลา"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(dummyRows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Import");
    XLSX.writeFile(wb, "template_telemed.xlsx");
    showToast("ดาวน์โหลดไฟล์เทมเพลตสำเร็จ", "success");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div 
        onClick={e => e.stopPropagation()} 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-teal-600" size={20} />
              นำเข้าข้อมูลผู้ป่วยแบบกลุ่ม
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">นำเข้าข้อมูลโดยการอัปโหลดไฟล์ Excel หรือคัดลอกเซลล์มาวาง</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50">
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-50 border-b border-slate-100 shrink-0 p-1.5 gap-1.5">
          <button 
            onClick={() => { setActiveTab('file'); setParsedData([]); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'file' 
                ? "bg-white text-teal-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload size={14} />
            นำเข้าด้วยไฟล์ Excel (.xlsx, .xls, .csv)
          </button>
          <button 
            onClick={() => { setActiveTab('paste'); setParsedData([]); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'paste' 
                ? "bg-white text-teal-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clipboard size={14} />
            คัดลอกจาก Excel มาวางแบบด่วน
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'file' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-8 text-center bg-slate-50/50 transition-colors relative group">
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload size={22} />
                  </div>
                  <p className="text-sm font-bold text-slate-700 mt-1">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</p>
                  <p className="text-xs text-slate-400">รองรับรูปแบบไฟล์ Excel (.xlsx, .xls) หรือ CSV</p>
                  {fileName && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-100 rounded-lg text-xs text-teal-700 font-medium">
                      ไฟล์ที่เลือก: {fileName}
                    </div>
                  )}
                </div>
              </div>

              {/* Format Hints */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50 flex items-start gap-3">
                <AlertCircle className="text-slate-500 shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-slate-500 leading-relaxed flex-1">
                  <p className="font-bold text-slate-700">รูปแบบหัวตาราง Excel ที่รองรับ:</p>
                  <p className="mt-1">ต้องมีหัวตาราง ได้แก่: <span className="font-semibold text-slate-700">HN, ชื่อ-สกุล, คลินิก/ผู้ป่วยนอก, สิทธิ์รักษา, วันที่สั่งยา, นัดครั้งต่อไปที่รพ, หน่วยงานที่ทำ, ส่งยาไป, วันที่จัดส่งยา, เภสัชกร, ยาฉีด, จนท รพสต ที่รับยา(ตอนเปิดกล่อง), วันที่ผู้ป่วยรับยา, หมายเหตุ</span></p>
                  <div className="mt-3">
                    <button 
                      type="button"
                      onClick={downloadTemplate}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-teal-200 hover:bg-teal-50 hover:border-teal-300 text-teal-700 rounded-xl font-bold shadow-sm transition-all"
                    >
                      <FileSpreadsheet size={14} className="text-teal-600" />
                      ดาวน์โหลดไฟล์เทมเพลต Excel (.xlsx)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block">วางข้อมูลเซลล์จาก Excel (คัดลอกหลายแถวและกดวางที่นี่):</label>
                <textarea 
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="คัดลอกแถวข้อมูลรวมหัวตารางจาก Excel แล้ววางที่นี่ (เช่น:&#10;HN	ชื่อ-สกุล	คลินิก/ผู้ป่วยนอก	สิทธิ์รักษา&#10;12345	นายสมชาย ใจดี	HT/DM	บัตรทอง)"
                  rows={6}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-50/20"
                />
              </div>

              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={handlePasteParse}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-xl transition-all"
                >
                  <Check size={14} />
                  วิเคราะห์ข้อมูลที่วาง
                </button>
              </div>
            </div>
          )}

          {/* Parse Preview Container */}
          {parsedData.length > 0 && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">พรีวิวตัวอย่างข้อมูลที่จะนำเข้า ({parsedData.length} รายการ)</p>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-bold">ข้อมูลถูกต้อง</span>
              </div>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 bg-slate-50">HN</th>
                      <th className="px-4 py-2 bg-slate-50">ชื่อ-สกุล</th>
                      <th className="px-4 py-2 bg-slate-50">สิทธิ์รักษา</th>
                      <th className="px-4 py-2 bg-slate-50">หน่วยงาน</th>
                      <th className="px-4 py-2 bg-slate-50">ส่งยาไป</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                    {parsedData.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-mono">{r.hn || "-"}</td>
                        <td className="px-4 py-2 font-medium text-slate-800">{r.name || "-"}</td>
                        <td className="px-4 py-2">{r.rights || "-"}</td>
                        <td className="px-4 py-2">{r.facility || "-"}</td>
                        <td className="px-4 py-2">{r.sentTo || "-"}</td>
                      </tr>
                    ))}
                    {parsedData.length > 10 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-center text-slate-400 bg-slate-50/30 italic">
                          ... และอีก {parsedData.length - 10} รายการ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            type="button"
            disabled={parsedData.length === 0}
            onClick={handleImportSubmit}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600 shadow-sm transition-all"
          >
            <Check size={14} />
            กดยืนยันนำเข้าข้อมูล ({parsedData.length} รายการ)
          </button>
        </div>
      </div>
    </div>
  );
}
