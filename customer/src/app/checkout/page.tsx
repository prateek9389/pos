"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin, Store, Clock, ChevronRight, Plus, CheckCircle2, ClipboardList, Tag, Navigation, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/AuthProvider";
import { useCartStore } from "@/lib/cart-store";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";

export default function CheckoutPage() {
  const [orderType, setOrderType] = useState<"delivery" | "takeaway">("delivery");
  const [selectedAddress, setSelectedAddress] = useState<string | number>("");
  const [selectedTime, setSelectedTime] = useState("now");
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddressTitle, setNewAddressTitle] = useState("Home");
  const [addrHouse, setAddrHouse] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPincode, setAddrPincode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.uid) return;
      try {
        const q = query(collection(db, "customerAddresses"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (fetched.length > 0) {
          setAddresses(fetched);
          const defaultAddr = fetched.find((a: any) => a.isDefault);
          if (defaultAddr) setSelectedAddress(defaultAddr.id);
          else if (!selectedAddress) setSelectedAddress(fetched[0].id);
        }
      } catch(e) {
        console.error("Error fetching addresses:", e);
      }
    };
    fetchAddresses();
  }, [user?.uid]);

  const handleSaveAddress = async () => {
    if (!addrHouse.trim() || !addrCity.trim() || !addrPincode.trim()) return;
    setIsSavingAddress(true);
    try {
      let tag = 'bg-slate-100 text-slate-700';
      if (newAddressTitle === 'Home') tag = 'bg-blue-100 text-blue-700';
      if (newAddressTitle === 'Office') tag = 'bg-purple-100 text-purple-700';
      
      const fullAddress = `${addrHouse}${addrLandmark ? ', ' + addrLandmark : ''}, ${addrCity}, ${addrState} - ${addrPincode}`;
      
      const newAddrData = {
        userId: user?.uid || "guest",
        title: newAddressTitle,
        address: fullAddress,
        tag,
        isDefault
      };
      const docRef = await addDoc(collection(db, "customerAddresses"), newAddrData);
      
      const completeAddr = { id: docRef.id, ...newAddrData };
      setAddresses(prev => [...prev, completeAddr]);
      setSelectedAddress(docRef.id);
      setIsAddressModalOpen(false);
      
      // Reset
      setAddrHouse("");
      setAddrLandmark("");
      setAddrCity("");
      setAddrState("");
      setAddrPincode("");
      setIsDefault(false);
    } catch (e) {
      console.error("Error saving address:", e);
    } finally {
      setIsSavingAddress(false);
    }
  };
  
  const { items: cartItems, appliedCoupon } = useCartStore();
  
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
  const grandTotal = afterDiscount + tax + (orderType === 'delivery' ? delivery : 0);

  return (
    <ProtectedRoute redirectTo="/login">
      <div className="max-w-6xl mx-auto px-4 py-12 font-sans relative">
      
      {/* Decorative Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      <div className="flex items-center gap-4 mb-10">
        <Link href="/cart" className="inline-flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Delivery Details</h1>
          <p className="text-[#64748B] font-medium text-[15px]">Where should we send your delicious food?</p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Left Column - Delivery Form */}
        <div className="flex-1 w-full relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 border-l-[6px] border-l-[#8B5CF6] h-full flex flex-col">
            
            {/* Order Type Toggle */}
            <div className="bg-[#F8FAFC] p-1.5 rounded-2xl flex relative mb-8">
              <motion.div 
                className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm border border-slate-200"
                animate={{ left: orderType === 'delivery' ? '6px' : '50%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button 
                onClick={() => setOrderType('delivery')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold relative z-10 transition-colors ${orderType === 'delivery' ? 'text-[#6D28D9]' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <MapPin className="w-5 h-5" /> Delivery
              </button>
              <button 
                onClick={() => setOrderType('takeaway')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold relative z-10 transition-colors ${orderType === 'takeaway' ? 'text-[#6D28D9]' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Store className="w-5 h-5" /> Takeaway
              </button>
            </div>

            {/* Delivery Details */}
            <div className="space-y-6 mb-8 flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                </div>
                <h2 className="text-[16px] font-bold text-slate-900">
                  {orderType === 'delivery' ? 'Delivery Address' : 'Pickup Location'}
                </h2>
              </div>
              
              {orderType === 'delivery' ? (
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <label 
                      key={addr.id} 
                      onClick={() => setSelectedAddress(addr.id)}
                      className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${selectedAddress === addr.id ? 'border-[#6D28D9] bg-purple-50/30 shadow-[0_4px_15px_rgb(109,40,217,0.1)]' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selectedAddress === addr.id ? 'border-[#6D28D9]' : 'border-slate-300'}`}>
                        {selectedAddress === addr.id && <div className="w-3 h-3 bg-[#6D28D9] rounded-full"></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">{addr.title}</span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${addr.tag}`}>{addr.title}</span>
                        </div>
                        <p className="text-slate-500 text-[13px] font-medium leading-relaxed">{addr.address}</p>
                      </div>
                    </label>
                  ))}
                  <button 
                    onClick={() => setIsAddressModalOpen(true)}
                    className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl text-[#8B5CF6] font-bold hover:border-[#8B5CF6] hover:bg-purple-50/50 transition-colors flex items-center justify-center gap-2 text-[14px]">
                    <Plus className="w-5 h-5" /> Add New Address
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-[#6D28D9] bg-purple-50/30 cursor-pointer shadow-[0_4px_15px_rgb(109,40,217,0.1)]">
                    <div className="w-6 h-6 rounded-full border-2 border-[#6D28D9] flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-3 h-3 bg-[#6D28D9] rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">Restaurant Pickup</h3>
                      <p className="text-slate-500 text-[13px] font-medium">Pick up your order directly from our kitchen counter</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Time Slot Picker */}
            <div className="space-y-5 pt-8 border-t border-slate-100 mt-auto">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
                <h2 className="text-[16px] font-bold text-slate-900">
                  Delivery Time
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setSelectedTime('now')}
                  className={`px-5 py-3 rounded-xl font-bold text-[13px] transition-colors border-2 ${selectedTime === 'now' ? 'border-[#6D28D9] bg-purple-50 text-[#6D28D9]' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-slate-900'}`}
                >
                  As soon as possible (~35 mins)
                </button>
                <button 
                  onClick={() => setSelectedTime('later')}
                  className={`px-5 py-3 rounded-xl font-bold text-[13px] transition-colors border-2 ${selectedTime === 'later' ? 'border-[#6D28D9] bg-purple-50 text-[#6D28D9]' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-slate-900'}`}
                >
                  Schedule for later
                </button>
              </div>
            </div>

          </motion.div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="w-full lg:w-[400px] shrink-0">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 sm:p-9 rounded-[2.5rem] text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden border border-slate-200/60 h-full flex flex-col">
            {/* Purple bottom glow */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#6D28D9]/5 via-indigo-600/5 to-transparent pointer-events-none rounded-b-[2.5rem]"></div>
            
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                <ClipboardList className="w-6 h-6 text-indigo-600"/>
              </div>
              <h3 className="text-[20px] font-bold text-slate-900 tracking-wide">Finalizing Order</h3>
            </div>
            
            <div className="space-y-6 mb-8 relative z-10 flex-1">
              <div className="flex justify-between items-center text-slate-500 font-medium text-[15px]">
                <span>Subtotal ({cartItems.length} items)</span>
                <span className="text-slate-900 font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-500 font-medium text-[15px]">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-500 font-medium text-[15px]">
                <span>Taxes & Fees (5%)</span>
                <span className="text-slate-900 font-bold">₹{tax.toFixed(2)}</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between items-center text-slate-500 font-medium text-[15px]">
                  <span>Delivery Fee</span>
                  {delivery === 0 ? (
                    <span className="font-bold text-emerald-500">FREE</span>
                  ) : (
                    <span className="text-slate-900 font-bold">₹{delivery.toFixed(2)}</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-100 py-8 mb-4 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                   <Tag className="w-5 h-5 text-indigo-600" />
                 </div>
                 <span className="text-[16px] font-bold text-slate-900">Grand Total</span>
              </div>
              <span className="text-[32px] font-black text-slate-900 tracking-tight flex items-baseline">
                <span className="text-[24px] mr-1 font-bold">₹</span>{grandTotal.toFixed(2)}
              </span>
            </div>
            
            <div className="mt-auto relative z-10">
              <Link 
                href="/payment" 
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem("checkout_orderType", orderType);
                  }
                }}
                className="inline-flex items-center justify-center bg-gradient-to-r from-[#6366F1] to-[#D946EF] hover:from-[#4F46E5] hover:to-[#C026D3] text-white w-full rounded-2xl h-[56px] text-[17px] font-bold shadow-[0_8px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.4)] hover:scale-[1.02] transition-all border-0 group"
              >
                Proceed to Payment <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
          </motion.div>
        </div>

      </div>
      
      {/* Add New Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">Add Delivery Address</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Address Label</label>
                <div className="flex gap-2">
                  {['Home', 'Office', 'Other'].map(lbl => (
                    <button 
                      key={lbl}
                      onClick={() => setNewAddressTitle(lbl)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border-2 ${newAddressTitle === lbl ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <input 
                  type="text"
                  value={addrHouse}
                  onChange={(e) => setAddrHouse(e.target.value)}
                  placeholder="House No. / Flat / Building"
                  className="w-full p-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none transition-all font-medium text-slate-800 text-sm"
                />
                <input 
                  type="text"
                  value={addrLandmark}
                  onChange={(e) => setAddrLandmark(e.target.value)}
                  placeholder="Landmark (Optional)"
                  className="w-full p-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none transition-all font-medium text-slate-800 text-sm"
                />
                <div className="flex gap-3">
                  <input 
                    type="text"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="City"
                    className="w-full p-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none transition-all font-medium text-slate-800 text-sm flex-1"
                  />
                  <input 
                    type="text"
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    placeholder="State"
                    className="w-full p-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none transition-all font-medium text-slate-800 text-sm flex-1"
                  />
                </div>
                <input 
                  type="text"
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value)}
                  placeholder="Pincode"
                  className="w-full p-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none transition-all font-medium text-slate-800 text-sm"
                />
                
                <label className="flex items-center gap-3 cursor-pointer mt-4 py-2">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isDefault ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}>
                    {isDefault && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm font-bold text-slate-700">Set as default address</span>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={isDefault} 
                    onChange={(e) => setIsDefault(e.target.checked)} 
                  />
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setIsAddressModalOpen(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAddress}
                disabled={isSavingAddress || !addrHouse.trim() || !addrCity.trim() || !addrPincode.trim()}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isSavingAddress ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
