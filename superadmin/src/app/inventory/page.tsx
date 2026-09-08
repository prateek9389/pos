"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Search, AlertTriangle, Package, PackageX, TrendingDown, ArrowDownToLine, ArrowUpToLine, MoreHorizontal, Edit, RefreshCw, X, Tag, FileText, Store, ChevronDown, Loader2, Trash, Image as ImageIcon, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, getDocs } from "firebase/firestore";
import { useBranchContext } from "@/context/BranchContext";

interface Branch {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  current: number;
  min: number;
  unit: string;
  image?: string;
  category?: string;
  unitCost?: number;
}

const getShortUnit = (unit: string) => {
  if (!unit) return "";
  const l = unit.toLowerCase();
  if (l === 'liters' || l === 'litres' || l === 'liter' || l === 'litre') return 'L';
  if (l === 'pieces' || l === 'piece') return 'pcs';
  if (l === 'kilograms' || l === 'kilogram') return 'kg';
  if (l === 'grams' || l === 'gram') return 'g';
  if (l === 'milliliters' || l === 'millilitres' || l === 'milliliter' || l === 'millilitre') return 'ml';
  return unit;
};

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const { selectedBranchId, branches } = useBranchContext();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);
  const [viewDetailsItem, setViewDetailsItem] = useState<InventoryItem | null>(null);
  const [filterType, setFilterType] = useState<"all" | "low-stock" | "out-of-stock">("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const f = params.get("filter");
      if (f === "low-stock" || f === "out-of-stock") {
        setFilterType(f as any);
      }
    }
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: "",
    branchId: "",
    branchName: "",
    current: "" as any,
    min: "" as any,
    unit: "kg",
    image: "",
    category: "Dairy",
    unitCost: "" as any,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setFormData(prev => ({ ...prev, image: data.secure_url }));
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {

    // Listen to BOTH inventory and inventoryItems to ensure no data is lost during the migration
    const invQ1 = query(collection(db, "inventory"));
    const invQ2 = query(collection(db, "inventoryItems"));
    
    let items1: InventoryItem[] = [];
    let items2: InventoryItem[] = [];

    const updateCombined = () => {
      const combined = [...items1, ...items2];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      setInventory(unique);
      setLoading(false);
    };

    const processSnapshot = (snapshot: any, isItems1: boolean) => {
      const fetched: InventoryItem[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        fetched.push({ id: doc.id, ...data, name: data.name || data.item || "" } as InventoryItem);
      });
      if (isItems1) items1 = fetched;
      else items2 = fetched;
      updateCombined();
    };

    const unsub1 = onSnapshot(invQ1, (snap) => processSnapshot(snap, true));
    const unsub2 = onSnapshot(invQ2, (snap) => processSnapshot(snap, false));

    return () => { unsub1(); unsub2(); };
  }, []);

  const openDialog = (mode: "add" | "edit", item?: InventoryItem) => {
    setDialogMode(mode);
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        name: "",
        branchId: selectedBranchId === "all" ? "" : selectedBranchId,
        branchName: selectedBranchId === "all" ? "" : (branches.find(b => b.id === selectedBranchId)?.name || ""),
        current: "" as any,
        min: "" as any,
        unit: "kg",
        image: "",
        category: "Dairy",
        unitCost: "" as any,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.branchId || formData.current === undefined) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemData = {
        name: formData.name,
        branchId: formData.branchId,
        branchName: branches.find(b => b.id === formData.branchId)?.name || "",
        current: Number(formData.current),
        min: Number(formData.min) || 0,
        unit: formData.unit || "kg",
        image: formData.image || "",
        category: formData.category || "Dairy",
        unitCost: Number(formData.unitCost) || 0,
        date: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      };

      if (dialogMode === "add") {
        await addDoc(collection(db, "inventory"), itemData);
        toast.success("Item added successfully!");
      } else if (formData.id) {
        await updateDoc(doc(db, "inventory", formData.id), itemData);
        toast.success("Item updated successfully!");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, "inventory", id));
        toast.success("Item deleted");
      } catch (error) {
        toast.error("Failed to delete item");
      }
    }
  };

  const branchInventory = useMemo(() => {
    return inventory.filter(item => {
      if (selectedBranchId === "all" || !selectedBranchId) return true;
      return item.branchId === selectedBranchId || 
             item.branchName === selectedBranchId ||
             item.branchId === (branches.find(b => b.id === selectedBranchId)?.name);
    });
  }, [inventory, selectedBranchId, branches]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    branchInventory.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return ["All Categories", ...Array.from(set)];
  }, [branchInventory]);

  const filteredInventory = useMemo(() => {
    return branchInventory.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        (item.name?.toLowerCase().includes(q) ?? false) ||
        (item.category?.toLowerCase().includes(q) ?? false) ||
        (item.branchName?.toLowerCase().includes(q) ?? false);
      
      const matchesCategory = selectedCategory === "All Categories" || item.category === selectedCategory;

      let matchesFilter = true;
      if (filterType === "low-stock") {
        matchesFilter = item.current > 0 && item.current <= item.min;
      } else if (filterType === "out-of-stock") {
        matchesFilter = item.current === 0;
      }

      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [branchInventory, searchTerm, selectedCategory, filterType]);

  const totalItems = branchInventory.length;
  const lowStock = branchInventory.filter(i => i.current > 0 && i.current <= i.min).length;
  const outOfStock = branchInventory.filter(i => i.current === 0).length;
  const totalValue = branchInventory.reduce((acc, curr) => acc + ((Number(curr.current) || 0) * (Number(curr.unitCost) || 0)), 0);
  const invValue = totalValue.toLocaleString('en-IN'); 

  const getStatus = (current: number, min: number) => {
    if (current === 0) return "Out of Stock";
    if (current <= min) return "Low Stock";
    return "In Stock";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          onClick={() => setFilterType("all")} 
          className={`cursor-pointer select-none rounded-2xl border-[3px] transition-all duration-300 hover:-translate-y-1 active:scale-[0.99] ${
            filterType === 'all' 
              ? 'border-[#A855F7] shadow-[0_8px_30px_rgba(168,85,247,0.15)] bg-purple-50/10' 
              : 'border-transparent hover:border-[#A855F7]/40 shadow-[0_4px_25px_rgb(0,0,0,0.02)]'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Ingredients</p>
              <h3 className="text-2xl font-bold text-foreground">{totalItems}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setFilterType(filterType === "low-stock" ? "all" : "low-stock")} 
          className={`cursor-pointer select-none rounded-2xl border-[3px] border-l-4 border-l-orange-500 transition-all duration-300 hover:-translate-y-1 active:scale-[0.99] ${
            filterType === 'low-stock' 
              ? 'border-orange-500 bg-orange-50/30 shadow-[0_8px_30px_rgba(249,115,22,0.2)]' 
              : 'border-transparent hover:border-orange-300 shadow-[0_4px_25px_rgb(0,0,0,0.02)]'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm font-semibold text-slate-500">Low Stock</p>
                {filterType === 'low-stock' && (
                  <span className="text-[10px] uppercase font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">Active</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-orange-600">{lowStock}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setFilterType(filterType === "out-of-stock" ? "all" : "out-of-stock")} 
          className={`cursor-pointer select-none rounded-2xl border-[3px] border-l-4 border-l-red-500 transition-all duration-300 hover:-translate-y-1 active:scale-[0.99] ${
            filterType === 'out-of-stock' 
              ? 'border-red-500 bg-red-50/30 shadow-[0_8px_30px_rgba(239,68,68,0.2)]' 
              : 'border-transparent hover:border-red-300 shadow-[0_4px_25px_rgb(0,0,0,0.02)]'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm font-semibold text-slate-500">Out of Stock</p>
                {filterType === 'out-of-stock' && (
                  <span className="text-[10px] uppercase font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">Active</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-red-600">{outOfStock}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <PackageX className="w-5 h-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[3px] border-transparent shadow-[0_4px_25px_rgb(0,0,0,0.02)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Inventory Value</p>
              <h3 className="text-2xl font-bold text-foreground">₹{invValue}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {filterType !== "all" && (
        <div className="flex items-center gap-2 bg-purple-50/80 border border-purple-200 px-4 py-2 rounded-xl w-fit">
          <span className="text-[13px] font-bold text-purple-900">
            Filtered by: {filterType === "low-stock" ? "Low Stock Items" : "Out of Stock Items"}
          </span>
          <button 
            onClick={() => setFilterType("all")} 
            className="text-purple-600 hover:text-purple-900 ml-2 text-xs font-black underline cursor-pointer"
          >
            Clear Filter (Show All)
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full mb-8">
        <div className="flex-1 w-full flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:max-w-md group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#A855F7] transition-colors" />
            <Input 
              placeholder="Search inventory items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 h-[52px] bg-white border-slate-100 rounded-full shadow-[0_2px_15px_rgb(0,0,0,0.02)] focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 transition-all text-[15px] font-medium placeholder:text-slate-400"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-[52px] px-6 bg-white border border-slate-100 rounded-full text-[14px] font-bold text-slate-700 shadow-[0_2px_15px_rgb(0,0,0,0.02)] hover:border-slate-300 transition-all min-w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => openDialog("add")} className="h-[52px] rounded-full px-8 bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all w-full sm:w-auto ml-auto font-bold text-[15px] border-0 shrink-0" />}>
            <ArrowUpToLine className="w-5 h-5 mr-2 font-black" /> Update Stock
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="w-full sm:max-w-4xl overflow-y-auto max-h-[90vh] p-0 gap-0 bg-[#F8F9FA] rounded-[2rem] shadow-[rgba(0,0,0,0.15)_0px_10px_40px] outline-none border-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-8 pb-24 shrink-0">
              <DialogClose render={<button className="absolute top-6 right-6 w-8 h-8 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-md flex items-center justify-center z-50 transition-colors" />}>
                <X className="w-4 h-4" />
              </DialogClose>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <DialogHeader className="text-left p-0 space-y-0.5">
                  <DialogTitle className="text-[20px] font-bold text-white tracking-tight">{dialogMode === "add" ? "Update Stock" : "Edit Stock"}</DialogTitle>
                  <DialogDescription className="text-white/80 text-[13px] font-medium leading-relaxed">
                    Add new inventory items or update stock
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
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Item Name <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input 
                      value={formData.name || ""}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Premium Arabica Beans" 
                      className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Category</Label>
                  <div className="relative group">
                    <Select value={formData.category || "Coffee & Beans"} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger className="h-[48px] w-full pl-5 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-600 data-[state=open]:border-[#A855F7]">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                        <SelectItem value="Coffee & Beans" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Coffee & Beans</SelectItem>
                        <SelectItem value="Dairy & Milk" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Dairy & Milk</SelectItem>
                        <SelectItem value="Bakery & Pastry" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Bakery & Pastry</SelectItem>
                        <SelectItem value="Syrups & Flavoring" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Syrups & Flavoring</SelectItem>
                        <SelectItem value="Beverages & Tea" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Beverages & Tea</SelectItem>
                        <SelectItem value="Condiments & Sugar" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Condiments & Sugar</SelectItem>
                        <SelectItem value="Packaging & Disposables" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Packaging & Disposables</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Unit Cost (₹)</Label>
                  <div className="relative group">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input 
                      type="number" 
                      min="0"
                      value={formData.unitCost === undefined ? "" : formData.unitCost}
                      onChange={(e) => setFormData({...formData, unitCost: e.target.value === "" ? "" as any : Number(e.target.value)})}
                      placeholder="100" 
                      className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Branch <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none z-10" />
                    <Select value={formData.branchId || ""} onValueChange={(v) => setFormData({...formData, branchId: v})}>
                      <SelectTrigger className="h-[48px] w-full pl-11 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-600 data-[state=open]:border-[#A855F7] data-[state=open]:ring-1 data-[state=open]:ring-[#A855F7]">
                        <SelectValue placeholder="Select Branch">
                          {formData.branchId ? branches.find(b => b.id === formData.branchId)?.name || formData.branchId : "Select Branch"}
                        </SelectValue>
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
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Quantity <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input 
                      type="number" 
                      min="0"
                      value={formData.current === undefined ? "" : formData.current}
                      onChange={(e) => setFormData({...formData, current: e.target.value === "" ? "" as any : Number(e.target.value)})}
                      placeholder="0" 
                      className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Unit <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Select value={formData.unit || "kg"} onValueChange={(v) => setFormData({...formData, unit: v})}>
                      <SelectTrigger className="h-[48px] w-full pl-5 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-600 data-[state=open]:border-[#A855F7] data-[state=open]:ring-1 data-[state=open]:ring-[#A855F7]">
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                        <SelectItem value="kg" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">kg</SelectItem>
                        <SelectItem value="liters" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">liters</SelectItem>
                        <SelectItem value="pcs" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">pcs</SelectItem>
                        <SelectItem value="boxes" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">boxes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Min Reorder Level</Label>
                  <div className="relative group">
                    <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input 
                      type="number" 
                      min="0"
                      value={formData.min === undefined ? "" : formData.min}
                      onChange={(e) => setFormData({...formData, min: e.target.value === "" ? "" as any : Number(e.target.value)})}
                      placeholder="10" 
                      className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2 mt-4">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Item Image</Label>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-[#A855F7] hover:bg-[#F4EBFF] bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group h-48 relative overflow-hidden"
                  >
                    {formData.image ? (
                      <>
                        <Image src={formData.image} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-full">Change Image</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center shadow-sm transition-colors">
                          <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-[#A855F7] transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-[13px] font-bold text-[#A855F7]">Click to upload <span className="text-slate-500 font-medium">or drag and drop</span></p>
                          <p className="text-[11px] text-slate-400 font-medium mt-1">SVG, PNG, JPG or GIF (max. 2MB)</p>
                        </div>
                      </>
                    )}
                    
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
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
              </div>

              <div className="flex justify-end items-center gap-4 mt-8">
                <DialogClose render={<Button type="button" variant="outline" className="h-[48px] px-8 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="h-[48px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all border-0">
                  {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ArrowUpToLine className="w-5 h-5 mr-1.5" />} 
                  Save Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <PackageX className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No items found</h3>
          <p className="text-slate-500 font-medium">Add stock to manage your inventory.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {filteredInventory.slice(0, viewAll ? undefined : 15).map((inv) => {
            const status = getStatus(inv.current, inv.min);
            return (
              <div 
                key={inv.id} 
                onClick={() => setViewDetailsItem(inv)}
                className="group bg-white rounded-[2rem] border-[3px] border-purple-200 hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col cursor-pointer"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[160px] bg-gradient-to-b from-[#F5ECE5] to-transparent rounded-full -mt-6 opacity-60"></div>
                <div className="absolute top-10 right-6 w-20 h-16 bg-[radial-gradient(#e2e8f0_2px,transparent_2px)] [background-size:10px_10px] opacity-70"></div>

                <div className="relative pt-6 px-6 flex justify-between items-start z-20">
                  <div className="pr-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      {inv.category && (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-[#7C3AED] border border-purple-100">
                          {inv.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[17px] font-black text-slate-900 mb-1 leading-tight line-clamp-2" title={inv.name}>{inv.name}</h3>
                    <p className="text-[12px] font-medium text-slate-500 leading-relaxed truncate" title={`Min. ${inv.min} ${getShortUnit(inv.unit)} • ${inv.branchName}`}>
                      <span className="font-bold text-slate-700">Min. {inv.min} {getShortUnit(inv.unit)}</span> 
                      <span className="mx-1.5 text-slate-300">•</span> 
                      {inv.branchName}
                    </p>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100/80 rounded-xl relative z-10 text-slate-400" />}>
                        <MoreHorizontal className="h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px] rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                        <DropdownMenuItem onClick={() => openDialog("edit", inv)} className="cursor-pointer hover:bg-slate-50 rounded-lg"><Edit className="mr-2 h-4 w-4" /> Edit Item</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(inv.id)} className="cursor-pointer hover:bg-red-50 text-red-600 rounded-lg"><Trash className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="px-6 flex-1 flex flex-col justify-end relative z-20 pt-6 pb-4">
                  <div className="flex items-end justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">Current Stock</span>
                      <span className={`text-[18px] font-black leading-none ${status === 'Low Stock' ? 'text-red-600' : status === 'Out of Stock' ? 'text-amber-600' : 'text-slate-800'}`}>
                        {inv.current} {getShortUnit(inv.unit)}
                      </span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 ${
                      status === 'Low Stock' ? 'bg-red-50 text-red-600' : status === 'Out of Stock' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span className="text-[11px] font-black tracking-wide uppercase">{status}</span>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full mb-4 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        status === 'Low Stock' ? 'bg-red-500' : status === 'Out of Stock' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(status === 'Out of Stock' ? 4 : 0, (inv.current / Math.max(1, inv.min * 2)) * 100))}%` }}
                    ></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Unit: <strong className="text-slate-700 font-semibold">₹{(inv.unitCost || 0).toLocaleString()}/{getShortUnit(inv.unit)}</strong></span>
                    <span className="text-slate-400 font-medium">Val: <strong className="text-[#7C3AED] font-bold">₹{((inv.current || 0) * (inv.unitCost || 0)).toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {filteredInventory.length > 15 && !viewAll && (
            <div className="flex justify-center mt-8">
              <Button onClick={() => setViewAll(true)} className="h-[52px] px-8 rounded-2xl font-bold bg-white text-slate-700 border-2 border-slate-200 hover:border-[#A855F7] hover:text-[#A855F7] shadow-sm hover:shadow-md transition-all">
                View All {filteredInventory.length} Items
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={!!viewDetailsItem} onOpenChange={(open) => !open && setViewDetailsItem(null)}>
        <DialogContent className="max-w-xl bg-[#FAFAFD] p-0 overflow-hidden border-0 shadow-2xl rounded-[2rem]">
          {viewDetailsItem && (
            <>
              <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-10 pb-16 shrink-0">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                
                <div className="relative z-10 flex items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-white border-4 border-white/20 shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
                    {viewDetailsItem.image ? (
                      <img src={viewDetailsItem.image} alt={viewDetailsItem.name} className="w-full h-full object-cover bg-slate-100" />
                    ) : (
                      <Tag className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-[26px] font-black text-white tracking-tight leading-tight mb-2">{viewDetailsItem.name}</DialogTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <DialogDescription className="text-white/90 text-[14px] font-medium flex items-center gap-1.5">
                        <Store className="w-4 h-4" /> {viewDetailsItem.branchName}
                      </DialogDescription>
                      {viewDetailsItem.category && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                          {viewDetailsItem.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl flex items-center gap-2 bg-white/20 border border-white/20 backdrop-blur-md shrink-0">
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">{getStatus(viewDetailsItem.current, viewDetailsItem.min)}</span>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 -mt-8 relative z-20 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Stock</span>
                    <span className={`text-[28px] font-black ${getStatus(viewDetailsItem.current, viewDetailsItem.min) === 'Low Stock' ? 'text-red-500' : getStatus(viewDetailsItem.current, viewDetailsItem.min) === 'Out of Stock' ? 'text-amber-500' : 'text-[#A855F7]'}`}>
                      {viewDetailsItem.current} <span className="text-[14px] text-slate-400">{getShortUnit(viewDetailsItem.unit)}</span>
                    </span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Minimum Alert</span>
                    <span className="text-[28px] font-black text-slate-800">
                      {viewDetailsItem.min} <span className="text-[14px] text-slate-400">{getShortUnit(viewDetailsItem.unit)}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit Cost</span>
                    <span className="text-[24px] font-black text-slate-800">
                      ₹{(viewDetailsItem.unitCost || 0).toLocaleString()} <span className="text-[13px] text-slate-400 font-semibold">/{getShortUnit(viewDetailsItem.unit)}</span>
                    </span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Stock Value</span>
                    <span className="text-[24px] font-black text-[#7C3AED]">
                      ₹{((viewDetailsItem.current || 0) * (viewDetailsItem.unitCost || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#7C3AED]" />
                    <span>Branch: <strong className="text-slate-800 font-bold text-sm">{viewDetailsItem.branchName || branches.find(b => b.id === viewDetailsItem.branchId)?.name || viewDetailsItem.branchId}</strong></span>
                  </div>
                  <Button 
                    onClick={() => {
                      const item = viewDetailsItem;
                      setViewDetailsItem(null);
                      openDialog("edit", item);
                    }}
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl font-bold border-purple-200 text-[#7C3AED] hover:bg-purple-50"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Stock
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
