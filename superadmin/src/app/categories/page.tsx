"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Plus, X, Image as ImageIcon, Tag, Loader2, MoreVertical, Edit, Trash } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
  DialogFooter,
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
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";

import { useBranchContext } from "@/context/BranchContext";

interface Category {
  id: string;
  name: string;
  description?: string;
  status: string;
  image: string;
  items: number;
  branchId?: string;
}

export default function MenuCategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);
  
  const { selectedBranchId, branches } = useBranchContext();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<Category>>({
    name: "",
    description: "",
    status: "Active",
    image: "",
    branchId: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, "menuCategories"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats: Category[] = [];
      snapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(cats);
      setLoading(false);
    });
    return () => unsubscribe();
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

  const openDialog = (mode: "add" | "edit", category?: Category) => {
    setDialogMode(mode);
    if (category) {
      setFormData(category);
    } else {
      setFormData({
        name: "",
        description: "",
        status: "Active",
        image: "",
        branchId: selectedBranchId === "all" ? "global" : selectedBranchId
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please provide a category name");
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryData = {
        name: formData.name,
        description: formData.description || "",
        status: formData.status || "Active",
        image: formData.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop",
        items: formData.items || 0,
        branchId: formData.branchId || (selectedBranchId === "all" ? "global" : selectedBranchId)
      };

      if (dialogMode === "add") {
        await addDoc(collection(db, "menuCategories"), categoryData);
        toast.success("Category created successfully!");
      } else if (formData.id) {
        await updateDoc(doc(db, "menuCategories", formData.id), categoryData);
        toast.success("Category updated successfully!");
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
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteDoc(doc(db, "menuCategories", id));
        toast.success("Category deleted");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete category");
      }
    }
  };
  
  const filteredCategories = categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranchId === "all" || c.branchId === selectedBranchId || c.branchId === "global" || !c.branchId;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search categories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-white border-slate-200"
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Link href="/menu" className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-white transition-colors" })}>
            View Menu Items
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button onClick={() => openDialog("add")} className="h-[52px] rounded-full px-8 bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all w-full sm:w-auto font-bold text-[15px] border-0" />}>
              <Plus className="w-5 h-5 mr-2 font-black" /> Add Category
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
                    <DialogTitle className="text-[20px] font-bold text-white tracking-tight">{dialogMode === "add" ? "Add New Category" : "Edit Category"}</DialogTitle>
                    <DialogDescription className="text-white/80 text-[13px] font-medium leading-relaxed">
                      {dialogMode === "add" ? "Create a new menu category" : "Update category details"}
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
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Category Name <span className="text-red-500">*</span></Label>
                    <div className="relative group">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                      <Input 
                        id="name" 
                        value={formData.name || ""}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Desserts" 
                        className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Description</Label>
                    <textarea 
                      id="description" 
                      value={formData.description || ""}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="e.g. Gentle and effective cleansers for all skin types." 
                      className="w-full min-h-[80px] p-3 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm resize-y" 
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Status</Label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="status" value="Active" checked={formData.status === "Active"} onChange={() => setFormData({...formData, status: "Active"})} className="peer sr-only" />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">Active</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="status" value="Inactive" checked={formData.status === "Inactive"} onChange={() => setFormData({...formData, status: "Inactive"})} className="peer sr-only" />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">Inactive</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Category Image</Label>
                    
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
                  <Button type="submit" disabled={isSubmitting || isUploading} className="h-[48px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all border-0">
                    {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-1.5" />} 
                    {dialogMode === "add" ? "Create Category" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <Tag className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No categories found</h3>
          <p className="text-slate-500 font-medium">Create your first menu category to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {filteredCategories.slice(0, viewAll ? undefined : 8).map((category) => (
              <Link href={`/menu?category=${category.id}`} key={category.id}>
              <Card className="border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group overflow-hidden cursor-pointer h-full relative flex flex-col bg-white rounded-[24px]">
                <CardContent className="p-0 flex flex-col h-full relative">
                  
                  {/* Top Image Section with subtle beige background */}
                  <div className="p-3 bg-[#F9F8F6] border-b border-slate-100">
                    <div className="w-full aspect-[4/3] sm:aspect-[16/10] relative overflow-hidden rounded-[16px] bg-slate-100">
                      {category.image ? (
                        <Image src={category.image} alt={category.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-slate-300" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Text Section */}
                  <div className="p-5 flex flex-col flex-1 bg-white">
                    <h3 className="text-[20px] sm:text-[22px] text-[#002D5B] font-serif transition-colors truncate mb-1.5">{category.name}</h3>
                    <p className="text-[13px] text-[#15A7A3] mb-4 line-clamp-2 leading-relaxed">
                      {category.description || `Explore our variety of ${category.name.toLowerCase()} for your menu.`}
                    </p>
                    
                    <div className="mt-auto pt-2">
                      {/* Divider */}
                      <div className="w-full h-px bg-slate-200 mb-4"></div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pb-1">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDialog("edit", category); }}
                          className="text-[12px] font-bold tracking-widest text-[#002D5B] hover:text-[#A855F7] uppercase transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(e as any, category.id); }}
                          className="text-[12px] font-bold tracking-widest text-[#F43F5E] hover:text-red-700 uppercase transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  
                </CardContent>
              </Card>
            </Link>
          ))}
          </div>

          {filteredCategories.length > 8 && !viewAll && (
            <div className="flex justify-center mt-8">
              <Button onClick={() => setViewAll(true)} className="h-[52px] px-8 rounded-2xl font-bold bg-white text-slate-700 border-2 border-slate-200 hover:border-[#A855F7] hover:text-[#A855F7] shadow-sm hover:shadow-md transition-all">
                View All {filteredCategories.length} Categories
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
