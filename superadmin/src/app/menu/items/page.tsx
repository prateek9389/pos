"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Plus, X, Image as ImageIcon, Tag, Loader2, ArrowLeft, MoreVertical, Edit, Trash, DollarSign } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, getDoc } from "firebase/firestore";

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  desc: string;
  price: string;
  status: string;
  type: string;
  image: string;
  addedBy?: string;
}

function MenuItemsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category");

  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categoryName, setCategoryName] = useState("Category");
  const [categoryBranchId, setCategoryBranchId] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: "",
    desc: "",
    price: "",
    status: "Available",
    type: "Veg",
    image: ""
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    const fetchCategory = async () => {
      try {
        const catDoc = await getDoc(doc(db, "menuCategories", categoryId));
        if (catDoc.exists()) {
          setCategoryName(catDoc.data().name);
          setCategoryBranchId(catDoc.data().branchId || "global");
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCategory();

    const q = query(collection(db, "menuItems"), where("categoryId", "==", categoryId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems: MenuItem[] = [];
      snapshot.forEach((doc) => {
        fetchedItems.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setItems(fetchedItems);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [categoryId]);

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
        price: "",
        status: "Available",
        type: "Veg",
        image: ""
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Missing category ID");
      return;
    }
    if (!formData.name || !formData.price) {
      toast.error("Name and price are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemData = {
        categoryId,
        name: formData.name,
        desc: formData.desc || "",
        price: formData.price,
        status: formData.status || "Available",
        type: formData.type || "Veg",
        image: formData.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop",
        addedBy: "Manager",
        branchId: categoryBranchId
      };

      if (dialogMode === "add") {
        await addDoc(collection(db, "menuItems"), itemData);
        const catRef = doc(db, "menuCategories", categoryId);
        const catDoc = await getDoc(catRef);
        if (catDoc.exists()) {
          const currentCount = catDoc.data().items || 0;
          await updateDoc(catRef, { items: currentCount + 1 });
        }
        toast.success("Item added successfully!");
      } else if (formData.id) {
        await updateDoc(doc(db, "menuItems", formData.id), itemData);
        toast.success("Item updated successfully!");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, "menuItems", id));
        if (categoryId) {
          const catRef = doc(db, "menuCategories", categoryId);
          const catDoc = await getDoc(catRef);
          if (catDoc.exists()) {
            const currentCount = catDoc.data().items || 0;
            if (currentCount > 0) {
              await updateDoc(catRef, { items: currentCount - 1 });
            }
          }
        }
        toast.success("Item deleted");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete item");
      }
    }
  };

  if (!categoryId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold mb-4">No Category Selected</h2>
        <Button onClick={() => router.push("/menu")}>Go Back to Menu</Button>
      </div>
    );
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button onClick={() => router.push("/menu")} variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">{categoryName} Items</h1>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search items..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-white border-slate-200"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => openDialog("add")} className="h-[52px] rounded-full px-8 bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all w-full sm:w-auto font-bold text-[15px] border-0" />}>
            <Plus className="w-5 h-5 mr-2 font-black" /> Add Item
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="w-full sm:max-w-xl overflow-y-auto max-h-[90vh] p-0 gap-0 bg-[#F8F9FA] rounded-[2rem] shadow-[rgba(0,0,0,0.15)_0px_10px_40px] outline-none border-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-8 pb-24 shrink-0">
              <DialogClose render={<button className="absolute top-6 right-6 w-8 h-8 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-md flex items-center justify-center z-50 transition-colors" />}>
                <X className="w-4 h-4" />
              </DialogClose>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <DialogHeader className="text-left p-0 space-y-0.5">
                  <DialogTitle className="text-[20px] font-bold text-white tracking-tight">{dialogMode === "add" ? "Add New Item" : "Edit Item"}</DialogTitle>
                  <DialogDescription className="text-white/80 text-[13px] font-medium leading-relaxed">
                    {dialogMode === "add" ? "Add a new item to the menu" : "Update item details"}
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
              <div className="grid gap-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Item Name <span className="text-red-500">*</span></Label>
                    <div className="relative group">
                      <Input 
                        value={formData.name || ""}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Margherita" 
                        className="h-[48px] bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Price <span className="text-red-500">*</span></Label>
                    <div className="relative group">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                      <Input 
                        type="number"
                        step="0.01"
                        value={formData.price || ""}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00" 
                        className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Description</Label>
                  <textarea 
                    value={formData.desc || ""}
                    onChange={(e) => setFormData({...formData, desc: e.target.value})}
                    placeholder="Brief description of the item..."
                    className="resize-none w-full p-3 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3 pt-2">
                    <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Type</Label>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="type" value="Veg" checked={formData.type === "Veg"} onChange={() => setFormData({...formData, type: "Veg"})} className="peer sr-only" />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-emerald-500 transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 transition-colors">Veg</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="type" value="Non-Veg" checked={formData.type === "Non-Veg"} onChange={() => setFormData({...formData, type: "Non-Veg"})} className="peer sr-only" />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-red-500 transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-red-500 scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 transition-colors">Non-Veg</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Status</Label>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="status" value="Available" checked={formData.status === "Available"} onChange={() => setFormData({...formData, status: "Available"})} className="peer sr-only" />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 transition-colors">Available</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="status" value="Out of Stock" checked={formData.status === "Out of Stock"} onChange={() => setFormData({...formData, status: "Out of Stock"})} className="peer sr-only" />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 transition-colors">Out of Stock</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Item Image</Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-[#A855F7] hover:bg-[#F4EBFF] bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group h-40 relative overflow-hidden"
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
                <Button type="submit" disabled={isSubmitting || isUploading} className="h-[48px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all border-0">
                  {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-1.5" />} 
                  {dialogMode === "add" ? "Add Item" : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <Tag className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No items found</h3>
          <p className="text-slate-500 font-medium">Add your first menu item to this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group overflow-hidden h-full flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                
                <div className="absolute top-3 right-3 flex gap-2">
                  <div className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm backdrop-blur-md ${item.status === 'Active' ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-slate-700'}`}>
                    {item.status}
                  </div>
                </div>

                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md p-1.5 rounded-lg shadow-sm" onClick={(e) => e.preventDefault()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<button className="w-6 h-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors" />}>
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[160px] rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDialog("edit", item); }} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(e as any, item.id); }} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 hover:bg-red-50 rounded-lg font-medium">
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-3 h-3 rounded-sm ${item.type === 'veg' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <h3 className="font-bold text-lg text-slate-900 leading-tight">{item.name}</h3>
                    </div>
                  </div>
                  <div className="font-black text-lg text-[#A855F7]">₹{item.price}</div>
                </div>
                
                <p className="text-sm text-slate-500 font-medium line-clamp-2 mt-1 mb-4 flex-1">
                  {item.desc || "No description provided."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MenuItemsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="w-10 h-10 animate-spin text-purple-500" /></div>}>
      <MenuItemsContent />
    </Suspense>
  );
}
