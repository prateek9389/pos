"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, Phone, MessageCircle, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const STEPS = [
  { id: 1, title: "Order Placed", time: "10:30 AM", completed: true },
  { id: 2, title: "Preparing Food", time: "10:35 AM", completed: true },
  { id: 3, title: "Out for Delivery", time: "10:50 AM", completed: false },
  { id: 4, title: "Delivered", time: "Estimated 11:15 AM", completed: false },
];

export default function TrackOrderPage() {
  const { id } = useParams();
  
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-8 sm:pt-12 pb-12">
        
        <div className="mb-6">
          <Link href="/orders" className="inline-flex items-center justify-center shrink-0 w-12 h-12 rounded-full shadow-sm bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
          
          <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Order #{id}</h1>
              <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5"><Clock className="w-4 h-4" /> Arriving in ~25 mins</p>
            </div>
            <div className="text-right">
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Preparing</span>
            </div>
          </div>

          {/* Stepper */}
          <div className="relative pl-6 mb-10">
            <div className="absolute left-[27px] top-4 bottom-4 w-1 bg-slate-100 rounded-full"></div>
            <div className="absolute left-[27px] top-4 h-[35%] w-1 bg-primary rounded-full transition-all duration-1000"></div>
            
            <div className="space-y-8">
              {STEPS.map((step, idx) => (
                <div key={step.id} className="relative flex items-start gap-6">
                  <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-4 border-white ${step.completed ? 'bg-primary' : 'bg-slate-200'}`}>
                    {step.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <h3 className={`font-bold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</h3>
                    <p className="text-sm font-medium text-slate-400 mt-0.5">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Partner */}
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0 overflow-hidden relative border-2 border-white shadow-sm">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop')] bg-cover"></div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900">Rajeev Kumar</h4>
              <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> DL-03 AB 1234</p>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" className="rounded-full h-10 w-10 text-primary border-primary hover:bg-primary/5">
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button size="icon" className="rounded-full h-10 w-10 bg-primary text-white shadow-md shadow-primary/20">
                <Phone className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button variant="outline" className="w-full h-12 rounded-full font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50">
            <FileText className="w-4 h-4 mr-2" /> View Order Details
          </Button>
          
        </div>
      </div>
    </div>
  );
}
