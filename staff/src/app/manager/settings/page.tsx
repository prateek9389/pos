"use client";

import { 
  Settings, 
  Save, 
  Store, 
  Phone, 
  MapPin, 
  SlidersHorizontal, 
  Utensils, 
  Percent, 
  Info, 
  Shield, 
  Banknote, 
  Receipt,
  BellRing, 
  Printer, 
  Mail, 
  MessageSquare, 
  Lock, 
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function SettingsPage() {
  const [branchName, setBranchName] = useState("Connaught Place Branch");
  const [phone, setPhone] = useState("+91 11 2345 6789");
  const [address, setAddress] = useState("B-24, Inner Circle, Connaught Place, New Delhi, Delhi 110001");
  const [defaultOrderType, setDefaultOrderType] = useState("Dine In");
  const [serviceCharge, setServiceCharge] = useState("5");

  const [settings, setSettings] = useState({
    enableServiceCharge: true,
    taxInclusivePricing: false,
    lowStockAlerts: true,
    printKOT: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [brandName, setBrandName] = useState("Foodie Bites");
  const [brandIcon, setBrandIcon] = useState("🍴");
  const [footerDescription, setFooterDescription] = useState("Premium quality food delivered to your door. Experience the best culinary delights with just a few clicks.");
  const [contactAddress, setContactAddress] = useState("123 Culinary Street, Foodville\nNY 10001, USA");
  const [contactPhone, setContactPhone] = useState("+1 (555) 123-4567");
  const [contactEmail, setContactEmail] = useState("hello@foodiebites.com");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "siteSettings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.brandName) setBrandName(data.brandName);
          if (data.brandIcon) setBrandIcon(data.brandIcon);
          if (data.footerDescription) setFooterDescription(data.footerDescription);
          if (data.contactAddress) setContactAddress(data.contactAddress);
          if (data.contactPhone) setContactPhone(data.contactPhone);
          if (data.contactEmail) setContactEmail(data.contactEmail);
          if (data.branchName) setBranchName(data.branchName);
          if (data.phone) setPhone(data.phone);
          if (data.address) setAddress(data.address);
          if (data.defaultOrderType) setDefaultOrderType(data.defaultOrderType);
          if (data.serviceCharge) setServiceCharge(data.serviceCharge);
          if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
        }
      } catch (e) {
        console.error("Failed to fetch site settings", e);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    toast.info(`Setting updated: ${newValue ? 'Enabled' : 'Disabled'}`);
  };

  const handleSave = async () => {
    try {
      const docRef = doc(db, "siteSettings", "global");
      await setDoc(docRef, {
        brandName,
        brandIcon,
        footerDescription,
        contactAddress,
        contactPhone,
        contactEmail,
        branchName,
        phone,
        address,
        defaultOrderType,
        serviceCharge,
        settings,
        updatedAt: Date.now()
      }, { merge: true });
      toast.success("Settings saved successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-10 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shadow-sm border border-purple-100">
            <Settings className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <div>
            <h1 className="text-[28px] font-black text-slate-900 tracking-tight">Settings</h1>
            <p className="text-slate-500 text-[14px] font-medium mt-1">Manage your branch-level operations and information.</p>
          </div>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-semibold shadow-sm transition-all text-[14px]"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* 2. Branch Information Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 relative overflow-hidden">
        
        {/* Background Graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-[400px] pointer-events-none opacity-20 bg-gradient-to-l from-purple-100 to-transparent flex items-center justify-end pr-10">
          <span className="text-[140px] drop-shadow-xl transform translate-x-10">🏪</span>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-black text-slate-900">Branch Information</h2>
              <p className="text-[13px] font-medium text-slate-500 mt-0.5">Update your branch details and contact information.</p>
            </div>
          </div>

          <div className="space-y-6 max-w-[800px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 block ml-1">Branch Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center pointer-events-none">
                    <Store className="w-4 h-4 text-purple-500" />
                  </div>
                  <input 
                    type="text" 
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-14 pr-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 block ml-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center pointer-events-none">
                    <Phone className="w-4 h-4 text-purple-500" />
                  </div>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-14 pr-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 block ml-1">Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-purple-500" />
                </div>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-14 pr-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Operations Settings Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 relative overflow-hidden">
        
        {/* Background Graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-[300px] pointer-events-none opacity-20 bg-gradient-to-l from-emerald-100 to-transparent flex items-center justify-end pr-10">
          <span className="text-[120px] drop-shadow-xl transform translate-x-5">📋</span>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-black text-slate-900">Operations Settings</h2>
              <p className="text-[13px] font-medium text-slate-500 mt-0.5">Configure how your branch operates.</p>
            </div>
          </div>

          <div className="space-y-6 max-w-[800px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 block ml-1">Default Order Type</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center pointer-events-none z-10">
                    <Utensils className="w-4 h-4 text-emerald-500" />
                  </div>
                  <Select value={defaultOrderType} onValueChange={(val) => setDefaultOrderType(val as string)}>
                    <SelectTrigger className="w-full h-[46px] bg-white border border-slate-200 rounded-xl pl-14 text-[14px] font-semibold focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all data-[state=open]:ring-1 data-[state=open]:ring-emerald-500">
                      <SelectValue placeholder="Select Order Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                      <SelectItem value="Dine In" className="cursor-pointer hover:bg-slate-50 rounded-lg font-semibold">Dine In</SelectItem>
                      <SelectItem value="Takeaway" className="cursor-pointer hover:bg-slate-50 rounded-lg font-semibold">Takeaway</SelectItem>
                      <SelectItem value="Delivery" className="cursor-pointer hover:bg-slate-50 rounded-lg font-semibold">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 block ml-1">Service Charge (%)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center pointer-events-none">
                    <Percent className="w-4 h-4 text-emerald-500" />
                  </div>
                  <input 
                    type="number" 
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-14 pr-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                  />
                </div>
              </div>

            </div>

            <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
              <Info className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-[13px] font-bold text-emerald-700">This service charge will be applied to all dine-in orders by default.</p>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Other Preferences Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-slate-900">Other Preferences</h2>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">Manage additional branch preferences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Item 1 */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900 leading-tight">Enable Service Charge</h4>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Apply service charge on applicable orders.</p>
              </div>
            </div>
            <Switch 
              checked={settings.enableServiceCharge} 
              onCheckedChange={() => handleToggle('enableServiceCharge')} 
              className="data-[state=checked]:bg-purple-600" 
            />
          </div>

          {/* Item 2 */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900 leading-tight">Tax Inclusive Pricing</h4>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Display prices inclusive of taxes.</p>
              </div>
            </div>
            <Switch 
              checked={settings.taxInclusivePricing} 
              onCheckedChange={() => handleToggle('taxInclusivePricing')} 
            />
          </div>

          {/* Item 3 */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900 leading-tight">Low Stock Alerts</h4>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Get notified when items are low in stock.</p>
              </div>
            </div>
            <Switch 
              checked={settings.lowStockAlerts} 
              onCheckedChange={() => handleToggle('lowStockAlerts')} 
              className="data-[state=checked]:bg-amber-500" 
            />
          </div>

          {/* Item 4 */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900 leading-tight">Print KOT Automatically</h4>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Print kitchen orders automatically.</p>
              </div>
            </div>
            <Switch 
              checked={settings.printKOT} 
              onCheckedChange={() => handleToggle('printKOT')} 
              className="data-[state=checked]:bg-purple-600" 
            />
          </div>

          {/* Item 5 */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900 leading-tight">Email Notifications</h4>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Receive important alerts via email.</p>
              </div>
            </div>
            <Switch 
              checked={settings.emailNotifications} 
              onCheckedChange={() => handleToggle('emailNotifications')} 
              className="data-[state=checked]:bg-pink-500" 
            />
          </div>

          {/* Item 6 */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900 leading-tight">SMS Notifications</h4>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Receive booking alerts via SMS.</p>
              </div>
            </div>
            <Switch 
              checked={settings.smsNotifications} 
              onCheckedChange={() => handleToggle('smsNotifications')} 
            />
          </div>

        </div>
      </div>

      {/* Customer App Settings Card */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Store className="w-5 h-5" /> 
          </div>
          <div>
            <h2 className="text-[18px] font-black text-slate-900">Customer App Settings</h2>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">Configure header, footer, and branding for the customer app.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 block ml-1">Brand Name</label>
            <input 
              type="text" 
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 block ml-1">Brand Icon (Emoji or Text)</label>
            <input 
              type="text" 
              value={brandIcon}
              onChange={(e) => setBrandIcon(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-[13px] font-bold text-slate-700 block ml-1">Footer Description</label>
          <textarea 
            value={footerDescription}
            onChange={(e) => setFooterDescription(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 block ml-1">Contact Phone</label>
            <input 
              type="text" 
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 block ml-1">Contact Email</label>
            <input 
              type="text" 
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 block ml-1">Contact Address</label>
            <textarea 
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm h-[46px]"
            />
          </div>
        </div>
      </div>

      {/* 5. Footer Security Alert */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-[20px] p-5 flex items-center justify-between relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shadow-sm shrink-0">
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-blue-900">Your settings are secure and encrypted.</h4>
            <p className="text-[12px] font-medium text-blue-700 mt-0.5">Only authorized users can make changes.</p>
          </div>
        </div>
        
        {/* Right Shield Graphic */}
        <div className="relative z-10 mr-4 hidden sm:block">
          <div className="w-12 h-12 rounded-xl bg-white border border-blue-100 flex items-center justify-center shadow-sm text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
        
        {/* Faint Background Shield */}
        <ShieldCheck className="absolute -right-6 -bottom-6 w-32 h-32 text-blue-200/40 pointer-events-none transform rotate-12" />
      </div>

    </div>
  );
}
