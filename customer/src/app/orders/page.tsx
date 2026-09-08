"use client";

import Link from "next/link";
import { ShoppingBag, ChevronRight, MapPin, Star, Repeat, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAST_ORDERS = [
  { id: "FB1024", date: "Today, 10:30 AM", status: "Delivered", amount: "₹1,203.30", branch: "Connaught Place", items: "Margherita Pizza x 2, Veg Burger x 1, Cold Coffee x 2", rating: null },
  { id: "FB0988", date: "05 Aug 2026, 20:15", status: "Delivered", amount: "₹450.00", branch: "Cyber Hub", items: "Pasta Alfredo x 1, French Fries x 1", rating: 5 },
  { id: "FB0842", date: "22 Jul 2026, 13:40", status: "Cancelled", amount: "₹890.00", branch: "Connaught Place", items: "Family Meal Combo x 1", rating: null },
];

export default function OrdersHistoryPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans relative overflow-hidden">
      
      {/* Decorative Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <div>
            <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Past Orders</h1>
            <p className="text-[15px] font-medium text-slate-500">View your order history and easily reorder your favorites</p>
          </div>
        </div>

        <div className="space-y-6">
          {PAST_ORDERS.map((order) => (
            <div key={order.id} className={`bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 sm:p-8 overflow-hidden relative border-l-[6px] transition-all hover:shadow-[0_10px_40px_rgb(0,0,0,0.05)] ${order.status === 'Delivered' ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-slate-50 pb-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {order.status === 'Delivered' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[18px]">Order #{order.id}</h3>
                    <p className="text-[13px] text-slate-500 font-medium">{order.date}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                  <div className="font-black text-slate-900 text-[20px] mb-0.5">{order.amount}</div>
                  <div className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-1 sm:px-0 sm:py-0 inline-block sm:block rounded-md sm:rounded-none ${order.status === 'Delivered' ? 'bg-emerald-100 sm:bg-transparent text-emerald-600' : 'bg-rose-100 sm:bg-transparent text-rose-600'}`}>
                    {order.status}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 text-[13px] text-slate-600 font-bold mb-3">
                  <MapPin className="w-4 h-4 text-indigo-400" /> {order.branch}
                </div>
                <p className="text-slate-500 text-[14px] font-medium leading-relaxed">{order.items}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-slate-100">
                {order.status === 'Delivered' ? (
                  <div className="flex-1 w-full">
                    {order.rating ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-slate-700 mr-2">You rated:</span>
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} className={`w-4 h-4 ${star <= order.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-slate-600 font-bold hover:bg-slate-200 rounded-xl">
                        <Star className="w-4 h-4 mr-2" /> Rate Order
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 w-full text-[13px] font-medium text-slate-400">Order was cancelled</div>
                )}
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button variant="outline" className="flex-1 sm:flex-none rounded-xl font-bold h-11 px-6 border-slate-200 hover:bg-slate-50 text-slate-700">Details</Button>
                  <Button className="flex-1 sm:flex-none rounded-xl font-bold h-11 px-6 bg-gradient-to-r from-[#6366F1] to-[#D946EF] hover:from-[#4F46E5] hover:to-[#C026D3] text-white shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-all border-0">
                    <Repeat className="w-4 h-4 mr-2" /> Reorder
                  </Button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
