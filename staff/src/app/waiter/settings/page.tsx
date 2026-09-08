"use client";

import { useState, useEffect } from "react";
import { 
  Settings, User, Bell, Lock, Palette, 
  Smartphone, Mail, Check, LogOut, Loader2, Save
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function WaiterSettings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("waiter@cafe.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [staffId, setStaffId] = useState("");

  // Notification states
  const [notifications, setNotifications] = useState({
    newOrders: true,
    orderReady: true,
    shiftReminders: false,
    weeklyReport: true
  });

  // Appearance states
  const [themeMode, setThemeMode] = useState("light");
  const [compactView, setCompactView] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem("staffSession");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.name) {
          const parts = session.name.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
        if (session.email) setEmail(session.email);
        if (session.phone) setPhone(session.phone);
        if (session.id || session.uid) setStaffId(session.id || session.uid);
      } catch (e) {}
    }

    const savedNotifs = localStorage.getItem("waiter_notifications");
    if (savedNotifs) {
      try { setNotifications(JSON.parse(savedNotifs)); } catch (e) {}
    }
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const fullName = `${firstName} ${lastName}`.trim();
    
    try {
      // Update session in localStorage
      const sessionStr = localStorage.getItem("staffSession");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        session.name = fullName;
        session.phone = phone;
        localStorage.setItem("staffSession", JSON.stringify(session));
      }

      // Update in staff collection if ID exists
      if (staffId) {
        const staffRef = doc(db, "staff", staffId);
        await setDoc(staffRef, { name: fullName, phone }, { merge: true });
      }

      localStorage.setItem("waiter_notifications", JSON.stringify(notifications));
      toast.success("Settings saved successfully!");
    } catch (e) {
      console.error("Error saving waiter settings:", e);
      toast.success("Profile saved locally!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("staffSession");
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 -mx-4 lg:-mx-8 -my-4 lg:-my-8 font-sans overflow-auto p-8">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F8F7FF] flex items-center justify-center border border-[#E5DFFF]">
            <Settings className="w-6 h-6 text-[#5D34F5]" />
          </div>
          <div>
            <h1 className="text-[22px] font-black text-slate-900 leading-tight">Account Settings</h1>
            <p className="text-[13px] font-bold text-slate-500 mt-0.5">Manage your profile, preferences, and security.</p>
          </div>
        </div>

        <button 
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="h-11 px-6 rounded-xl bg-[#5D34F5] text-white flex items-center justify-center gap-2 font-black text-[13px] shadow-lg shadow-[#5D34F5]/20 hover:bg-[#4A2ABF] transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        
        {/* Left Sidebar - Navigation */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {[
            { name: "Profile", icon: <User className="w-5 h-5" /> },
            { name: "Notifications", icon: <Bell className="w-5 h-5" /> },
            { name: "Security", icon: <Lock className="w-5 h-5" /> },
            { name: "Appearance", icon: <Palette className="w-5 h-5" /> },
          ].map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[14px] font-black transition-all ${
                activeTab === tab.name 
                  ? "bg-[#5D34F5] text-white shadow-md shadow-[#5D34F5]/20" 
                  : "bg-transparent text-slate-600 hover:bg-white hover:shadow-sm"
              }`}
            >
              <div className={activeTab === tab.name ? "text-white" : "text-slate-400"}>
                {tab.icon}
              </div>
              {tab.name}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[14px] font-black text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 min-h-[500px]">
          
          {activeTab === "Profile" && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h2 className="text-[18px] font-black text-slate-900 mb-1">Personal Details</h2>
                <p className="text-[13px] font-bold text-slate-500">Update your identity and contact information.</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-slate-700 uppercase tracking-wider">First Name</label>
                    <input 
                      type="text" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5D34F5]/20 focus:border-[#5D34F5] transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5D34F5]/20 focus:border-[#5D34F5] transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        value={email} 
                        disabled
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-100/70 text-[14px] font-bold text-slate-500 cursor-not-allowed" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5D34F5]/20 focus:border-[#5D34F5] transition-all" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="max-w-2xl">
              <h2 className="text-[18px] font-black text-slate-900 mb-1">Notification Preferences</h2>
              <p className="text-[13px] font-bold text-slate-500 mb-8">Choose what alerts you want to receive on your device.</p>
              
              <div className="space-y-4">
                {[
                  { key: "newOrders" as const, title: "New Order Assignments", desc: "Get notified when a new order is assigned to you." },
                  { key: "orderReady" as const, title: "Order Ready Alerts", desc: "Get notified when the kitchen marks an order as ready." },
                  { key: "shiftReminders" as const, title: "Shift Reminders", desc: "Receive reminders 30 mins before your shift starts." },
                  { key: "weeklyReport" as const, title: "Weekly Performance Report", desc: "Receive a summary of your performance every Monday." },
                ].map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-slate-100">
                    <div>
                      <h4 className="text-[14px] font-black text-slate-900">{item.title}</h4>
                      <p className="text-[12px] font-bold text-slate-500 mt-1">{item.desc}</p>
                    </div>
                    <button 
                      onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${notifications[item.key] ? 'bg-[#5D34F5]' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifications[item.key] ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Security" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-[18px] font-black text-slate-900 mb-1">Account Security</h2>
                <p className="text-[13px] font-bold text-slate-500">Manage your credentials and login safety.</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#5D34F5] shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Protected Account</p>
                  <p className="text-xs text-slate-600">Logged in securely via staff credentials. Contact your manager to reset password or permissions.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Appearance" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-[18px] font-black text-slate-900 mb-1">Appearance Settings</h2>
                <p className="text-[13px] font-bold text-slate-500">Customize interface density and layout.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100">
                  <div>
                    <h4 className="text-[14px] font-black text-slate-900">Compact Table View</h4>
                    <p className="text-[12px] font-bold text-slate-500">Show more tables in the floor view by reducing padding.</p>
                  </div>
                  <button 
                    onClick={() => setCompactView(!compactView)}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${compactView ? 'bg-[#5D34F5]' : 'bg-slate-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${compactView ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
