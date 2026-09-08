"use client";

import { 
  Users, 
  Plus, 
  Search, 
  ShoppingBag, 
  Star, 
  Crown,
  Phone, 
  Mail, 
  MoreVertical, 
  ChevronDown, 
  UserPlus, 
  Loader2, 
  Trash,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export default function CustomersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSegment, setActiveSegment] = useState("All Segments");
  const [activeStatus, setActiveStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState<"none" | "orders">("none");
  const [showAll, setShowAll] = useState(false);

  // Add Customer Form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTier, setNewTier] = useState<"Regular" | "Gold Member" | "VIP">("Regular");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Realtime subscription to customers collection
    const q = query(collection(db, "customers"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const resData: any[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const initial = data.name 
            ? data.name.split(" ").filter(Boolean).map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() 
            : "C";
          const spent = Number(data.totalSpent || data.spending || data.spent || 0);
          const orders = Number(data.totalOrders || data.orders || 0);
          const points = Number(data.points || 0);

          // Gold Member criteria: ONLY real explicit tier, membership, or isGold flag
          const isGold = 
            (typeof data.tier === "string" && data.tier.toLowerCase() === "gold") ||
            (typeof data.membership === "string" && data.membership.toLowerCase().includes("gold")) ||
            data.isGold === true;

          // VIP criteria: ONLY real explicit VIP tier or status
          const isVip = 
            !isGold && (
              (typeof data.status === "string" && data.status.toLowerCase() === "vip") ||
              (typeof data.tier === "string" && data.tier.toLowerCase() === "vip") ||
              (typeof data.membership === "string" && data.membership.toLowerCase().includes("vip")) ||
              data.isVip === true
            );

          const avatarStyle = isGold 
            ? "bg-amber-100 text-amber-700 ring-2 ring-amber-400/30" 
            : isVip 
            ? "bg-purple-100 text-purple-700 ring-2 ring-purple-400/30" 
            : "bg-slate-100 text-slate-700";

          const email = data.email || "No email";
          const rawStatus = data.status || "Active";
          const status = rawStatus === "Inactive" ? "Inactive" : "Active";

          resData.push({ 
            id: docSnap.id, 
            ...data,
            name: data.name || "Unnamed Customer",
            initial,
            isGold,
            isVip,
            tier: isGold ? "Gold Member" : isVip ? "VIP" : "Regular",
            avatarStyle,
            email,
            status,
            orders,
            spending: spent,
            totalOrders: orders,
            totalSpent: spent,
            points
          });
        });

        // Default sort alphabetically
        resData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setItems(resData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Customers listener error:", err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // KPI Calculations
  const totalCustomers = items.length;
  const goldMembersCount = items.filter((c) => c.isGold).length;
  const vipCustomersCount = items.filter((c) => c.isVip).length;
  const totalOrders = items.reduce((acc, c) => acc + (c.totalOrders || c.orders || 0), 0);

  const kpis = [
    { 
      id: "total",
      title: "Total Customers", 
      value: totalCustomers, 
      icon: Users, 
      theme: "purple",
      iconBg: "bg-purple-100", 
      iconColor: "text-purple-600",
      active: activeSegment === "All Segments" && activeStatus === "All Status" && sortBy === "none",
      onClick: () => {
        setActiveSegment("All Segments");
        setActiveStatus("All Status");
        setSortBy("none");
        setSearchQuery("");
      }
    },
    { 
      id: "gold",
      title: "Gold Members", 
      value: goldMembersCount, 
      icon: Crown, 
      theme: "amber",
      iconBg: "bg-amber-100", 
      iconColor: "text-amber-500",
      active: activeSegment === "Gold Member",
      onClick: () => {
        if (activeSegment === "Gold Member") {
          setActiveSegment("All Segments");
        } else {
          setActiveSegment("Gold Member");
        }
      }
    },
    { 
      id: "vip",
      title: "VIP Customers", 
      value: vipCustomersCount, 
      icon: Star, 
      theme: "purple-light",
      iconBg: "bg-indigo-100", 
      iconColor: "text-indigo-600",
      active: activeSegment === "VIP",
      onClick: () => {
        if (activeSegment === "VIP") {
          setActiveSegment("All Segments");
        } else {
          setActiveSegment("VIP");
        }
      }
    },
    { 
      id: "orders",
      title: "Total Orders", 
      value: totalOrders, 
      icon: ShoppingBag, 
      theme: "blue",
      iconBg: "bg-blue-100", 
      iconColor: "text-blue-600",
      active: sortBy === "orders",
      onClick: () => {
        setSortBy((prev) => (prev === "orders" ? "none" : "orders"));
      }
    },
  ];

  // Filtering & Sorting
  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.email || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.phone || "").includes(searchQuery);
    
    const matchesSegment = 
      activeSegment === "All Segments" || 
      (activeSegment === "Gold Member" && item.isGold) ||
      (activeSegment === "VIP" && item.isVip) || 
      (activeSegment === "Regular" && !item.isGold && !item.isVip);

    const matchesStatus = 
      activeStatus === "All Status" || item.status === activeStatus;
    
    return matchesSearch && matchesSegment && matchesStatus;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "orders") {
      return (b.totalOrders || b.orders || 0) - (a.totalOrders || a.orders || 0);
    }
    return 0;
  });

  const displayedItems = showAll ? sortedItems : sortedItems.slice(0, 5);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Please enter a customer name");
      return;
    }

    setIsSaving(true);
    try {
      const sessionStr = localStorage.getItem("staffSession");
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      const isGold = newTier === "Gold Member";
      const isVip = newTier === "VIP";

      await addDoc(collection(db, "customers"), {
        name: newName.trim(),
        phone: newPhone.trim() || "",
        email: newEmail.trim() || "",
        status: "Active",
        tier: isGold ? "Gold" : isVip ? "VIP" : "Regular",
        membership: newTier,
        isGold,
        isVip,
        orders: 0,
        spending: 0,
        points: isGold ? 350 : isVip ? 150 : 0,
        totalOrders: 0,
        totalSpent: 0,
        branchId: session?.branchId || "",
        restaurantId: session?.restaurantId || "",
        createdAt: Date.now()
      });

      toast.success("Customer added successfully!");
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewTier("Regular");
      setIsAddOpen(false);
    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast.error(error.message || "Failed to add customer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteDoc(doc(db, "customers", id));
        toast.success("Customer removed successfully");
      } catch (error: any) {
        console.error("Error deleting customer:", error);
        toast.error("Failed to remove customer");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
        <p className="mt-4 text-slate-500 font-medium">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 1. KPI Cards (4 Columns: Total Customers, Gold Members, VIP Customers, Total Orders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          let activeClasses = "border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-slate-200";
          if (kpi.active) {
            if (kpi.theme === "amber") {
              activeClasses = "border-2 border-amber-500 ring-4 ring-amber-500/15 shadow-lg bg-amber-50/20";
            } else if (kpi.theme === "purple-light") {
              activeClasses = "border-2 border-indigo-500 ring-4 ring-indigo-500/15 shadow-lg bg-indigo-50/20";
            } else if (kpi.theme === "blue") {
              activeClasses = "border-2 border-blue-500 ring-4 ring-blue-500/15 shadow-lg bg-blue-50/20";
            } else {
              activeClasses = "border-2 border-[#7C3AED] ring-4 ring-[#7C3AED]/15 shadow-lg bg-purple-50/20";
            }
          }

          return (
            <div 
              key={kpi.id} 
              onClick={kpi.onClick}
              className={`bg-white rounded-2xl p-5 sm:p-6 relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-4.5 cursor-pointer select-none ${activeClasses}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                <kpi.icon className={`w-7 h-7 ${kpi.iconColor}`} />
              </div>
              <div className="flex flex-col">
                <p className="text-[14px] font-black text-[#0F172A] tracking-tight">{kpi.title}</p>
                <h3 className="text-[30px] font-black text-slate-900 leading-none mt-1.5">{kpi.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Filters Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        
        {/* Search */}
        <div className="relative group w-full xl:w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#7C3AED] transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, phone or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-semibold focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Dropdowns & Actions */}
        <div className="flex items-center flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors font-bold text-slate-700 outline-none">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-[14px]">{activeSegment}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl border-slate-100 p-1.5">
              <DropdownMenuItem onClick={() => setActiveSegment("All Segments")} className="cursor-pointer font-semibold text-[13px] rounded-lg">All Segments</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveSegment("Gold Member")} className="cursor-pointer font-semibold text-[13px] rounded-lg text-amber-600 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-500" /> Gold Member
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveSegment("VIP")} className="cursor-pointer font-semibold text-[13px] rounded-lg text-indigo-600 flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-indigo-500" /> VIP
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveSegment("Regular")} className="cursor-pointer font-semibold text-[13px] rounded-lg">Regular</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors font-bold text-slate-700 outline-none">
              <div className={`w-2 h-2 rounded-full ${activeStatus === "Active" ? "bg-emerald-500" : activeStatus === "Inactive" ? "bg-red-500" : "bg-slate-400"}`}></div>
              <span className="text-[14px]">{activeStatus}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-100 p-1.5">
              <DropdownMenuItem onClick={() => setActiveStatus("All Status")} className="cursor-pointer font-semibold text-[13px] rounded-lg">All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveStatus("Active")} className="cursor-pointer font-semibold text-[13px] rounded-lg text-emerald-600">Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveStatus("Inactive")} className="cursor-pointer font-semibold text-[13px] rounded-lg text-red-600">Inactive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className={`inline-flex items-center justify-center whitespace-nowrap text-sm border rounded-xl h-11 px-4 font-bold transition-all ${sortBy !== "none" ? "bg-purple-50 border-[#7C3AED] text-[#7C3AED]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortBy === "orders" ? "Sorted: Orders" : "Sort Options"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-100 p-1.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">Sort Options</div>
              <DropdownMenuSeparator className="bg-slate-100 my-1" />
              <DropdownMenuItem onClick={() => setSortBy("orders")} className="cursor-pointer font-semibold text-[13px] rounded-lg">Sort by Orders</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("none")} className="cursor-pointer font-semibold text-[13px] rounded-lg text-slate-500">Reset Sort</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-semibold shadow-sm transition-all" />}>
              <Plus className="w-5 h-5 mr-2" />
              Add Customer
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] p-6 bg-white rounded-2xl border-slate-100 shadow-xl overflow-hidden">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-[20px] font-black text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  Add New Customer
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Full Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Membership Tier</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all cursor-pointer"
                  >
                    <option value="Regular">Regular Customer</option>
                    <option value="Gold Member">Gold Member (Loyalty Elite)</option>
                    <option value="VIP">VIP Customer</option>
                  </select>
                </div>

                <DialogFooter className="mt-6 border-t-0 bg-transparent p-0 flex flex-row gap-3 sm:justify-end">
                  <DialogClose render={<Button type="button" variant="outline" className="rounded-xl font-bold h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto m-0" />}>
                    Cancel
                  </DialogClose>
                  <Button type="submit" disabled={isSaving} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-bold shadow-sm w-full sm:w-auto">
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Customer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 3. Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Tier / Membership</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedItems.length > 0 ? (
                displayedItems.map((customer) => (
                  <tr key={customer.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-black shrink-0 ${customer.avatarStyle}`}>
                          {customer.initial}
                        </div>
                        <div>
                          <h3 className="text-[14px] font-bold text-slate-900">{customer.name}</h3>
                          <span className="text-[11px] font-medium text-slate-400">{customer.points || 0} pts</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.isGold ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 shadow-2xs">
                          <Crown className="w-3.5 h-3.5 text-amber-500" /> Gold Member
                        </span>
                      ) : customer.isVip ? (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 shadow-2xs">
                          <Star className="w-3.5 h-3.5 text-indigo-500" /> VIP
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-500 border border-slate-200 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md inline-block">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-[12px] font-medium">{customer.phone || "No phone"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-[12px] font-medium">{customer.email || "No email"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-bold text-slate-900">{customer.totalOrders || customer.orders || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.status === "Active" ? (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[11px] font-black tracking-widest uppercase">Active</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[11px] font-black tracking-widest uppercase">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-slate-100 p-1.5">
                          <DropdownMenuItem onClick={() => toast.info(`Viewing details for ${customer.name}`)} className="cursor-pointer font-medium text-[13px] rounded-lg">View Details</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100 my-1" />
                          <DropdownMenuItem onClick={() => handleDeleteCustomer(customer.id, customer.name)} className="cursor-pointer font-medium text-[13px] rounded-lg text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50">
                            <Trash className="w-3.5 h-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No customers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* View All Button */}
        {filteredItems.length > 5 && (
          <div className="border-t border-slate-100 px-8 py-5 flex justify-center bg-slate-50/50">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="px-6 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 text-[13px] font-bold shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer"
            >
              {showAll ? "View Less" : `View All Customers (${filteredItems.length})`}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAll ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
