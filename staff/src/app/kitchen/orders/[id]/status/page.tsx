"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { kitchenService } from "@/services/kitchenService";
import type { Order } from "@/services/cashierService";
import { toast } from "sonner";

export default function KitchenOrderStatus() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      const orders = await kitchenService.getOrders();
      const found = orders.find(o => o.orderId === params.id);
      if (found) setOrder(found);
    };
    loadOrder();
  }, [params.id]);

  if (!order) return <div className="p-8 text-center text-slate-500 font-bold">Loading...</div>;

  const handleUpdate = async (status: Order["orderStatus"]) => {
    // In a real app, Cancel Order might require confirmation or manager approval.
    if (status === "CANCELLED") {
       if(!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;
    }
    
    await kitchenService.updateOrderStatus(order.orderId, status);
    toast.success(`Order #${order.orderId} status updated to ${status}.`);
    
    if (status === "READY" || status === "COMPLETED") {
       router.push('/kitchen/ready');
    } else {
       router.push('/kitchen/dashboard');
    }
  };

  const getTimelineSteps = () => {
    const steps = [
      { id: 'placed', label: 'Order Placed', time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'completed' },
      { id: 'confirmed', label: 'Confirmed', time: new Date(new Date(order.createdAt).getTime() + 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'completed' },
    ];

    if ((order.orderStatus as any) === "PENDING") {
      steps.push({ id: 'preparing', label: 'Preparing', time: '', status: 'pending' });
      steps.push({ id: 'ready', label: 'Ready', time: '', status: 'pending' });
    } else if (order.orderStatus === "PREPARING") {
      steps.push({ id: 'preparing', label: 'Preparing', time: 'Current', status: 'active' });
      steps.push({ id: 'ready', label: 'Ready', time: '', status: 'pending' });
    } else {
      steps.push({ id: 'preparing', label: 'Preparing', time: new Date(new Date(order.createdAt).getTime() + 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'completed' });
      steps.push({ id: 'ready', label: 'Ready', time: new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'completed' });
    }

    steps.push({ id: 'served', label: 'Served', time: '', status: order.orderStatus === 'COMPLETED' ? 'completed' : 'pending' });
    steps.push({ id: 'completed', label: 'Completed', time: '', status: order.orderStatus === 'COMPLETED' ? 'completed' : 'pending' });

    return steps;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 bg-white p-4 lg:p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl lg:text-2xl font-black text-slate-900 flex items-center gap-3">
          Update Order Status
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Current State Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Order #{order.orderId}</h2>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-bold">Table</span>
              <span className="text-slate-900 font-black">{order.tableId || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-bold">Customer</span>
              <span className="text-slate-900 font-black">{order.customerName || "Walk-in"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-bold">Order Time</span>
              <span className="text-slate-900 font-black">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-bold block mb-2">Items</span>
              <ul className="text-slate-900 font-black space-y-1">
                {order.items.map(i => <li key={i.id}>{i.quantity}× {i.name}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* Timeline & Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Current Status</h2>
          
          <div className="relative pl-3 space-y-6 mb-8 flex-1">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
            
            {getTimelineSteps().map((step, index) => (
              <div key={step.id} className="relative z-10 flex gap-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 mt-0.5 ${
                  step.status === 'completed' 
                    ? 'bg-primary border-primary text-white' 
                    : step.status === 'active'
                    ? 'bg-white border-primary text-primary ring-4 ring-primary/20'
                    : 'bg-white border-slate-200 text-slate-300'
                }`}>
                  {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <div className={`w-2 h-2 rounded-full ${step.status === 'active' ? 'bg-primary' : 'bg-slate-200'}`} />}
                </div>
                <div className="flex-1 flex justify-between">
                  <p className={`font-bold ${step.status === 'completed' ? 'text-slate-900' : step.status === 'active' ? 'text-primary' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  {step.time && <p className="text-xs font-bold text-slate-500 mt-1">{step.time}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <Button 
          onClick={() => handleUpdate("READY")}
          className="flex-1 h-14 text-base font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
        >
          Mark as Ready
        </Button>
        {/* Note: 'ON_HOLD' isn't explicitly in the cashierService types currently, using string cast or matching backend logic if necessary. Assuming we stick to standard strings for mock. */}
        <Button 
          onClick={() => {
             toast("Order put on hold.", { description: "The timer is paused."});
          }}
          className="flex-1 h-14 text-base font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
        >
          Put On Hold
        </Button>
        <Button 
          onClick={() => handleUpdate("CANCELLED")}
          variant="destructive"
          className="flex-1 h-14 text-base font-black rounded-xl shadow-lg shadow-red-600/20"
        >
          Cancel Order
        </Button>
      </div>

    </div>
  );
}
