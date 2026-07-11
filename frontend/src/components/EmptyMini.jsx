import React from 'react';

export default function EmptyMini({ text }) {
  return (
    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
      {text}
    </div>
  );
}
