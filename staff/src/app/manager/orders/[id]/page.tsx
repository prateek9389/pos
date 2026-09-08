"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, MoreHorizontal, CheckCircle2, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const orderItems = [
  { name: "Margherita Pizza", qty: 1, price: 349, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=200&auto=format&fit=crop" },
  { name: "Cold Coffee", qty: 1, price: 149, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=200&auto=format&fit=crop" },
  { name: "French Fries", qty: 1, price: 129, image: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?q=80&w=200&auto=format&fit=crop" },
];

export default function OrderDetailsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/manager/orders">
            <Button variant="outline" size="icon" className="rounded-xl w-10 h-10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Details</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="default" className="rounded-xl font-bold gap-2">
            <Printer className="w-4 h-4" /> Print Bill
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Order Info & Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-none shadow-sm shadow-slate-200/50">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Order Information</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <div>
                <p className="text-sm font-bold text-slate-500">Order ID</p>
                <p className="text-base font-bold text-slate-900 mt-1">#FB10234</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Date & Time</p>
                <p className="text-base font-medium text-slate-900 mt-1">12 May 2026, 10:30 AM</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Table</p>
                <p className="text-base font-bold text-slate-900 mt-1">T-12</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Customer</p>
                <p className="text-base font-medium text-slate-900 mt-1">Rahul Mehta</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Phone</p>
                <p className="text-base font-medium text-slate-900 mt-1">+91 98765 43210</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Order Type</p>
                <p className="text-base font-medium text-slate-900 mt-1">Dine In</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Payment Method</p>
                <p className="text-base font-bold text-slate-900 mt-1 uppercase">UPI</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Payment Status</p>
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mt-1">
                  Paid
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Order Status</p>
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full mt-1">
                  Preparing
                </span>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm shadow-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Order Items</h2>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orderItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 relative overflow-hidden">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                        <span className="font-bold text-slate-900">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-600">{item.qty}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">₹{item.price}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">₹{item.price * item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50/50 flex flex-col items-end gap-3">
              <div className="w-full sm:w-64 flex justify-between text-sm font-medium text-slate-500">
                <span>Subtotal</span>
                <span className="text-slate-900">₹627.00</span>
              </div>
              <div className="w-full sm:w-64 flex justify-between text-sm font-medium text-slate-500">
                <span>GST (5%)</span>
                <span className="text-slate-900">₹31.35</span>
              </div>
              <div className="w-full sm:w-64 flex justify-between text-sm font-medium text-slate-500">
                <span>Delivery Charges</span>
                <span className="text-slate-900">₹30.00</span>
              </div>
              <div className="w-full sm:w-64 h-px bg-slate-200 my-1"></div>
              <div className="w-full sm:w-64 flex justify-between text-lg font-black text-slate-900">
                <span>Total Amount</span>
                <span className="text-primary">₹688.35</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Timeline */}
        <div className="lg:col-span-1">
          <Card className="p-6 border-none shadow-sm shadow-slate-200/50">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Order Timeline</h2>
            
            <div className="relative pl-6 space-y-8">
              {/* Vertical line */}
              <div className="absolute top-2 bottom-8 left-[11px] w-[2px] bg-slate-100"></div>

              {/* Steps */}
              <div className="relative z-10 flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 -ml-[7px] ring-4 ring-white">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-900">Order Placed</p>
                    <span className="text-xs font-bold text-slate-400">10:30 AM</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 -ml-[7px] ring-4 ring-white">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-900">Confirmed</p>
                    <span className="text-xs font-bold text-slate-400">10:31 AM</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 -ml-[7px] ring-4 ring-white">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-900 text-primary">Preparing</p>
                    <span className="text-xs font-bold text-slate-400">10:32 AM</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex gap-4 opacity-40">
                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center shrink-0 -ml-[7px] ring-4 ring-white">
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-900">Ready</p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex gap-4 opacity-40">
                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center shrink-0 -ml-[7px] ring-4 ring-white">
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-900">Served</p>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
