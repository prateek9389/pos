"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Eye, 
  Filter, 
  Calendar as CalendarIcon, 
  Download, 
  SlidersHorizontal, 
  ClipboardList, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  CheckCircle, 
  Plus, 
  X, 
  Tag, 
  FileText, 
  FileDown, 
  ChevronDown, 
  Loader2, 
  Utensils, 
  ShoppingBag, 
  Store, 
  Phone, 
  MapPin, 
  CreditCard,
  IndianRupee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import { useBranchContext } from "@/context/BranchContext";

interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isVeg?: boolean;
  notes?: string;
}

interface Order {
  id: string;
  orderId: string;
  orderNumber?: string;
  customer?: any;
  customerName?: string;
  customerPhone?: string;
  branch?: string;
  branchId?: string;
  branchName?: string;
  amount: number;
  totalAmount?: number;
  total?: number;
  subtotal?: number;
  tax?: number;
  deliveryCharge?: number;
  status: string;
  orderStatus?: string;
  type: string;
  orderType?: string;
  table?: string;
  time?: string;
  date?: string;
  day?: string;
  createdAt?: number;
  items?: OrderItem[];
  paymentMethod?: string;
  paymentStatus?: string;
  payment?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { selectedBranchId, branches } = useBranchContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<Order>>({
    orderId: "",
    customer: "",
    branch: "",
    amount: 0,
    status: "Pending",
    type: "Dine In",
    table: "Table 1",
    time: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [viewDetailsOrder, setViewDetailsOrder] = useState<Order | null>(null);

  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Order[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Order);
      });
      // Sort newest first
      items.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
      setOrders(items);
      setLoading(false);
    });

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        setActiveTab(tabParam.toLowerCase());
      }
    }

    return () => unsubscribe();
  }, []);

  // Helper to extract clean customer details
  const getCustomerInfo = (order: Order) => {
    let raw = order.customer || order.customerName;
    if (typeof raw === "object" && raw !== null) {
      const name = raw.name || raw.customerName || "Guest Patron";
      const phone = raw.phone || raw.userPhone || "";
      const initials = (name.replace(/[^a-zA-Z]/g, "").slice(0, 2) || "GP").toUpperCase();
      return { name, phone, initials, address: raw.address || "" };
    }
    if (typeof raw === "string" && raw.trim() && raw !== "[object Object]") {
      const name = raw.trim();
      const initials = (name.replace(/[^a-zA-Z]/g, "").slice(0, 2) || "GP").toUpperCase();
      return { name, phone: order.customerPhone || "", initials, address: "" };
    }
    if (order.table && order.table !== "Delivery" && order.table !== "Takeaway") {
      return { name: `${order.table} Patron`, phone: "", initials: "T", address: "" };
    }
    return { name: "Walk-in Guest", phone: "", initials: "WG", address: "" };
  };

  // Helper to resolve branch name cleanly
  const getBranchName = (order: Order) => {
    if (order.branchName) return order.branchName;
    if (order.branchId) {
      const found = branches.find(b => b.id === order.branchId);
      if (found) return found.name;
    }
    if (order.branch) return order.branch;
    return "Main Branch";
  };

  // Helper to resolve order date and time cleanly
  const getOrderTiming = (order: Order) => {
    let timeStr = order.time;
    let dateStr = order.date;
    if ((!timeStr || !dateStr) && order.createdAt) {
      const d = new Date(order.createdAt);
      if (!isNaN(d.getTime())) {
        if (!timeStr) timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (!dateStr) dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    return {
      time: timeStr || "Just now",
      date: dateStr || "Today",
      day: order.day || ""
    };
  };

  const openDialog = (mode: "add" | "edit", order?: Order) => {
    setDialogMode(mode);
    if (order) {
      const cInfo = getCustomerInfo(order);
      setFormData({
        ...order,
        customer: cInfo.name
      });
    } else {
      const randomOrderId = "ORD-" + Math.floor(10000 + Math.random() * 90000);
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setFormData({
        orderId: randomOrderId,
        customer: "",
        branch: selectedBranchId === "all" ? (branches[0]?.name || "") : selectedBranchId,
        amount: 0,
        status: "Pending",
        type: "Dine In",
        table: "Table 1",
        time: timeString,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer || !formData.amount) {
      toast.error("Customer name and amount are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const branchObj = branches.find(b => b.id === formData.branch || b.name === formData.branch);
      const bId = branchObj ? branchObj.id : (selectedBranchId === "all" ? "" : selectedBranchId);
      const bName = branchObj ? branchObj.name : formData.branch || "Main Branch";
      const now = Date.now();
      const dateObj = new Date(now);

      const customerObj = {
        name: typeof formData.customer === 'string' ? formData.customer : (formData.customer?.name || "Guest"),
        phone: "+91 98111 22334",
        initials: ((typeof formData.customer === 'string' ? formData.customer : "G").slice(0, 2)).toUpperCase()
      };

      const data = {
        orderId: formData.orderId || "ORD-" + Math.floor(10000 + Math.random() * 90000),
        orderNumber: formData.orderId || "ORD-" + Math.floor(10000 + Math.random() * 90000),
        customer: customerObj,
        customerName: customerObj.name,
        branchId: bId,
        branch: bName,
        branchName: bName,
        amount: Number(formData.amount) || 0,
        totalAmount: Number(formData.amount) || 0,
        total: Number(formData.amount) || 0,
        status: formData.status || "Pending",
        orderStatus: (formData.status || "Pending").toUpperCase(),
        type: formData.type || "Dine In",
        orderType: formData.type || "Dine In",
        table: formData.table || (formData.type === "Dine In" ? "Table 1" : formData.type),
        time: formData.time || dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        paymentStatus: formData.status === "Completed" ? "PAID" : "PENDING",
        paymentMethod: "UPI",
        createdAt: now
      };

      if (dialogMode === "add") {
        await addDoc(collection(db, "orders"), data);
        toast.success("Order created successfully!");
      } else if (formData.id) {
        await updateDoc(doc(db, "orders", formData.id), data);
        toast.success("Order updated successfully!");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "orders", id));
        toast.success("Order deleted");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete order");
      }
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", id), { 
        status: newStatus,
        orderStatus: newStatus.toUpperCase(),
        paymentStatus: newStatus === "Completed" ? "PAID" : "PENDING"
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  // Branch selected object
  const currentBranchObj = branches.find(b => b.id === selectedBranchId);

  // Tab counts
  const counts = useMemo(() => {
    const list = orders.filter(o => {
      if (!selectedBranchId || selectedBranchId === "all") return true;
      if (o.branchId === selectedBranchId) return true;
      if (o.branch === selectedBranchId || o.branchName === selectedBranchId) return true;
      if (currentBranchObj && (
        o.branch?.toLowerCase().includes(currentBranchObj.name.toLowerCase()) ||
        o.branchName?.toLowerCase().includes(currentBranchObj.name.toLowerCase())
      )) return true;
      return false;
    });

    const isMatch = (status: string, tab: string) => {
      const s = (status || "").toLowerCase().trim();
      if (tab === "pending") return s === "pending" || s === "sent to kitchen" || s === "sent_to_kitchen" || s === "bill_requested" || s === "placed";
      if (tab === "preparing") return s === "preparing" || s === "cooking" || s === "in progress";
      if (tab === "ready") return s === "ready" || s === "served";
      if (tab === "completed") return s === "completed" || s === "paid" || s === "delivered";
      return false;
    };

    return {
      all: list.length,
      pending: list.filter(o => isMatch(o.status || o.orderStatus || "", "pending")).length,
      preparing: list.filter(o => isMatch(o.status || o.orderStatus || "", "preparing")).length,
      ready: list.filter(o => isMatch(o.status || o.orderStatus || "", "ready")).length,
      completed: list.filter(o => isMatch(o.status || o.orderStatus || "", "completed")).length
    };
  }, [orders, selectedBranchId, currentBranchObj]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const orderId = (order.orderId || order.orderNumber || "").toLowerCase();
      const cInfo = getCustomerInfo(order);
      const bName = getBranchName(order).toLowerCase();
      
      const matchesSearch = !searchLower ||
        orderId.includes(searchLower) ||
        cInfo.name.toLowerCase().includes(searchLower) ||
        cInfo.phone.toLowerCase().includes(searchLower) ||
        bName.includes(searchLower) ||
        (order.table && order.table.toLowerCase().includes(searchLower));

      const rawStatus = (order.status || order.orderStatus || "").toLowerCase().trim();
      
      let matchesTab = true;
      if (activeTab === "pending") {
        matchesTab = rawStatus === "pending" || rawStatus === "sent to kitchen" || rawStatus === "sent_to_kitchen" || rawStatus === "bill_requested" || rawStatus === "placed";
      } else if (activeTab === "preparing") {
        matchesTab = rawStatus === "preparing" || rawStatus === "cooking" || rawStatus === "in progress";
      } else if (activeTab === "ready") {
        matchesTab = rawStatus === "ready" || rawStatus === "served";
      } else if (activeTab === "completed") {
        matchesTab = rawStatus === "completed" || rawStatus === "paid" || rawStatus === "delivered";
      } else if (activeTab !== "all") {
        matchesTab = rawStatus === activeTab;
      }

      // Branch match
      const matchesBranch = selectedBranchId === "all" || !selectedBranchId ||
        order.branchId === selectedBranchId ||
        order.branch === selectedBranchId ||
        order.branchName === selectedBranchId ||
        (currentBranchObj && (
          order.branchId === currentBranchObj.id ||
          (order.branch && order.branch.toLowerCase().includes(currentBranchObj.name.toLowerCase())) ||
          (currentBranchObj.name && currentBranchObj.name.toLowerCase().includes((order.branch || "").toLowerCase())) ||
          (order.branchName && order.branchName.toLowerCase().includes(currentBranchObj.name.toLowerCase()))
        ));
      
      return matchesSearch && matchesTab && matchesBranch;
    });
  }, [orders, searchTerm, activeTab, selectedBranchId, currentBranchObj]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* 1. Filter Tabs & Add Order Button */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-white border border-slate-100 h-14 p-1.5 rounded-full shadow-[0_2px_15px_rgb(0,0,0,0.02)] flex overflow-x-auto no-scrollbar gap-1">
            <TabsTrigger value="all" className="rounded-full px-5 font-bold data-[state=active]:bg-[#A855F7] data-[state=active]:text-white whitespace-nowrap">
              All Orders <span className="ml-1.5 opacity-80 text-xs font-semibold">({counts.all})</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-full px-5 font-bold data-[state=active]:bg-[#A855F7] data-[state=active]:text-white whitespace-nowrap">
              Pending <span className="ml-1.5 opacity-80 text-xs font-semibold">({counts.pending})</span>
            </TabsTrigger>
            <TabsTrigger value="preparing" className="rounded-full px-5 font-bold data-[state=active]:bg-[#A855F7] data-[state=active]:text-white whitespace-nowrap">
              Preparing <span className="ml-1.5 opacity-80 text-xs font-semibold">({counts.preparing})</span>
            </TabsTrigger>
            <TabsTrigger value="ready" className="rounded-full px-5 font-bold data-[state=active]:bg-[#A855F7] data-[state=active]:text-white whitespace-nowrap">
              Ready <span className="ml-1.5 opacity-80 text-xs font-semibold">({counts.ready})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-full px-5 font-bold data-[state=active]:bg-[#A855F7] data-[state=active]:text-white whitespace-nowrap">
              Completed <span className="ml-1.5 opacity-80 text-xs font-semibold">({counts.completed})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => openDialog("add")} className="h-[52px] rounded-full px-8 bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all w-full md:w-auto font-bold text-[15px] border-0 shrink-0 cursor-pointer" />}>
            <Plus className="w-5 h-5 mr-2 font-black" /> Add Order
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="w-full sm:max-w-4xl overflow-y-auto max-h-[90vh] p-0 gap-0 bg-[#F8F9FA] rounded-[2rem] shadow-[rgba(0,0,0,0.15)_0px_10px_40px] outline-none border-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-8 pb-24 shrink-0">
              <DialogClose render={<button className="absolute top-6 right-6 w-8 h-8 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-md flex items-center justify-center z-50 transition-colors cursor-pointer" />}>
                <X className="w-4 h-4" />
              </DialogClose>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <DialogHeader className="text-left p-0 space-y-0.5">
                  <DialogTitle className="text-[20px] font-bold text-white tracking-tight">{dialogMode === "add" ? "Create New Order" : "Edit Order"}</DialogTitle>
                  <DialogDescription className="text-white/80 text-[13px] font-medium leading-relaxed">
                    {dialogMode === "add" ? "Manually record an order in the system" : "Update order details"}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="absolute bottom-0 left-0 right-0 translate-y-[1px]">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-[#F8F9FA]">
                  <path d="M0,60 C320,120 420,0 720,20 C1020,40 1120,80 1440,40 L1440,120 L0,120 Z" fill="currentColor"></path>
                </svg>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-8 pt-4 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Customer Name <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Input 
                      value={typeof formData.customer === 'string' ? formData.customer : (formData.customer?.name || "")}
                      onChange={(e) => setFormData({...formData, customer: e.target.value})}
                      placeholder="e.g. Rahul Mehta" 
                      className="h-[48px] bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Amount (₹) <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.amount || ""}
                      onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                      placeholder="0.00" 
                      className="h-[48px] bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Order Type</Label>
                  <div className="relative group">
                    <Select value={formData.type || "Dine In"} onValueChange={(v) => setFormData({...formData, type: v, table: v === "Dine In" ? "Table 1" : v})}>
                      <SelectTrigger className="h-[48px] w-full bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-600 data-[state=open]:border-[#A855F7] data-[state=open]:ring-1 data-[state=open]:ring-[#A855F7]">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                        <SelectItem value="Dine In" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Dine In</SelectItem>
                        <SelectItem value="Takeaway" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Takeaway</SelectItem>
                        <SelectItem value="Delivery" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Branch</Label>
                  <div className="relative group">
                    <Select value={formData.branch || ""} onValueChange={(v) => setFormData({...formData, branch: v})}>
                      <SelectTrigger className="h-[48px] w-full bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-600 data-[state=open]:border-[#A855F7] data-[state=open]:ring-1 data-[state=open]:ring-[#A855F7]">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                        {branches.map(b => (
                          <SelectItem key={b.id} value={b.id} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Table / Area</Label>
                  <div className="relative group">
                    <Input 
                      value={formData.table || ""}
                      onChange={(e) => setFormData({...formData, table: e.target.value})}
                      placeholder="e.g. Table 4" 
                      className="h-[48px] bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 md:col-span-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Status</Label>
                  <div className="flex flex-wrap items-center gap-6">
                    {["Pending", "Preparing", "Ready", "Completed"].map(status => (
                      <label key={status} className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="order-status" value={status} checked={formData.status === status} onChange={() => setFormData({...formData, status})} className="peer sr-only" />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-4 mt-8">
                <DialogClose render={<Button type="button" variant="outline" className="h-[48px] px-8 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm cursor-pointer" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="h-[48px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all border-0 cursor-pointer">
                  {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-1.5" />} 
                  Save Order
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* 2. Search & Export Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#A855F7] transition-colors" />
          <Input 
            placeholder="Search by order #, customer, table, branch..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-14 h-[52px] bg-white border-slate-100 rounded-full shadow-[0_2px_15px_rgb(0,0,0,0.02)] focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 transition-all text-[15px] font-medium placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Sheet>
            <SheetTrigger render={<Button className="h-[52px] rounded-full px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all shrink-0 font-bold text-[15px] border-0 cursor-pointer" />}>
              <Download className="w-5 h-5 mr-2 font-black" /> Export
            </SheetTrigger>
            <SheetContent showCloseButton={false} className="w-full sm:max-w-md overflow-y-auto p-0 gap-0 bg-[#F8F9FA] border-l-0 shadow-[rgba(0,0,0,0.15)_0px_4px_30px] outline-none">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-10 pb-24 shrink-0">
                <SheetClose render={<button className="absolute top-6 right-6 w-8 h-8 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-md flex items-center justify-center z-50 transition-colors cursor-pointer" />}>
                  <X className="w-4 h-4" />
                </SheetClose>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative">
                    <FileDown className="w-6 h-6 text-white" />
                  </div>
                  <SheetHeader className="text-left p-0 space-y-0.5">
                    <SheetTitle className="text-[20px] font-bold text-white tracking-tight">Export Orders</SheetTitle>
                    <SheetDescription className="text-white/80 text-[13px] font-medium leading-relaxed">
                      Download order data for reporting
                    </SheetDescription>
                  </SheetHeader>
                </div>

                <div className="absolute bottom-0 left-0 right-0 translate-y-[1px]">
                  <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-[#F8F9FA]">
                    <path d="M0,60 C320,120 420,0 720,20 C1020,40 1120,80 1440,40 L1440,120 L0,120 Z" fill="currentColor"></path>
                  </svg>
                </div>
              </div>

              <div className="p-8 pt-2 pb-10">
                <div className="grid gap-6">
                  
                  <div className="space-y-3 pt-2">
                    <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Export Format</Label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="export-format" defaultChecked className="peer sr-only" />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">CSV (Excel)</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="export-format" className="peer sr-only" />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">PDF Report</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date-from" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Date From</Label>
                      <div className="relative group">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors z-10 pointer-events-none" />
                        <Input id="date-from" type="date" className="h-[52px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-2xl transition-all font-medium text-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] w-full text-slate-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-to" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Date To</Label>
                      <div className="relative group">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors z-10 pointer-events-none" />
                        <Input id="date-to" type="date" className="h-[52px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-2xl transition-all font-medium text-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] w-full text-slate-600" />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="flex items-center gap-4 mt-8">
                  <SheetClose render={<Button variant="outline" className="flex-1 h-[52px] rounded-2xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm cursor-pointer" />}>
                    Cancel
                  </SheetClose>
                  <Button onClick={() => toast.success("Export started")} className="flex-[1.5] h-[52px] rounded-2xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all border-0 cursor-pointer">
                    <Download className="w-5 h-5 mr-1.5" /> Download
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 3. Orders Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
      ) : filteredOrders.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No orders found</h3>
          <p className="text-slate-500 font-medium">There are no orders matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Order ID</th>
                  <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Table / Type</th>
                  <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Customer</th>
                  <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Items</th>
                  <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                  <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Time</th>
                  <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, viewAll ? undefined : 10).map((order) => {
                  const cInfo = getCustomerInfo(order);
                  const branchName = getBranchName(order);
                  const timing = getOrderTiming(order);

                  const rawStatus = (order.status || order.orderStatus || "Pending").trim();
                  const statusLower = rawStatus.toLowerCase();
                  const isCompleted = statusLower === 'completed' || statusLower === 'paid' || statusLower === 'delivered';
                  const isPreparing = statusLower === 'preparing' || statusLower === 'cooking' || statusLower === 'in progress';
                  const isReady = statusLower === 'ready' || statusLower === 'served';
                  const isPending = statusLower === 'pending' || statusLower === 'sent to kitchen' || statusLower === 'sent_to_kitchen' || statusLower === 'bill_requested' || statusLower === 'placed';

                  const bgStyle = isCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : isPreparing ? 'bg-orange-50 text-orange-500 border border-orange-100' : isReady ? 'bg-blue-50 text-blue-500 border border-blue-100' : isPending ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600';
                  const dotStyle = isCompleted ? 'bg-emerald-500' : isPreparing ? 'bg-orange-500' : isReady ? 'bg-blue-500' : isPending ? 'bg-amber-500' : 'bg-slate-500';
                  const borderStyle = isCompleted ? 'border-l-emerald-500' : isPreparing ? 'border-l-orange-500' : isReady ? 'border-l-blue-500' : isPending ? 'border-l-amber-500' : 'border-l-slate-300';
                  
                  const displayAmount = Number(order.amount ?? order.totalAmount ?? order.total ?? 0);
                  const orderDisplayId = order.orderId || order.orderNumber || `#${order.id.slice(0, 6).toUpperCase()}`;
                  
                  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                  const paymentDisplay = order.paymentStatus || order.payment || (isCompleted ? "PAID" : "PENDING");

                  return (
                    <tr key={order.id} className={`border-b border-slate-100 hover:bg-purple-50/20 transition-colors bg-white ${borderStyle} border-l-[4px]`}>
                      
                      {/* Order ID & Date */}
                      <td className="py-4 px-6">
                        <div 
                          className="font-black text-[#7C3AED] text-[14px] cursor-pointer hover:underline flex items-center gap-1.5" 
                          onClick={() => setViewDetailsOrder(order)}
                        >
                          {orderDisplayId}
                        </div>
                        <div className="text-[12px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" /> {timing.date}
                        </div>
                      </td>
                      
                      {/* Table / Order Type */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] shrink-0">
                            {order.type === "Dine In" ? <Utensils className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-[13px] leading-tight">
                              {order.table || order.type}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-400">
                              {order.type || "Dine In"}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Customer Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-purple-100 shrink-0">
                            <AvatarFallback className="bg-purple-50 text-[#7C3AED] font-black text-[12px]">{cInfo.initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-[14px] leading-tight truncate">{cInfo.name}</div>
                            <div className="text-[11px] font-medium text-slate-400 mt-0.5 truncate flex items-center gap-1">
                              <Store className="w-3 h-3 text-slate-400 shrink-0" /> {branchName}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Order Items Preview */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          {firstItem?.image ? (
                            <div className="w-9 h-9 rounded-xl border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                              <img src={firstItem.image} alt={firstItem.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#7C3AED] shrink-0 font-bold text-xs">
                              <Utensils className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-800 truncate leading-tight">
                              {firstItem ? `${firstItem.name} × ${firstItem.quantity}` : `${order.items?.length || 1} Item(s)`}
                            </p>
                            {order.items && order.items.length > 1 && (
                              <p className="text-[11px] font-bold text-[#7C3AED] mt-0.5">
                                +{order.items.length - 1} more items
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Amount & Payment */}
                      <td className="py-4 px-6">
                        <div className="font-black text-slate-900 text-[15px]">
                          ₹{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded ${paymentDisplay === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {paymentDisplay}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">• {order.paymentMethod || "UPI"}</span>
                        </div>
                      </td>
                      
                      {/* Order Status */}
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold capitalize ${bgStyle}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${dotStyle}`}></div>
                          <span>{rawStatus}</span>
                        </div>
                      </td>
                      
                      {/* Time */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-[13px]">{timing.time}</div>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5">{timing.day ? `${timing.day}, ` : ""}{timing.date}</div>
                      </td>
                      
                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<button className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors mx-auto cursor-pointer" />}>
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[170px] rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 z-50">
                            <DropdownMenuItem onClick={() => setViewDetailsOrder(order)} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">
                              <Eye className="mr-2 h-4 w-4 text-[#7C3AED]" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialog("edit", order)} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">
                              <Edit className="mr-2 h-4 w-4" /> Edit Order
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100 my-1" />
                            {order.status !== 'Completed' && (
                              <DropdownMenuItem onClick={() => updateStatus(order.id, "Completed")} className="cursor-pointer text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium">
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark Completed
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'Ready' && order.status !== 'Completed' && (
                              <DropdownMenuItem onClick={() => updateStatus(order.id, "Ready")} className="cursor-pointer text-blue-600 hover:bg-blue-50 rounded-lg font-medium">
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark Ready
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-slate-100 my-1" />
                            <DropdownMenuItem onClick={() => handleDelete(order.id)} className="cursor-pointer text-red-600 hover:bg-red-50 rounded-lg font-medium">
                              <Trash className="mr-2 h-4 w-4" /> Delete Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
          
          {filteredOrders.length > 10 && !viewAll && (
            <div className="flex justify-center mt-8">
              <Button onClick={() => setViewAll(true)} className="h-[52px] px-8 rounded-2xl font-bold bg-white text-slate-700 border-2 border-slate-200 hover:border-[#A855F7] hover:text-[#A855F7] shadow-sm hover:shadow-md transition-all cursor-pointer">
                View All {filteredOrders.length} Orders
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 4. View Details Dialog */}
      <Dialog open={!!viewDetailsOrder} onOpenChange={(open) => !open && setViewDetailsOrder(null)}>
        <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-0 shadow-2xl rounded-[2rem]">
          {viewDetailsOrder && (() => {
            const cInfo = getCustomerInfo(viewDetailsOrder);
            const branchName = getBranchName(viewDetailsOrder);
            const timing = getOrderTiming(viewDetailsOrder);
            const displayTotal = Number(viewDetailsOrder.amount ?? viewDetailsOrder.totalAmount ?? viewDetailsOrder.total ?? 0);
            const subtotal = viewDetailsOrder.subtotal || Math.round(displayTotal / 1.05);
            const tax = viewDetailsOrder.tax || (displayTotal - subtotal);
            const isCompleted = (viewDetailsOrder.status || viewDetailsOrder.orderStatus || "").toLowerCase() === "completed";
            const currentStatus = viewDetailsOrder.status || viewDetailsOrder.orderStatus || "Pending";

            return (
              <>
                <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-10 pb-8 shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                        <ClipboardList className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <DialogTitle className="text-[24px] font-black text-white tracking-tight">
                          {viewDetailsOrder.orderId || viewDetailsOrder.orderNumber}
                        </DialogTitle>
                        <DialogDescription className="text-white/90 text-[13px] font-medium mt-1 flex items-center gap-2">
                          <span>{timing.time} • {timing.date}</span>
                          <span>•</span>
                          <span className="font-bold">{viewDetailsOrder.type || viewDetailsOrder.orderType || "Dine In"}</span>
                        </DialogDescription>
                      </div>
                    </div>
                    <div className="px-4 py-2 rounded-xl flex items-center gap-2 bg-white/20 border border-white/20 backdrop-blur-md">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                      <span className="text-[12px] font-black text-white uppercase tracking-wider">{currentStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
                  {/* Order Metadata 4-Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Customer Details
                      </p>
                      <p className="text-[15px] font-black text-slate-800">{cInfo.name}</p>
                      {cInfo.phone && <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{cInfo.phone}</p>}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5" /> Branch & Table
                      </p>
                      <p className="text-[15px] font-black text-slate-800">{branchName}</p>
                      <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{viewDetailsOrder.table || viewDetailsOrder.type}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> Payment Method
                      </p>
                      <p className="text-[15px] font-black text-slate-800">{viewDetailsOrder.paymentMethod || "UPI / Online"}</p>
                      <p className="text-[12px] font-semibold text-slate-500 mt-0.5">Payment ID: TXN-{viewDetailsOrder.id.slice(0, 8).toUpperCase()}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Status</p>
                      <p className="text-[15px] font-black mt-0.5">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${isCompleted || viewDetailsOrder.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {viewDetailsOrder.paymentStatus || (isCompleted ? "PAID" : "PENDING")}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="space-y-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#A855F7]" /> Order Items ({viewDetailsOrder.items?.length || 1})
                    </h4>
                    
                    <div className="space-y-2.5">
                      {viewDetailsOrder.items && viewDetailsOrder.items.length > 0 ? (
                        viewDetailsOrder.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <div className="w-11 h-11 rounded-xl border border-slate-200 overflow-hidden shrink-0">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C3AED] font-bold text-sm shrink-0">
                                  <Utensils className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-800 text-[14px] leading-tight">{item.name}</p>
                                  {item.isVeg !== undefined && (
                                    <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} title={item.isVeg ? "Veg" : "Non-Veg"}></span>
                                  )}
                                </div>
                                <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                                  ₹{item.price} × {item.quantity}
                                </p>
                              </div>
                            </div>
                            <p className="font-black text-slate-900 text-[15px]">
                              ₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                          <p className="text-slate-500 font-medium text-[13px]">Standard order package</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-[13px]">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-800">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Taxes & GST (5%)</span>
                      <span className="font-bold text-slate-800">₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {viewDetailsOrder.deliveryCharge ? (
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Delivery Fee</span>
                        <span className="font-bold text-slate-800">₹{Number(viewDetailsOrder.deliveryCharge).toFixed(2)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Grand Total</p>
                    <p className="text-[28px] font-black text-[#7C3AED] leading-tight">
                      ₹{displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {viewDetailsOrder.status !== "Completed" && (
                      <Button 
                        onClick={() => {
                          updateStatus(viewDetailsOrder.id, "Completed");
                          setViewDetailsOrder(null);
                        }}
                        className="h-11 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Mark Completed
                      </Button>
                    )}
                    <Button 
                      onClick={() => {
                        const ord = viewDetailsOrder;
                        setViewDetailsOrder(null);
                        openDialog("edit", ord);
                      }}
                      variant="outline" 
                      className="h-11 px-6 rounded-xl font-bold border-purple-200 text-[#7C3AED] hover:bg-purple-50 cursor-pointer"
                    >
                      <Edit className="w-4 h-4 mr-1.5" /> Edit Order
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
