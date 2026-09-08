"use client";

import { useState, useEffect } from "react";
import { Search, Plus, MapPin, Store, Settings, Power, Phone, Mail, Building, Map, FileText, Clock, Info, ChevronDown, X, Loader2, Camera, Eye, MoreHorizontal, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
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
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INDIAN_STATES = [
  "Andaman and Nicobar Islands (AN)",
  "Andhra Pradesh (AP)",
  "Arunachal Pradesh (AR)",
  "Assam (AS)",
  "Bihar (BR)",
  "Chandigarh (CH)",
  "Chhattisgarh (CG)",
  "Dadra and Nagar Haveli and Daman and Diu (DN)",
  "Delhi (DL)",
  "Goa (GA)",
  "Gujarat (GJ)",
  "Haryana (HR)",
  "Himachal Pradesh (HP)",
  "Jammu and Kashmir (JK)",
  "Jharkhand (JH)",
  "Karnataka (KA)",
  "Kerala (KL)",
  "Ladakh (LA)",
  "Lakshadweep (LD)",
  "Madhya Pradesh (MP)",
  "Maharashtra (MH)",
  "Manipur (MN)",
  "Meghalaya (ML)",
  "Mizoram (MZ)",
  "Nagaland (NL)",
  "Odisha (OR)",
  "Puducherry (PY)",
  "Punjab (PB)",
  "Rajasthan (RJ)",
  "Sikkim (SK)",
  "Tamil Nadu (TN)",
  "Telangana (TG)",
  "Tripura (TR)",
  "Uttar Pradesh (UP)",
  "Uttarakhand (UK)",
  "West Bengal (WB)"
];

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338988a2e8c0?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop"
];

interface Restaurant {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  gst?: string;
  openingTime: string;
  closingTime: string;
  status: "Active" | "Inactive";
  img: string;
  createdAt: any;
}

