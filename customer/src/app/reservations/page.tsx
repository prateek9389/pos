"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, Users, MapPin, CheckCircle2, Info, CreditCard, Smartphone, ShieldCheck, Lock, User, Eye, ArrowRight, ClipboardList, Tag, Gift, ChevronRight, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ProtectedRoute, useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { useBranchStore } from "@/lib/branch-store";

export default function ReservationsPage() {
  const { user } = useAuth();
  const { selectedBranchId, selectedBranchName } = useBranchStore();
  const [guests, setGuests] = useState(2);
  const [isBooked, setIsBooked] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedTime, setSelectedTime] = useState("19:30");
  const [date, setDate] = useState("");
  const [tablePreference, setTablePreference] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [showAllBranches, setShowAllBranches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const snap = await getDocs(collection(db, "branches"));
        const fetchedBranches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBranches(fetchedBranches);
        if (selectedBranchId) {
          setSelectedBranch(selectedBranchId);
        } else if (fetchedBranches.length > 0) {
          setSelectedBranch(fetchedBranches[0].id);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, [selectedBranchId]);

  const handleConfirmBooking = async () => {
    if (!user) {
      alert("You must be logged in to make a reservation");
      return;
    }
    
    if (!date) {
      alert("Please select a date");
      setIsPaying(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const reservationData = {
        userId: user.uid,
        userName: user.displayName || "Guest",
        customerPhone: user.phoneNumber || "",
        branchId: selectedBranch,
        guests: guests,
        time: selectedTime,
        date: date,
        tablePreference: tablePreference,
        status: "Confirmed",
        amountPaid: 100,
        createdAt: Date.now()
      };

      await addDoc(collection(db, "reservations"), reservationData);
      setIsPaying(false); 
      setIsBooked(true);
    } catch (error) {
      console.error("Error saving reservation:", error);
      alert("Failed to confirm reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBooked) {
    return (
      <ProtectedRoute redirectTo="/login">
        <div className="flex flex-col flex-1 pb-20 bg-[#F8FAFC] min-h-screen font-sans flex justify-center pt-12 relative overflow-hidden">
        
        {/* Subtle Background Elements to replace the vector art */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-[500px] w-full mx-auto px-4 py-10 text-center relative z-10">
          
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-[120px] h-[120px] bg-blue-100/50 rounded-full flex items-center justify-center mx-auto mb-6 relative"
          >
            {/* Confetti sparks simulation */}
            <div className="absolute -top-4 left-4 w-2 h-2 bg-yellow-400 rotate-45 rounded-sm"></div>
            <div className="absolute top-10 -right-4 w-3 h-1 bg-red-400 -rotate-12 rounded-sm"></div>
            <div className="absolute bottom-4 -left-2 w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="absolute -bottom-4 right-10 w-2 h-2 bg-blue-400 rotate-45 rounded-sm"></div>
            
            <div className="w-[85px] h-[85px] bg-white rounded-full shadow-sm flex items-center justify-center border-[4px] border-blue-500">
              <CheckCircle2 className="w-[45px] h-[45px] text-blue-500" strokeWidth={3} />
            </div>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-[36px] font-serif font-black text-[#0F172A] mb-2 tracking-tight"
          >
            Table Reserved!
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "100%" }} transition={{ delay: 0.3 }}
            className="flex justify-center items-center gap-1.5 mb-5"
          >
            <div className="w-16 h-1 bg-blue-500 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-[#64748B] text-[16px] font-medium leading-relaxed mb-8 px-2"
          >
            We've saved a table for you.<br/>A confirmation SMS has been sent to your phone number.
          </motion.p>
          
          {/* Main Info Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="bg-white p-6 sm:p-8 rounded-[2rem] text-left shadow-[0_8px_30px_rgb(0,0,0,0.06)] mb-6 border border-slate-50"
          >
            {/* Date & Time */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-5 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-blue-500"/>
                </div>
                <span className="text-[#0F172A] text-[16px] font-bold">Date & Time</span>
              </div>
              <div className="bg-blue-50 text-blue-700 font-bold text-[14px] px-4 py-2 rounded-xl flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> {date}, {selectedTime}
              </div>
            </div>
            
            {/* Guests */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-5 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-orange-500"/>
                </div>
                <span className="text-[#0F172A] text-[16px] font-bold">Guests</span>
              </div>
              <div className="bg-orange-50 text-orange-700 font-bold text-[14px] px-4 py-2 rounded-xl flex items-center gap-2">
                {guests} People <Users className="w-4 h-4" />
              </div>
            </div>
            
            {/* Branch */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-5 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-purple-500"/>
                </div>
                <span className="text-[#0F172A] text-[16px] font-bold">Branch</span>
              </div>
              <div className="bg-purple-50 text-purple-700 font-bold text-[14px] px-4 py-2 rounded-xl flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {branches.find(b => b.id === selectedBranch)?.name || selectedBranch}
              </div>
            </div>
            
            {/* Payment */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-indigo-500"/>
                </div>
                <span className="text-[#0F172A] text-[16px] font-bold">Payment</span>
              </div>
              <div className="bg-blue-50 text-blue-700 font-bold text-[14px] px-4 py-2 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> ₹100 Paid
              </div>
            </div>
          </motion.div>
          
          {/* Banner Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border border-blue-100 rounded-3xl p-5 mb-8 flex items-center gap-5 shadow-sm"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-blue-50 flex items-center justify-center shrink-0">
               <span className="text-3xl">🍽️</span>
            </div>
            <div className="text-left">
              <h4 className="text-[#0F172A] font-bold text-[16px] mb-1">We can't wait to serve you!</h4>
              <p className="text-slate-500 text-[13px] font-medium">See you soon and enjoy your meal. 💙</p>
            </div>
          </motion.div>
          
          {/* Action Button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            <Button 
              onClick={() => setIsBooked(false)} 
              className="w-full rounded-2xl h-14 text-[16px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Back to Home
            </Button>
          </motion.div>
          
        </div>
      </div>
      </ProtectedRoute>
    );
  }

  if (isPaying) {
    return (
      <ProtectedRoute redirectTo="/login">
        <div className="flex flex-col flex-1 bg-[#F5F5FA] min-h-screen font-sans justify-center py-12 relative overflow-hidden">
        {/* Very subtle background blur */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-[1050px] w-full mx-auto px-4 relative z-10">
          <div className="mb-10 text-center flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-[#6366F1]" strokeWidth={2.5}/>
              <h2 className="text-[32px] font-black text-[#0F172A] tracking-tight">Secure Checkout</h2>
            </div>
            <p className="text-[#64748B] font-medium text-[16px]">Complete your payment of ₹100 to finalize your reservation.</p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            
            {/* Left Column - Payment Method Form */}
            <div className="flex-1 w-full relative">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 border-l-[6px] border-l-[#8B5CF6] h-full flex flex-col">
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <CreditCard className="w-6 h-6 text-[#4F46E5]" strokeWidth={2}/>
                  </div>
                  <div>
                    <h3 className="text-[20px] font-black text-[#0F172A] leading-tight">Payment Method</h3>
                    <p className="text-[13px] text-[#64748B] font-medium">Choose your preferred payment option</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div 
                    onClick={() => setPaymentMethod('card')} 
                    className={`p-5 rounded-2xl cursor-pointer border-[2px] font-bold flex flex-col items-center justify-center gap-2 transition-all relative ${
                      paymentMethod === 'card' 
                        ? 'border-[#6366F1] bg-[#F5F3FF] text-[#4F46E5]' 
                        : 'border-slate-100 text-[#64748B] hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {paymentMethod === 'card' && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#6366F1] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3}/>
                      </div>
                    )}
                    <CreditCard className="w-7 h-7 mb-1" strokeWidth={1.5} />
                    <span className="text-[14px]">Credit / Debit Card</span>
                  </div>
                  
                  <div 
                    onClick={() => setPaymentMethod('upi')} 
                    className={`p-5 rounded-2xl cursor-pointer border-[2px] font-bold flex flex-col items-center justify-center gap-2 transition-all relative ${
                      paymentMethod === 'upi' 
                        ? 'border-[#6366F1] bg-[#F5F3FF] text-[#4F46E5]' 
                        : 'border-slate-100 text-[#64748B] hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {paymentMethod === 'upi' && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#6366F1] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3}/>
                      </div>
                    )}
                    <Smartphone className="w-7 h-7 mb-1" strokeWidth={1.5} />
                    <span className="text-[14px]">UPI / Wallet</span>
                  </div>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-[12px] font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#6366F1]" /> Card Number
                      </Label>
                      <div className="relative flex items-center">
                        <CreditCard className="absolute left-4 w-5 h-5 text-slate-400" strokeWidth={1.5} />
                        <Input placeholder="4242 4242 4242 4242" className="h-[52px] bg-[#F8FAFC] border-slate-200 font-semibold text-[15px] rounded-xl pl-12 pr-12 focus-visible:ring-[#6366F1]/20 focus-visible:border-[#6366F1]" />
                        <CheckCircle2 className="absolute right-4 w-5 h-5 text-emerald-500" strokeWidth={2} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-[12px] font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-[#6366F1]" /> Expiry Date
                        </Label>
                        <div className="relative flex items-center">
                          <CreditCard className="absolute left-4 w-5 h-5 text-slate-400" strokeWidth={1.5} />
                          <Input placeholder="12 / 28" className="h-[52px] bg-[#F8FAFC] border-slate-200 font-semibold text-[15px] rounded-xl pl-12 pr-4 focus-visible:ring-[#6366F1]/20 focus-visible:border-[#6366F1]" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[12px] font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[#6366F1]" /> CVV
                        </Label>
                        <div className="relative flex items-center">
                          <CreditCard className="absolute left-4 w-5 h-5 text-slate-400" strokeWidth={1.5} />
                          <Input placeholder="123" type="password" className="h-[52px] bg-[#F8FAFC] border-slate-200 font-semibold text-[16px] tracking-widest rounded-xl pl-12 pr-12 focus-visible:ring-[#6366F1]/20 focus-visible:border-[#6366F1] placeholder:tracking-normal" />
                          <Eye className="absolute right-4 w-5 h-5 text-slate-400" strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-[12px] font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#6366F1]" /> Name on Card
                      </Label>
                      <div className="relative flex items-center">
                        <User className="absolute left-4 w-5 h-5 text-slate-400" strokeWidth={1.5} />
                        <Input placeholder="John Doe" className="h-[52px] bg-[#F8FAFC] border-slate-200 font-semibold text-[15px] rounded-xl pl-12 pr-4 focus-visible:ring-[#6366F1]/20 focus-visible:border-[#6366F1]" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-2xl border border-slate-100 text-center min-h-[320px]">
                    <Smartphone className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="font-bold text-slate-900 mb-3 text-lg">Scan QR or enter UPI ID</p>
                    <Input placeholder="yourname@upi" className="max-w-xs h-[52px] text-center font-medium bg-white rounded-xl" />
                  </div>
                )}
                
                <div className="mt-auto">
                  <Button 
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    className="w-full mt-8 rounded-2xl h-[56px] text-[17px] font-bold bg-gradient-to-r from-[#6366F1] to-[#D946EF] hover:from-[#4F46E5] hover:to-[#C026D3] text-white shadow-[0_8px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.4)] transition-all border-0 flex items-center justify-center gap-3"
                  >
                    <CreditCard className="w-5 h-5" />
                    Pay ₹100 Now 
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
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 sm:p-9 rounded-[2rem] text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden border border-slate-100 h-full flex flex-col">
                {/* Purple bottom glow */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-fuchsia-600/5 via-indigo-600/5 to-transparent pointer-events-none rounded-b-[2rem]"></div>
                
                <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center shrink-0 border border-slate-100">
                    <ClipboardList className="w-6 h-6 text-[#6D28D9]"/>
                  </div>
                  <h3 className="text-[20px] font-bold text-slate-900 tracking-wide">Order Summary</h3>
                </div>
                
                <div className="space-y-6 mb-8 relative z-10">
                  <div className="flex justify-between items-center text-slate-500 font-medium text-[15px]">
                    <span>Booking Fee</span>
                    <span className="text-slate-900 font-bold">₹100</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-medium text-[15px]">
                    <span>Taxes & Fees</span>
                    <span className="text-slate-900 font-bold">₹0</span>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 py-8 mb-4 flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center border border-slate-100">
                       <Tag className="w-5 h-5 text-[#6D28D9]" />
                     </div>
                     <span className="text-[16px] font-bold text-slate-900">Total to Pay</span>
                  </div>
                  <span className="text-[36px] font-black text-slate-900 tracking-tight flex items-baseline">
                    <span className="text-[28px] mr-1 font-bold">₹</span>100
                  </span>
                </div>
                
                {/* Special Offer Banner */}
                <div className="bg-[#F8FAFC] border border-indigo-100 rounded-2xl p-4 flex items-center gap-4 mb-8 cursor-pointer hover:bg-indigo-50 transition-colors relative z-10 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100/80 flex items-center justify-center shrink-0 text-[#6D28D9]">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[#6D28D9] font-bold text-[14px]">Special Offer</h4>
                    <p className="text-slate-500 text-[11px] font-medium mt-0.5">Get 10% cashback on UPI payments!</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#6D28D9] group-hover:translate-x-1 transition-transform" />
                </div>
                
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
      </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute redirectTo="/login">
      <div className="flex flex-col flex-1 pb-20 bg-[#F8FAFC] min-h-screen font-sans relative">
      
      <div className="flex flex-col lg:flex-row min-h-screen max-h-screen overflow-hidden">
        
        {/* Left Side: Visuals & Title */}
        <div className="relative lg:w-1/2 flex flex-col justify-center lg:justify-end p-8 lg:p-12 overflow-hidden h-[30vh] lg:h-screen shrink-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30"></div>
          
          <div className="relative z-10 w-full mt-auto">
            {/* Back Button */}
            <button 
              onClick={() => window.history.back()} 
              className="absolute -top-12 md:-top-20 lg:top-auto lg:bottom-[120%] left-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-colors mb-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800"><path d="m15 18-6-6 6-6"/></svg>
            </button>

            <h1 className="text-4xl lg:text-5xl font-serif text-white mb-2 lg:mb-4 tracking-wide">
              Book a Table
            </h1>
            <div className="w-12 h-[2px] bg-[#C19B6C] mb-4 lg:mb-6"></div>
            <p className="text-white/90 text-lg lg:text-xl font-medium tracking-wide max-w-sm hidden sm:block">
              Reserve your perfect dining experience
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 xl:p-10 bg-[#FAF9F6] relative overflow-y-auto lg:h-screen custom-scrollbar">
          
          <div className="w-full max-w-xl mx-auto pb-8">
            
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 md:p-8 border-2 border-[#5B2EFF]/15 relative overflow-hidden">
              
              {/* 1. Select Branch */}
              <div className="mb-6">
                <Label className="text-xs font-bold text-[#5B2EFF] mb-3 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C19B6C]"/> 1. SELECT BRANCH
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {branches.filter(b => b.id === selectedBranchId).map((branch) => (
                    <div 
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch.id)}
                      className={`p-4 rounded-xl cursor-pointer relative transition-all duration-300 border-2 ${
                        selectedBranch === branch.id 
                          ? 'border-[#5B2EFF] bg-[#EFF6FF]' 
                          : 'border-slate-100 bg-white hover:border-[#5B2EFF]/30'
                      }`}
                    >
                      {/* Radio / Check Circle */}
                      <div className="absolute top-3 right-3">
                        {selectedBranch === branch.id ? (
                          <div className="w-5 h-5 rounded-full bg-[#5B2EFF] flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-serif font-bold text-[#5B2EFF] text-[15px] mb-0.5">{branch.name || "Main Branch"}</h4>
                        <p className="text-[11px] text-slate-500 font-medium mb-1.5">{branch.address || branch.location || "Location unavailable"}</p>
                        {selectedBranch === branch.id && (
                          <div className="inline-block bg-[#5B2EFF] text-white text-[9px] font-bold px-2 py-1 rounded-sm tracking-wider">
                            SELECTED
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                {/* 2. Date */}
                <div>
                  <Label className="text-xs font-bold text-[#5B2EFF] mb-3 uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#C19B6C]"/> 2. DATE
                  </Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 bg-slate-50/50 rounded-lg pl-10 pr-3 border-slate-200 text-sm font-medium text-slate-600 focus-visible:ring-[#5B2EFF]/20 focus-visible:border-[#5B2EFF]" />
                  </div>
                </div>
                
                {/* 3. Guests */}
                <div>
                  <Label className="text-xs font-bold text-[#5B2EFF] mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C19B6C]"/> 3. GUESTS
                  </Label>
                  <div className="flex items-center gap-2 h-12 bg-slate-50/50 border border-slate-200 rounded-lg px-2 focus-within:border-[#5B2EFF] focus-within:ring-2 focus-within:ring-[#5B2EFF]/10 transition-all">
                    <button onClick={() => setGuests(Math.max(1, guests-1))} className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold transition-colors">-</button>
                    <div className="flex-1 text-center font-serif text-xl font-medium text-[#5B2EFF]">{guests}</div>
                    <button onClick={() => setGuests(Math.min(20, guests+1))} className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold transition-colors">+</button>
                  </div>
                </div>
              </div>

              {/* 4. Table Preference */}
              <div className="mb-6">
                <Label className="text-xs font-bold text-[#5B2EFF] mb-3 uppercase tracking-wider flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C19B6C]"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 12.5V11a2 2 0 0 0-4 0v5Z"/><path d="M7 18v4"/><path d="M17 18v4"/></svg>
                  4. TABLE PREFERENCE / NAME (OPTIONAL)
                </Label>
                <div className="relative">
                  <Input placeholder="e.g. Window Seat, Table 4..." value={tablePreference} onChange={(e) => setTablePreference(e.target.value)} className="h-12 bg-slate-50/50 rounded-lg px-4 border-slate-200 text-sm font-medium text-slate-600 focus-visible:ring-[#5B2EFF]/20 focus-visible:border-[#5B2EFF]" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 10h8m-4-6v6m0 0v10m-4 0h8"/></svg>
                  </div>
                </div>
              </div>

              {/* 5. Time Selection */}
              <div className="mb-6">
                <Label className="text-xs font-bold text-[#5B2EFF] mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C19B6C]"/> 5. TIME
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="time" 
                    value={selectedTime} 
                    onChange={(e) => setSelectedTime(e.target.value)} 
                    className="h-12 bg-slate-50/50 rounded-lg pl-10 pr-3 border-slate-200 text-sm font-medium text-slate-600 focus-visible:ring-[#5B2EFF]/20 focus-visible:border-[#5B2EFF]" 
                  />
                </div>
              </div>

              <div className="bg-[#FDF8E7] p-3 rounded-lg flex items-start gap-2 mb-6 border border-[#F3E5AB]">
                <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-amber-900 leading-relaxed">
                  Tables held for 15 mins. For &gt;8 guests, call restaurant.
                </p>
              </div>

              {/* Payment Section */}
              <div className="bg-[#F1F5F9] border border-[#E2E8F0] p-4 rounded-lg mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0 border border-[#E9D5FF]">
                    <CheckCircle2 className="w-4 h-4 text-[#5B2EFF]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#5B2EFF] text-sm mb-0.5">
                      Reservation Charge
                    </h4>
                    <p className="text-[10px] text-[#475569] font-medium">Nominal fee required.</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-[#5B2EFF]">₹100</div>
              </div>

              <Button 
                onClick={() => setIsPaying(true)} 
                className="w-full h-14 rounded-xl shadow-lg shadow-[#5B2EFF]/20 hover:shadow-xl hover:shadow-[#5B2EFF]/30 hover:-translate-y-0.5 transition-all bg-[#5B2EFF] hover:bg-[#4C1D95] text-white flex flex-col items-center justify-center gap-0.5"
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="text-sm font-bold tracking-widest uppercase">Confirm</span>
                </div>
                <span className="text-[9px] text-white/70 tracking-wide">Proceed to secure table</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
