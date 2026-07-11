import React from 'react';
import { Users, Clock, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';

const iconMap = {
  slate: Users,
  ordered: Clock,
  amber: Truck,
  emerald: CheckCircle2,
  rose: AlertTriangle
};

const toneStyles = {
  slate: {
    border: 'border-l-4 border-l-slate-400',
    iconBg: 'bg-slate-50 text-slate-500',
    valCls: 'text-slate-900',
    glow: 'hover:shadow-slate-100'
  },
  ordered: {
    border: 'border-l-4 border-l-teal-500',
    iconBg: 'bg-teal-50 text-teal-600',
    valCls: 'text-teal-900',
    glow: 'hover:shadow-teal-100'
  },
  amber: {
    border: 'border-l-4 border-l-amber-500',
    iconBg: 'bg-amber-50 text-amber-600',
    valCls: 'text-amber-700',
    glow: 'hover:shadow-amber-100'
  },
  emerald: {
    border: 'border-l-4 border-l-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600',
    valCls: 'text-emerald-700',
    glow: 'hover:shadow-emerald-100'
  },
  rose: {
    border: 'border-l-4 border-l-rose-500',
    iconBg: 'bg-rose-50 text-rose-600',
    valCls: 'text-rose-700',
    glow: 'hover:shadow-rose-100'
  }
};

export default function KPICard({ label, value, sub, tone }) {
  // Let's resolve specific icon mapping for ordered vs general slate
  let mappedTone = tone;
  if (tone === 'slate' && label.includes('รอ')) {
    mappedTone = 'ordered';
  }
  
  const style = toneStyles[mappedTone] || toneStyles.slate;
  const IconComponent = iconMap[mappedTone] || Users;

  return (
    <div className={`bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md ${style.border} ${style.glow} hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between`}>
      <div className="space-y-1">
        <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-extrabold tracking-tight ${style.valCls}`}>
            {value}
          </span>
          {sub && <span className="text-[10px] text-slate-400 font-medium">| {sub}</span>}
        </div>
      </div>
      <div className={`p-3 rounded-xl ${style.iconBg} transition-transform duration-300 hover:scale-110`}>
        <IconComponent size={22} className="stroke-[2.2]" />
      </div>
    </div>
  );
}
