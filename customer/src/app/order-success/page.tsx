"use client";

import Link from "next/link";
import { Check, ChevronRight, FileText, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'N/A';
  const amount = searchParams.get('amount') || '0';
  const items = searchParams.get('items') || '0';
  const method = searchParams.get('method') === 'upi' ? 'UPI Payment' : 'Card Payment';

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 relative"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
          className="absolute inset-0 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse shadow-xl shadow-emerald-500/30"
        />
        <Check className="w-12 h-12 text-white relative z-10 stroke-[3]" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-black text-slate-900 mb-2">Order Confirmed!</h1>
        <p className="text-slate-500 mb-8">Thank you for your order. We've received it and are preparing it right now.</p>
        
        <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left border border-slate-100">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order ID</p>
              <p className="font-mono font-bold text-slate-900">#{orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</p>
              <p className="font-bold text-primary text-lg">₹{parseFloat(amount).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm font-medium text-slate-600">
            <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-slate-400" /> {items} Items</span>
            <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> {method}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/track-order/${orderId}`} className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/80 flex-1 rounded-full h-14 text-lg font-bold shadow-xl shadow-primary/25 hover:scale-[1.02] transition-transform">
            Track Order <ChevronRight className="w-5 h-5 ml-1" />
          </Link>
          <Link href="/menu" className="inline-flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 flex-1 rounded-full h-14 text-lg font-bold">
            Back to Menu
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
