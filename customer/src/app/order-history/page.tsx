"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ShoppingBag, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedRoute, useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

interface OrderItem {
  id: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  isVeg: boolean;
}

interface Order {
  id: string;
  orderId: string;
  paymentMethod: string;
  orderStatus?: string;
  status?: string;
  total?: number;
  amount?: number;
  createdAt: number;
  items: OrderItem[];
}

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      if (user === null) setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Sort in memory to avoid needing a Firestore composite index
      fetched.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(fetched);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching orders:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getStatusColor = (status: string) => {
    switch(status.toUpperCase()) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PREPARING': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'READY': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'DELIVERED': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
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
              <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Order History</h1>
              <p className="text-[#64748B] font-medium text-[15px]">View your past orders and their status</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500 font-medium">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <ShoppingBag className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
              <p className="text-slate-500 mb-6">Looks like you haven't placed any orders yet.</p>
              <Link href="/menu">
                <Button className="bg-[#6D28D9] hover:bg-purple-700 text-white rounded-xl px-8 h-12 font-bold shadow-md">
                  Browse Menu
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">Order #{order.orderId || order.id.slice(0,8)}</h3>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wide ${getStatusColor(order.orderStatus || order.status || 'PENDING')}`}>
                          {order.orderStatus || order.status || 'PENDING'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <Clock className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    
                    <div className="text-right w-full sm:w-auto">
                      <p className="text-sm text-slate-500 font-medium mb-1">Total Amount</p>
                      <p className="text-2xl font-black text-[#6D28D9]">₹{(order.total || order.amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {order.items?.map((item, idx) => {
                      const itemContent = (
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0 overflow-hidden relative">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ShoppingBag className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{item.name}</h4>
                            <p className="text-sm text-slate-500 font-medium">Qty: {item.quantity}</p>
                          </div>
                          <div className="font-bold text-slate-900 text-right">
                            ₹{item.price * item.quantity}
                          </div>
                        </div>
                      );

                      if (item.menuItemId) {
                        return (
                          <Link key={idx} href={`/food/${item.menuItemId}`} className="block hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors group">
                            {itemContent}
                          </Link>
                        );
                      }

                      return (
                        <div key={idx} className="block p-2 -mx-2">
                          {itemContent}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </ProtectedRoute>
  );
}
