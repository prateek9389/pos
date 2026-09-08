"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CreditCard, Lock, CheckCircle2, ShieldCheck, Tag, Gift, ChevronRight, ClipboardList, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { useCartStore } from "@/lib/cart-store";
import { useBranchStore } from "@/lib/branch-store";

export default function PaymentPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<"card" | "upi">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { items: cartItems, clearCart, appliedCoupon } = useCartStore();
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "Percentage (%)" || appliedCoupon.type === "Percentage") {
      discountAmount = subtotal * (appliedCoupon.value / 100);
    } else {
      discountAmount = appliedCoupon.value;
    }
    if (discountAmount > subtotal) discountAmount = subtotal;
  }
  
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * 0.05;
  const delivery = afterDiscount > 500 ? 0 : 40;
  const grandTotal = afterDiscount + tax + delivery;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const customerNameStr = auth.currentUser?.displayName || "Guest User";
      const initialsStr = customerNameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "GU";
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const { selectedBranchId, selectedBranchName } = useBranchStore.getState();
      
      const newOrder = {
        orderId,
        restaurantId: "R-1",
        branchId: selectedBranchId || "R4NVTuAAyjc0U2icb46A",
        branch: selectedBranchName || "Premium Restaurant, Vijay Nagar",

        userId: auth.currentUser?.uid || "guest",
        
        // Waiter App Fields
        customerName: customerNameStr,
        orderType: localStorage.getItem("checkout_orderType") === "takeaway" ? "Takeaway" : "Delivery",
        orderStatus: "PENDING",
        paymentStatus: "PAID",
        paymentMethod: selectedMethod === 'card' ? 'Card' : 'UPI',
        subtotal: subtotal,
        tax: tax,
        serviceCharge: 0,
        discount: discountAmount,
        deliveryCharge: delivery,
        total: grandTotal,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        items: cartItems.map((item, idx) => ({
          id: `item-${idx}`,
          menuItemId: item.foodId || item.id || `menu-${idx}`,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          isVeg: (item as any).isVeg ?? true,
          image: item.image || ""
        })),
        
        // Manager & Superadmin App Fields
        status: "Pending",
        type: localStorage.getItem("checkout_orderType") === "takeaway" ? "Takeaway" : "Delivery",
        amount: grandTotal,
        payment: "PAID",
        date: dateStr,
        time: timeStr,
        day: now.toLocaleDateString('en-US', { weekday: 'short' }),
        table: localStorage.getItem("checkout_orderType") === "takeaway" ? "Takeaway" : "Delivery",
        customer: {
          name: customerNameStr,
          phone: "+91 9999999999",
          initials: initialsStr
        }
      };

      const finalAmount = grandTotal;
      const finalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

      await addDoc(collection(db, "orders"), newOrder);
      
      // Sync customer data to the customers collection
      try {
        const customerPhone = "+91 9999999999"; // Fallback phone, or auth user's phone if available
        const customersRef = collection(db, "customers");
        const q = query(customersRef, where("phone", "==", customerPhone));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const custDoc = snap.docs[0];
          const data = custDoc.data();
          const newTotalOrders = (data.totalOrders || data.orders || 0) + 1;
          const newTotalSpent = (data.totalSpent || data.spending || 0) + grandTotal;
          
          await updateDoc(doc(db, "customers", custDoc.id), {
            totalOrders: newTotalOrders,
            orders: newTotalOrders,
            totalSpent: newTotalSpent,
            spending: newTotalSpent,
            lastVisit: dateStr
          });
        } else {
          await addDoc(customersRef, {
            customerId: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
            name: customerNameStr,
            phone: customerPhone,
            email: auth.currentUser?.email || "",
            totalOrders: 1,
            orders: 1,
            totalSpent: grandTotal,
            spending: grandTotal,
            points: 0,
            lastVisit: dateStr,
            status: "Active",
            createdAt: serverTimestamp()
          });
        }
      } catch (err) {
        console.error("Error syncing customer data:", err);
      }
      
      clearCart();
      
      setTimeout(() => {
        router.push(`/order-success?orderId=${orderId}&amount=${finalAmount}&items=${finalItems}&method=${selectedMethod}`);
      }, 1000);
    } catch (error) {
      console.error("Error placing order:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 font-sans relative">
      
      {/* Decorative Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      <div className="flex items-center gap-4 mb-10">
        <Link href="/checkout" className={`inline-flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-slate-900 transition-colors ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Secure Checkout</h1>
          <p className="text-[#64748B] font-medium text-[15px]">Complete your payment to finalize your order.</p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Left Column - Payment Method Form */}
        <div className="flex-1 w-full relative">
          
          <AnimatePresence>
            {isProcessing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center"
              >
                <div className="relative w-20 h-20">
                  <svg className="animate-spin w-full h-full text-slate-200" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75 text-[#7C3AED]" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-[#7C3AED]" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-6">Processing Payment...</h2>
                <p className="text-slate-500 mt-2 text-sm font-medium">Please do not close this window</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 border-l-[6px] border-l-[#8B5CF6] h-full flex flex-col">
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-[22px] font-bold text-slate-900 leading-tight">Payment Method</h3>
                <p className="text-[#64748B] text-[14px] font-medium">Choose your preferred payment option</p>
              </div>
            </div>
            
            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => setSelectedMethod('card')}
                className={`flex-1 relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${selectedMethod === 'card' ? 'border-[#6D28D9] bg-purple-50/30 shadow-[0_4px_15px_rgb(109,40,217,0.1)]' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
              >
                {selectedMethod === 'card' && <div className="absolute top-3 right-3 w-5 h-5 bg-[#6D28D9] rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                <CreditCard className={`w-8 h-8 ${selectedMethod === 'card' ? 'text-[#6D28D9]' : 'text-slate-400'}`} />
                <span className={`text-[14px] font-bold ${selectedMethod === 'card' ? 'text-[#6D28D9]' : 'text-slate-500'}`}>Credit / Debit Card</span>
              </button>
              
              <button 
                onClick={() => setSelectedMethod('upi')}
                className={`flex-1 relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${selectedMethod === 'upi' ? 'border-[#6D28D9] bg-purple-50/30 shadow-[0_4px_15px_rgb(109,40,217,0.1)]' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
              >
                {selectedMethod === 'upi' && <div className="absolute top-3 right-3 w-5 h-5 bg-[#6D28D9] rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                <Smartphone className={`w-8 h-8 ${selectedMethod === 'upi' ? 'text-[#6D28D9]' : 'text-slate-400'}`} />
                <span className={`text-[14px] font-bold ${selectedMethod === 'upi' ? 'text-[#6D28D9]' : 'text-slate-500'}`}>UPI / Wallet</span>
              </button>
            </div>
            
            {selectedMethod === 'card' ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2 uppercase tracking-wide"><CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Card Number</label>
                  <div className="relative">
                    <input type="text" placeholder="4242 4242 4242 4242" className="w-full h-[52px] bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 text-[15px] font-bold tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] shadow-sm transition-all placeholder:text-slate-300" />
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Expiry Date</label>
                    <input type="text" placeholder="12 / 28" className="w-full h-[52px] bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 text-[15px] font-bold tracking-wider text-slate-900 outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] shadow-sm transition-all placeholder:text-slate-300" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2 uppercase tracking-wide"><Lock className="w-3.5 h-3.5 text-indigo-500" /> CVV</label>
                    <div className="relative">
                      <input type="password" placeholder="•••" className="w-full h-[52px] bg-[#EEF2FF] border border-indigo-100 rounded-xl px-4 text-[15px] font-bold tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] shadow-sm transition-all placeholder:text-indigo-200" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Name on Card</label>
                  <input type="text" placeholder="John Doe" className="w-full h-[52px] bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 text-[15px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] shadow-sm transition-all placeholder:text-slate-300" />
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 flex-1 flex flex-col justify-center items-center py-8">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <Smartphone className="w-10 h-10 text-indigo-500" />
                </div>
                <h4 className="font-bold text-slate-900 text-lg">Enter UPI ID</h4>
                <div className="w-full relative mt-2 max-w-sm">
                  <input type="text" placeholder="username@upi" className="w-full h-[52px] bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 text-[15px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] shadow-sm transition-all text-center" />
                </div>
              </div>
            )}
            
            <div className="mt-auto">
              <Button 
                onClick={handlePayment} 
                disabled={isProcessing || cartItems.length === 0}
                className="w-full mt-8 rounded-2xl h-[56px] text-[17px] font-bold bg-gradient-to-r from-[#6366F1] to-[#D946EF] hover:from-[#4F46E5] hover:to-[#C026D3] text-white shadow-[0_8px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.4)] transition-all border-0 flex items-center justify-center gap-3"
              >
                <CreditCard className="w-5 h-5" />
                Pay ₹{grandTotal.toFixed(2)} Now 
                <ArrowRight className="w-5 h-5" />
              </Button>
              
              <p className="text-center text-[#94A3B8] text-[11px] font-medium flex items-center justify-center gap-1.5 mt-4">
                <Lock className="w-3 h-3" /> Your payment information is secure and encrypted
              </p>
            </div>
            
          </motion.div>
        </div>
        
        {/* Right Column - Order Summary */}
        <div className="w-full lg:w-[400px] shrink-0">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 sm:p-9 rounded-[2.5rem] text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden border border-slate-100 h-full flex flex-col">
            {/* Purple bottom glow */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#6D28D9]/5 via-indigo-600/5 to-transparent pointer-events-none rounded-b-[2.5rem]"></div>
            
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center shrink-0 border border-slate-100">
                <ClipboardList className="w-6 h-6 text-[#6D28D9]"/>
              </div>
              <h3 className="text-[20px] font-bold text-slate-900 tracking-wide">Order Summary</h3>
            </div>
            
            <div className="space-y-6 mb-8 relative z-10">
              <div className="flex justify-between items-center text-slate-500 font-medium text-[15px]">
                <span>Items ({cartItems.length})</span>
                <span className="text-slate-900 font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-500 font-medium text-[15px]">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-500 font-medium text-[15px]">
                <span>Taxes & Fees</span>
                <span className="text-slate-900 font-bold">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 font-medium text-[15px]">
                <span>Delivery Fee</span>
                {delivery === 0 ? (
                  <span className="font-bold text-emerald-500">FREE</span>
                ) : (
                  <span className="text-slate-900 font-bold">₹{delivery.toFixed(2)}</span>
                )}
              </div>
            </div>
            
            <div className="border-t border-slate-100 py-8 mb-4 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center border border-slate-100">
                   <Tag className="w-5 h-5 text-[#6D28D9]" />
                 </div>
                 <span className="text-[16px] font-bold text-slate-900">Total to Pay</span>
              </div>
              <span className="text-[32px] font-black text-slate-900 tracking-tight flex items-baseline">
                <span className="text-[24px] mr-1 font-bold">₹</span>{grandTotal.toFixed(2)}
              </span>
            </div>
            
            {/* Special Offer Banner */}
            {appliedCoupon && (
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 mb-8 relative z-10 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center shrink-0 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-emerald-700 font-bold text-[14px]">Coupon Applied</h4>
                  <p className="text-emerald-600/80 text-[11px] font-bold mt-0.5">You saved ₹{discountAmount.toFixed(2)} on this order!</p>
                </div>
              </div>
            )}
            
            {/* Security Trust Badges */}
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-6 border-t border-slate-100 relative z-10 mt-auto">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> 100% Secure
              </div>
              <div className="w-[1px] h-3 bg-slate-200"></div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Encrypted
              </div>
              <div className="w-[1px] h-3 bg-slate-200"></div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-slate-400" /> Fast Payment
              </div>
            </div>
            
          </motion.div>
        </div>
      </div>
    </div>
  );
}
