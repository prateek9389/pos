"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  SlidersHorizontal, 
  Bell, 
  Monitor, 
  Volume2, 
  Printer, 
  Info, 
  Headphones, 
  ArrowRight, 
  Clock, 
  AlarmClock, 
  Store, 
  Pencil, 
  Tag, 
  ClipboardList, 
  Gift,
  ChevronDown
} from "lucide-react";

export default function KitchenSettings() {
  const [activeTab, setActiveTab] = useState('pref');

  const categories = [
    { id: 'pref', icon: SlidersHorizontal, title: 'Preferences', subtitle: 'General kitchen preferences' },
    { id: 'notif', icon: Bell, title: 'Notifications', subtitle: 'Manage alerts & notifications' },
    { id: 'disp', icon: Monitor, title: 'Display', subtitle: 'Screen & display settings' },
    { id: 'snd', icon: Volume2, title: 'Sound', subtitle: 'Audio & alert sounds' },
    { id: 'prn', icon: Printer, title: 'Printers', subtitle: 'Printer configuration' },
    { id: 'abt', icon: Info, title: 'About', subtitle: 'App & system information' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-none mb-1">Settings</h1>
        <p className="text-[14px] font-medium text-slate-500">Manage your kitchen operations and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-[16px] font-black text-slate-900 mb-4">Settings Categories</h2>
            
            <div className="space-y-2">
              {categories.map(c => {
                const active = c.id === activeTab;
                const Icon = c.icon;
                return (
                  <button 
                    key={c.id} 
                    onClick={() => setActiveTab(c.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-4 transition-all border ${
                      active 
                        ? 'bg-purple-50/70 border-[#5D34F5] shadow-[0_2px_10px_rgba(93,52,245,0.08)]' 
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#5D34F5]' : 'text-slate-400'}`} />
                    <div>
                      <p className={`text-[14px] font-bold ${active ? 'text-slate-900' : 'text-slate-700'} mb-0.5 leading-none`}>{c.title}</p>
                      <p className="text-[11px] font-bold text-slate-400 leading-none mt-1">{c.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-purple-50/50 rounded-2xl border border-purple-100 p-5 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
              <Headphones className="w-6 h-6 text-[#5D34F5]" />
            </div>
            <h3 className="text-[15px] font-black text-slate-900 mb-1">Need Help?</h3>
            <p className="text-[12px] font-bold text-slate-500 mb-4">If you face any issues, our support team is here to help.</p>
            <Button className="w-full bg-[#5D34F5] hover:bg-[#4B28C9] text-white font-bold rounded-xl h-11 flex items-center justify-center gap-2 shadow-md shadow-[#5D34F5]/20">
              Contact Support <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

        </div>

        {/* Right Content */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
           
           {/* Kitchen Preferences Card */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             
             {/* Header */}
             <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
               <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                 <SlidersHorizontal className="w-6 h-6 text-[#5D34F5]" />
               </div>
               <div>
                 <h2 className="text-[18px] font-black text-slate-900 leading-none mb-1.5">Kitchen Preferences</h2>
                 <p className="text-[13px] font-bold text-slate-500 leading-none">Manage how the kitchen system behaves and operates.</p>
               </div>
             </div>
             
             {/* Settings List */}
             <div className="px-6 py-2">
               
               {/* Toggles */}
               <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                     <Clock className="w-5 h-5 text-[#5D34F5]" />
                   </div>
                   <div>
                     <h3 className="text-[14px] font-bold text-slate-900 mb-1">Auto Update Order Status</h3>
                     <p className="text-[12px] font-bold text-slate-500">Automatically update order status based on timers.</p>
                   </div>
                 </div>
                 <Switch defaultChecked className="data-[state=checked]:bg-[#5D34F5]" />
               </div>

               <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                     <AlarmClock className="w-5 h-5 text-[#5D34F5]" />
                   </div>
                   <div>
                     <h3 className="text-[14px] font-bold text-slate-900 mb-1">Preparation Time Alerts</h3>
                     <p className="text-[12px] font-bold text-slate-500">Send alert when an order is taking longer than expected.</p>
                   </div>
                 </div>
                 <Switch defaultChecked className="data-[state=checked]:bg-[#5D34F5]" />
               </div>

               <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                     <Volume2 className="w-5 h-5 text-[#5D34F5]" />
                   </div>
                   <div>
                     <h3 className="text-[14px] font-bold text-slate-900 mb-1">Sound Notifications</h3>
                     <p className="text-[12px] font-bold text-slate-500">Play sound for new incoming orders.</p>
                   </div>
                 </div>
                 <Switch defaultChecked className="data-[state=checked]:bg-[#5D34F5]" />
               </div>

               {/* Dropdowns */}
               <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 border-b border-slate-100 last:border-0 gap-4">
                 <div>
                   <h3 className="text-[14px] font-bold text-slate-900 mb-1">Default Preparation Time</h3>
                   <p className="text-[12px] font-bold text-slate-500">Set default preparation time for new orders.</p>
                 </div>
                  <div className="relative shrink-0 w-full sm:w-[140px]">
                    <Select defaultValue="15">
                      <SelectTrigger className="h-[44px] w-full pl-4 pr-10 bg-white border border-slate-200 focus:ring-1 focus:ring-[#5D34F5] focus:border-[#5D34F5] rounded-xl transition-all font-bold text-[13px] shadow-sm text-slate-700 data-[state=open]:border-[#5D34F5] data-[state=open]:ring-1 data-[state=open]:ring-[#5D34F5]">
                        <SelectValue placeholder="15" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 min-w-[140px]">
                        <SelectItem value="15" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold">15 min</SelectItem>
                        <SelectItem value="20" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold">20 min</SelectItem>
                        <SelectItem value="25" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold">25 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 border-b border-slate-100 last:border-0 gap-4">
                 <div>
                   <h3 className="text-[14px] font-bold text-slate-900 mb-1">Maximum Alert Time</h3>
                   <p className="text-[12px] font-bold text-slate-500">Send alert when preparation time exceeds the limit.</p>
                 </div>
                  <div className="relative shrink-0 w-full sm:w-[140px]">
                    <Select defaultValue="30">
                      <SelectTrigger className="h-[44px] w-full pl-4 pr-10 bg-white border border-slate-200 focus:ring-1 focus:ring-[#5D34F5] focus:border-[#5D34F5] rounded-xl transition-all font-bold text-[13px] shadow-sm text-slate-700 data-[state=open]:border-[#5D34F5] data-[state=open]:ring-1 data-[state=open]:ring-[#5D34F5]">
                        <SelectValue placeholder="30" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 min-w-[140px]">
                        <SelectItem value="30" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold">30 min</SelectItem>
                        <SelectItem value="45" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold">45 min</SelectItem>
                        <SelectItem value="60" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 border-b border-slate-100 last:border-0 gap-4">
                 <div>
                   <h3 className="text-[14px] font-bold text-slate-900 mb-1">Kitchen Printer</h3>
                   <p className="text-[12px] font-bold text-slate-500">Select the default printer for kitchen orders.</p>
                 </div>
                  <div className="relative shrink-0 w-full sm:w-auto">
                    <Printer className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                    <Select defaultValue="Kitchen Printer 1">
                      <SelectTrigger className="h-[44px] w-full sm:w-[220px] pl-10 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#5D34F5] focus:border-[#5D34F5] rounded-xl transition-all font-bold text-[13px] shadow-sm text-slate-700 data-[state=open]:border-[#5D34F5] data-[state=open]:ring-1 data-[state=open]:ring-[#5D34F5]">
                        <SelectValue placeholder="Select Printer" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                        <SelectItem value="Kitchen Printer 1" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold">Kitchen Printer 1</SelectItem>
                        <SelectItem value="Kitchen Printer 2" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold">Kitchen Printer 2</SelectItem>
                        <SelectItem value="Main Bar Printer" className="cursor-pointer hover:bg-slate-50 rounded-lg font-bold">Main Bar Printer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>

             </div>
           </div>

           {/* Kitchen Information Card */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             
             {/* Header */}
             <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/30">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                   <Store className="w-6 h-6 text-[#5D34F5]" />
                 </div>
                 <div>
                   <h2 className="text-[18px] font-black text-slate-900 leading-none mb-1.5">Kitchen Information</h2>
                   <p className="text-[13px] font-bold text-slate-500 leading-none">View and manage your kitchen details.</p>
                 </div>
               </div>
               <Button variant="outline" className="h-10 border-[#5D34F5]/30 text-[#5D34F5] bg-purple-50/50 hover:bg-purple-100/50 shadow-sm font-bold gap-2 rounded-xl">
                 <Pencil className="w-4 h-4" /> Edit Information
               </Button>
             </div>

             {/* Info Grid */}
             <div className="p-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                 
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                     <Tag className="w-5 h-5 text-[#5D34F5]" />
                   </div>
                   <div>
                     <p className="text-[11px] font-bold text-slate-500 mb-1 leading-none">Branch</p>
                     <p className="text-[14px] font-black text-slate-900 leading-none">Connaught Place Branch</p>
                   </div>
                 </div>

                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                     <ClipboardList className="w-5 h-5 text-[#5D34F5]" />
                   </div>
                   <div>
                     <p className="text-[11px] font-bold text-slate-500 mb-1 leading-none">Kitchen Code</p>
                     <p className="text-[14px] font-black text-slate-900 leading-none">KCH-01</p>
                   </div>
                 </div>

                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                     <Gift className="w-5 h-5 text-[#5D34F5]" />
                   </div>
                   <div>
                     <p className="text-[11px] font-bold text-slate-500 mb-1 leading-none">Kitchen Name</p>
                     <p className="text-[14px] font-black text-slate-900 leading-none">Main Kitchen</p>
                   </div>
                 </div>

                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                     <Clock className="w-5 h-5 text-[#5D34F5]" />
                   </div>
                   <div>
                     <p className="text-[11px] font-bold text-slate-500 mb-1 leading-none">Time Zone</p>
                     <p className="text-[14px] font-black text-slate-900 leading-none">Asia/Kolkata (GMT +05:30)</p>
                   </div>
                 </div>

               </div>
             </div>

           </div>

        </div>
      </div>

    </div>
  );
}
