"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, CreditCard, Banknote, Smartphone, Wallet, QrCode, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cashierService, type Order } from "@/services/cashierService";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { id: "UPI", icon: Smartphone, label: "UPI & QR" },
  { id: "Card", icon: CreditCard, label: "Credit/Debit Card" },
  { id: "Cash", icon: Banknote, label: "Cash Payment" },
  { id: "Wallet", icon: Wallet, label: "Digital Wallet" },
];

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [selectedMethod, setSelectedMethod] = useState("UPI");
  const [isSuccess, setIsSuccess] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setIsLoading(false);
        return;
      }
      try {
        const orders = await cashierService.getOrders();
        const found = orders.find(o => o.id === orderId || o.orderId === orderId);
        if (found) setOrder(found);
      } catch (e) {
        console.error("Error loading order:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrder();
  }, [orderId]);

  const subtotal = order?.subtotal || order?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const gst = order?.tax || subtotal * 0.05;
  const serviceCharge = order?.serviceCharge || 0;
  const total = order?.total || (subtotal + gst + serviceCharge);

  const handlePayment = async () => {
    if (!order?.id) return;
    setIsProcessing(true);
    try {
      await cashierService.updateOrder(order.id, {
        paymentStatus: "PAID",
        paymentMethod: selectedMethod.toUpperCase(),
        orderStatus: "COMPLETED",
      });
      await cashierService.updateOrderStatus(order.id, "COMPLETED");
      toast.success("Payment processed successfully!");
      setIsSuccess(true);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-bold">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-slate-50">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-lg flex flex-col items-center max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <Banknote className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">No Order Selected</h2>
          <p className="text-slate-500 font-medium mb-6">Navigate here from the Orders or POS page to process a payment.</p>
          <Button className="rounded-xl font-bold h-12 px-8" onClick={() => router.push("/cashier/orders")}>
            Go to Orders
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl shadow-emerald-500/10 flex flex-col items-center max-w-md w-full relative overflow-hidden text-center"
        >
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-50 to-transparent" />

          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-emerald-500/30"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          <h1 className="text-3xl font-black text-slate-900 mb-2 relative z-10 tracking-tight">Payment Received!</h1>
          <p className="text-slate-500 font-medium mb-8 relative z-10">
            Order <span className="font-bold text-slate-700">#{order.orderId}</span> settled via {selectedMethod}.
          </p>
          
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 w-full mb-8 relative z-10">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Total Amount Paid</p>
            <p className="text-5xl font-black text-emerald-500 tracking-tight">₹{total.toFixed(2)}</p>
          </div>

          <div className="flex flex-col w-full gap-3 relative z-10">
            <Button className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/25 text-lg" onClick={() => router.push("/cashier/pos")}>
              Start New Order <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
              Print Receipt
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col font-sans pb-24">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-4"
      >
        <Button variant="outline" size="icon" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 rounded-xl border-slate-200 shadow-sm">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h1>
          <p className="text-slate-500 text-sm font-medium">Select payment method to settle bill.</p>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        
        {/* Payment Methods */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 flex flex-col gap-6"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
            <h2 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-wider">Payment Method</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left group",
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        isSelected ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm"
                      )}>
                        <method.icon className="w-6 h-6" />
                      </div>
                      <span className={cn(
                        "font-bold",
                        isSelected ? "text-primary" : "text-slate-700"
                      )}>
                        {method.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Details Area */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedMethod}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 flex-1"
            >
              {selectedMethod === "UPI" && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-48 h-48 bg-slate-50 rounded-3xl border-2 border-slate-200 p-4 mb-6 relative overflow-hidden group shadow-sm">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_15px_#4f46e5] animate-[scan_2s_ease-in-out_infinite]" />
                    <QrCode className="w-full h-full text-slate-800" />
                  </div>
                  <h3 className="font-black text-slate-900 text-xl mb-2">Scan to Pay</h3>
                  <p className="text-slate-500 font-medium mb-6">Ask customer to scan using any UPI app</p>
                  <p className="text-sm font-black tracking-widest text-primary bg-primary/5 px-6 py-3 rounded-xl border border-primary/20 inline-block">
                    FOODIE@UPI
                  </p>
                </div>
              )}

              {selectedMethod === "Cash" && (
                <div className="flex flex-col justify-center h-full max-w-sm mx-auto space-y-8">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3">Amount Due</label>
                    <div className="text-4xl font-black text-slate-900">₹{total.toFixed(2)}</div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3">Cash Received (₹)</label>
                    <Input 
                      type="number" 
                      className="h-16 text-2xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 focus-visible:ring-primary/20 transition-all" 
                      placeholder="0.00"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                    />
                  </div>
                  <div className="pt-6 border-t-2 border-dashed border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-600">Change to return:</span>
                      <span className={cn(
                        "text-3xl font-black",
                        parseFloat(cashReceived || "0") >= total ? "text-emerald-500" : "text-slate-300"
                      )}>
                        ₹{Math.max(0, (parseFloat(cashReceived || "0") - total)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {(selectedMethod === "Card" || selectedMethod === "Wallet") && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <CreditCard className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="font-black text-slate-900 text-xl mb-2">Send Payment Link</h3>
                  <p className="text-slate-500 font-medium">Send an SMS or Email link to the customer to complete payment securely.</p>
                  <Button variant="outline" className="mt-8 rounded-xl font-bold h-12 px-8">Send Link</Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Order Summary & Pay Button */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full lg:w-[420px] flex-shrink-0 flex flex-col gap-6"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="p-6 bg-slate-50/80 border-b border-slate-100 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <h2 className="text-lg font-black text-slate-900 mb-4 tracking-tight relative z-10">Bill Details</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm relative z-10">
                <div className="text-slate-500 font-medium">Order ID</div>
                <div className="font-bold text-slate-900 text-right bg-white px-2 py-1 rounded-md border shadow-sm">#{order.orderId}</div>
                
                {order.tableId && (
                  <>
                    <div className="text-slate-500 font-medium">Table</div>
                    <div className="font-bold text-slate-900 text-right">{order.tableId}</div>
                  </>
                )}
                
                <div className="text-slate-500 font-medium">Type</div>
                <div className="font-bold text-slate-900 text-right text-primary">{order.orderType || "Dine In"}</div>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <span className="font-bold text-slate-700 block mb-0.5">{item.name}</span>
                      <span className="text-xs font-bold text-slate-400">₹{item.price} × {item.quantity}</span>
                    </div>
                    <div className="text-right font-black text-slate-900 text-base">₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-3">
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>Taxes (5% GST)</span>
                <span className="font-bold text-slate-900">₹{gst.toFixed(2)}</span>
              </div>
              {serviceCharge > 0 && (
                <div className="flex justify-between text-sm font-medium text-slate-500">
                  <span>Service Charge</span>
                  <span className="font-bold text-slate-900">₹{serviceCharge.toFixed(2)}</span>
                </div>
              )}
              
              <div className="pt-4 mt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-end">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Grand Total</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-16 rounded-2xl text-xl font-black shadow-xl shadow-primary/30 hover:-translate-y-0.5 transition-all relative overflow-hidden"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </motion.div>
            ) : (
              `Confirm Payment — ₹${total.toFixed(2)}`
            )}
          </Button>

        </motion.div>

      </div>
    </div>
  );
}
