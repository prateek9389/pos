"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, Store, Shield, Bell, Palette, Settings as SettingsIcon, 
  CheckCircle2, Home, IndianRupee, Mail, Phone, Percent, 
  ShieldCheck, Lock, Loader2 
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // General Settings
  const [systemName, setSystemName] = useState("Foodie POS");
  const [defaultCurrency, setDefaultCurrency] = useState("INR (₹)");
  const [supportEmail, setSupportEmail] = useState("support@foodiepos.com");
  const [supportPhone, setSupportPhone] = useState("+91 1800 123 4567");
  const [defaultTax, setDefaultTax] = useState("5");

  // Security Settings
  const [require2FA, setRequire2FA] = useState(true);
  const [complexPass, setComplexPass] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("120");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");

  // Notification Settings
  const [notifNewRestaurant, setNotifNewRestaurant] = useState(true);
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifSuspicious, setNotifSuspicious] = useState(true);

  // Appearance Settings
  const [primaryColor, setPrimaryColor] = useState("#A855F7");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, "systemSettings", "global");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const d = snap.data();
          if (d.systemName) setSystemName(d.systemName);
          if (d.defaultCurrency) setDefaultCurrency(d.defaultCurrency);
          if (d.supportEmail) setSupportEmail(d.supportEmail);
          if (d.supportPhone) setSupportPhone(d.supportPhone);
          if (d.defaultTax) setDefaultTax(d.defaultTax);
          if (d.require2FA !== undefined) setRequire2FA(d.require2FA);
          if (d.complexPass !== undefined) setComplexPass(d.complexPass);
          if (d.sessionTimeout) setSessionTimeout(d.sessionTimeout);
          if (d.maxLoginAttempts) setMaxLoginAttempts(d.maxLoginAttempts);
          if (d.notifNewRestaurant !== undefined) setNotifNewRestaurant(d.notifNewRestaurant);
          if (d.notifLowStock !== undefined) setNotifLowStock(d.notifLowStock);
          if (d.notifSuspicious !== undefined) setNotifSuspicious(d.notifSuspicious);
          if (d.primaryColor) setPrimaryColor(d.primaryColor);
          if (d.updatedAt) {
            setLastSavedTime(new Date(d.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      } catch (e) {
        console.error("Error loading system settings:", e);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const data = {
      systemName,
      defaultCurrency,
      supportEmail,
      supportPhone,
      defaultTax,
      require2FA,
      complexPass,
      sessionTimeout,
      maxLoginAttempts,
      notifNewRestaurant,
      notifLowStock,
      notifSuspicious,
      primaryColor,
      updatedAt: Date.now()
    };

    try {
      const docRef = doc(db, "systemSettings", "global");
      await setDoc(docRef, data, { merge: true });
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(timeStr);
      toast.success("Settings saved successfully!");
    } catch (e) {
      console.error("Error saving system settings:", e);
      toast.error("Failed to save settings to database");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between shadow-[0_4px_25px_rgb(0,0,0,0.02)] border border-slate-100 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-full opacity-10 flex items-center justify-center">
            <SettingsIcon className="w-48 h-48 text-[#A855F7] animate-spin-slow absolute top-0 right-10" style={{ animationDuration: '20s' }} />
            <SettingsIcon className="w-24 h-24 text-[#A855F7] animate-spin-slow absolute bottom-4 left-10" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
          <div className="w-20 h-20 rounded-full bg-[#F4EBFF] flex items-center justify-center shrink-0 border-4 border-white shadow-[0_4px_15px_rgb(168,85,247,0.15)]">
            <SettingsIcon className="w-10 h-10 text-[#A855F7]" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#A855F7] tracking-tight mb-1">System Settings</h2>
            <p className="text-slate-500 font-medium">Manage global configuration for your POS system.</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 mt-6 md:mt-0 relative z-10 w-full md:w-auto">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="h-12 rounded-xl px-8 bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all w-full md:w-auto font-bold text-[15px] border-0 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} 
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-full justify-center md:w-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {lastSavedTime ? `Last saved at ${lastSavedTime}` : "Configuration ready to apply"}
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white border border-slate-100 h-[60px] p-2 rounded-full shadow-[0_2px_15px_rgb(0,0,0,0.02)] mb-6 flex overflow-x-auto w-full sm:w-fit">
          <TabsTrigger value="general" className="rounded-full data-[state=active]:bg-[#F4EBFF] data-[state=active]:text-[#A855F7] text-slate-500 font-bold px-8 h-full flex items-center gap-2 transition-all">
            <Home className="w-4 h-4" /> General
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-full data-[state=active]:bg-[#F4EBFF] data-[state=active]:text-[#A855F7] text-slate-500 font-bold px-8 h-full flex items-center gap-2 transition-all">
            <Shield className="w-4 h-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-full data-[state=active]:bg-[#F4EBFF] data-[state=active]:text-[#A855F7] text-slate-500 font-bold px-8 h-full flex items-center gap-2 transition-all">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-full data-[state=active]:bg-[#F4EBFF] data-[state=active]:text-[#A855F7] text-slate-500 font-bold px-8 h-full flex items-center gap-2 transition-all">
            <Palette className="w-4 h-4" /> Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0 outline-none">
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_25px_rgb(0,0,0,0.02)] border border-slate-100">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900 mb-1">General Information</h3>
              <p className="text-sm font-medium text-slate-500">Update your basic system details and localization settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-slate-700 ml-1">System Name</Label>
                <div className="relative">
                  <div className="absolute left-1.5 top-1.5 bottom-1.5 w-11 bg-[#F4EBFF] rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5 text-[#A855F7]" />
                  </div>
                  <Input 
                    value={systemName} 
                    onChange={(e) => setSystemName(e.target.value)}
                    className="pl-[60px] h-14 bg-white border-slate-200 rounded-xl focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 font-semibold text-slate-900 shadow-sm" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-slate-700 ml-1">Default Currency</Label>
                <div className="relative">
                  <div className="absolute left-1.5 top-1.5 bottom-1.5 w-11 bg-[#F4EBFF] rounded-lg flex items-center justify-center z-10 pointer-events-none">
                    <IndianRupee className="w-5 h-5 text-[#A855F7]" />
                  </div>
                  <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                    <SelectTrigger className="w-full h-14 pl-[60px] pr-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-300 font-semibold text-slate-900 shadow-sm cursor-pointer data-[state=open]:border-purple-300 data-[state=open]:ring-4 data-[state=open]:ring-purple-500/10">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                      <SelectItem value="INR (₹)" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">INR (₹)</SelectItem>
                      <SelectItem value="USD ($)" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">USD ($)</SelectItem>
                      <SelectItem value="EUR (€)" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-slate-700 ml-1">Support Email</Label>
                <div className="relative">
                  <div className="absolute left-1.5 top-1.5 bottom-1.5 w-11 bg-[#F4EBFF] rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#A855F7]" />
                  </div>
                  <Input 
                    type="email" 
                    value={supportEmail} 
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="pl-[60px] h-14 bg-white border-slate-200 rounded-xl focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 font-semibold text-slate-900 shadow-sm" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-slate-700 ml-1">Support Phone</Label>
                <div className="relative">
                  <div className="absolute left-1.5 top-1.5 bottom-1.5 w-11 bg-[#F4EBFF] rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#A855F7]" />
                  </div>
                  <Input 
                    value={supportPhone} 
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="pl-[60px] h-14 bg-white border-slate-200 rounded-xl focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 font-semibold text-slate-900 shadow-sm" 
                  />
                </div>
              </div>
              <div className="space-y-3 md:col-span-2">
                <Label className="text-[13px] font-bold text-slate-700 ml-1">Default Tax Percentage (%)</Label>
                <div className="relative w-full md:w-1/2">
                  <div className="absolute left-1.5 top-1.5 bottom-1.5 w-11 bg-[#F4EBFF] rounded-lg flex items-center justify-center">
                    <Percent className="w-5 h-5 text-[#A855F7]" />
                  </div>
                  <Input 
                    type="number" 
                    value={defaultTax} 
                    onChange={(e) => setDefaultTax(e.target.value)}
                    className="pl-[60px] h-14 bg-white border-slate-200 rounded-xl focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 font-semibold text-slate-900 shadow-sm" 
                  />
                </div>
              </div>
            </div>

            {/* Security Callout */}
            <div className="bg-gradient-to-r from-[#F4EBFF] to-[#FAFAFD] border border-purple-100 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-4 z-10 relative">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-[#A855F7]" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-[15px]">Your system is secure and up to date</h4>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Global configuration synced with Firebase Cloud Store.</p>
                </div>
              </div>
              
              <div className="relative z-10 hidden sm:block">
                <div className="w-16 h-16 bg-[#A855F7] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 rotate-12">
                  <Shield className="w-8 h-8 text-white -rotate-12" />
                </div>
                <div className="absolute -bottom-2 -right-4 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md rotate-[-15deg]">
                  <Lock className="w-5 h-5 text-[#A855F7] rotate-[15deg]" />
                </div>
              </div>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-0 outline-none">
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_25px_rgb(0,0,0,0.02)] border border-slate-100">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Security Policies</h3>
              <p className="text-sm font-medium text-slate-500">Configure authentication and access security.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="2fa" 
                    checked={require2FA} 
                    onCheckedChange={(c) => setRequire2FA(!!c)} 
                    className="border-slate-300 data-[state=checked]:bg-[#A855F7] data-[state=checked]:border-[#A855F7]" 
                  />
                  <label htmlFor="2fa" className="text-sm font-medium leading-none text-slate-700 cursor-pointer">Require Two-Factor Authentication for Super Admins</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="complexPass" 
                    checked={complexPass} 
                    onCheckedChange={(c) => setComplexPass(!!c)} 
                    className="border-slate-300 data-[state=checked]:bg-[#A855F7] data-[state=checked]:border-[#A855F7]" 
                  />
                  <label htmlFor="complexPass" className="text-sm font-medium leading-none text-slate-700 cursor-pointer">Enforce strong passwords (min 8 chars, 1 uppercase, 1 number)</label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                <div className="space-y-3">
                  <Label className="text-[13px] font-bold text-slate-700 ml-1">Session Timeout (minutes)</Label>
                  <Input 
                    type="number" 
                    value={sessionTimeout} 
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="h-14 bg-white border-slate-200 rounded-xl focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 font-semibold text-slate-900 shadow-sm px-4" 
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[13px] font-bold text-slate-700 ml-1">Max Login Attempts</Label>
                  <Input 
                    type="number" 
                    value={maxLoginAttempts} 
                    onChange={(e) => setMaxLoginAttempts(e.target.value)}
                    className="h-14 bg-white border-slate-200 rounded-xl focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 font-semibold text-slate-900 shadow-sm px-4" 
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0 outline-none">
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_25px_rgb(0,0,0,0.02)] border border-slate-100">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900 mb-1">System Notifications</h3>
              <p className="text-sm font-medium text-slate-500">Choose which events trigger an email or push notification to admins.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-900">New Restaurant Registration</h4>
                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">Receive an email when a new restaurant signs up.</p>
                </div>
                <Checkbox 
                  checked={notifNewRestaurant} 
                  onCheckedChange={(c) => setNotifNewRestaurant(!!c)} 
                  className="h-5 w-5 border-slate-300 data-[state=checked]:bg-[#A855F7] data-[state=checked]:border-[#A855F7]" 
                />
              </div>
              <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-900">Low Stock Alerts</h4>
                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">Daily summary of ingredients falling below minimum thresholds.</p>
                </div>
                <Checkbox 
                  checked={notifLowStock} 
                  onCheckedChange={(c) => setNotifLowStock(!!c)} 
                  className="h-5 w-5 border-slate-300 data-[state=checked]:bg-[#A855F7] data-[state=checked]:border-[#A855F7]" 
                />
              </div>
              <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-900">Suspicious Login Attempts</h4>
                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">Alert immediately upon multiple failed logins.</p>
                </div>
                <Checkbox 
                  checked={notifSuspicious} 
                  onCheckedChange={(c) => setNotifSuspicious(!!c)} 
                  className="h-5 w-5 border-slate-300 data-[state=checked]:bg-[#A855F7] data-[state=checked]:border-[#A855F7]" 
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-0 outline-none">
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_25px_rgb(0,0,0,0.02)] border border-slate-100">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Theme & Branding</h3>
              <p className="text-sm font-medium text-slate-500">Customize the look and feel of the Super Admin dashboard.</p>
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-slate-700 ml-1">Primary Brand Color</Label>
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-xl ring-4 ring-offset-2 ring-purple-100 shadow-sm transition-colors" style={{ backgroundColor: primaryColor }}></div>
                  <Input 
                    type="text" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-32 h-14 bg-white border-slate-200 rounded-xl focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 font-bold text-slate-900 px-4" 
                  />
                </div>
              </div>
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <Label className="text-[13px] font-bold text-slate-700 ml-1">System Logo</Label>
                <div className="flex items-center gap-6">
                  <div className="w-28 h-28 bg-[#F4EBFF] border-2 border-dashed border-[#A855F7] rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                    🍴
                  </div>
                  <Button variant="outline" className="h-12 rounded-xl font-bold border-slate-200 hover:bg-slate-50">Upload New Logo</Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
