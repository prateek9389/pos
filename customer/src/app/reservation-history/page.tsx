"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Users, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ProtectedRoute, useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface Reservation {
  id: string;
  userId: string;
  userName: string;
  branchId: string;
  guests: number;
  time: string;
  date: string;
  tablePreference: string;
  status: string;
  amountPaid: number;
  createdAt: number;
}

export default function ReservationHistoryPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      if (user === null) setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "reservations"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
      fetched.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setReservations(fetched);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching reservations:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getStatusColor = (status: string) => {
    switch((status || '').toUpperCase()) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <ProtectedRoute redirectTo="/login">
      <div className="min-h-screen bg-[#F8FAFC] font-sans relative">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          
          <div className="flex items-center gap-4 mb-10">
            <Link href="/" className="inline-flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Reservation History</h1>
              <p className="text-[#64748B] font-medium text-[15px]">View your past and upcoming reservations</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500 font-medium">Loading your reservations...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Calendar className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No reservations found</h3>
              <p className="text-slate-500 mb-6">Looks like you haven't made any reservations yet.</p>
              <Link href="/reservations">
                <Button className="bg-[#6D28D9] hover:bg-purple-700 text-white rounded-xl px-8 h-12 font-bold shadow-md">
                  Book a Table
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {reservations.map((reservation) => (
                <motion.div 
                  key={reservation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">Booking #{reservation.id.slice(0,8)}</h3>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wide ${getStatusColor(reservation.status)}`}>
                          {reservation.status || 'PENDING'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <Clock className="w-4 h-4" />
                        Booked on {new Date(reservation.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    
                    <div className="text-right w-full sm:w-auto">
                      <p className="text-sm text-slate-500 font-medium mb-1">Reservation Fee</p>
                      <p className="text-2xl font-black text-[#6D28D9]">₹{(reservation.amountPaid || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <Calendar className="w-5 h-5 text-[#6D28D9] mb-2" />
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Date</span>
                        <span className="font-bold text-slate-700 text-sm">{reservation.date}</span>
                     </div>
                     <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <Clock className="w-5 h-5 text-[#6D28D9] mb-2" />
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Time</span>
                        <span className="font-bold text-slate-700 text-sm">{reservation.time}</span>
                     </div>
                     <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <Users className="w-5 h-5 text-[#6D28D9] mb-2" />
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Guests</span>
                        <span className="font-bold text-slate-700 text-sm">{reservation.guests} People</span>
                     </div>
                     <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <MapPin className="w-5 h-5 text-[#6D28D9] mb-2" />
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Branch</span>
                        <span className="font-bold text-slate-700 text-sm truncate w-full px-1">{reservation.branchId}</span>
                     </div>
                  </div>

                  {reservation.tablePreference && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2">
                      <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="text-xs text-slate-500 font-medium block mb-0.5">Table Preference / Note</span>
                        <span className="text-sm font-bold text-slate-700">{reservation.tablePreference}</span>
                      </div>
                    </div>
                  )}

                </motion.div>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </ProtectedRoute>
  );
}
