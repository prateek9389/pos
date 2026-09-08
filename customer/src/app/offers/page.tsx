"use client";

import { useState, useEffect } from "react";
import { Scissors, CheckCircle2, Ticket, Sparkles, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  validUntil: string;
  status: string;
  applicableProduct?: string;
}

export default function OffersPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [offers, setOffers] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "coupons"), where("status", "==", "Active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Coupon[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Coupon);
      });
      setOffers(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col flex-1 pb-20 bg-[#F8FAFC] min-h-[calc(100vh-72px)] font-sans">
      
      {/* Premium Page Header */}
      <div className="bg-[#101026] pt-16 pb-24 relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#6366F1]/30 to-transparent blur-[50px]"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-t from-[#D946EF]/20 to-transparent blur-[60px]"></div>
        
        <div className="container max-w-6xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 text-purple-200 border border-white/10 font-bold text-[13px] mb-8 backdrop-blur-md shadow-[0_4px_20px_rgba(99,102,241,0.2)]"
          >
            <Sparkles className="w-4 h-4 text-[#D946EF]" /> Exclusive Deals
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[40px] md:text-[56px] lg:text-[64px] font-black text-white tracking-tight mb-5 leading-tight"
          >
            Coupons & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#D946EF]">Offers</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-300 font-medium text-[16px] max-w-xl mx-auto leading-relaxed"
          >
            Apply these codes at checkout to save big on your favorite meals!
          </motion.p>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loading ? (
            <div className="flex justify-center py-20 col-span-1 lg:col-span-2">
              <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            </div>
          ) : offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center col-span-1 lg:col-span-2">
              <Ticket className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">No active offers right now</h3>
              <p className="text-slate-500 font-medium">Check back later for exclusive deals!</p>
            </div>
          ) : (
            offers.map((offer, index) => (
            <motion.div 
              key={offer.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col sm:flex-row relative group hover:shadow-[0_20px_40px_rgba(109,40,217,0.12)] transition-all"
            >
              {/* Left side design / Ticket Stub */}
              <div className="w-full sm:w-1/3 bg-gradient-to-br from-purple-50 to-indigo-50 flex flex-col items-center justify-center p-8 sm:border-r-2 sm:border-b-0 border-b-2 border-dashed border-purple-200 relative">
                {/* Cutouts for ticket effect */}
                <div className="hidden sm:block absolute -top-4 -right-4 w-8 h-8 bg-[#F8FAFC] rounded-full shadow-inner z-10 border-b border-l border-slate-100"></div>
                <div className="hidden sm:block absolute -bottom-4 -right-4 w-8 h-8 bg-[#F8FAFC] rounded-full shadow-inner z-10 border-t border-l border-slate-100"></div>
                
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-purple-100 flex items-center justify-center text-[#7C3AED] mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                  <Ticket className="w-8 h-8" />
                </div>
                <span className="text-[11px] uppercase font-black tracking-[0.2em] text-[#7C3AED]/60">VOUCHER</span>
              </div>

              {/* Right side content */}
              <div className="w-full sm:w-2/3 p-6 sm:p-8 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                   <h3 className="font-black text-slate-900 text-[22px] leading-tight group-hover:text-[#6D28D9] transition-colors">
                     {offer.type === 'Percentage (%)' ? `${offer.value}% OFF` : `₹${offer.value} OFF`}
                   </h3>
                </div>
                <p className="text-slate-500 font-medium mb-8 flex-1 text-[14px] leading-relaxed">
                  Applicable on: {offer.applicableProduct || "All Menu Items"}
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mt-auto">
                  <div className="w-full sm:w-auto">
                    <p className="text-[11px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Valid until: {offer.validUntil || "No expiry"}
                    </p>
                    <div className="font-mono font-black text-[#6366F1] bg-indigo-50/50 px-4 py-2.5 rounded-xl text-[17px] border border-indigo-200 border-dashed inline-block tracking-wider">
                      {offer.code}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleCopy(offer.id, offer.code)}
                    variant={copied === offer.id ? "default" : "outline"}
                    className={`w-full sm:w-auto rounded-2xl px-6 h-14 font-bold transition-all shadow-sm ${copied === offer.id ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_8px_20px_rgba(16,185,129,0.3)]' : 'text-[#6366F1] border-purple-200 hover:bg-gradient-to-r hover:from-[#6366F1] hover:to-[#D946EF] hover:text-white hover:border-transparent hover:shadow-[0_8px_25px_rgba(168,85,247,0.35)]'}`}
                  >
                    {copied === offer.id ? (
                      <><CheckCircle2 className="w-5 h-5 mr-2" /> Copied</>
                    ) : (
                      <><Scissors className="w-5 h-5 mr-2" /> Copy Code</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )))}
        </div>
      </div>
    </div>
  );
}
