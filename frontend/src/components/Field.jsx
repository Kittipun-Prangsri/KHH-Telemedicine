import React from 'react';

export default function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm w-full">
      <span className="text-slate-600 font-medium">{label}</span>
      {children}
    </label>
  );
}
