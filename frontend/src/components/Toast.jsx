import React from 'react';

export default function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium ${isErr ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-teal-50 border-teal-200 text-teal-700"}`}>
      {toast.msg}
    </div>
  );
}
