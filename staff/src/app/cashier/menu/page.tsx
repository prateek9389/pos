"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Search, 
  ListFilter,
  LayoutGrid,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Leaf,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

interface Category {
  id: string;
  name: string;
  image?: string;
  restaurantId?: string;
}

interface MenuItem {
  id: string;
  name: string;
  desc: string;
  category: string;
  price: string;
  isVeg: boolean;
  available: boolean;
  image: string;
  restaurantId?: string;
  branchId?: string;
  active: boolean;
  categoryId?: string;
}

export default function CashierMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [activeStatus, setActiveStatus] = useState("All Status");

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: "",
    desc: "",
    category: "",
    price: "",
    isVeg: false,
    available: true,
    image: "",
    active: true
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem("staffSession");
    if (!sessionStr) return;
    const session = JSON.parse(sessionStr);
    
    // Fetch Categories
    const qCat = session.branchId 
      ? query(collection(db, "menuCategories"), where("branchId", "in", [session.branchId, "global"]))
      : query(collection(db, "menuCategories"));
      
    const unsubCats = onSnapshot(qCat, (snapshot) => {
      const cats: Category[] = [];
      snapshot.forEach(d => cats.push({ id: d.id, ...d.data() } as Category));
      setCategories(cats);
    });

    // Fetch Menu Items
    const qItems = query(collection(db, "menuItems"));
      
    const unsubItems = onSnapshot(qItems, (snapshot) => {
      const itms: MenuItem[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        if (!data.branchId || data.branchId === "global" || data.branchId === session.branchId) {
          itms.push({ id: d.id, ...data } as MenuItem);
        }
      });
      setItems(itms);
      setLoading(false);
    });

    return () => {
      unsubCats();
      unsubItems();
    };
  }, []);

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

  const openDialog = (mode: "add" | "edit", item?: MenuItem) => {
    setDialogMode(mode);
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        name: "",
        desc: "",
        category: categories.length > 0 ? categories[0].name : "",
        price: "",
        isVeg: false,
        available: true,
        image: "",
        active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionStr = localStorage.getItem("staffSession");
      const session = sessionStr ? JSON.parse(sessionStr) : {};
      
      const itemData = {
        name: formData.name,
        desc: formData.desc || "",
        category: formData.category,
        price: Number(formData.price),
        isVeg: formData.isVeg || false,
        available: formData.available ?? true,
        image: formData.image || "",
        active: formData.active ?? true,
        restaurantId: session.restaurantId || "",
        branchId: session.branchId || ""
      };

      if (dialogMode === "add") {
        await addDoc(collection(db, "menuItems"), itemData);
        toast.success("Menu item created!");
      } else if (formData.id) {
        await updateDoc(doc(db, "menuItems", formData.id), itemData);
        toast.success("Menu item updated!");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      try {
        await deleteDoc(doc(db, "menuItems", id));
        toast.success("Item deleted");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete item");
      }
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await updateDoc(doc(db, "menuItems", item.id), {
        available: !item.available
      });
      toast.success(item.available ? "Marked as out of stock" : "Marked as available");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredItems = items.filter(item => {
    const itemCatName = item.category || categories.find(c => c.id === item.categoryId)?.name || "Unknown";
    const matchesCategory = activeCategory === "All Items" || itemCatName === activeCategory;
    const matchesStatus = activeStatus === "All Status" || (activeStatus === "Available" ? item.available : !item.available);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.desc || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-[1500px] mx-auto p-6 lg:px-10 lg:pb-10 lg:pt-4 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Filters & Actions Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 pb-4">
        
        {/* Dropdowns */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="flex items-center gap-2 border border-slate-200 bg-white px-5 py-2.5 rounded-full cursor-pointer hover:bg-slate-50 transition-colors shrink-0" />}>
                <span className="text-[14px] font-bold text-slate-700">{activeCategory === "All Items" ? "All Categories" : activeCategory}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100 p-2 max-h-[300px] overflow-y-auto">
              <DropdownMenuItem onClick={() => setActiveCategory("All Items")} className="cursor-pointer font-medium text-[13px] rounded-lg">All Categories</DropdownMenuItem>
              {categories.map(cat => (
                <DropdownMenuItem key={cat.id} onClick={() => setActiveCategory(cat.name)} className="cursor-pointer font-medium text-[13px] rounded-lg">{cat.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="flex items-center gap-2 border border-slate-200 bg-white px-5 py-2.5 rounded-full cursor-pointer hover:bg-slate-50 transition-colors shrink-0" />}>
                <span className="text-[14px] font-bold text-slate-700">{activeStatus}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100 p-2">
              <DropdownMenuItem onClick={() => setActiveStatus("All Status")} className="cursor-pointer font-medium text-[13px] rounded-lg">All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveStatus("Available")} className="cursor-pointer font-medium text-[13px] rounded-lg">Available</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveStatus("Out of Stock")} className="cursor-pointer font-medium text-[13px] rounded-lg">Out of Stock</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => openDialog("add")} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-semibold shadow-sm transition-all flex items-center justify-center cursor-pointer border-0" />}>
            <Plus className="w-5 h-5 mr-2" />
            Add New Item
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-0 bg-white rounded-2xl border-slate-100 shadow-xl overflow-hidden overflow-y-auto max-h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-[20px] font-black text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  {dialogMode === "add" ? "Add Menu Item" : "Edit Menu Item"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSave} className="space-y-4">
                
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Item Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-slate-200 hover:border-[#7C3AED] hover:bg-slate-50 rounded-xl flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden"
                  >
                    {formData.image ? (
                      <Image src={formData.image} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="text-center flex flex-col items-center">
                        <ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
                        <span className="text-[12px] font-semibold text-slate-500">Click to upload image</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-[#7C3AED] animate-spin" />
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Item Name *</label>
                  <input 
                    type="text" 
                    value={formData.name || ""}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. French Fries"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Category *</label>
                    <Select value={formData.category as any} onValueChange={(val) => setFormData({...formData, category: val})}>
                      <SelectTrigger className="w-full h-[46px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[14px] font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50">
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name} className="font-semibold">{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Price *</label>
                    <input 
                      type="text" 
                      value={formData.price || ""}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      placeholder="e.g. ₹199"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Description</label>
                  <textarea 
                    rows={2}
                    value={formData.desc || ""}
                    onChange={e => setFormData({...formData, desc: e.target.value})}
                    placeholder="Brief description of the item..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400 resize-none"
                  ></textarea>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={formData.isVeg} onCheckedChange={(val) => setFormData({...formData, isVeg: val})} className="data-[state=checked]:bg-emerald-500" />
                    <span className="text-[13px] font-bold text-slate-700">Vegetarian (Veg)</span>
                  </label>
                </div>

                <DialogFooter className="mt-6 border-t border-slate-100 pt-4 flex flex-row gap-3 sm:justify-end">
                  <DialogClose render={<Button type="button" variant="outline" className="h-11 px-6 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto m-0" />}>
                    Cancel
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting || isUploading} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-bold shadow-sm w-full sm:w-auto">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Item
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {loading ? (
          <div className="col-span-full py-16 flex justify-center text-slate-500 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
          </div>
        ) : filteredItems.length > 0 ? filteredItems.map((item) => (
          <div key={item.id} className="bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col group">
            <div className="relative w-full h-52 bg-slate-100 overflow-hidden">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover transition-transform group-hover:scale-105 duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-slate-300" />
                </div>
              )}
              {/* Image Gradient Overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 opacity-60"></div>
              
              {/* Category Badge */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                <span className="text-[11px] font-black text-slate-800 tracking-wide uppercase">{item.category || categories.find(c => c.id === item.categoryId)?.name || "Unknown"}</span>
              </div>
              
              {/* Price Badge */}
              <div className="absolute bottom-4 right-4 bg-[#7C3AED] text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-white/20">
                <span className="text-[14px] font-black">₹{item.price}</span>
              </div>
            </div>
            
            <div className="p-5 sm:p-6 flex flex-col flex-1 relative z-10 bg-white">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-bold text-slate-900 text-[17px] leading-tight line-clamp-2">{item.name}</h4>
                {item.isVeg && (
                  <div className="w-5 h-5 mt-0.5 rounded-md border border-emerald-500 flex items-center justify-center bg-emerald-50 shrink-0" title="Vegetarian">
                    <Leaf className="w-3 h-3 text-emerald-600" />
                  </div>
                )}
              </div>
              
              <p className="text-[13px] font-medium text-slate-500 line-clamp-2 mb-5 flex-1">
                {item.desc || "No description provided."}
              </p>
              
              <div className="pt-4 border-t border-slate-100/80 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={item.available} 
                    onCheckedChange={() => toggleAvailability(item)}
                    className="data-[state=checked]:bg-[#7C3AED] scale-90 origin-left shadow-sm"
                  />
                  <span className={`text-[12px] font-bold ${item.available ? "text-slate-700" : "text-slate-400"}`}>
                    {item.available ? "Available" : "Out of Stock"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button onClick={() => openDialog("edit", item)} variant="ghost" size="icon" className="w-9 h-9 rounded-xl text-slate-500 hover:text-[#7C3AED] hover:bg-purple-50 bg-slate-50 border border-slate-200 transition-colors shadow-sm">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => handleDelete(item.id)} variant="ghost" size="icon" className="w-9 h-9 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 bg-red-50/50 border border-red-100 transition-colors shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-white border border-slate-100 shadow-sm rounded-3xl">
            <LayoutGrid className="w-12 h-12 text-slate-200 mb-4" />
            <span className="font-bold text-[15px] text-slate-600">No items found matching your criteria.</span>
            <span className="text-[13px] mt-1 opacity-70">Try adjusting your category or search filter.</span>
          </div>
        )}
      </div>
    </div>
  );
}
