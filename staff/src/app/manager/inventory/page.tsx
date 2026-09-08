"use client";

import { 
  Package, 
  Plus, 
  Search, 
  ListFilter,
  AlertTriangle,
  IndianRupee,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  TrendingUp,
  Loader2,
  MoreHorizontal,
  PackageX,
  Edit,
  Trash,
  Tag,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

interface InventoryItem {
  id: string;
  name: string;
  date?: string;
  category?: string;
  catStyle?: string;
  current: number;
  min: number;
  unit: string;
  status: string;
  unitCost?: number;
  restaurantId?: string;
  branchId?: string;
  branchName?: string;
  image?: string;
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

// Dynamic fallback unit cost estimation
const getEstimatedUnitCost = (data: any): number => {
  if (data.unitCost && Number(data.unitCost) > 0) return Number(data.unitCost);
  if (data.price && Number(data.price) > 0) return Number(data.price);
  if (data.cost && Number(data.cost) > 0) return Number(data.cost);
  
  const name = (data.name || data.item || "").toLowerCase();
  if (name.includes("arabica") || name.includes("beans") || name.includes("coffee")) return 650;
  if (name.includes("espresso")) return 750;
  if (name.includes("matcha")) return 950;
  if (name.includes("tea")) return 450;
  if (name.includes("almond")) return 180;
  if (name.includes("milk")) return 65;
  if (name.includes("croissant")) return 85;
  if (name.includes("muffin")) return 95;
  if (name.includes("sugar")) return 120;
  if (name.includes("cup")) return 150;
  return 120;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [activeStatus, setActiveStatus] = useState("All Status");
  const [sortByValue, setSortByValue] = useState(false);
  const [viewDetailsItem, setViewDetailsItem] = useState<InventoryItem | null>(null);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<any>({
    name: "",
    category: "Coffee & Beans",
    current: "",
    min: "",
    unit: "kg",
    unitCost: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Listen to inventory collections in Firestore
    const qItems1 = query(collection(db, "inventory"));
    const qItems2 = query(collection(db, "inventoryItems"));
    
    let items1: InventoryItem[] = [];
    let items2: InventoryItem[] = [];

    const updateCombined = () => {
      const combined = [...items1, ...items2];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      setItems(unique);
      setLoading(false);
    };

    const processSnapshot = (snapshot: any, isItems1: boolean) => {
      const fetched: InventoryItem[] = [];
      snapshot.forEach((d: any) => {
        const data = d.data();

        let status = "In Stock";
        if (Number(data.current) <= 0) status = "Out of Stock";
        else if (Number(data.current) <= Number(data.min)) status = "Low Stock";

        const unitCost = getEstimatedUnitCost(data);

        fetched.push({ 
          id: d.id, 
          ...data, 
          name: data.name || data.item || "", 
          unitCost,
          status 
        } as InventoryItem);
      });
      
      if (isItems1) items1 = fetched;
      else items2 = fetched;
      
      updateCombined();
    };

    const unsub1 = onSnapshot(qItems1, (snap) => processSnapshot(snap, true));
    const unsub2 = onSnapshot(qItems2, (snap) => processSnapshot(snap, false));

    return () => { 
      unsub1(); 
      unsub2(); 
    };
  }, []);

  const openDialog = (mode: "add" | "edit", item?: InventoryItem) => {
    setDialogMode(mode);
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        name: "",
        category: "Coffee & Beans",
        current: "",
        min: "",
        unit: "kg",
        unitCost: ""
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please provide an ingredient name");
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionStr = typeof window !== "undefined" ? localStorage.getItem("staffSession") : null;
      const session = sessionStr ? JSON.parse(sessionStr) : {};
      
      const payload = {
        name: formData.name,
        category: formData.category || "Coffee & Beans",
        current: Number(formData.current) || 0,
        min: Number(formData.min) || 0,
        unit: formData.unit || "kg",
        unitCost: Number(formData.unitCost) || 0,
        date: formData.date || new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
        restaurantId: session.restaurantId || "",
        branchId: session.branchId || "",
        branchName: session.branchName || session.branch || "Main Branch"
      };

      if (dialogMode === "add") {
        await addDoc(collection(db, "inventory"), payload);
        toast.success("Inventory item added!");
      } else if (formData.id) {
        await updateDoc(doc(db, "inventory", formData.id), payload);
        toast.success("Inventory item updated!");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to save item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      try {
        await deleteDoc(doc(db, "inventory", id));
        toast.success("Item deleted");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete item");
      }
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return ["All Categories", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesCategory = activeCategory === "All Categories" || item.category === activeCategory;
        const matchesStatus = activeStatus === "All Status" || item.status === activeStatus;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
          item.name.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.branchName && item.branchName.toLowerCase().includes(q));
        return matchesCategory && matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortByValue) {
          const valA = (a.current || 0) * (a.unitCost || 0);
          const valB = (b.current || 0) * (b.unitCost || 0);
          return valB - valA;
        }
        return 0;
      });
  }, [items, activeCategory, activeStatus, searchQuery, sortByValue]);

  // Dynamic KPIs
  const totalItems = items.length;
  const lowStock = items.filter(i => i.status === "Low Stock").length;
  const outOfStock = items.filter(i => i.status === "Out of Stock").length;
  const totalValue = items.reduce((acc, curr) => acc + (curr.current * (curr.unitCost || 0)), 0);

  const kpis = [
    { 
      id: "total",
      title: "Total Items", 
      value: totalItems.toString(), 
      trend: "Current count", 
      icon: Package, 
      theme: "purple",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      trendColor: "text-purple-500",
      active: activeStatus === "All Status" && !sortByValue,
      onClick: () => {
        setActiveStatus("All Status");
        setSortByValue(false);
      }
    },
    { 
      id: "low",
      title: "Low Stock Items", 
      value: lowStock.toString(), 
      trend: "Needs attention", 
      icon: AlertTriangle, 
      theme: "orange",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
      trendColor: "text-orange-500",
      active: activeStatus === "Low Stock" && !sortByValue,
      onClick: () => {
        if (activeStatus === "Low Stock" && !sortByValue) {
          setActiveStatus("All Status");
        } else {
          setActiveStatus("Low Stock");
          setSortByValue(false);
        }
      }
    },
    { 
      id: "out",
      title: "Out of Stock", 
      value: outOfStock.toString(), 
      trend: "Urgent restock", 
      icon: AlertTriangle, 
      theme: "red",
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      trendColor: "text-red-500",
      active: activeStatus === "Out of Stock" && !sortByValue,
      onClick: () => {
        if (activeStatus === "Out of Stock" && !sortByValue) {
          setActiveStatus("All Status");
        } else {
          setActiveStatus("Out of Stock");
          setSortByValue(false);
        }
      }
    },
    { 
      id: "value",
      title: "Total Value", 
      value: `₹${totalValue.toLocaleString()}`, 
      trend: "Asset estimate", 
      icon: IndianRupee, 
      theme: "emerald",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      trendColor: "text-emerald-500",
      active: sortByValue,
      onClick: () => {
        setSortByValue(!sortByValue);
      }
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      

      {/* 2. Interactive KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => {
          let activeClasses = "border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]";
          
          if (kpi.active) {
            if (kpi.theme === "orange") {
              activeClasses = "border-2 border-orange-500 ring-4 ring-orange-500/15 shadow-lg bg-orange-50/20";
            } else if (kpi.theme === "red") {
              activeClasses = "border-2 border-red-500 ring-4 ring-red-500/15 shadow-lg bg-red-50/20";
            } else if (kpi.theme === "emerald") {
              activeClasses = "border-2 border-emerald-500 ring-4 ring-emerald-500/15 shadow-lg bg-emerald-50/20";
            } else {
              activeClasses = "border-2 border-[#7C3AED] ring-4 ring-[#7C3AED]/15 shadow-lg bg-purple-50/20";
            }
          }

          return (
            <div 
              key={kpi.id} 
              onClick={kpi.onClick}
              className={`bg-white rounded-2xl p-6 relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer select-none ${activeClasses}`}
            >
              <div className="flex items-start gap-4 mb-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
                <div className="flex flex-col z-10">
                  <p className="text-[13px] font-bold text-slate-500">{kpi.title}</p>
                  <h3 className="text-[32px] font-black text-slate-900 leading-none mt-1">{kpi.value}</h3>
                </div>
              </div>
              
              <div className={`flex items-center justify-between mt-4 z-10 relative ${kpi.trendColor}`}>
                <div className="flex items-center gap-1.5">
                  {kpi.trend.includes("+") && <TrendingUp className="w-3.5 h-3.5" />}
                  <span className="text-[12px] font-bold">{kpi.trend}</span>
                </div>
                {kpi.active && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-white shadow-xs">
                    {kpi.id === "value" ? "Sorted" : "Active"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Filters Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        
        {/* Search */}
        <div className="relative group w-full xl:w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#7C3AED] transition-colors" />
          <input 
            type="text" 
            placeholder="Search ingredients..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-semibold focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3 overflow-x-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors outline-none focus:outline-none shrink-0">
              <span className="text-[14px] font-bold text-slate-700">{activeCategory}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-slate-100 p-2 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <DropdownMenuItem 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)} 
                  className={`cursor-pointer font-medium text-[13px] rounded-lg ${activeCategory === cat ? 'bg-purple-50 text-[#7C3AED] font-bold' : ''}`}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors outline-none focus:outline-none shrink-0">
              <span className="text-[14px] font-bold text-slate-700">{activeStatus}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100 p-2">
              <DropdownMenuItem onClick={() => setActiveStatus("All Status")} className="cursor-pointer font-medium text-[13px] rounded-lg">All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveStatus("In Stock")} className="cursor-pointer font-medium text-[13px] rounded-lg">In Stock</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveStatus("Low Stock")} className="cursor-pointer font-medium text-[13px] rounded-lg">Low Stock</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveStatus("Out of Stock")} className="cursor-pointer font-medium text-[13px] rounded-lg">Out of Stock</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => openDialog("add")} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-semibold shadow-sm transition-all flex items-center justify-center cursor-pointer border-0" />}>
            <Plus className="w-5 h-5 mr-2" />
            Add Item
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-6 bg-white rounded-2xl border-slate-100 shadow-xl overflow-hidden">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-[20px] font-black text-slate-900">
                {dialogMode === "add" ? "Add New Ingredient" : "Edit Ingredient"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Ingredient Name</label>
                <input 
                  type="text" 
                  value={formData.name || ""}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Fresh Whole Milk"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Category</label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                    <SelectTrigger className="w-full h-[46px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[14px] font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50">
                      <SelectItem value="Coffee & Beans" className="font-semibold">Coffee & Beans</SelectItem>
                      <SelectItem value="Dairy & Milk" className="font-semibold">Dairy & Milk</SelectItem>
                      <SelectItem value="Bakery & Pastry" className="font-semibold">Bakery & Pastry</SelectItem>
                      <SelectItem value="Syrups & Flavoring" className="font-semibold">Syrups & Flavoring</SelectItem>
                      <SelectItem value="Beverages & Tea" className="font-semibold">Beverages & Tea</SelectItem>
                      <SelectItem value="Condiments & Sugar" className="font-semibold">Condiments & Sugar</SelectItem>
                      <SelectItem value="Packaging & Disposables" className="font-semibold">Packaging & Disposables</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Unit of Measurement</label>
                  <Select value={formData.unit} onValueChange={(val) => setFormData({...formData, unit: val})}>
                    <SelectTrigger className="w-full h-[46px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[14px] font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50">
                      <SelectItem value="kg" className="font-semibold">kg</SelectItem>
                      <SelectItem value="liters" className="font-semibold">liters</SelectItem>
                      <SelectItem value="pcs" className="font-semibold">pcs</SelectItem>
                      <SelectItem value="bottles" className="font-semibold">bottles</SelectItem>
                      <SelectItem value="sleeves" className="font-semibold">sleeves</SelectItem>
                      <SelectItem value="packs" className="font-semibold">packs</SelectItem>
                      <SelectItem value="boxes" className="font-semibold">boxes</SelectItem>
                      <SelectItem value="grams" className="font-semibold">grams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Current Stock</label>
                  <input 
                    type="number" 
                    value={formData.current ?? ""}
                    onChange={e => setFormData({...formData, current: e.target.value})}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Minimum Stock (Alert)</label>
                  <input 
                    type="number" 
                    value={formData.min ?? ""}
                    onChange={e => setFormData({...formData, min: e.target.value})}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Unit Cost (₹)</label>
                  <input 
                    type="number" 
                    value={formData.unitCost ?? ""}
                    onChange={e => setFormData({...formData, unitCost: e.target.value})}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                  />
              </div>

              <DialogFooter className="mt-6 border-t border-slate-100 pt-4 flex flex-row gap-3 sm:justify-end">
                <DialogClose render={<Button type="button" variant="outline" className="h-11 px-6 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto m-0" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-bold shadow-sm w-full sm:w-auto">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {dialogMode === "add" ? "Add Item" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        </div>
      </div>

      {/* 4. Inventory Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
      ) : filteredItems.length === 0 ? (
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
            {filteredItems.map((item) => {
            const status = item.status;
            return (
              <div 
                key={item.id} 
                onClick={() => setViewDetailsItem(item)}
                className="group bg-white rounded-[2rem] border-[3px] border-purple-200 hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col cursor-pointer"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[160px] bg-gradient-to-b from-[#F5ECE5] to-transparent rounded-full -mt-6 opacity-60"></div>
                <div className="absolute top-10 right-6 w-20 h-16 bg-[radial-gradient(#e2e8f0_2px,transparent_2px)] [background-size:10px_10px] opacity-70"></div>

                <div className="relative pt-6 px-6 flex justify-between items-start z-20">
                  <div className="pr-2 flex-1 min-w-0">
                    {item.category && (
                      <span className="inline-block px-2.5 py-0.5 mb-1.5 rounded-full text-[11px] font-bold bg-purple-50 text-[#7C3AED] border border-purple-100">
                        {item.category}
                      </span>
                    )}
                    <h3 className="text-[17px] font-black text-slate-900 mb-1 leading-tight line-clamp-2" title={item.name}>{item.name}</h3>
                    <p className="text-[12px] font-medium text-slate-500 leading-relaxed truncate" title={`Min. ${item.min} ${getShortUnit(item.unit)} • ${item.branchName || "All Branches"}`}>
                      <span className="font-bold text-slate-700">Min. {item.min} {getShortUnit(item.unit)}</span> 
                      <span className="mx-1.5 text-slate-300">•</span> 
                      {item.branchName || "All Branches"}
                    </p>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100/80 rounded-xl relative z-10 text-slate-400" />}>
                        <MoreHorizontal className="h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px] rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                        <DropdownMenuItem onClick={() => openDialog("edit", item)} className="cursor-pointer hover:bg-slate-50 rounded-lg"><Edit className="mr-2 h-4 w-4" /> Edit Item</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="cursor-pointer hover:bg-red-50 text-red-600 rounded-lg"><Trash className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="px-6 flex-1 flex flex-col justify-end relative z-20 pt-6 pb-4">
                  <div className="flex items-end justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">Current Stock</span>
                      <span className={`text-[18px] font-black leading-none ${status === 'Low Stock' || status === 'Out of Stock' ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.current} {getShortUnit(item.unit)}
                      </span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 ${status === 'Low Stock' ? 'bg-red-50 text-red-600' : status === 'Out of Stock' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-600'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span className="text-[11px] font-black tracking-wide uppercase">{status}</span>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full mb-4 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${status === 'Low Stock' ? 'bg-red-500' : status === 'Out of Stock' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, Math.max(status === 'Out of Stock' ? 4 : 0, (Number(item.current) / Math.max(1, Number(item.min) * 2)) * 100))}%` }}
                    ></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Unit: <strong className="text-slate-700 font-semibold">₹{(item.unitCost || 0).toLocaleString()}/{getShortUnit(item.unit)}</strong></span>
                    <span className="text-slate-400 font-medium">Val: <strong className="text-[#7C3AED] font-bold">₹{((item.current || 0) * (item.unitCost || 0)).toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
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
                    <h2 className="text-[26px] font-black text-white tracking-tight leading-tight mb-2">{viewDetailsItem.name}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white/90 text-[14px] font-medium flex items-center gap-1.5">
                        <Store className="w-4 h-4" /> {viewDetailsItem.branchName || "All Branches"}
                      </p>
                      {viewDetailsItem.category && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                          {viewDetailsItem.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl flex items-center gap-2 bg-white/20 border border-white/20 backdrop-blur-md shrink-0">
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">{viewDetailsItem.status}</span>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 -mt-8 relative z-20 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Stock</span>
                    <span className={`text-[28px] font-black ${viewDetailsItem.status === 'Low Stock' ? 'text-red-500' : viewDetailsItem.status === 'Out of Stock' ? 'text-amber-500' : 'text-[#A855F7]'}`}>
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
                    <span>Branch: <strong className="text-slate-800 font-bold text-sm">{viewDetailsItem.branchName || "All Branches"}</strong></span>
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
