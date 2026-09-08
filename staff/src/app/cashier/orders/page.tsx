"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Clock, ChefHat, CheckSquare, CheckCircle2, 
  XCircle, Armchair, Printer, FileText, Check, X, Eye, 
  User, ShoppingBag, Phone, MapPin, UtensilsCrossed, Tag, AlertCircle
} from "lucide-react";
import { cashierService, type Order, type OrderItem } from "@/services/cashierService";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const getStatusStyles = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case 'pending':
    case 'sent to kitchen':
    case 'placed':
      return { border: "border-l-amber-400", pill: "bg-amber-50 text-amber-700 border-amber-200", icon: "text-amber-500", dot: <Clock className="w-3.5 h-3.5" /> };
    case 'preparing':
    case 'cooking':
      return { border: "border-l-blue-400", pill: "bg-blue-50 text-blue-700 border-blue-200", icon: "text-blue-500", dot: <ChefHat className="w-3.5 h-3.5" /> };
    case 'ready':
    case 'served':
      return { border: "border-l-emerald-400", pill: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "text-emerald-500", dot: <CheckSquare className="w-3.5 h-3.5" /> };
    case 'completed':
    case 'paid':
      return { border: "border-l-[#5D34F5]", pill: "bg-[#F8F7FF] text-[#5D34F5] border-[#E5DFFF]", icon: "text-[#5D34F5]", dot: <CheckCircle2 className="w-3.5 h-3.5" /> };
    case 'cancelled':
      return { border: "border-l-rose-400", pill: "bg-rose-50 text-rose-700 border-rose-200", icon: "text-rose-500", dot: <XCircle className="w-3.5 h-3.5" /> };
    default:
      return { border: "border-l-slate-400", pill: "bg-slate-50 text-slate-700 border-slate-200", icon: "text-slate-500", dot: <Clock className="w-3.5 h-3.5" /> };
  }
};

const getCustomerDetails = (order: Order) => {
  let name = order.customerName;
  let phone = order.customerPhone || (order as any).phone;
  let address = (order as any).address || (order as any).deliveryAddress;

  if (typeof (order as any).customer === 'object' && (order as any).customer !== null) {
    const c = (order as any).customer;
    if (!name || name === "Walk-in Guest") name = c.name || name;
    if (!phone) phone = c.phone;
    if (!address) address = c.address;
  } else if (typeof (order as any).customer === 'string' && (!name || name === "Walk-in Guest")) {
    name = (order as any).customer;
  }

  return {
    name: name || "Walk-in Guest",
    phone: phone && phone !== "undefined" && phone !== "null" ? String(phone) : null,
    address: address && address !== "undefined" && address !== "null" ? String(address) : null,
  };
};

const getOrderFinancials = (order: Order) => {
  const items = order.items || [];
  const itemsSum = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  
  const subtotal = Number(order.subtotal != null ? order.subtotal : itemsSum);
  const discount = Number(order.discount || 0);
  const taxableSubtotal = Math.max(0, subtotal - discount);
  
  const tax = Number(order.tax != null ? order.tax : taxableSubtotal * 0.05);
  const deliveryCharge = Number(order.deliveryCharge || 0);
  const serviceCharge = Number(order.serviceCharge || 0);
  
  const rawTotal = order.total ?? (order as any).totalAmount ?? (order as any).amount;
  const total = rawTotal != null ? Number(rawTotal) : (taxableSubtotal + tax + deliveryCharge + serviceCharge);

  return {
    subtotal,
    discount,
    tax,
    deliveryCharge,
    serviceCharge,
    total
  };
};

