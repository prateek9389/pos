"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Printer, CheckSquare, Clock, 
  ChefHat, XCircle, CreditCard, User, Armchair, 
  Receipt, ShoppingBag
} from "lucide-react";
import { waiterService } from "@/services/waiterService";
import type { Order, MenuItem } from "@/services/cashierService";

export default function WaiterOrderDetails() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const orders = await waiterService.getOrders();
      const found = orders.find(o => o.orderId === id);
      if (found) setOrder(found);
    };
    fetchOrder();
  }, [id]);

  if (!order) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#5D34F5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: <Clock className="w-4 h-4" /> };
      case "PREPARING": return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: <ChefHat className="w-4 h-4" /> };
      case "READY": return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: <CheckSquare className="w-4 h-4" /> };
      case "COMPLETED": return { bg: "bg-[#F8F7FF]", text: "text-[#5D34F5]", border: "border-[#E5DFFF]", icon: <CheckSquare className="w-4 h-4" /> };
      case "CANCELLED": return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: <XCircle className="w-4 h-4" /> };
      default: return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", icon: <Clock className="w-4 h-4" /> };
    }
  };

  const statusConfig = getStatusConfig(order.orderStatus);

  return (
    <div className="h-full flex flex-col bg-slate-50 -mx-4 lg:-mx-8 -my-4 lg:-my-8 font-sans overflow-auto p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/waiter/orders" 
            className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-black text-slate-900 leading-tight">Order #{order.orderId}</h1>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                {statusConfig.icon}
                <span className="text-[11px] font-black uppercase tracking-widest">{order.orderStatus}</span>
              </div>
            </div>
            <p className="text-[13px] font-bold text-slate-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {(order.orderStatus as any) === "PENDING" && (
            <button 
              onClick={async () => {
                try {
                  const { db } = await import("@/lib/firebase");
                  const { updateDoc, doc } = await import("firebase/firestore");
                  await updateDoc(doc(db, "orders", (order as any).id), { status: "Sent to Kitchen", orderStatus: "SENT_TO_KITCHEN" });
                  setOrder(prev => prev ? { ...prev, orderStatus: "SENT_TO_KITCHEN", status: "Sent to Kitchen" } as any : null);
                } catch (error) {
                  console.error("Error updating order:", error);
                }
              }}
              className="h-11 px-5 rounded-full bg-indigo-600 text-white flex items-center gap-2 font-black text-[13px] hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-colors"
            >
              <ChefHat className="w-4 h-4" />
              Send to Kitchen
            </button>
          )}
          <button className="h-11 px-5 rounded-full border border-slate-200 bg-white flex items-center gap-2 text-slate-700 font-black text-[13px] hover:bg-slate-50 transition-colors shadow-sm">
            <Printer className="w-4 h-4 text-[#5D34F5]" />
            Print KOT
          </button>
          <button className="h-11 px-5 rounded-full bg-[#5D34F5] text-white flex items-center gap-2 font-black text-[13px] hover:bg-[#4A2ABF] shadow-md shadow-[#5D34F5]/20 transition-colors">
            <Receipt className="w-4 h-4" />
            Generate Bill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[16px] font-black text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#5D34F5]" />
                Order Items
              </h2>
              <span className="text-[13px] font-bold text-slate-500">{order.items.length} items</span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {order.items.map((item, index) => (
                <div key={index} className="p-6 flex items-center gap-6 hover:bg-slate-50/50 transition-colors">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-[15px] font-black text-slate-900">{item.name}</h3>
                      <p className="text-[16px] font-black text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    
                    <p className="text-[13px] font-bold text-slate-500 mb-3">{(item as any).category}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[12px] font-black">Qty: {item.quantity}</span>
                        <span className="text-[12px] font-bold text-slate-400">× ₹{item.price.toFixed(2)}</span>
                      </div>
                      
                      <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} title={item.isVeg ? "Veg" : "Non-Veg"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Order Summary */}
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6">
            <h2 className="text-[16px] font-black text-slate-900 mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#5D34F5]" />
              Payment Summary
            </h2>
            
            <div className="space-y-4 mb-6 text-[14px]">
              <div className="flex justify-between text-slate-500 font-bold">
                <span>Subtotal</span>
                <span className="text-slate-900">₹{order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-bold">
                <span>Tax (5%)</span>
                <span className="text-slate-900">₹{(order.total * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-bold border-b border-slate-100 pb-4">
                <span>Service Charge</span>
                <span className="text-slate-900">₹0.00</span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-[15px] font-black text-slate-900">Total Amount</span>
                <span className="text-[24px] font-black text-[#5D34F5]">₹{(order.total * 1.05).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
              <span className="text-[13px] font-bold text-amber-700">Payment Status</span>
              <span className="text-[13px] font-black text-amber-700 uppercase">Unpaid</span>
            </div>
          </div>

          {/* Table & Customer Info */}
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6">
            <h2 className="text-[16px] font-black text-slate-900 mb-6">Service Details</h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#F8F7FF] flex items-center justify-center text-[#5D34F5] shrink-0">
                  <Armchair className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Assigned Table</p>
                  <p className="text-[15px] font-black text-slate-900">{order.tableId || "Not assigned"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#F8F7FF] flex items-center justify-center text-[#5D34F5] shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Customer Name</p>
                  <p className="text-[15px] font-black text-slate-900">{order.customerName || "Walk-in Guest"}</p>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-8 py-3 rounded-xl border border-slate-200 text-[13px] font-black text-[#5D34F5] hover:bg-slate-50 transition-colors">
              Update Details
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
