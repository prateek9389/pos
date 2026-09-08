"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Ticket, 
  Calendar as CalendarIcon, 
  Power, 
  Edit, 
  Trash, 
  X, 
  Tag, 
  Percent, 
  ImagePlus, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import Image from "next/image";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  validUntil: string;
  status: string;
  usage: string;
  color: string;
  image: string;
  applicableProduct?: string;
}

const COLORS = ["bg-purple-600", "bg-blue-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600"];

export default function OffersPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);
  const [viewDetailsItem, setViewDetailsItem] = useState<Coupon | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deactivate" | "expired">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: "",
    type: "Percentage (%)",
    value: 0,
    validUntil: "",
    status: "Active",
    image: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem("staffSession");
    const session = sessionStr ? JSON.parse(sessionStr) : {};
    const q = query(collection(db, "coupons"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Coupon[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.branchId || data.branchId === "global" || data.branchId === session.branchId) {
          items.push({ id: doc.id, ...data } as Coupon);
        }
      });
      setCoupons(items);
      setLoading(false);
    });

    const productsQ = query(collection(db, "menuItems"));
    const unsubProducts = onSnapshot(productsQ, (snapshot) => {
      const prods: any[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() });
      });
      setProducts(prods);
    });

    return () => {
      unsubscribe();
      unsubProducts();
    };
  }, []);

  const isExpired = (coupon: Coupon) => {
    if (coupon.status?.toLowerCase() === "expired") return true;
    if (!coupon.validUntil) return false;
    const expiryDate = new Date(coupon.validUntil);
    if (isNaN(expiryDate.getTime())) return false;
    expiryDate.setHours(23, 59, 59, 999);
    return expiryDate.getTime() < Date.now();
  };

  const isDeactivated = (coupon: Coupon) => {
    const s = coupon.status?.toLowerCase() || "";
    return (s === "inactive" || s === "deactivated" || s === "deactivate") && !isExpired(coupon);
  };

  const isActive = (coupon: Coupon) => {
    const s = coupon.status?.toLowerCase() || "";
    return (s === "active" || !s) && !isExpired(coupon);
  };

  // KPI Calculations
  const totalCount = coupons.length;
  const activeCount = coupons.filter(isActive).length;
  const deactivateCount = coupons.filter(isDeactivated).length;
  const expiredCount = coupons.filter(isExpired).length;

  const kpis = [
    {
      id: "all",
      title: "All",
      value: totalCount,
      icon: Ticket,
      bg: "bg-purple-100",
      iconColor: "text-purple-600",
      theme: "purple",
      active: statusFilter === "all",
      onClick: () => setStatusFilter("all"),
    },
    {
      id: "active",
      title: "Active",
      value: activeCount,
      icon: CheckCircle2,
      bg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      theme: "emerald",
      active: statusFilter === "active",
      onClick: () => setStatusFilter((prev) => (prev === "active" ? "all" : "active")),
    },
    {
      id: "deactivate",
      title: "Deactivate",
      value: deactivateCount,
      icon: Power,
      bg: "bg-orange-100",
      iconColor: "text-orange-500",
      theme: "orange",
      active: statusFilter === "deactivate",
      onClick: () => setStatusFilter((prev) => (prev === "deactivate" ? "all" : "deactivate")),
    },
    {
      id: "expired",
      title: "Expired",
      value: expiredCount,
      icon: Clock,
      bg: "bg-red-100",
      iconColor: "text-red-500",
      theme: "red",
      active: statusFilter === "expired",
      onClick: () => setStatusFilter((prev) => (prev === "expired" ? "all" : "expired")),
    },
  ];

  // Filtering
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      !searchQuery ||
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coupon.applicableProduct || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "active") return isActive(coupon);
    if (statusFilter === "deactivate") return isDeactivated(coupon);
    if (statusFilter === "expired") return isExpired(coupon);

    return true;
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", "restaurant_pos"); 

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dwhee5w49/image/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      setFormData((prev) => ({ ...prev, image: data.secure_url }));
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const openDialog = (mode: "add" | "edit", coupon?: Coupon) => {
    setDialogMode(mode);
    if (coupon) {
      setFormData(coupon);
    } else {
      setFormData({
        code: "",
        type: "Percentage (%)",
        value: 0,
        validUntil: "",
        status: "Active",
        applicableProduct: "All Menu Items",
        image: ""
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.value) {
      toast.error("Code and value are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        code: formData.code.toUpperCase(),
        type: formData.type || "Percentage (%)",
        value: Number(formData.value),
        validUntil: formData.validUntil || "",
        status: formData.status || "Active",
        applicableProduct: formData.applicableProduct || "All Menu Items",
        usage: formData.id ? formData.usage : "0 / Unlimited",
        color: formData.id ? formData.color : COLORS[Math.floor(Math.random() * COLORS.length)],
        image: formData.image || "",
        branchId: "MAIN_BRANCH"
      };

      if (dialogMode === "add") {
        await addDoc(collection(db, "coupons"), data);
        toast.success("Coupon created successfully!");
      } else if (formData.id) {
        await updateDoc(doc(db, "coupons", formData.id), data);
        toast.success("Coupon updated successfully!");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    const newStatus = coupon.status === "Active" ? "Inactive" : "Active";
    try {
      await updateDoc(doc(db, "coupons", coupon.id), { status: newStatus });
      toast.success(`Coupon status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      try {
        await deleteDoc(doc(db, "coupons", id));
        toast.success("Coupon deleted");
      } catch (error) {
        toast.error("Failed to delete coupon");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-10">
      
      {/* 1. Four KPI Cards at the Top (All, Active, Deactivate, Expired) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          let activeClasses = "border-slate-100 shadow-sm hover:border-slate-200";
          if (kpi.active) {
            if (kpi.theme === "emerald") {
              activeClasses = "border-2 border-emerald-500 ring-4 ring-emerald-500/15 shadow-lg bg-emerald-50/20";
            } else if (kpi.theme === "orange") {
              activeClasses = "border-2 border-orange-500 ring-4 ring-orange-500/15 shadow-lg bg-orange-50/20";
            } else if (kpi.theme === "red") {
              activeClasses = "border-2 border-red-500 ring-4 ring-red-500/15 shadow-lg bg-red-50/20";
            } else {
              activeClasses = "border-2 border-[#A855F7] ring-4 ring-[#A855F7]/15 shadow-lg bg-purple-50/20";
            }
          }

          return (
            <div 
              key={kpi.id} 
              onClick={kpi.onClick}
              className={`bg-white rounded-2xl p-5 sm:p-6 relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-4.5 cursor-pointer select-none ${activeClasses}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
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

      {/* 2. Action & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="relative group w-full sm:w-[360px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors" />
          <input 
            type="text" 
            placeholder="Search coupons by code or product..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-semibold focus:outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => openDialog("add")} className="h-[46px] rounded-xl px-6 bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-sm hover:-translate-y-0.5 transition-all w-full sm:w-auto font-bold text-[14px] border-0 flex items-center justify-center" />}>
            <Plus className="w-4 h-4 mr-2 font-black" /> Create Coupon
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="w-full sm:max-w-4xl overflow-y-auto max-h-[90vh] p-0 gap-0 bg-[#F8F9FA] rounded-[2rem] shadow-[rgba(0,0,0,0.15)_0px_10px_40px] outline-none border-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-8 pb-24 shrink-0">
              <DialogClose render={<button className="absolute top-6 right-6 w-8 h-8 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-md flex items-center justify-center z-50 transition-colors" />}>
                <X className="w-4 h-4" />
              </DialogClose>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <DialogHeader className="text-left p-0 space-y-0.5">
                  <DialogTitle className="text-[20px] font-bold text-white tracking-tight">{dialogMode === "add" ? "Create Coupon" : "Edit Coupon"}</DialogTitle>
                  <DialogDescription className="text-white/80 text-[13px] font-medium leading-relaxed">
                    Set up a new discount code or offer
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
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Coupon Code <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input 
                      value={formData.code || ""}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      placeholder="e.g. SUMMER50" 
                      className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-mono font-bold text-[14px] shadow-sm uppercase" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Discount Type <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Select value={formData.type || "Percentage (%)"} onValueChange={(v) => setFormData({...formData, type: v})}>
                      <SelectTrigger className="h-[48px] w-full pl-5 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-600 data-[state=open]:border-[#A855F7] data-[state=open]:ring-1 data-[state=open]:ring-[#A855F7]">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                        <SelectItem value="Percentage (%)" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Percentage (%)</SelectItem>
                        <SelectItem value="Fixed Amount (₹)" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Value <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input 
                      type="number" 
                      min="0"
                      value={formData.value || 0}
                      onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                      placeholder="e.g. 20" 
                      className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Expiry Date</Label>
                  <div className="relative group">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors z-10 pointer-events-none" />
                    <Input 
                      type="date"
                      value={formData.validUntil || ""}
                      onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                      className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm w-full text-slate-600" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Status</Label>
                  <div className="relative group">
                    <Select value={formData.status || "Active"} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger className="h-[48px] w-full pl-5 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-600 data-[state=open]:border-[#A855F7]">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                        <SelectItem value="Active" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium text-emerald-600">Active</SelectItem>
                        <SelectItem value="Inactive" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium text-red-600">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Applicable On</Label>
                  <div className="relative group">
                    <Select value={formData.applicableProduct || "All Menu Items"} onValueChange={(v) => setFormData({...formData, applicableProduct: v})}>
                      <SelectTrigger className="h-[48px] w-full pl-5 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-600 data-[state=open]:border-[#A855F7]">
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 max-h-[250px]">
                        <SelectItem value="All Menu Items" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">All Menu Items</SelectItem>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.name} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">{product.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Coupon Image</Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-8 hover:bg-purple-50 hover:border-[#A855F7] transition-all group cursor-pointer bg-white relative overflow-hidden h-40"
                  >
                    {formData.image ? (
                      <>
                        <Image src={formData.image} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-full">Change Image</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-8 w-8 text-slate-400 group-hover:text-[#A855F7] transition-colors" aria-hidden="true" />
                        <div className="mt-4 flex text-[13px] leading-6 text-slate-600 justify-center">
                          <span className="relative cursor-pointer rounded-md font-semibold text-[#A855F7] hover:text-[#9333EA]">
                            Upload an image
                          </span>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-[#A855F7] animate-spin mb-2" />
                        <span className="text-sm font-medium text-slate-700">Uploading...</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload}
                  />
                </div>

                <div className="space-y-3 pt-2 md:col-span-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Status</Label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="radio" name="coupon-status" value="Active" checked={formData.status === "Active"} onChange={() => setFormData({...formData, status: "Active"})} className="peer sr-only" />
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                      </div>
                      <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">Active</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="radio" name="coupon-status" value="Inactive" checked={formData.status === "Inactive"} onChange={() => setFormData({...formData, status: "Inactive"})} className="peer sr-only" />
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                      </div>
                      <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-4 mt-8">
                <DialogClose render={<Button type="button" variant="outline" className="h-[48px] px-8 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={isSubmitting || isUploading} className="h-[48px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all border-0">
                  {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-1.5" />} 
                  Save Coupon
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 3. Coupons Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <Ticket className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No coupons found</h3>
          <p className="text-slate-500 font-medium">Try adjusting your status filter or search query.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCoupons.slice(0, viewAll ? undefined : 8).map((coupon) => {
              const expired = isExpired(coupon);
              const deactivated = isDeactivated(coupon);
              const active = isActive(coupon);

              let statusBadgeClass = "bg-emerald-500 text-white";
              let displayStatus = "Active";
              if (expired) {
                statusBadgeClass = "bg-red-500 text-white";
                displayStatus = "Expired";
              } else if (deactivated) {
                statusBadgeClass = "bg-orange-500 text-white";
                displayStatus = "Deactivated";
              }

              return (
                <Card 
                  key={coupon.id} 
                  onClick={() => setViewDetailsItem(coupon)}
                  className="rounded-2xl border-[3px] border-transparent hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group cursor-pointer !p-0 !gap-0"
                >
                  <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700 bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white rounded-xl" />}>
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[170px] rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 z-50">
                        <DropdownMenuItem onClick={() => openDialog("edit", coupon)} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium"><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleCouponStatus(coupon)} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium text-orange-600">
                          <Power className="w-4 h-4 mr-2" /> {coupon.status === "Active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100 my-1" />
                        <DropdownMenuItem onClick={() => handleDelete(coupon.id)} className="cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50 rounded-lg font-medium"><Trash className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="w-full h-32 relative overflow-hidden bg-slate-100 shrink-0">
                    {coupon.image ? (
                      <img src={coupon.image} alt={coupon.code} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-50">
                        <Ticket className="w-8 h-8 text-purple-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 left-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${statusBadgeClass}`}>
                        {displayStatus}
                      </span>
                    </div>
                  </div>

                  <CardContent className="pt-5 px-5 pb-5 relative flex flex-col flex-1">
                    <h3 className="text-2xl font-black text-slate-900 mb-1.5 tracking-tight">
                      {coupon.type === "Percentage (%)" ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                    </h3>
                    <div className="inline-block px-3 py-1 bg-purple-50 rounded-md border border-purple-100 border-dashed font-mono font-bold text-purple-700 text-[13px] mb-4 w-fit">
                      {coupon.code}
                    </div>

                    <div className="space-y-1.5 mt-auto pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-slate-500 flex items-center gap-1.5 font-medium"><CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> Valid Until</span>
                        <span className={`font-bold ${expired ? "text-red-500" : "text-slate-700"}`}>{coupon.validUntil || "No expiry"}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-slate-500 flex items-center gap-1.5 font-medium"><TrendingUpIcon className="w-3.5 h-3.5 text-slate-400" /> Usage</span>
                        <span className="font-bold text-slate-700">{coupon.usage}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredCoupons.length > 8 && !viewAll && (
            <div className="flex justify-center mt-8">
              <Button onClick={() => setViewAll(true)} className="h-[52px] px-8 rounded-2xl font-bold bg-white text-slate-700 border-2 border-slate-200 hover:border-[#A855F7] hover:text-[#A855F7] shadow-sm hover:shadow-md transition-all">
                View All {filteredCoupons.length} Offers
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={!!viewDetailsItem} onOpenChange={(open) => !open && setViewDetailsItem(null)}>
        <DialogContent className="max-w-md bg-[#FAFAFD] p-0 overflow-hidden border-0 shadow-2xl rounded-[2rem]">
          {viewDetailsItem && (
            <>
              <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-10 pb-16 shrink-0 text-center flex flex-col items-center">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
                
                <div className="w-24 h-24 rounded-3xl bg-white border-4 border-white/20 shadow-xl overflow-hidden mb-6 flex items-center justify-center relative z-10">
                  {viewDetailsItem.image ? (
                    <img src={viewDetailsItem.image} alt={viewDetailsItem.code} className="w-full h-full object-cover" />
                  ) : (
                    <Ticket className="w-10 h-10 text-[#A855F7]" />
                  )}
                </div>
                
                <h3 className="text-4xl font-black text-white mb-2 relative z-10 tracking-tight">
                  {viewDetailsItem.type === "Percentage (%)" ? `${viewDetailsItem.value}% OFF` : `₹${viewDetailsItem.value} OFF`}
                </h3>
                <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 font-mono font-bold text-white text-lg relative z-10">
                  {viewDetailsItem.code}
                </div>
              </div>

              <div className="px-8 pb-8 -mt-8 relative z-20">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  {viewDetailsItem.applicableProduct && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Tag className="w-4 h-4 text-slate-300" /> Applicable On</span>
                      <span className="text-[15px] font-black text-slate-800">{viewDetailsItem.applicableProduct}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-slate-300" /> Valid Until</span>
                    <span className="text-[15px] font-black text-slate-800">{viewDetailsItem.validUntil || "No expiry"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><TrendingUpIcon className="w-4 h-4 text-slate-300" /> Total Usage</span>
                    <span className="text-[15px] font-black text-slate-800">{viewDetailsItem.usage}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Power className="w-4 h-4 text-slate-300" /> Status</span>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${isExpired(viewDetailsItem) ? "bg-red-50 text-red-600" : isDeactivated(viewDetailsItem) ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {isExpired(viewDetailsItem) ? "Expired" : isDeactivated(viewDetailsItem) ? "Deactivated" : "Active"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MoreHorizontalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
  );
}
function TrendingUpIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  );
}
