"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Search, Phone, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function TrackOrderLandingPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      // Navigate to the specific order tracking page
      router.push(`/track-order/${encodeURIComponent(orderId.trim())}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#F8FAFC] flex flex-col relative isolate overflow-hidden font-sans">
      
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-[#101026] -z-20 border-b border-slate-800"></div>
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#6366F1]/20 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] bg-[#D946EF]/10 rounded-full blur-[100px] -z-10 -translate-x-1/3 -translate-y-1/4 pointer-events-none" />

      {/* Header Section */}
      <div className="container max-w-6xl mx-auto px-6 pt-16 pb-32 lg:pt-24 lg:pb-40 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 text-white font-bold text-[13px] tracking-wide mb-8 border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <MapPin className="w-4 h-4 text-[#A78BFA]" />
            <span>Real-time Tracking</span>
          </div>
          <h1 className="text-[40px] md:text-[54px] lg:text-[64px] font-black text-white tracking-tight leading-[1.1] mb-6">
            Track your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#D946EF]">Delicious</span> delivery
          </h1>
          <p className="text-slate-300 font-medium text-[16px] max-w-xl mx-auto leading-relaxed">
            Enter your order ID below to see live updates on your food's journey from our kitchen to your table.
          </p>
        </motion.div>
      </div>

      {/* Tracking Form Card */}
      <div className="container mx-auto px-6 relative z-20 -mt-24 lg:-mt-32 pb-24 flex justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="w-full max-w-2xl bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100"
        >
          <div className="w-20 h-20 bg-purple-50 text-[#7C3AED] rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-purple-100">
            <Package className="w-10 h-10" />
          </div>
          
          <h2 className="text-[28px] font-black text-slate-900 mb-2 tracking-tight">Order Details</h2>
          <p className="text-slate-500 font-medium mb-10 text-[15px]">Please enter the details provided in your confirmation email or SMS.</p>
          
          <form onSubmit={handleTrackOrder} className="space-y-6">
            <div>
              <label htmlFor="orderId" className="block text-[13px] uppercase tracking-wide font-bold text-slate-700 mb-2.5">Order ID <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  id="orderId"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. ORD-12345678" 
                  className="pl-14 h-16 bg-[#F8FAFC] border-slate-200 text-slate-900 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 focus-visible:border-[#8B5CF6] transition-all text-[16px] font-bold"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-[13px] uppercase tracking-wide font-bold text-slate-700 mb-2.5">Phone Number <span className="text-slate-400 font-medium normal-case tracking-normal">(Optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter mobile number" 
                  className="pl-14 h-16 bg-[#F8FAFC] border-slate-200 text-slate-900 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 focus-visible:border-[#8B5CF6] transition-all text-[16px] font-bold"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={!orderId.trim()}
              className="w-full h-16 mt-6 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#D946EF] hover:from-[#4F46E5] hover:to-[#C026D3] text-white font-black text-[17px] shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_15px_40px_rgba(168,85,247,0.4)] hover:-translate-y-1 transition-all duration-300 group border-0"
            >
              Track Order <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </form>
        </motion.div>
      </div>

    </div>
  );
}