export default function CashierOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeStatus, setActiveStatus] = useState("Completed");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const load = async () => {
      unsubscribe = await cashierService.subscribeToOrders((data) => {
        setOrders(data);
        setSelectedOrder((prev) => {
          if (!prev) return null;
          return data.find(o => o.id === prev.id) || prev;
        });
      });
    };
    load();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Compute live dynamic KPI stats across all statuses
  const stats = useMemo(() => {
    const isStatusMatch = (o: Order, targetStatus: string) => {
      const s = (o.orderStatus || (o as any).status || "").toUpperCase();
      if (targetStatus === "All") return true;
      if (targetStatus === "Pending") return s === "PENDING" || s === "SENT TO KITCHEN" || s === "PLACED";
      if (targetStatus === "Preparing") return s === "PREPARING" || s === "COOKING";
      if (targetStatus === "Ready") return s === "READY" || s === "SERVED";
      if (targetStatus === "Completed") return s === "COMPLETED" || s === "PAID";
      if (targetStatus === "Cancelled") return s === "CANCELLED";
      return s === targetStatus.toUpperCase();
    };

    const getCount = (status: string) => {
      if (status === "All") return orders.length;
      return orders.filter(o => isStatusMatch(o, status)).length;
    };

    const getRevenue = (status: string) => {
      const list = status === "All" ? orders : orders.filter(o => isStatusMatch(o, status));
      return list.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    };

    return {
      All: { count: getCount("All"), revenue: getRevenue("All") },
      Pending: { count: getCount("Pending"), revenue: getRevenue("Pending") },
      Preparing: { count: getCount("Preparing"), revenue: getRevenue("Preparing") },
      Ready: { count: getCount("Ready"), revenue: getRevenue("Ready") },
      Completed: { count: getCount("Completed"), revenue: getRevenue("Completed") },
      Cancelled: { count: getCount("Cancelled"), revenue: getRevenue("Cancelled") },
    };
  }, [orders]);

  const KPI_CARDS = [
    {
      id: "All",
      label: "All Orders",
      icon: ShoppingBag,
      count: stats.All.count,
      subtext: `₹${stats.All.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      activeBg: "bg-gradient-to-br from-[#5D34F5] to-[#4520D8] text-white shadow-xl shadow-[#5D34F5]/30 border-[#5D34F5]",
      inactiveIconBg: "bg-purple-50 text-[#5D34F5]",
      activeIconBg: "bg-white/20 text-white",
      tag: "All Orders",
      footerLabel: "Total Revenue"
    },
    {
      id: "Pending",
      label: "Pending",
      icon: Clock,
      count: stats.Pending.count,
      subtext: stats.Pending.count > 0 ? "Action needed" : "All clear",
      activeBg: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl shadow-amber-500/30 border-amber-500",
      inactiveIconBg: "bg-amber-50 text-amber-600",
      activeIconBg: "bg-white/20 text-white",
      tag: "Pending",
      pulse: stats.Pending.count > 0,
      footerLabel: "Status"
    },
    {
      id: "Preparing",
      label: "Preparing",
      icon: ChefHat,
      count: stats.Preparing.count,
      subtext: stats.Preparing.count > 0 ? "Cooking" : "Idle",
      activeBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30 border-blue-500",
      inactiveIconBg: "bg-blue-50 text-blue-600",
      activeIconBg: "bg-white/20 text-white",
      tag: "Preparing",
      footerLabel: "Kitchen"
    },
    {
      id: "Ready",
      label: "Ready",
      icon: CheckSquare,
      count: stats.Ready.count,
      subtext: stats.Ready.count > 0 ? "Pickup now" : "None waiting",
      activeBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/30 border-emerald-500",
      inactiveIconBg: "bg-emerald-50 text-emerald-600",
      activeIconBg: "bg-white/20 text-white",
      tag: "Ready",
      pulse: stats.Ready.count > 0,
      footerLabel: "Pickup"
    },
    {
      id: "Completed",
      label: "Completed",
      icon: CheckCircle2,
      count: stats.Completed.count,
      subtext: `₹${stats.Completed.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      activeBg: "bg-gradient-to-br from-[#5D34F5] to-[#4520D8] text-white shadow-xl shadow-[#5D34F5]/30 border-[#5D34F5]",
      inactiveIconBg: "bg-purple-50 text-[#5D34F5]",
      activeIconBg: "bg-white/20 text-white",
      tag: "Completed",
      footerLabel: "Settled Value"
    },
    {
      id: "Cancelled",
      label: "Cancelled",
      icon: XCircle,
      count: stats.Cancelled.count,
      subtext: stats.Cancelled.count > 0 ? "Voided" : "0 void",
      activeBg: "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xl shadow-rose-500/30 border-rose-500",
      inactiveIconBg: "bg-rose-50 text-rose-600",
      activeIconBg: "bg-white/20 text-white",
      tag: "Cancelled",
      footerLabel: "Cancelled"
    }
  ];

  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase().trim();
    const orderIdMatch = (order.orderId || "").toLowerCase().includes(q);
    const tableMatch = (order.tableId || "").toLowerCase().includes(q);
    const customerMatch = (order.customerName || "").toLowerCase().includes(q);
    const matchesSearch = !q || orderIdMatch || tableMatch || customerMatch;

    const s = (order.orderStatus || (order as any).status || "").toUpperCase();
    let matchesStatus = true;
    if (activeStatus === "Pending") {
      matchesStatus = s === "PENDING" || s === "SENT TO KITCHEN" || s === "PLACED";
    } else if (activeStatus === "Preparing") {
      matchesStatus = s === "PREPARING" || s === "COOKING";
    } else if (activeStatus === "Ready") {
      matchesStatus = s === "READY" || s === "SERVED";
    } else if (activeStatus === "Completed") {
      matchesStatus = s === "COMPLETED" || s === "PAID";
    } else if (activeStatus === "Cancelled") {
      matchesStatus = s === "CANCELLED";
    } else if (activeStatus !== "All") {
      matchesStatus = s === activeStatus.toUpperCase();
    }

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (status: string) => {
    if (!selectedOrder || !selectedOrder.id) return;
    const orderId = selectedOrder.id;
    try {
      setSelectedOrder(prev => prev && prev.id === orderId ? {
        ...prev,
        orderStatus: status,
        paymentStatus: status === "COMPLETED" ? "PAID" : prev.paymentStatus
      } : prev);
      await cashierService.updateOrderStatus(orderId, status);
      toast.success(`Order marked as ${status}`);
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const calculateTotals = (orderItems: OrderItem[]) => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const total = subtotal + cgst + sgst;
    return { subtotal, cgst, sgst, total };
  };

  return (
    <div className="h-[calc(100vh-70px)] flex flex-col bg-[#F8F9FD] overflow-hidden font-sans print:h-auto print:block print:overflow-visible">
      
      {/* 🌟 TOP FULL-WIDTH SECTION: Full-Width KPI Cards & Pill Filters */}
      <div className="px-6 pt-5 pb-3 shrink-0 print:hidden w-full">
        
        {/* 1. Beautiful Premium KPI Cards Row (Spans 100% Full Page Width) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-3 w-full">
          {KPI_CARDS.map((card) => {
            const Icon = card.icon;
            const isActive = activeStatus === card.id;

            return (
              <div
                key={card.id}
                onClick={() => setActiveStatus(card.id)}
                className={`rounded-2xl p-4 transition-all duration-300 border-2 cursor-pointer relative overflow-hidden group flex flex-col justify-between select-none ${
                  isActive
                    ? `${card.activeBg} ring-2 ring-offset-2 ring-slate-100 scale-[1.02]`
                    : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 text-slate-800 shadow-xs"
                }`}
              >
                {/* Top: Icon and Badge */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isActive ? card.activeIconBg : card.inactiveIconBg
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {card.pulse && !isActive && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-slate-100 text-[#0F172A] border border-slate-200/80 group-hover:bg-slate-200/80"
                    }`}>
                      {card.tag}
                    </span>
                  </div>
                </div>

                {/* Count */}
                <div className="my-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      isActive ? "text-white" : "text-[#0F172A]"
                    }`}>
                      {card.count}
                    </span>
                    <span className={`text-[12px] font-black truncate ${
                      isActive ? "text-white/80" : "text-[#0F172A]"
                    }`}>
                      orders
                    </span>
                  </div>
                </div>

                {/* Bottom Subtext / Revenue */}
                <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-between text-[11px] font-black">
                  <span className={isActive ? "text-white/80" : "text-[#0F172A]/70"}>
                    {card.footerLabel}
                  </span>
                  <span className={`font-black ${isActive ? "text-white" : "text-[#0F172A]"}`}>
                    {card.subtext}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📦 BOTTOM CONTENT SECTION: Left Order List + Right Order Details (Below KPI Cards) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden px-6 pb-4 gap-5 print:p-0 print:block print:overflow-visible">
        
        {/* Left: Scrollable Order Cards List (Hidden on print) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative print:hidden">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-white rounded-2xl border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-[16px] font-black text-slate-700 mb-1">No Orders Found</h3>
              <p className="text-[13px] font-bold text-slate-400 max-w-[260px]">
                There are no orders matching status &quot;{activeStatus}&quot;.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 content-start pb-12">
              {filteredOrders.map(order => {
                const styles = getStatusStyles(order.orderStatus);
                const isSelected = selectedOrder?.id === order.id;
                const orderAmount = Number(order.total ?? (order as any).amount ?? 0);
                const orderTimeStr = order.createdAt 
                  ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "Just now";

                return (
                  <div 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={`bg-white rounded-2xl p-4 cursor-pointer transition-all duration-300 border-2 flex items-center justify-between ${
                      isSelected ? 'border-[#5D34F5] ring-2 ring-[#5D34F5]/10 scale-[1.01]' : `border-transparent hover:border-[#5D34F5]/30 ${styles.border}`
                    } shadow-xs hover:shadow-sm group relative overflow-hidden`}
                  >
                    <div className="flex items-center gap-4 sm:gap-8">
                      <div className="min-w-[160px] flex-1 shrink-0">
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          #{order.orderId}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-slate-900 font-black">
                            <Armchair className="w-4 h-4 text-slate-400" />
                            <span>{order.tableId || "Takeaway"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 font-bold text-[12px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{orderTimeStr}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {order.isPrinted && (
                          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                            <Printer className="w-3 h-3" /> Printed
                          </div>
                        )}
                        <Badge variant="outline" className={`${styles.pill} border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0`}>
                          {styles.dot}
                          {order.orderStatus}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-8">
                      <div className="text-[12px] font-bold text-slate-400 hidden sm:block">
                        {order.items?.length || 0} items
                      </div>
                      <div className="text-[16px] font-black text-slate-900 w-28 text-right">
                        ₹{orderAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Order Details Panel (Below KPI Cards on the right side) */}
        <div id="order-details-print-panel" className="w-full lg:w-[430px] bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col shrink-0 z-10 print:w-full print:border-none relative overflow-hidden h-full">
          
          {/* Header (Screen only) */}
          <div className="h-[64px] px-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F8F7FF] flex items-center justify-center border border-[#E5DFFF] text-[#5D34F5]">
                <FileText className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[15px] font-black text-slate-900 leading-tight">Order Details</h2>
                <p className="text-[11px] font-bold text-slate-400">
                  {selectedOrder ? `#${selectedOrder.orderId}` : "Select an order"}
                </p>
              </div>
            </div>
            
            {selectedOrder && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-50 text-[#5D34F5] border border-purple-100 px-2 py-0.5 rounded-md">
                  {selectedOrder.orderType || "Dine In"}
                </span>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {selectedOrder ? (
            (() => {
              const cust = getCustomerDetails(selectedOrder);
              const fin = getOrderFinancials(selectedOrder);
              const styles = getStatusStyles(selectedOrder.orderStatus);
              const itemsList = selectedOrder.items || [];
              const orderTime = selectedOrder.createdAt 
                ? new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "Just now";

              return (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden print:overflow-visible print:h-auto print:block">
                  
                  {/* Printable Restaurant Bill Header (Visible ONLY on print) */}
                  <div className="hidden print:block text-center pb-3 mb-3 border-b-2 border-dashed border-slate-800">
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">Foodie Cafe & Restaurant</h1>
                    <p className="text-[11px] text-slate-600 font-bold">Fast Billing • Delicious Dining</p>
                    <div className="my-1.5 inline-block px-3 py-0.5 border border-slate-800 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                      Tax Invoice / Bill
                    </div>
                    <div className="text-[11px] font-black text-slate-800 flex justify-between px-1 mt-1">
                      <span>Order: #{selectedOrder.orderId}</span>
                      <span>{selectedOrder.orderType || "Dine In"}</span>
                    </div>
                  </div>

                  {/* Scrollable Content Body (Meta + Customer Contact + Items + Financial Breakdown) */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 print:p-0 print:overflow-visible print:h-auto print:space-y-3">
                    
                    {/* 1. Quick Info Grid (2x2) */}
                    <div className="grid grid-cols-2 gap-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-[12px] print:bg-transparent print:p-0 print:border-none print:border-b print:border-dashed print:border-slate-300 print:pb-2.5">
                      <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Customer</span>
                        <div className="flex items-center gap-1 font-black text-slate-800 truncate" title={cust.name}>
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                          <span className="truncate">{cust.name}</span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Table / Service</span>
                        <div className="flex items-center gap-1 font-black text-slate-800">
                          <Armchair className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                          <span>{selectedOrder.tableId || "Takeaway"}</span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Placed At</span>
                        <div className="flex items-center gap-1 font-black text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                          <span>{orderTime}</span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Status</span>
                        <div className="flex items-center gap-1 font-black text-slate-800">
                          <span className="print:hidden">{styles.dot}</span>
                          <span>{selectedOrder.orderStatus}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Phone & Delivery Address (if provided) */}
                    {(cust.phone || cust.address) && (
                      <div className="bg-[#FAF9FF] border border-[#ECE7FF] rounded-xl p-3 space-y-1.5 text-[11px] print:bg-transparent print:p-0 print:border-none print:border-b print:border-dashed print:border-slate-300 print:pb-2">
                        {cust.phone && (
                          <div className="flex items-center gap-2 text-slate-700 font-bold">
                            <Phone className="w-3.5 h-3.5 text-[#5D34F5] shrink-0 print:hidden" />
                            <span>Phone: {cust.phone}</span>
                          </div>
                        )}
                        {cust.address && (
                          <div className="flex items-start gap-2 text-slate-700 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-[#5D34F5] shrink-0 mt-0.5 print:hidden" />
                            <span className="line-clamp-2">Address: {cust.address}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. Itemized Breakdown */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          Items Breakdown ({itemsList.length})
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {itemsList.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0)} pcs total
                        </span>
                      </div>

                      {itemsList.length === 0 ? (
                        <div className="p-4 text-center text-[12px] text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                          No item records attached to this order.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {itemsList.map((item, idx) => {
                            const isVeg = item.isVeg !== false;
                            const itemPrice = Number(item.price || 0);
                            const itemQty = Number(item.quantity || 1);
                            const lineTotal = itemPrice * itemQty;

                            return (
                              <div 
                                key={item.id || idx}
                                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors print:border-none print:border-b print:border-slate-200 print:rounded-none print:px-0 print:py-1.5"
                              >
                                {/* Thumbnail with graceful fallback (hidden on print to save ink and space) */}
                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 relative flex items-center justify-center print:hidden">
                                  {item.image ? (
                                    <img 
                                      src={item.image} 
                                      alt={item.name} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                        const sibling = e.currentTarget.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                                        if (sibling) sibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className={`fallback-icon w-full h-full items-center justify-center text-slate-400 ${item.image ? 'hidden' : 'flex'}`}
                                  >
                                    <UtensilsCrossed className="w-5 h-5 text-slate-400" />
                                  </div>
                                </div>

                                {/* Dish Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    {/* Veg/Non-Veg Dot */}
                                    <span 
                                      className={`inline-flex items-center justify-center w-3.5 h-3.5 border rounded-xs p-0.5 shrink-0 ${
                                        isVeg ? 'border-emerald-600' : 'border-rose-600'
                                      }`}
                                      title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                    </span>
                                    <h4 className="text-[13px] font-black text-slate-800 truncate" title={item.name}>
                                      {item.name}
                                    </h4>
                                  </div>

                                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                    <span>₹{itemPrice.toFixed(2)}</span>
                                    <span>×</span>
                                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-black text-[10px] print:bg-transparent print:p-0">
                                      Qty: {itemQty}
                                    </span>
                                    {item.selectedSize && (
                                      <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded font-bold print:bg-transparent">
                                        {item.selectedSize}
                                      </span>
                                    )}
                                  </div>

                                  {item.specialInstructions && (
                                    <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 font-bold truncate print:bg-transparent">
                                      Note: {item.specialInstructions}
                                    </div>
                                  )}
                                </div>

                                {/* Line Total */}
                                <div className="text-right shrink-0">
                                  <span className="text-[13px] font-black text-slate-900">
                                    ₹{lineTotal.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 3. Financial Breakdown Card */}
                    <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/70 space-y-2 text-[12px] print:bg-transparent print:p-0 print:border-none print:border-t print:border-dashed print:border-slate-300 print:pt-3">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Billing & Payment
                      </div>

                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-bold">Items Subtotal</span>
                        <span className="font-black text-slate-800">₹{fin.subtotal.toFixed(2)}</span>
                      </div>

                      {fin.discount > 0 && (
                        <div className="flex justify-between items-center text-emerald-600">
                          <span className="font-bold flex items-center gap-1">
                            <Tag className="w-3 h-3 print:hidden" /> Coupon Discount
                          </span>
                          <span className="font-black">-₹{fin.discount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-bold">GST / Taxes (5%)</span>
                        <span className="font-black text-slate-800">₹{fin.tax.toFixed(2)}</span>
                      </div>

                      {fin.deliveryCharge > 0 && (
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-bold">Delivery Fee</span>
                          <span className="font-black text-slate-800">₹{fin.deliveryCharge.toFixed(2)}</span>
                        </div>
                      )}

                      {fin.serviceCharge > 0 && (
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-bold">Service Charge</span>
                          <span className="font-black text-slate-800">₹{fin.serviceCharge.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="h-px bg-slate-200 my-1 print:border-t print:border-slate-300"></div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">Payment:</span>
                          <span className="text-[11px] font-black text-slate-800">
                            {selectedOrder.paymentMethod || "Cash"}
                          </span>
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          (selectedOrder.paymentStatus || "").toUpperCase() === 'PAID' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 print:bg-transparent print:border-none' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200 print:bg-transparent print:border-none'
                        }`}>
                          {selectedOrder.paymentStatus || 'PENDING'}
                        </span>
                      </div>
                    </div>

                    {/* Grand Total Box */}
                    <div className="bg-[#F8F7FF] border border-[#E5DFFF] rounded-xl p-3.5 flex justify-between items-center shadow-xs print:bg-transparent print:border-t-2 print:border-b-2 print:border-slate-900 print:rounded-none print:px-0 print:py-2">
                      <div>
                        <span className="block text-[11px] font-black text-slate-500 uppercase tracking-wider print:text-slate-900">
                          Grand Total
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 print:text-slate-600">
                          Inclusive of all taxes
                        </span>
                      </div>
                      <span className="text-[22px] font-black text-[#5D34F5] print:text-slate-900">
                        ₹{fin.total.toFixed(2)}
                      </span>
                    </div>

                    {/* Printable Bill Footer (Visible ONLY on print) */}
                    <div className="hidden print:block text-center pt-3 mt-3 border-t border-dashed border-slate-400 text-[11px] text-slate-600">
                      <p className="font-black text-slate-900">Thank you for dining with us!</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Please visit again • Have a wonderful day</p>
                    </div>

                  </div>

                  {/* Pinned Action Toolbar (Always visible at bottom on screen, hidden on print) */}
                  <div className="p-4 bg-white border-t border-slate-100 shrink-0 space-y-2 print:hidden">
                    {/* Row 1: Print Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          toast.success("Printing KOT...");
                          window.print();
                        }}
                        className="h-10 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 font-black text-[12px] transition-colors shadow-xs cursor-pointer active:scale-98"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" /> KOT
                      </button>

                      <button 
                        onClick={async () => {
                          toast.success("Printing Bill...");
                          window.print();
                          if (selectedOrder?.id && !selectedOrder.isPrinted) {
                            await cashierService.updateOrder(selectedOrder.id, { isPrinted: true });
                          }
                        }}
                        className="h-10 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 font-black text-[12px] transition-colors shadow-xs cursor-pointer active:scale-98"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" /> Print Bill
                      </button>
                    </div>

                    {/* Row 2: Status Lifecycle Actions */}
                    {selectedOrder.orderStatus !== "COMPLETED" && selectedOrder.orderStatus !== "CANCELLED" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleUpdateStatus("COMPLETED")}
                          className="h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5 font-black text-[12px] transition-all shadow-xs shadow-emerald-200 cursor-pointer active:scale-98"
                        >
                          <Check className="w-4 h-4" /> Mark Complete
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus("CANCELLED")}
                          className="h-10 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-600 flex items-center justify-center gap-1.5 font-black text-[12px] transition-all shadow-xs cursor-pointer active:scale-98"
                        >
                          <X className="w-4 h-4" /> Cancel Order
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-1.5 text-[11px] font-black tracking-wide rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
                        {selectedOrder.orderStatus === "COMPLETED" ? "✓ Order Completed & Settled" : "✕ Order Cancelled"}
                      </div>
                    )}
                  </div>

                </div>
              );
            })()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                <Eye className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-[15px] font-black text-slate-700 mb-1">No Order Selected</h3>
              <p className="text-[12px] font-bold text-slate-400 max-w-[220px]">
                Click on any order from the left list to view items, check financials, print bills, and update status.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 🖨️ Dedicated Print Styles: Isolates and prints ONLY the Order Details section */}
      <style>{`
        @media print {
          @page {
            margin: 8mm;
            size: auto;
          }
          body * {
            visibility: hidden !important;
          }
          #order-details-print-panel,
          #order-details-print-panel * {
            visibility: visible !important;
          }
          #order-details-print-panel {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 480px !important;
            margin: 0 auto !important;
            padding: 8px !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            height: auto !important;
            display: block !important;
          }
          #order-details-print-panel .overflow-y-auto {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            padding: 0 !important;
          }
          [data-sonner-toaster],
          #sonner-toaster,
          .sonner-toast,
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

    </div>
  );
}
