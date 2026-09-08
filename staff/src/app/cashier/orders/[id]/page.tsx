"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cashierService, Order } from "@/services/cashierService";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, Phone, Printer, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const allOrders = await cashierService.getOrders();
      const found = allOrders.find(o => o.orderId === params.id);
      setOrder(found || null);
      setIsLoading(false);
    };
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500 font-medium animate-pulse">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h2>
        <p className="text-slate-500 mb-6">The order #{params.id} does not exist or has been removed.</p>
        <Button onClick={() => router.push("/cashier/orders")}>Back to Orders</Button>
      </div>
    );
  }

  const steps = ["PENDING", "PREPARING", "READY", "COMPLETED"];
  const currentStepIndex = steps.indexOf(order.orderStatus);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 px-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/cashier/orders">
            <Button variant="ghost" size="icon" className="shrink-0 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Order #{order.orderId}</h1>
            <p className="text-sm font-medium text-slate-500">
              {new Date(order.createdAt).toLocaleString()} • {order.orderType}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold text-slate-700" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print KOT
          </Button>
          <Button className="font-bold shadow-md shadow-primary/20" onClick={() => window.print()}>
            <Receipt className="w-4 h-4 mr-2" /> Print Bill
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Order Status</h3>
            <div className="relative flex justify-between">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all"
                style={{ width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%` }}
              ></div>
              
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors",
                      isCompleted ? "bg-primary border-primary text-white" : "bg-white border-slate-200 text-slate-400",
                      isCurrent && "ring-4 ring-primary/20"
                    )}>
                      {index + 1}
                    </div>
                    <span className={cn(
                      "text-xs font-bold capitalize",
                      isCompleted ? "text-slate-900" : "text-slate-400"
                    )}>
                      {step.toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <span className="font-black text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 mt-1">₹{item.price.toFixed(2)} × {item.quantity}</p>
                    {item.selectedSize && <p className="text-xs text-slate-500 mt-1">Size: {item.selectedSize}</p>}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Add-ons: {item.selectedAddons.map(a => a.name).join(", ")}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p className="text-xs font-medium text-amber-600 bg-amber-50 p-1.5 rounded-md mt-2 inline-block">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          
          {/* Customer & Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Customer Details</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {(order.customerName || "W")[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{order.customerName || "Walk-in Customer"}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {order.customerId ? "Registered" : "No Phone"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="h-px bg-slate-100 w-full"></div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Order Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> Table
                  </p>
                  <p className="font-bold text-slate-900">{order.tableId || "N/A"}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" /> Type
                  </p>
                  <p className="font-bold text-slate-900">{order.orderType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Payment Summary</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>Subtotal</span>
                <span className="text-slate-900">₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>GST (5%)</span>
                <span className="text-slate-900">₹{order.tax.toFixed(2)}</span>
              </div>
              {order.orderType === 'DELIVERY' && (order.deliveryCharge || 0) > 0 && (
                <div className="flex justify-between items-center py-2 text-[14px] font-bold text-slate-500">
                  <span>Delivery Charge</span>
                  <span>₹{(order.deliveryCharge || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>Discount</span>
                <span className="text-green-600">-₹{order.discount.toFixed(2)}</span>
              </div>
              <div className="h-px w-full bg-slate-100 my-2"></div>
              <div className="flex justify-between text-xl font-black text-slate-900">
                <span>Total</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-600">Status</span>
              <span className={cn(
                "px-3 py-1 rounded-md text-xs font-bold border",
                order.paymentStatus === "PAID" 
                  ? "bg-green-100 text-green-700 border-green-200" 
                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
              )}>
                {order.paymentStatus}
              </span>
            </div>

            {order.paymentStatus !== "PAID" && (
              <Button className="w-full font-bold shadow-md shadow-primary/20" onClick={() => router.push("/cashier/payment")}>
                Collect Payment
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
