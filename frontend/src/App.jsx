import React, { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, ListChecks, Loader2, Database, ShieldCheck, HeartPulse, Settings2, FileText, LogOut, Menu, X } from "lucide-react";
import Toast from "./components/Toast";
import RecordModal from "./components/RecordModal";
import ConfirmDelete from "./components/ConfirmDelete";
import ImportModal from "./components/ImportModal";
import Dashboard from "./pages/Dashboard";
import Records from "./pages/Records";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./contexts/AuthContext";
import { getPatients, createPatient, updatePatient, deletePatient, bulkCreatePatients } from "./api";

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setRecords(data);
    } catch (err) {
      console.error("Error loading patient data:", err);
      showToast("ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const saveRecord = async (rec) => {
    try {
      const exists = records.some(r => r.id === rec.id);
      if (exists) {
        const updated = await updatePatient(rec.id, rec);
        setRecords(prev => prev.map(r => r.id === rec.id ? updated : r));
        showToast("แก้ไขข้อมูลแล้ว");
      } else {
        const created = await createPatient(rec);
        setRecords(prev => [created, ...prev]);
        showToast("เพิ่มรายการแล้ว");
      }
      setModalOpen(false);
      setEditRecord(null);
    } catch (err) {
      console.error("Error saving patient:", err);
      showToast("ไม่สามารถบันทึกข้อมูลได้", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePatient(deleteTarget.id);
      setRecords(prev => prev.filter(r => r.id !== deleteTarget.id));
      showToast("ลบรายการแล้ว");
    } catch (err) {
      console.error("Error deleting patient:", err);
      showToast("ไม่สามารถลบข้อมูลได้", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleImport = async (importedRecords) => {
    try {
      showToast("กำลังนำเข้าข้อมูล...", "info");
      await bulkCreatePatients(importedRecords);
      await fetchRecords();
      showToast(`นำเข้าข้อมูลสำเร็จ ${importedRecords.length} รายการ`);
    } catch (err) {
      console.error("Error importing patients:", err);
      showToast("ไม่สามารถนำเข้าข้อมูลได้", "error");
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-400 bg-slate-900">
        <Loader2 className="animate-spin mb-3 text-teal-500" size={36} />
        <p className="text-sm font-semibold tracking-wide text-slate-300">กำลังตรวจสอบสิทธิ์...</p>
        <p className="text-xs text-slate-500 mt-1">KHH Telemedicine Cloud Services</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-400 bg-slate-900">
        <Loader2 className="animate-spin mb-3 text-teal-500" size={36} />
        <p className="text-sm font-semibold tracking-wide text-slate-300">กำลังเชื่อมต่อฐานข้อมูล...</p>
        <p className="text-xs text-slate-500 mt-1">KHH Telemedicine Cloud Services</p>
      </div>
    );
  }

  const renderSidebar = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full bg-slate-900 text-slate-300 select-none">
      <div>
        {/* Logo Brand Header */}
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/10 p-2 rounded-xl border border-teal-500/20 text-teal-400">
              <HeartPulse size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide uppercase">KHH Telemedicine</h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">ระบบติดตามการจัดส่งยา</p>
            </div>
          </div>
          {isMobile && (
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <button 
            onClick={() => { setTab("dashboard"); if (isMobile) setMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              tab === "dashboard" 
                ? "bg-teal-600 text-white shadow-lg shadow-teal-900/10" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <LayoutDashboard size={18} className="stroke-[2]" />
            ภาพรวมระบบ
          </button>
          
          <button 
            onClick={() => { setTab("records"); if (isMobile) setMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              tab === "records" 
                ? "bg-teal-600 text-white shadow-lg shadow-teal-900/10" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <ListChecks size={18} className="stroke-[2]" />
            จัดการข้อมูลผู้ป่วย
          </button>

          <button 
            onClick={() => { setTab("reports"); if (isMobile) setMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              tab === "reports" 
                ? "bg-teal-600 text-white shadow-lg shadow-teal-900/10" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <FileText size={18} className="stroke-[2]" />
            พิมพ์รายงาน PDF
          </button>

          <button 
            onClick={() => { setTab("settings"); if (isMobile) setMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              tab === "settings" 
                ? "bg-teal-600 text-white shadow-lg shadow-teal-900/10" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Settings2 size={18} className="stroke-[2]" />
            การตั้งค่าระบบ
          </button>
        </nav>
      </div>

      {/* Database Status footer indicators */}
      <div className="p-4 border-t border-slate-800/60 space-y-3 bg-slate-950/20">
        <div className="flex items-center justify-between text-xs bg-slate-800/40 border border-slate-800/40 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-teal-400" />
            <span className="font-semibold text-slate-400 text-[11px]">Database Cloud</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[10px] text-emerald-400 uppercase">Live</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold px-1">
          <ShieldCheck size={12} />
          <span>KHH Primary Care Platform v1.1</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen flex text-slate-800 antialiased overflow-hidden">
      <Toast toast={toast} />
      
      {modalOpen && (
        <RecordModal
          initial={editRecord}
          onClose={() => { setModalOpen(false); setEditRecord(null); }}
          onSave={saveRecord}
        />
      )}

      {importModalOpen && (
        <ImportModal
          onClose={() => setImportModalOpen(false)}
          onImport={handleImport}
          showToast={showToast}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete 
          record={deleteTarget} 
          onCancel={() => setDeleteTarget(null)} 
          onConfirm={confirmDelete} 
        />
      )}

      {/* Modern Left Sidebar Navigation for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 h-screen select-none">
        {renderSidebar(false)}
      </aside>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Navigation Drawer */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 z-50 transform transition-transform duration-300 lg:hidden ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {renderSidebar(true)}
      </div>

      {/* Main Fluid Right Container Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Modern Top Minimal Header */}
        <header className="bg-white border-b border-slate-200/80 px-4 py-3 lg:px-8 lg:py-4.5 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 lg:hidden transition-colors cursor-pointer"
              title="เปิดเมนู"
            >
              <Menu size={20} className="stroke-[2.2]" />
            </button>
            
            <span className="hidden sm:inline-flex text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/50 px-2.5 py-1 rounded-md">
              เครือข่ายบริการปฐมภูมิ
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 font-medium">|</span>
            <span className="text-xs text-slate-500 font-semibold truncate max-w-[120px] sm:max-w-none">
              รพ.คลองหาด (KHH)
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-xl">
              <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                {user?.providerId?.slice(0, 3) || 'KHH'}
              </div>
              <span className="text-xs font-bold text-slate-700 truncate max-w-[80px] sm:max-w-none">{user?.name}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all duration-200 cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">ออก</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Scroll Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 lg:px-8 lg:py-6">
          {tab === "dashboard" ? (
            <Dashboard records={records} />
          ) : tab === "records" ? (
            <Records 
              records={records}
              onAddClick={() => { setEditRecord(null); setModalOpen(true); }}
              onEditClick={(rec) => { setEditRecord(rec); setModalOpen(true); }}
              onDeleteClick={(rec) => setDeleteTarget(rec)}
              onImportClick={() => setImportModalOpen(true)}
              showToast={showToast}
            />
          ) : tab === "reports" ? (
            <Reports records={records} />
          ) : (
            <Settings showToast={showToast} />
          )}
        </main>
      </div>
    </div>
  );
}
