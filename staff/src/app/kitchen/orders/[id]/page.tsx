"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { kitchenService } from "@/services/kitchenService";
import type { Order } from "@/services/cashierService";
import { toast } from "sonner";

export default function KitchenOrderDetails() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  
  // Kitchen specific item checklist state (mocked locally for UI purposes)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadOrder = async () => {
      const orders = await kitchenService.getOrders();
      const found = orders.find(o => o.orderId === params.id);
      if (found) setOrder(found);
    };
    loadOrder();
  }, [params.id]);

  if (!order) return <div className="p-8 text-center text-slate-500 font-bold">Loading Order Details...</div>;

  const toggleCheck = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) newChecked.delete(itemId);
    else newChecked.add(itemId);
    setCheckedItems(newChecked);
  };

  const handlePrintKOT = () => {
    // In a real app, this would send to thermal printer. Here we mock browser print.
    toast.success("Printing KOT...");
    window.print();
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 lg:p-6 rounded-2xl border border-slate-200/60 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 flex items-center gap-3">
            Order #{order.orderId}
            {(order.orderStatus as any) === "PENDING" && <span className="px-3 py-1 text-sm rounded-full border bg-purple-100 text-purple-700 border-purple-200">NEW</span>}
            {order.orderStatus === "PREPARING" && <span className="px-3 py-1 text-sm rounded-full border bg-orange-100 text-orange-700 border-orange-200">PREPARING</span>}
            {order.orderStatus === "READY" && <span className="px-3 py-1 text-sm rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">READY</span>}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handlePrintKOT}
            variant="outline"
            className="font-bold rounded-xl border-primary text-primary hover:bg-primary/5 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print KOT
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl border-slate-200">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Info & Timeline */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          {/* Order Information (Reduced for Kitchen) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Order Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-100 pb-4">
                <span className="text-slate-500 font-bold text-sm">Table</span>
                <span className="text-slate-900 font-black">{order.tableId || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-4">
                <span className="text-slate-500 font-bold text-sm">Customer</span>
                <span className="text-slate-900 font-black">{order.customerName || "Walk-in"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-4">
                <span className="text-slate-500 font-bold text-sm">Order Type</span>
                <span className="text-slate-900 font-black">{order.orderType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-4">
                <span className="text-slate-500 font-bold text-sm">Order Time</span>
                <span className="text-slate-900 font-black">{new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Order Timeline</h2>
            <div className="relative pl-3 space-y-6">
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
                  <div>
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

        {/* Right Column: Items Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm" id="printable-area">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Order Items ({order.items.length})</h2>
              {checkedItems.size === order.items.length && order.items.length > 0 && (
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  All items ready
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              {order.items.map((item) => {
                const isChecked = checkedItems.has(item.id);
                return (
                  <div 
                    key={item.id} 
                    onClick={() => toggleCheck(item.id)}
                    className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      isChecked ? 'bg-emerald-50/50 border-emerald-200 opacity-60' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="pt-1">
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent'
                      }`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 print:hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-black text-lg ${isChecked ? 'text-slate-600 line-through' : 'text-slate-900'}`}>{item.name}</h4>
                        <span className="font-black text-xl text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{item.quantity}×</span>
                      </div>
                      
                      <div className="text-sm font-medium mt-1">
                        {(item.selectedSize || item.selectedAddons?.length) && (
                          <span className={`block mb-1 ${isChecked ? 'text-slate-400' : 'text-slate-600'}`}>
                            {item.selectedSize && `${item.selectedSize}`}
                            {item.selectedSize && item.selectedAddons?.length ? ' • ' : ''}
                            {item.selectedAddons?.map(a => a.name).join(', ')}
                          </span>
                        )}
                        {item.specialInstructions && (
                          <div className="mt-2 text-sm font-black text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 flex items-center gap-2">
                             <AlertTriangle className="w-4 h-4" />
                             SPECIAL INSTRUCTION: {item.specialInstructions.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* KOT Print Styles */}
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #printable-area, #printable-area * {
                  visibility: visible;
                }
                #printable-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  box-shadow: none !important;
                  border: none !important;
                }
              }
            `}</style>
          </div>
          
          <div className="flex gap-4 print:hidden">
            {(order.orderStatus as any) === "PENDING" && (
              <Button 
                onClick={() => {
                  kitchenService.updateOrderStatus(order.orderId, "PREPARING");
                  toast.success("Preparation started.");
                  router.push(`/kitchen/orders/${order.orderId}`);
                }}
                className="w-full h-14 text-lg font-black rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20"
              >
                Start Preparing
              </Button>
            )}
            {order.orderStatus === "PREPARING" && (
              <Button 
                onClick={() => {
                  kitchenService.updateOrderStatus(order.orderId, "READY");
                  toast.success("Order marked as ready!");
                  router.push(`/kitchen/ready`);
                }}
                disabled={checkedItems.size !== order.items.length}
                className="w-full h-14 text-lg font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                Mark Order Ready
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => router.push(`/kitchen/orders/${order.orderId}/status`)}
              className="w-full h-14 text-lg font-black rounded-xl border-slate-200 text-slate-600 bg-white shadow-sm hover:bg-slate-50"
            >
              Update Status Options
            </Button>
          </div>
          
        </div>
      </div>
    </div>
  );
}

import { AlertTriangle } from "lucide-react";
