"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, ChevronRight, Heart, ShieldCheck, CreditCard, Truck, Award, RotateCcw, ShoppingBag, Tag, ClipboardList, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

import { useCartStore } from "@/lib/cart-store";

export default function CartPage() {
  const cart = useCartStore(state => state.items);
  const updateQuantityAction = useCartStore(state => state.updateQuantity);
  const removeItemAction = useCartStore(state => state.removeItem);

  const updateQuantity = (id: string, delta: number) => {
    const item = cart.find(i => i.id === id);
    if (item) {
      const currentQ = Number(item.quantity) || 1;
      const newQ = currentQ + delta;
      if (newQ <= 0) {
        removeItemAction(id);
      } else {
        updateQuantityAction(id, newQ);
      }
    }
  };

  const removeItem = (id: string) => {
    removeItemAction(id);
  };

  const [coupons, setCoupons] = useState<any[]>([]);
  const appliedCoupon = useCartStore(state => state.appliedCoupon);
  const setAppliedCoupon = useCartStore(state => state.setAppliedCoupon);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const q = query(collection(db, "coupons"), where("status", "==", "Active"));
        const snap = await getDocs(q);
        const loaded: any[] = [];
        snap.forEach(doc => loaded.push({ id: doc.id, ...doc.data() }));
        setCoupons(loaded);
      } catch (error) {
        console.error("Error fetching coupons:", error);
      }
    };
    fetchCoupons();
  }, []);

  const handleApplyCoupon = (coupon: any) => {
    setAppliedCoupon(coupon);
    setIsCouponModalOpen(false);
  };
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
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
  const taxes = afterDiscount * 0.05; // 5% GST
  const delivery = afterDiscount > 500 ? 0 : 40;
  const total = afterDiscount + taxes + delivery;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 pointer-events-none -z-10 bg-[#F8FAFC]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-purple-200/40 rounded-full blur-[120px]"></div>
        </div>
        <div className="w-48 h-48 mb-6 opacity-80 mix-blend-multiply">
          <Image src="https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?q=80&w=400&auto=format&fit=crop" alt="Empty Cart" width={400} height={400} className="object-cover rounded-full shadow-lg" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Your cart is empty</h2>
        <p className="text-slate-500 mb-8 max-w-sm font-medium">Looks like you haven't added anything to your cart yet. Explore our menu to find your favorites!</p>
        <Link href="/menu" className="inline-flex items-center justify-center bg-gradient-to-r from-[#6366F1] to-[#D946EF] text-white hover:opacity-90 rounded-2xl px-8 h-14 font-bold shadow-[0_8px_30px_rgba(168,85,247,0.3)] transition-transform">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans relative overflow-x-hidden">
      
      {/* Decorative Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <div>
              <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Your Cart</h1>
              <p className="text-[15px] font-medium text-slate-500">Review your items and proceed to checkout</p>
            </div>
          </div>
          
          <Button variant="outline" className="h-[44px] px-5 rounded-xl border-purple-100 bg-white hover:bg-purple-50 text-[#7C3AED] font-bold text-[14px] shadow-sm transition-colors w-fit">
            <Heart className="w-4 h-4 mr-2" /> Save for later
          </Button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-10 items-start">
          
          {/* Left Column: Cart Items & Banners */}
          <div className="flex-1 w-full flex flex-col gap-5">
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
              <AnimatePresence>
                {cart.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className={`flex flex-col sm:flex-row gap-6 relative ${index !== cart.length - 1 ? 'border-b border-slate-100 pb-8 mb-8' : 'mb-8'}`}
                  >
                    <div className="w-full sm:w-[220px] h-48 sm:h-[140px] rounded-[1.2rem] overflow-hidden relative shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="pr-8">
                          <h3 className="font-bold text-slate-900 text-[20px] mb-1.5 leading-tight">{item.name}</h3>
                          <div className="text-[14px] text-slate-500 font-medium leading-snug max-w-[90%] space-y-1">
                            {item.size && <p>Size: {item.size.name}</p>}
                            {item.addons && item.addons.length > 0 && <p>Addons: {item.addons.map(a => a.name).join(', ')}</p>}
                            {item.specialInstructions && <p className="italic">Note: {item.specialInstructions}</p>}
                          </div>
                          <p className="text-[#6D28D9] font-black text-[22px] mt-4">₹{item.price}</p>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="absolute sm:relative top-0 right-0 sm:top-auto sm:right-auto w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all shrink-0 bg-white shadow-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-end justify-end mt-4 sm:mt-0">
                        <div className="flex items-center gap-5">
                          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden h-10 bg-white">
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(item.id, -1); }} className="w-10 h-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-bold text-slate-900 text-[15px]">{item.quantity}</span>
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(item.id, 1); }} className="w-10 h-full flex items-center justify-center text-[#7C3AED] hover:bg-purple-50 transition-colors font-medium">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="font-black text-slate-900 text-[22px] w-[80px] text-right">
                            ₹{item.price * item.quantity}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Free Delivery Banner */}
              {cart.length > 0 && (
                <div className="bg-[#F5F3FF] rounded-2xl p-4 sm:px-6 sm:py-5 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-indigo-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <p className="text-[14px] text-slate-600 font-medium">
                    Add items worth <span className="font-bold text-slate-900">₹101.75</span> more to get <span className="font-bold text-[#6D28D9]">FREE delivery</span>!
                  </p>
                </div>
              )}
            </div>

            <div className="mt-2">
              <Link href="/menu" className="inline-flex items-center gap-2 text-sm font-bold text-[#6D28D9] hover:text-indigo-800 transition-colors group">
                <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </div>
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-[420px] shrink-0">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-7 sm:p-8 rounded-[2rem] text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden border border-slate-100 flex flex-col">
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1rem] bg-[#F8FAFC] flex items-center justify-center shrink-0 border border-slate-100">
                    <ClipboardList className="w-6 h-6 text-[#6D28D9]"/>
                  </div>
                  <h3 className="text-[20px] font-bold text-slate-900 tracking-wide">Order Summary</h3>
                </div>
              </div>
              
              {/* Coupon Section */}
              <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
                <DialogTrigger className="w-full flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border border-indigo-100 mb-8 hover:bg-indigo-50/50 transition-colors group cursor-pointer text-left">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100/80 text-[#6D28D9] w-10 h-10 rounded-xl flex items-center justify-center">
                      <Tag className="w-5 h-5 -rotate-90" />
                    </div>
                    <div>
                      {appliedCoupon ? (
                        <>
                          <p className="font-bold text-emerald-600 text-[15px]">Coupon Applied: {appliedCoupon.code}</p>
                          <p className="text-[12px] text-slate-500 font-medium mt-0.5">You saved ₹{discountAmount.toFixed(2)}!</p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-[#6D28D9] text-[15px]">Apply Coupon</p>
                          <p className="text-[12px] text-slate-500 font-medium mt-0.5">View offers & save more</p>
                        </>
                      )}
                    </div>
                  </div>
                  {appliedCoupon ? (
                     <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveCoupon(); }} className="text-rose-500 hover:bg-rose-50 w-8 h-8 flex items-center justify-center rounded-full transition-colors"><X className="w-4 h-4"/></div>
                  ) : (
                     <ChevronRight className="w-4 h-4 text-[#6D28D9] group-hover:translate-x-1 transition-transform" />
                  )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black">Available Offers</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {coupons.length === 0 ? (
                      <p className="text-center text-slate-500 font-medium py-4">No active offers available right now.</p>
                    ) : (
                      coupons.map((coupon) => (
                        <div key={coupon.id} className="border border-indigo-100 rounded-xl p-4 flex flex-col gap-3 bg-indigo-50/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 font-black text-[13px] rounded-lg tracking-wider">{coupon.code}</span>
                              <p className="text-[14px] font-bold text-slate-700 mt-2">
                                Get {coupon.type === "Percentage (%)" || coupon.type === "Percentage" ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                              </p>
                            </div>
                            <Button onClick={() => handleApplyCoupon(coupon)} className="bg-[#6D28D9] hover:bg-[#5B2EFF] text-white font-bold h-9 px-4 rounded-lg shadow-sm">
                              Apply
                            </Button>
                          </div>
                          <p className="text-[12px] text-slate-500">Valid until {coupon.validUntil || "forever"}</p>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Bill Details */}
              <div className="space-y-4 mb-8 flex-1">
                <div className="flex justify-between items-center text-slate-500 font-medium text-[15px]">
                  <span>Item Total</span>
                  <span className="text-slate-900 font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-500 font-medium text-[15px]">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-500 font-medium text-[15px]">
                  <span>Taxes & Charges (5%)</span>
                  <span className="text-slate-900 font-bold">₹{taxes.toFixed(2)}</span>
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
              
              <div className="border-t border-slate-100 pt-6 pb-2 mb-6 flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[17px] font-bold text-slate-900">To Pay</span>
                  <span className="text-[12px] font-medium text-slate-500 mt-1">Inclusive of all taxes</span>
                </div>
                <span className="text-[32px] font-black text-slate-900 tracking-tight flex items-baseline leading-none">
                  <span className="text-[22px] mr-1 font-bold">₹</span>{total.toFixed(2)}
                </span>
              </div>

              {/* Savings Banner */}
              {delivery === 0 && (
               <div className="bg-emerald-50/80 text-emerald-600 p-3.5 rounded-xl flex items-center gap-3 font-bold text-[13px] mb-6">
                  <Truck className="w-4 h-4" /> You are saving ₹40 on delivery!
                </div>
              )}

              <Link href="/checkout" className="flex items-center justify-center bg-[#6D28D9] hover:bg-[#5B2EFF] text-white w-full rounded-2xl h-[56px] text-[16px] font-bold shadow-md hover:shadow-lg transition-all group mb-6">
                <ShieldCheck className="w-5 h-5 mr-2" /> Proceed to Checkout
              </Link>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-slate-400">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Secure Checkout</span>
                <span className="mx-1">•</span>
                <span>100% Safe Payments</span>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
