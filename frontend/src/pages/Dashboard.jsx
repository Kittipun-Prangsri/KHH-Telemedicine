import React, { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell
} from "recharts";
import KPICard from "../components/KPICard";
import PipelineHero from "../components/PipelineHero";
import EmptyMini from "../components/EmptyMini";
import { PIE_COLORS } from "../constants";
import { getStatus, daysSince } from "../utils";

export default function Dashboard({ records }) {
  const kpis = useMemo(() => {
    const counts = { ordered: 0, dispatched: 0, atStation: 0, done: 0 };
    let overdue = 0;
    records.forEach(r => {
      const s = getStatus(r).key;
      if (s !== "new") counts[s] = (counts[s] || 0) + 1;
      if ((s === "ordered" || s === "dispatched") && r.orderDate) {
        const d = daysSince(r.orderDate);
        if (d !== null && d > 3) overdue++;
      }
    });
    
    const pipelineCounts = {
      ordered: counts.ordered + counts.dispatched + counts.atStation + counts.done,
      dispatched: counts.dispatched + counts.atStation + counts.done,
      atStation: counts.atStation + counts.done,
      done: counts.done
    };
    return { counts, overdue, pipelineCounts, total: records.length };
  }, [records]);

  const facilityData = useMemo(() => {
    const m = {};
    records.forEach(r => { if (r.facility) m[r.facility] = (m[r.facility] || 0) + 1; });
    return Object.entries(m)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [records]);

  const clinicData = useMemo(() => {
    const m = {};
    records.forEach(r => (r.clinicTags || []).forEach(c => { m[c] = (m[c] || 0) + 1; }));
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [records]);

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">ภาพรวมระบบ (Dashboard)</h2>
          <p className="text-xs text-slate-500 mt-0.5">ภาพรวมการให้บริการและสถานะจัดส่งยาของหน่วยปฐมภูมิ</p>
        </div>
        <div className="text-xs text-slate-400 font-semibold bg-slate-100/60 px-3 py-1.5 rounded-lg border border-slate-200/50">
          อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="ผู้ป่วยทั้งหมด" value={kpis.total} tone="slate" />
        <KPICard label="รอจัดส่งยา" value={kpis.counts.ordered} tone="slate" />
        <KPICard label="อยู่ระหว่างขนส่ง" value={kpis.counts.dispatched} tone="amber" />
        <KPICard label="รับยาครบแล้ว" value={kpis.counts.done} tone="emerald" />
        <KPICard label="เกินกำหนด 3 วัน" value={kpis.overdue} sub="ยังไม่จัดส่ง" tone="rose" />
      </div>

      {/* Pipeline Visual Component */}
      <PipelineHero counts={kpis.pipelineCounts} />

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Facility Distribution Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-slate-800 tracking-wide uppercase">จำนวนผู้ป่วยแยกตามหน่วยบริการ</p>
              <p className="text-xs text-slate-400 mt-0.5">เรียงลำดับหน่วยบริการที่มีปริมาณผู้ป่วยสูงสุด 8 ลำดับแรก</p>
            </div>
          </div>
          
          {facilityData.length ? (
            <div style={{ height: 280 }} className="mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facilityData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#0f766e" radius={[0, 6, 6, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyMini text="ยังไม่มีข้อมูลสำหรับการแสดงผล" />}
        </div>
        
        {/* Clinic Pie Distribution Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-slate-800 tracking-wide uppercase">สัดส่วนกลุ่มโรคของผู้ป่วย</p>
              <p className="text-xs text-slate-400 mt-0.5">แบ่งเปอร์เซ็นต์ตามประเภทคลินิกโรคเรื้อรังที่เข้าบริการ</p>
            </div>
          </div>

          {clinicData.length ? (
            <div style={{ height: 280 }} className="mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={clinicData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    tick={{ fontSize: 11, fill: '#475569' }}
                  >
                    {clinicData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} className="focus:outline-none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyMini text="ยังไม่มีข้อมูลสำหรับการแสดงผล" />}
        </div>
      </div>
    </div>
  );
}
