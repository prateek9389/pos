"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  IndianRupee,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  ShoppingBag,
  Utensils,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Interfaces
interface Order {
  id: string;
  orderId: string;
  branchId: string;
  table: string;
  customer?: {
    name: string;
    phone: string;
    initials?: string;
  };
  type?: string;
  status?: string;
  orderStatus?: string;
  amount?: string | number;
  totalAmount?: string | number;
  payment?: string;
  paymentStatus?: string;
  seats?: string;
  createdAt: any;
  items?: any[];
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("All Orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // New Order Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "Dine In",
    table: "",
    customerName: "",
    customerPhone: "",
  });

  useEffect(() => {
    const sessionStr = localStorage.getItem("staffSession");
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        setSession(parsed);
        
        // Fetch orders
        const q = query(
          collection(db, "orders"), 
          where("branchId", "==", parsed.branchId)
        );
        
        const unsub = onSnapshot(q, (snapshot) => {
          const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
          fetched.sort((a, b) => {
            const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime()));
            const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime()));
            return tB - tA;
          });
          setOrders(fetched);
          setIsLoading(false);
        });
        
        return () => unsub();
      } catch (e) {
        console.error("Invalid session");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.table && formData.type === "Dine In") {
      toast.error("Table number is required for Dine In");
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a short ID
      const shortId = "#" + Math.floor(100000 + Math.random() * 900000).toString();
      const now = new Date();
      const initials = formData.customerName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0,2) || "G";

      const newOrder = {
        orderId: shortId,
        branchId: session.branchId,
        restaurantId: session.restaurantId,
        date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        table: formData.table || "-",
        customer: {
          name: formData.customerName || "Guest",
          phone: formData.customerPhone || "-",
          initials: initials
        },
        type: formData.type,
        status: "Pending",
        amount: "₹0.00", // Will be updated when items are added
        payment: "Pending",
        seats: "-",
        extraItems: 0,
        day: "Today",
        createdAt: Date.now()
      };

      await addDoc(collection(db, "orders"), newOrder);
      toast.success("Order created successfully");
      setIsDialogOpen(false);
      setFormData({ type: "Dine In", table: "", customerName: "", customerPhone: "" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      let orderStatusVal = newStatus.toUpperCase();
      if (newStatus === "Sent to Kitchen") orderStatusVal = "SENT_TO_KITCHEN";
      
      await updateDoc(doc(db, "orders", id), { 
        status: newStatus,
        orderStatus: orderStatusVal
      });
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  const deleteOrder = async (id: string) => {
    if(confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "orders", id));
        toast.success("Order deleted");
      } catch (error) {
        toast.error("Failed to delete order");
      }
    }
  };

  const getDisplayStatus = (order: Order) => {
    let s = order.orderStatus || order.status || "PENDING";
    if (s === "COMPLETED" || s === "Completed") return "Completed";
    if (s === "DELIVERED" || s === "Delivered") return "Delivered";
    if (s === "PREPARING" || s === "Preparing") return "Preparing";
    if (s === "PENDING" || s === "Pending") return "Pending";
    if (s === "CANCELLED" || s === "Cancelled") return "Cancelled";
    return s;
  };

  const filteredOrders = orders.filter(order => {
    const s = getDisplayStatus(order);
    return activeTab === "All Orders" || s === activeTab;
  });

  const displayedOrders = showAll ? filteredOrders : filteredOrders.slice(0, 5);

  // KPI Calculations
  const pending = orders.filter(o => getDisplayStatus(o) === "Pending").length;
  const preparing = orders.filter(o => getDisplayStatus(o) === "Preparing").length;
  const ready = orders.filter(o => getDisplayStatus(o) === "Ready").length;
  const completed = orders.filter(o => getDisplayStatus(o) === "Completed").length;
  const cancelled = orders.filter(o => getDisplayStatus(o) === "Cancelled").length;

  const kpis = [
    { label: "Total Orders", value: orders.length, trend: "", isPositive: true, icon: IndianRupee, bgColor: "bg-purple-100", iconColor: "text-purple-600" },
    { label: "Pending", value: pending, trend: "", isPositive: true, icon: Clock, bgColor: "bg-orange-100", iconColor: "text-orange-500" },
    { label: "Preparing", value: preparing, trend: "", isPositive: true, icon: ChefHat, bgColor: "bg-blue-100", iconColor: "text-blue-500" },
    { label: "Ready", value: ready, trend: "", isPositive: true, icon: CheckCircle2, bgColor: "bg-purple-100", iconColor: "text-purple-600" },
    { label: "Completed", value: completed, trend: "", isPositive: true, icon: ShoppingBag, bgColor: "bg-emerald-100", iconColor: "text-emerald-600" },
    { label: "Cancelled", value: cancelled, trend: "", isPositive: false, icon: XCircle, bgColor: "bg-red-100", iconColor: "text-red-500" }
  ];

  // Helper for Status Badge Styles
  const getStatusStyle = (status: string) => {
    switch(status) {
      case "Preparing": return { bg: "bg-orange-50", text: "text-orange-500", dot: "bg-orange-500", border: "border-l-orange-500" };
      case "Ready": return { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-600", border: "border-l-purple-600" };
      case "Completed": return { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-600", border: "border-l-emerald-600" };
      case "Delivered": return { bg: "bg-teal-50", text: "text-teal-600", dot: "bg-teal-600", border: "border-l-teal-600" };
      case "Cancelled": return { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", border: "border-l-red-500" };
      case "Pending": return { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-500", border: "border-l-slate-400" };
      default: return { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400", border: "border-l-slate-200" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
        <p className="mt-4 text-slate-500 font-medium">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 1. KPI Cards (acting as interactive status filters) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const isSelected = (kpi.label === "Total Orders" && activeTab === "All Orders") || activeTab === kpi.label;
          return (
            <div 
              key={idx} 
              onClick={() => setActiveTab(kpi.label === "Total Orders" ? "All Orders" : kpi.label)}
              className={`bg-white p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-center flex flex-col items-center hover:shadow-md hover:-translate-y-1 ${
                isSelected ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-sm" : "border-slate-100 shadow-xs"
              }`}
            >
              <div className={`w-12 h-12 rounded-[14px] ${kpi.bgColor} flex items-center justify-center mb-3`}>
                <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
              <h3 className="text-[28px] font-black text-slate-900 leading-none mb-3">{kpi.value}</h3>
            </div>
          );
        })}
      </div>

      {/* 2. Orders Table */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-black text-slate-900 tracking-tight">Orders List</h2>
            <p className="text-[12px] font-bold text-slate-400 mt-0.5">
              {activeTab === "All Orders" ? "All active & completed orders" : `${activeTab} orders`} ({displayedOrders.length} shown)
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-10 px-5 text-[13px] font-bold shadow-xs transition-all cursor-pointer"><Plus className="w-4 h-4 mr-1.5" />New Order</Button>} />
            <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-2xl border-slate-100 shadow-xl overflow-hidden">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-[20px] font-black text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  Create New Order
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateOrder}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Order Type</label>
                    <div className="relative">
                      <Select value={formData.type as any} onValueChange={(v) => setFormData({...formData, type: v})}>
                        <SelectTrigger className="w-full h-[46px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[14px] font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all data-[state=open]:ring-1 data-[state=open]:ring-[#7C3AED]">
                          <SelectValue placeholder="Select Order Type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                          <SelectItem value="Dine In" className="cursor-pointer hover:bg-slate-50 rounded-lg font-semibold">Dine In</SelectItem>
                          <SelectItem value="Takeaway" className="cursor-pointer hover:bg-slate-50 rounded-lg font-semibold">Takeaway</SelectItem>
                          <SelectItem value="Delivery" className="cursor-pointer hover:bg-slate-50 rounded-lg font-semibold">Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Table Number (Dine In)</label>
                    <input 
                      type="text" 
                      value={formData.table}
                      onChange={(e) => setFormData({...formData, table: e.target.value})}
                      placeholder="e.g. T-12"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700 ml-1">Customer Name</label>
                      <input 
                        type="text" 
                        value={formData.customerName}
                        onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                        placeholder="Enter name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700 ml-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                        placeholder="+91"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-6 border-t-0 bg-transparent p-0 flex flex-row gap-3 sm:justify-end">
                  <DialogClose render={<Button type="button" variant="outline" className="rounded-xl font-bold h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto m-0" />}>Cancel</DialogClose>
                  <Button type="submit" disabled={isSubmitting} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-bold shadow-sm w-full sm:w-auto">
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Start Order
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Order ID <ChevronDown className="w-3 h-3 inline ml-1" /></th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Table <ChevronDown className="w-3 h-3 inline ml-1" /></th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Customer <ChevronDown className="w-3 h-3 inline ml-1" /></th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Items</th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount <ChevronDown className="w-3 h-3 inline ml-1" /></th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status <ChevronDown className="w-3 h-3 inline ml-1" /></th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Order Type <ChevronDown className="w-3 h-3 inline ml-1" /></th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Time <ChevronDown className="w-3 h-3 inline ml-1" /></th>
                <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.length > 0 ? displayedOrders.map((order, idx) => {
                const s = getDisplayStatus(order);
                const style = getStatusStyle(s);
                
                let t = 0;
                if (order.createdAt?.toMillis) t = order.createdAt.toMillis();
                else if (order.createdAt?.seconds) t = order.createdAt.seconds * 1000;
                else if (typeof order.createdAt === 'number') t = order.createdAt;
                else if (typeof order.createdAt === 'string') t = new Date(order.createdAt).getTime();

                const dateStr = t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "-";
                const timeStr = t ? new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-";
                const dayStr = t ? new Date(t).toLocaleDateString('en-US', { weekday: 'short' }) : "-";

                const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                const extraItems = order.items ? order.items.length - 1 : 0;

                return (
                  <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white ${style.border} border-l-[4px]`}>
                    
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#7C3AED] text-[14px]">{order.orderId || order.id.substring(0, 6)}</div>
                      <div className="text-[12px] font-semibold text-slate-400 mt-1">{dateStr}</div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-[14px]">{order.table || "Takeaway"}</div>
                      <div className="text-[12px] font-semibold text-slate-400 mt-1">{order.seats ? `${order.seats} seats` : ""}</div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-slate-200">
                          <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-[12px]">{order.customer?.initials || "G"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-slate-900 text-[14px]">{order.customer?.name || "Guest"}</div>
                          <div className="text-[12px] font-semibold text-slate-500 mt-0.5">{order.customer?.phone || "-"}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-2 p-1.5 -ml-1.5 rounded-xl hover:bg-slate-100/80 transition-colors text-left"
                      >
                        {firstItem ? (
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center shrink-0 bg-white">
                               {firstItem.image ? <img src={firstItem.image} className="w-full h-full object-cover" /> : <span className="text-[14px]">🍔</span>}
                             </div>
                           </div>
                        ) : (
                          <div className="text-[13px] font-bold text-slate-400">-</div>
                        )}
                        {extraItems > 0 && (
                          <span className="text-[12px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">+{extraItems}</span>
                        )}
                      </button>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-[14px]">₹{Number(order.totalAmount || order.amount || 0).toLocaleString()}</div>
                      <div className="text-[12px] font-semibold text-slate-400 mt-1">{order.paymentStatus || order.payment || "PENDING"}</div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${style.bg}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></div>
                        <span className={`text-[13px] font-bold ${style.text}`}>{s}</span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]">
                          {order.type === "Dine In" || order.table ? <Utensils className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-bold text-slate-700 text-[13px]">{order.type || (order.table ? "Dine In" : "Takeaway")}</span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-[14px]">{timeStr}</div>
                      <div className="text-[12px] font-semibold text-slate-400 mt-1">{dayStr}</div>
                    </td>
                    
                    <td className="py-4 px-6 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<button className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors mx-auto" />}>
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100 p-2">
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "Preparing")} className="cursor-pointer font-medium text-[13px] text-blue-600 rounded-lg">Mark as Preparing</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "Ready")} className="cursor-pointer font-medium text-[13px] text-purple-600 rounded-lg">Mark as Ready</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "Completed")} className="cursor-pointer font-medium text-[13px] text-emerald-600 rounded-lg">Mark as Completed</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "Delivered")} className="cursor-pointer font-medium text-[13px] text-teal-600 rounded-lg">Mark as Delivered</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100 my-1" />
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "Cancelled")} className="cursor-pointer font-medium text-[13px] text-red-600 rounded-lg">Cancel Order</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100 my-1" />
                          <DropdownMenuItem onClick={() => deleteOrder(order.id)} className="cursor-pointer font-medium text-[13px] text-red-600 rounded-lg">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                    No orders found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!showAll && filteredOrders.length > 5 && (
          <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/30">
            <Button 
              variant="outline" 
              onClick={() => setShowAll(true)}
              className="text-[#7C3AED] border-slate-200 hover:bg-[#7C3AED]/5 hover:border-[#7C3AED] rounded-xl font-bold px-8 h-10 transition-colors"
            >
              View all orders ({filteredOrders.length - 5} more)
            </Button>
          </div>
        )}
      </div>


      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 bg-white rounded-2xl border-slate-100 shadow-xl overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-[20px] font-black text-slate-900 flex items-center justify-between">
              Order Details
              <span className="text-[14px] font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-3 py-1 rounded-lg">
                {selectedOrder?.orderId || selectedOrder?.id.substring(0,6)}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              {selectedOrder?.items && selectedOrder.items.length > 0 ? selectedOrder.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[20px]">🍔</div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-[15px]">{item.name}</div>
                    <div className="text-[13px] font-semibold text-slate-500">₹{item.price} x {item.quantity || 1}</div>
                  </div>
                  <div className="font-black text-slate-900 text-[15px]">
                    ₹{Number(item.price || 0) * Number(item.quantity || 1)}
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-slate-500 font-medium">No items found for this order.</div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[15px] font-bold text-slate-500">Total Amount</span>
              <span className="text-[20px] font-black text-slate-900">₹{Number(selectedOrder?.totalAmount || selectedOrder?.amount || 0).toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Button 
              variant="outline" 
              onClick={() => setSelectedOrder(null)}
              className="rounded-xl font-bold h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-100 w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