export default function BranchesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("All Restaurants");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Dialog Mode State
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    restaurantId: "",
    restaurantName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Maharashtra (MH)",
    gst: "",
    openingTime: "09:00",
    closingTime: "23:00",
    status: "Active"
  });

  useEffect(() => {
    const unsubRestaurants = onSnapshot(collection(db, "restaurants"), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Restaurant[];
      setRestaurants(fetched);
    });

    const unsubBranches = onSnapshot(collection(db, "branches"), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Branch[];
      setBranches(fetched);
      setIsLoading(false);
    });

    return () => {
      unsubRestaurants();
      unsubBranches();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleRestaurantSelect = (id: string) => {
    const selected = restaurants.find(r => r.id === id);
    if (selected) {
      setFormData(prev => ({ ...prev, restaurantId: id, restaurantName: selected.name }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const openDialog = (mode: "add" | "edit" | "view", branch?: Branch) => {
    setDialogMode(mode);
    setPreviewUrl("");
    setSelectedFile(null);
    if (branch) {
      setSelectedBranchId(branch.id);
      setFormData({
        name: branch.name,
        restaurantId: branch.restaurantId,
        restaurantName: branch.restaurantName,
        phone: branch.phone,
        email: branch.email,
        address: branch.address,
        city: branch.city,
        state: branch.state,
        gst: branch.gst || "",
        openingTime: branch.openingTime,
        closingTime: branch.closingTime,
        status: branch.status || "Active",
      });
      setPreviewUrl(branch.img);
    } else {
      setSelectedBranchId(null);
      setFormData({
        name: "", restaurantId: "", restaurantName: "", phone: "", email: "", address: "", city: "", state: "Maharashtra (MH)", gst: "", openingTime: "09:00", closingTime: "23:00", status: "Active"
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.restaurantId || !formData.phone || !formData.email || !formData.address || !formData.city) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);
    try {
      let uploadedImageUrl = previewUrl;

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append("file", selectedFile);
        fileData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "restaurant_pos");
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: fileData,
        });
        
        const data = await res.json();
        if (data.secure_url) {
          uploadedImageUrl = data.secure_url;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const finalImg = uploadedImageUrl || DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];

      if (dialogMode === "edit" && selectedBranchId) {
        await updateDoc(doc(db, "branches", selectedBranchId), {
          ...formData,
          img: finalImg,
        });
        toast.success("Branch updated successfully!");
      } else {
        await addDoc(collection(db, "branches"), {
          ...formData,
          img: finalImg,
          createdAt: serverTimestamp()
        });

        // Increment the branches count in the restaurant document
        await updateDoc(doc(db, "restaurants", formData.restaurantId), {
          branches: increment(1)
        });
        
        toast.success("Branch added successfully!");
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${dialogMode} branch.`);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const toggleBranchStatus = async (id: string, currentStatus: "Active" | "Inactive") => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      await updateDoc(doc(db, "branches", id), {
        status: newStatus
      });
      toast.success(`Branch ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status.");
    }
  };

  const filteredBranches = branches.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRestaurant = restaurantFilter === "All Restaurants" || b.restaurantId === restaurantFilter;
    return matchesSearch && matchesRestaurant;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search branches..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200"
            />
          </div>
          <Select value={restaurantFilter} onValueChange={(val) => setRestaurantFilter(val || "All Restaurants")}>
            <SelectTrigger className="h-[52px] px-5 bg-white border border-slate-100 rounded-full text-[14.5px] font-bold text-slate-700 shadow-[0_2px_15px_rgb(0,0,0,0.02)] hover:border-slate-300 transition-all min-w-[160px]">
              <SelectValue placeholder="All Restaurants">
                {restaurantFilter === "All Restaurants" ? "All Restaurants" : restaurants.find(r => r.id === restaurantFilter)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 max-h-[300px]">
              <SelectItem value="All Restaurants" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">All Restaurants</SelectItem>
              {restaurants.map(r => (
                <SelectItem key={r.id} value={r.id} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => openDialog("add")} className="h-[52px] rounded-full px-8 bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all w-full sm:w-auto font-bold text-[15px] border-0">
            <Plus className="w-5 h-5 mr-2 font-black" /> Add Branch
          </Button>
          <DialogContent showCloseButton={false} className="w-full sm:max-w-4xl overflow-y-auto max-h-[90vh] p-0 gap-0 bg-[#F8F9FA] rounded-[2rem] shadow-[rgba(0,0,0,0.15)_0px_10px_40px] outline-none border-0">
            {/* Header Area */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-8 pb-24 shrink-0">
              <DialogClose className="absolute top-6 right-6 w-8 h-8 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-md flex items-center justify-center z-50 transition-colors">
                <X className="w-4 h-4" />
              </DialogClose>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative">
                  <svg className="absolute -top-1 -right-1 w-4 h-4 text-white/80 animate-pulse" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z"/></svg>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <DialogHeader className="text-left p-0 space-y-0.5">
                  <DialogTitle className="text-[20px] font-bold text-white tracking-tight">
                    {dialogMode === "add" ? "Add New Branch" : dialogMode === "edit" ? "Edit Branch" : "Branch Details"}
                  </DialogTitle>
                  <DialogDescription className="text-white/80 text-[13px] font-medium leading-relaxed">
                    {dialogMode === "view" ? "View branch information below" : "Fill in the details to register a new branch location"}
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Wavy bottom edge */}
              <div className="absolute bottom-0 left-0 right-0 translate-y-[1px]">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-[#F8F9FA]">
                  <path d="M0,60 C320,120 420,0 720,20 C1020,40 1120,80 1440,40 L1440,120 L0,120 Z" fill="currentColor"></path>
                </svg>
              </div>
            </div>

            {/* Form Area */}
            <form onSubmit={handleSaveBranch} className="p-8 pt-4 pb-8">
              <fieldset disabled={dialogMode === "view" || isSubmitting || isUploading}>
                <div className="mb-8">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-3 block">Branch Cover Image</Label>
                  <div className="relative w-64 h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden group hover:border-[#A855F7] hover:bg-purple-50/50 transition-all">
                    {previewUrl ? (
                      <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-[#A855F7] transition-colors" />
                        <span className="text-[11px] font-medium text-slate-400 group-hover:text-[#A855F7]">Upload Image (2:1)</span>
                      </div>
                    )}
                    {dialogMode !== "view" && (
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera className="w-8 h-8 text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>
                  {isUploading && <p className="text-sm text-purple-600 mt-2 font-medium flex items-center"><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Uploading...</p>}
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Branch Name <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Connaught Place" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurant" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Select Restaurant <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none z-10" />
                    <Select value={formData.restaurantId} onValueChange={(val) => handleRestaurantSelect(val || "")}>
                      <SelectTrigger id="restaurant" className="h-[48px] w-full pl-11 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-600 data-[state=open]:border-[#A855F7] data-[state=open]:ring-1 data-[state=open]:ring-[#A855F7]">
                        <SelectValue placeholder="Select Restaurant">
                          {formData.restaurantName || undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 max-h-[300px]">
                        {restaurants.map(r => (
                          <SelectItem key={r.id} value={r.id} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Phone Number <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input id="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 98765 43210" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Email Address <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="contact@example.com" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Address <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input id="address" value={formData.address} onChange={handleInputChange} placeholder="123 Main St, Area, Landmark" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">City <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input id="city" value={formData.city} onChange={handleInputChange} placeholder="Mumbai" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">State <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none z-10" />
                    <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value || "" }))}>
                      <SelectTrigger id="state" className="!h-[48px] w-full pl-11 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-900 data-[state=open]:border-[#A855F7] data-[state=open]:ring-1 data-[state=open]:ring-[#A855F7]">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 max-h-[300px]">
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="gst" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">GST Number</Label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input id="gst" value={formData.gst} onChange={handleInputChange} placeholder="e.g. 27AAAAA0000A1Z5" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] uppercase shadow-sm" />
                  </div>
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-1 pl-1">
                    <Info className="w-3.5 h-3.5" /> Enter valid GST number (Optional)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="open" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Opening Time <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors z-10 pointer-events-none" />
                    <Input id="openingTime" type="time" value={formData.openingTime} onChange={handleInputChange} className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm w-full text-slate-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="close" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Closing Time <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors z-10 pointer-events-none" />
                    <Input id="closingTime" type="time" value={formData.closingTime} onChange={handleInputChange} className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm w-full text-slate-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Status <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${formData.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#EF4444]'} z-10 pointer-events-none transition-colors`}></div>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as "Active" | "Inactive" }))}>
                      <SelectTrigger id="status" className="!h-[48px] w-full pl-11 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-900 data-[state=open]:border-[#A855F7] data-[state=open]:ring-1 data-[state=open]:ring-[#A855F7]">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                        <SelectItem value="Active" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Active</SelectItem>
                        <SelectItem value="Inactive" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-4 mt-8">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-[48px] px-8 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                  Cancel
                </Button>
                {dialogMode !== "view" && (
                  <Button type="submit" disabled={isSubmitting || isUploading} className="h-[48px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all border-0">
                    {(isSubmitting || isUploading) ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Plus className="w-5 h-5 mr-1.5" /> Save Branch</>
                    )}
                  </Button>
                )}
              </div>
              </fieldset>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#A855F7]" />
            <p className="font-medium">Loading branches...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <Store className="w-16 h-16 text-slate-200 mb-4" />
            <p className="font-medium text-lg text-slate-500">No branches found</p>
          </div>
        ) : filteredBranches.map((branch) => (
          <Card key={branch.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group pt-0">
            <div className="h-40 w-full relative bg-slate-900 overflow-hidden cursor-pointer" onClick={() => openDialog("view", branch)}>
              <Image src={branch.img || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400"} alt={branch.name} fill className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">{branch.name}</h3>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                    branch.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                  {branch.status}
                </span>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <Store className="w-4 h-4 text-[#A855F7]" />
                  {branch.restaurantName}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-800" />}>
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px] rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                    <DropdownMenuItem onClick={() => openDialog("view", branch)} className="cursor-pointer hover:bg-slate-50 rounded-lg"><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDialog("edit", branch)} className="cursor-pointer hover:bg-slate-50 rounded-lg"><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100 my-1" />
                    <DropdownMenuItem onClick={() => toggleBranchStatus(branch.id, branch.status)} className="cursor-pointer text-red-600 hover:bg-red-50 rounded-lg">
                      {branch.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-[13px] text-slate-800 font-bold">
                  <MapPin className="w-4 h-4 text-slate-600" /> {branch.city}
                </div>
                <div className="flex items-center gap-3 text-[13px] text-slate-800 font-bold">
                  <Phone className="w-4 h-4 text-slate-600" /> {branch.phone}
                </div>
                <div className="flex items-center gap-3 text-[13px] text-slate-800 font-bold">
                  <Mail className="w-4 h-4 text-slate-600" /> {branch.email}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
