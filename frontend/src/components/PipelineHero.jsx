import React from 'react';
import { Clock, Truck, PackageCheck, CheckCircle2 } from "lucide-react";

export default function PipelineHero({ counts }) {
  const stages = [
    { key: "ordered", label: "สั่งยาแล้ว", icon: Clock, tone: "teal", gradient: "from-teal-400 to-cyan-500", textCls: "text-teal-700" },
    { key: "dispatched", label: "จัดส่งไปหน่วยแล้ว", icon: Truck, tone: "amber", gradient: "from-amber-400 to-orange-500", textCls: "text-amber-700" },
    { key: "atStation", label: "หน่วยรับยาแล้ว", icon: PackageCheck, tone: "sky", gradient: "from-sky-400 to-blue-500", textCls: "text-sky-700" },
    { key: "done", label: "ผู้ป่วยรับยาแล้ว", icon: CheckCircle2, tone: "emerald", gradient: "from-emerald-400 to-teal-500", textCls: "text-emerald-700" }
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-bold text-slate-800 tracking-wide uppercase">เส้นทางการส่งยาถึงผู้ป่วย (Pipeline)</p>
        <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">Realtime Status</span>
      </div>
      <div className="flex items-center relative py-2">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const count = counts[s.key] || 0;
          const isActive = count > 0;

          return (
            <div key={s.key} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center gap-2.5 flex-1 relative group">
                {/* Node Container with dynamic glowing ring if active */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 ${
                  isActive 
                    ? `bg-gradient-to-tr ${s.gradient} text-white shadow-lg shadow-slate-200 hover:scale-110 hover:rotate-3` 
                    : 'bg-slate-50 text-slate-400 border border-slate-200'
                }`}>
                  <Icon size={26} className="stroke-[2]" />
                  {/* Subtle pulsing animation if active */}
                  {isActive && (
                    <span className="absolute -inset-1 rounded-full bg-inherit opacity-25 animate-ping -z-10" />
                  )}
                </div>
                
                {/* Numeric value indicator */}
                <p className={`text-2xl font-black transition-colors duration-300 ${
                  isActive ? s.textCls : 'text-slate-400'
                }`}>
                  {count}
                </p>
                
                {/* Stage label */}
                <p className="text-xs font-semibold text-slate-500 text-center max-w-[110px]">
                  {s.label}
                </p>
              </div>
              
              {/* Connecting Line with gradient if active */}
              {i < stages.length - 1 && (
                <div className="h-1 flex-1 -mt-12 relative mx-2">
                  <div className="absolute inset-0 bg-slate-100 rounded-full" />
                  <div 
                    className={`absolute inset-0 bg-gradient-to-r ${s.gradient} rounded-full transition-all duration-1000 origin-left`}
                    style={{ 
                      width: isActive && (counts[stages[i+1].key] > 0) ? '100%' : '0%' 
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
