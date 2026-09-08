"use client";

import { 
  Settings2, Store, Printer, ReceiptText, Users, 
  Bell, Shield, MonitorSmartphone, Database, Moon,
  Save, Loader2, Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SIDEBAR_NAV = [
  { id: "general", label: "General Store Info", icon: <Store className="w-4 h-4" /> },
  { id: "hardware", label: "Printers & Hardware", icon: <Printer className="w-4 h-4" /> },
  { id: "taxes", label: "Taxes & Fees", icon: <ReceiptText className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { id: "security", label: "Security & Privacy", icon: <Shield className="w-4 h-4" /> },
];

export default function CashierSettings() {
  const [activeNav, setActiveNav] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form states
  const [storeName, setStoreName] = useState("Foodie Restaurant & Cafe");
  const [branchLocation, setBranchLocation] = useState("Connaught Place, New Delhi");
  const [contactEmail, setContactEmail] = useState("hello@foodiecafe.com");
  const [storeAddress, setStoreAddress] = useState("Block B, Inner Circle, Connaught Place\nNew Delhi, DL 110001");
  const [autoPrint, setAutoPrint] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Hardware states
  const [printerIp, setPrinterIp] = useState("192.168.1.100");
  const [printerPaperSize, setPrinterPaperSize] = useState("80mm");

  // Taxes states
  const [cgstRate, setCgstRate] = useState("2.5");
  const [sgstRate, setSgstRate] = useState("2.5");
  const [serviceChargeRate, setServiceChargeRate] = useState("5");

  // Notification states
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [newOrderPopup, setNewOrderPopup] = useState(true);

  useEffect(() => {
    // Load local or remote settings
    const loadSettings = async () => {
      try {
        const local = localStorage.getItem("cashier_settings");
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.storeName) setStoreName(parsed.storeName);
          if (parsed.branchLocation) setBranchLocation(parsed.branchLocation);
          if (parsed.contactEmail) setContactEmail(parsed.contactEmail);
          if (parsed.storeAddress) setStoreAddress(parsed.storeAddress);
          if (parsed.autoPrint !== undefined) setAutoPrint(parsed.autoPrint);
          if (parsed.darkMode !== undefined) setDarkMode(parsed.darkMode);
          if (parsed.printerIp) setPrinterIp(parsed.printerIp);
          if (parsed.printerPaperSize) setPrinterPaperSize(parsed.printerPaperSize);
          if (parsed.cgstRate) setCgstRate(parsed.cgstRate);
          if (parsed.sgstRate) setSgstRate(parsed.sgstRate);
          if (parsed.serviceChargeRate) setServiceChargeRate(parsed.serviceChargeRate);
          if (parsed.soundAlerts !== undefined) setSoundAlerts(parsed.soundAlerts);
          if (parsed.newOrderPopup !== undefined) setNewOrderPopup(parsed.newOrderPopup);
        }

        const docRef = doc(db, "settings", "cashier");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const d = snap.data();
          if (d.storeName) setStoreName(d.storeName);
          if (d.branchLocation) setBranchLocation(d.branchLocation);
          if (d.contactEmail) setContactEmail(d.contactEmail);
          if (d.storeAddress) setStoreAddress(d.storeAddress);
          if (d.autoPrint !== undefined) setAutoPrint(d.autoPrint);
          if (d.darkMode !== undefined) setDarkMode(d.darkMode);
          if (d.printerIp) setPrinterIp(d.printerIp);
          if (d.printerPaperSize) setPrinterPaperSize(d.printerPaperSize);
          if (d.cgstRate) setCgstRate(d.cgstRate);
          if (d.sgstRate) setSgstRate(d.sgstRate);
          if (d.serviceChargeRate) setServiceChargeRate(d.serviceChargeRate);
        }
      } catch (e) {
        console.error("Error loading cashier settings:", e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const data = {
      storeName,
      branchLocation,
      contactEmail,
      storeAddress,
      autoPrint,
      darkMode,
      printerIp,
      printerPaperSize,
      cgstRate,
      sgstRate,
      serviceChargeRate,
      soundAlerts,
      newOrderPopup,
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem("cashier_settings", JSON.stringify(data));
      const docRef = doc(db, "settings", "cashier");
      await setDoc(docRef, data, { merge: true });
      toast.success("Settings saved successfully!");
    } catch (e) {
      console.error("Error saving settings:", e);
      // Still persisted locally
      toast.success("Settings saved locally!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 font-sans pb-32 lg:pb-8 bg-[#F8F9FD] min-h-[calc(100vh-80px)] flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-lg">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-none mb-1">System Settings</h1>
            <p className="text-[13px] font-bold text-slate-500">Configure your store preferences, hardware, and POS behavior.</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="h-11 px-6 rounded-xl bg-[#5D34F5] text-white flex items-center justify-center gap-2 font-black text-[13px] shadow-lg shadow-[#5D34F5]/30 hover:bg-[#4A2ABF] transition-colors shrink-0 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1 items-start">
        
        {/* Left Nav Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0 space-y-1">
          {SIDEBAR_NAV.map((nav) => (
            <button
              key={nav.id}
              onClick={() => setActiveNav(nav.id)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[14px] font-bold transition-all ${
                activeNav === nav.id
                  ? "bg-white text-[#5D34F5] shadow-sm border border-slate-100"
                  : "text-slate-500 hover:bg-white/50 hover:text-slate-900 border border-transparent"
              }`}
            >
              <div className={activeNav === nav.id ? "text-[#5D34F5]" : "text-slate-400"}>
                {nav.icon}
              </div>
              {nav.label}
            </button>
          ))}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 w-full bg-white rounded-[24px] shadow-sm border border-slate-100 p-8">
          
          {/* General Info View */}
          {activeNav === "general" && (
            <div className="max-w-2xl">
              <div className="mb-8">
                <h2 className="text-[18px] font-black text-slate-900 mb-1">Store Information</h2>
                <p className="text-[13px] font-bold text-slate-500">These details appear on your printed receipts and customer invoices.</p>
              </div>

              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-slate-900 uppercase tracking-wider">Store Name</label>
                    <input 
                      type="text" 
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#5D34F5] focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-slate-900 uppercase tracking-wider">Branch Location</label>
                    <input 
                      type="text" 
                      value={branchLocation}
                      onChange={(e) => setBranchLocation(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#5D34F5] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-900 uppercase tracking-wider">Contact Email</label>
                  <input 
                    type="email" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#5D34F5] focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-900 uppercase tracking-wider">Store Address</label>
                  <textarea 
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    rows={3}
                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#5D34F5] focus:bg-white transition-colors resize-none"
                  />
                </div>

                <div className="w-full h-px bg-slate-100 my-8"></div>

                <div className="mb-8">
                  <h2 className="text-[18px] font-black text-slate-900 mb-1">Preferences</h2>
                  <p className="text-[13px] font-bold text-slate-500">Configure global behavior for this terminal.</p>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  
                  {/* Auto Print Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <h4 className="text-[14px] font-black text-slate-900 mb-0.5 flex items-center gap-2">
                        <Printer className="w-4 h-4 text-slate-400" />
                        Auto-Print Receipts
                      </h4>
                      <p className="text-[12px] font-bold text-slate-500">Automatically print a bill when an order is settled.</p>
                    </div>
                    <button 
                      onClick={() => setAutoPrint(!autoPrint)}
                      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 shadow-inner ${autoPrint ? 'bg-[#5D34F5]' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${autoPrint ? 'translate-x-6' : 'translate-x-1'}`}></div>
                    </button>
                  </div>

                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <h4 className="text-[14px] font-black text-slate-900 mb-0.5 flex items-center gap-2">
                        <Moon className="w-4 h-4 text-slate-400" />
                        Dark Mode Theme
                      </h4>
                      <p className="text-[12px] font-bold text-slate-500">Switch the POS interface to a darker color palette.</p>
                    </div>
                    <button 
                      onClick={() => setDarkMode(!darkMode)}
                      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 shadow-inner ${darkMode ? 'bg-[#5D34F5]' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}></div>
                    </button>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* Hardware View */}
          {activeNav === "hardware" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-[18px] font-black text-slate-900 mb-1">Printers & Hardware</h2>
                <p className="text-[13px] font-bold text-slate-500">Configure thermal receipt printers and hardware connections.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-900 uppercase tracking-wider">Thermal Printer IP / Port</label>
                  <input 
                    type="text" 
                    value={printerIp}
                    onChange={(e) => setPrinterIp(e.target.value)}
                    placeholder="e.g. 192.168.1.100:9100"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#5D34F5] focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-900 uppercase tracking-wider">Paper Width</label>
                  <select 
                    value={printerPaperSize}
                    onChange={(e) => setPrinterPaperSize(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#5D34F5] focus:bg-white transition-colors"
                  >
                    <option value="80mm">80mm (Standard POS)</option>
                    <option value="58mm">58mm (Compact Receipt)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Taxes View */}
          {activeNav === "taxes" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-[18px] font-black text-slate-900 mb-1">Taxes & Charges</h2>
                <p className="text-[13px] font-bold text-slate-500">Configure GST rates and service charges applied at checkout.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-900 uppercase tracking-wider">CGST (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={cgstRate}
                    onChange={(e) => setCgstRate(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#5D34F5] focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-900 uppercase tracking-wider">SGST (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={sgstRate}
                    onChange={(e) => setSgstRate(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#5D34F5] focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-900 uppercase tracking-wider">Service Charge (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={serviceChargeRate}
                    onChange={(e) => setServiceChargeRate(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#5D34F5] focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications View */}
          {activeNav === "notifications" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-[18px] font-black text-slate-900 mb-1">Terminal Alerts</h2>
                <p className="text-[13px] font-bold text-slate-500">Manage audio and visual alerts on incoming orders and kitchen status.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <h4 className="text-[14px] font-black text-slate-900 mb-0.5">Sound Chime on New Orders</h4>
                    <p className="text-[12px] font-bold text-slate-500">Play an audible chime when an online or table order is placed.</p>
                  </div>
                  <button 
                    onClick={() => setSoundAlerts(!soundAlerts)}
                    className={`w-12 h-7 rounded-full transition-colors relative shrink-0 shadow-inner ${soundAlerts ? 'bg-[#5D34F5]' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${soundAlerts ? 'translate-x-6' : 'translate-x-1'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <h4 className="text-[14px] font-black text-slate-900 mb-0.5">New Order Pop-up Notifications</h4>
                    <p className="text-[12px] font-bold text-slate-500">Show a toast banner on top of the POS when an order arrives.</p>
                  </div>
                  <button 
                    onClick={() => setNewOrderPopup(!newOrderPopup)}
                    className={`w-12 h-7 rounded-full transition-colors relative shrink-0 shadow-inner ${newOrderPopup ? 'bg-[#5D34F5]' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${newOrderPopup ? 'translate-x-6' : 'translate-x-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security View */}
          {activeNav === "security" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-[18px] font-black text-slate-900 mb-1">Security & Session</h2>
                <p className="text-[13px] font-bold text-slate-500">Security configurations for this cashier station.</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">Terminal Protected with Role-Based Authentication</p>
                  <p className="text-xs text-emerald-700">Encrypted session active via Firebase Auth.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
