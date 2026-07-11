import React from 'react';
import { AlertTriangle } from "lucide-react";

export default function ConfirmDelete({ record, onCancel, onConfirm }) {
  if (!record) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2 text-rose-600 mb-2">
          <AlertTriangle size={20} />
          <h3 className="font-semibold">ลบรายการนี้?</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          ลบข้อมูลของ <span className="font-medium text-slate-800">{record.name}</span> (HN {record.hn}) ออกจากระบบอย่างถาวร
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50">
            ยกเลิก
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-md bg-rose-600 text-white font-medium hover:bg-rose-700">
            ลบรายการ
          </button>
        </div>
      </div>
    </div>
  );
}
