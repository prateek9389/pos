"use client";

import { useState, useEffect } from "react";
import { Search, Plus, MoreHorizontal, Store, Edit, Trash, Eye, User, Phone, Mail, MapPin, Building, Map, FileText, Clock, Info, ChevronDown, X, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { db } from "@/lib/firebase/config";
import { collection, addDoc, onSnapshot, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

interface Restaurant {
  id: string;
  name: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  gst?: string;
  openingTime: string;
  closingTime: string;
  branches: number;
  status: "Active" | "Inactive";
  img: string;
  createdAt: any;
}

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1546146830-2cca9512c68e?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=500&fit=crop"
];

export const INDIAN_STATES = [
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

export default function RestaurantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Dialog Mode State
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    owner: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Maharashtra (MH)",
    gst: "",
    branches: "0",
    openingTime: "09:00",
    closingTime: "23:00",
    status: "Active"
  });

  useEffect(() => {
    const q = collection(db, "restaurants");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Restaurant[];
      setRestaurants(fetched);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching restaurants:", error);
      toast.error("Failed to fetch restaurants");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const openDialog = (mode: "add" | "edit" | "view", restaurant?: Restaurant) => {
    setDialogMode(mode);
    setPreviewUrl("");
    setSelectedFile(null);
    if (restaurant) {
      setSelectedRestaurantId(restaurant.id);
      setFormData({
        name: restaurant.name,
        owner: restaurant.owner,
        phone: restaurant.phone,
        email: restaurant.email,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        gst: restaurant.gst || "",
        branches: restaurant.branches?.toString() || "0",
        openingTime: restaurant.openingTime,
        closingTime: restaurant.closingTime,
        status: restaurant.status || "Active",
      });
      setPreviewUrl(restaurant.img);
    } else {
      setSelectedRestaurantId(null);
      setFormData({
        name: "", owner: "", phone: "", email: "", address: "", city: "", state: "Maharashtra (MH)", gst: "", branches: "0", openingTime: "09:00", closingTime: "23:00", status: "Active"
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.owner || !formData.phone || !formData.email || !formData.address || !formData.city) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);
    try {
      let uploadedImageUrl = previewUrl;

      // Upload to Cloudinary if new file selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "restaurant_pos");
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData,
        });
        
        const data = await res.json();
        if (data.secure_url) {
          uploadedImageUrl = data.secure_url;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const finalImg = uploadedImageUrl || DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];
      const parsedBranches = parseInt(formData.branches as string) || 0;

      if (dialogMode === "edit" && selectedRestaurantId) {
        await updateDoc(doc(db, "restaurants", selectedRestaurantId), {
          name: formData.name,
          owner: formData.owner,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          gst: formData.gst,
          openingTime: formData.openingTime,
          closingTime: formData.closingTime,
          status: formData.status,
          img: finalImg,
        });
        toast.success("Restaurant updated successfully!");
      } else {
        await addDoc(collection(db, "restaurants"), {
          ...formData,
          branches: 0,
          img: finalImg,
          createdAt: serverTimestamp()
        });
        toast.success("Restaurant added successfully!");
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${dialogMode} restaurant.`);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const toggleRestaurantStatus = async (id: string, currentStatus: "Active" | "Inactive") => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      await updateDoc(doc(db, "restaurants", id), {
        status: newStatus
      });
      toast.success(`Restaurant ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status.");
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex-1 w-full flex items-center gap-4">

          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </div>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "All Status")}>
              <SelectTrigger className="h-[52px] pl-12 pr-5 bg-white border border-slate-100 rounded-full text-[14.5px] font-bold text-slate-700 shadow-[0_2px_15px_rgb(0,0,0,0.02)] hover:border-slate-300 transition-all min-w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                <SelectItem value="All Status" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">All Status</SelectItem>
                <SelectItem value="Active" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Active</SelectItem>
                <SelectItem value="Inactive" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => openDialog("add")} className="h-[52px] rounded-full px-8 bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all w-full sm:w-auto font-bold text-[15px] border-0">
            <Plus className="w-5 h-5 mr-2 font-black" /> Add Restaurant
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
                  <Store className="w-6 h-6 text-white" />
                </div>
                <DialogHeader className="text-left p-0 space-y-0.5">
                  <DialogTitle className="text-[20px] font-bold text-white tracking-tight">
                    {dialogMode === "add" ? "Add New Restaurant" : dialogMode === "edit" ? "Edit Restaurant" : "Restaurant Details"}
                  </DialogTitle>
                  <DialogDescription className="text-white/80 text-[13px] font-medium leading-relaxed">
                    {dialogMode === "view" ? "Viewing details of the restaurant" : "Fill in the details for the restaurant"}
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
            <div className="p-8 pt-4 pb-8">
              <fieldset disabled={dialogMode === "view" || isSubmitting || isUploading} className="space-y-6">
                
                {dialogMode === "view" ? (
                  <div className="space-y-8">
                    {/* Image Area */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-full max-w-[320px] h-48 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center">
                        {previewUrl ? (
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_IMAGES[0];
                            }}
                          />
                        ) : (
                          <Store className="w-12 h-12 text-slate-300" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> Restaurant Name</Label>
                        <p className="text-[15px] font-black text-slate-900">{formData.name}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Owner Name</Label>
                        <p className="text-[15px] font-black text-slate-900">{formData.owner}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</Label>
                        <p className="text-[15px] font-black text-slate-900">{formData.phone}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</Label>
                        <p className="text-[15px] font-black text-slate-900">{formData.email}</p>
                      </div>

                      <div className="space-y-1 md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5" /> Full Address</Label>
                        <p className="text-[14px] font-bold text-slate-700 leading-relaxed">
                          {formData.address},<br/>
                          {formData.city}, {formData.state}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> GST Number</Label>
                        <p className="text-[15px] font-black text-slate-900">{formData.gst || "N/A"}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> Total Branches</Label>
                        <p className="text-[15px] font-black text-slate-900">{formData.branches}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Business Hours</Label>
                        <p className="text-[15px] font-black text-slate-900">{formData.openingTime} - {formData.closingTime}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Current Status</Label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            formData.status === 'Active' ? 'bg-[#E6F8EF] text-[#10B981]' : 'bg-[#FEE2E2] text-[#EF4444]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${formData.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></span>
                            {formData.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Image Upload Area */}
                    <div className="flex flex-col items-center justify-center mb-6">
                      <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-3">Restaurant Image</Label>
                      <div className="relative group w-64 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-10 h-10 text-slate-300" />
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Camera className="w-8 h-8 text-white" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>
                      {isUploading && <p className="text-sm text-purple-600 mt-2 font-medium flex items-center"><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Uploading...</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Restaurant Name <span className="text-red-500">*</span></Label>
                        <div className="relative group">
                          <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                          <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Spice Nation" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owner" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Owner Name <span className="text-red-500">*</span></Label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                          <Input id="owner" value={formData.owner} onChange={handleInputChange} placeholder="e.g. Rahul Sharma" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" />
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

                      <div className="space-y-2">
                        <Label htmlFor="gst" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">GST Number</Label>
                        <div className="relative group">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                          <Input id="gst" value={formData.gst} onChange={handleInputChange} placeholder="e.g. 27AAAAA0000A1Z5" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] uppercase shadow-sm" />
                        </div>
                      </div>



                      <div className="space-y-2">
                        <Label htmlFor="open" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Opening Time <span className="text-red-500">*</span></Label>
                        <div className="relative group">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors z-10 pointer-events-none" />
                          <Input id="openingTime" value={formData.openingTime} onChange={handleInputChange} type="time" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm w-full text-slate-600" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="close" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Closing Time <span className="text-red-500">*</span></Label>
                        <div className="relative group">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors z-10 pointer-events-none" />
                          <Input id="closingTime" value={formData.closingTime} onChange={handleInputChange} type="time" className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm w-full text-slate-600" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Status <span className="text-red-500">*</span></Label>
                        <div className="relative group">
                          <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${formData.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#EF4444]'} z-10 pointer-events-none transition-colors`}></div>
                          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value || "Active" }))}>
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
                  </>
                )}
              </fieldset>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-4 mt-8">
                <DialogClose render={<Button variant="outline" className="h-[48px] px-8 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" />}>
                  {dialogMode === "view" ? "Close" : "Cancel"}
                </DialogClose>
                {dialogMode !== "view" && (
                  <Button disabled={isSubmitting || isUploading} onClick={handleSaveRestaurant} className="h-[48px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all border-0">
                    {(isSubmitting || isUploading) ? <Loader2 className="w-5 h-5 mr-1.5 animate-spin" /> : <Plus className="w-5 h-5 mr-1.5" />} 
                    {(isSubmitting || isUploading) ? "Saving..." : dialogMode === "edit" ? "Update Restaurant" : "Create Restaurant"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#A855F7] mb-4" />
            <p className="font-medium">Loading restaurants...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <Store className="w-12 h-12 text-slate-200 mb-4" />
            <p className="font-medium text-lg text-slate-500">No restaurants found</p>
            <p className="text-sm">Try adjusting your search or add a new restaurant.</p>
          </div>
        ) : filteredRestaurants.map((restaurant) => (
          <div key={restaurant.id} className="group bg-white rounded-[2rem] border-[3px] border-purple-200 hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col">
            
            {/* Full-width Image Header */}
            <div className="relative h-40 w-full bg-slate-100 overflow-hidden shrink-0">
              <img 
                src={restaurant.img || DEFAULT_IMAGES[0]} 
                alt={restaurant.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_IMAGES[0];
                }}
              />
              {/* Action Menu (Top Right) */}
              <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-white/20">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white rounded-xl relative z-10 text-slate-700" />}>
                    <MoreHorizontal className="h-5 w-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px] rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                    <DropdownMenuItem onClick={() => openDialog("view", restaurant)} className="cursor-pointer hover:bg-slate-50 rounded-lg"><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDialog("edit", restaurant)} className="cursor-pointer hover:bg-slate-50 rounded-lg"><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100 my-1" />
                    <DropdownMenuItem onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.status)} className="cursor-pointer text-red-600 hover:bg-red-50 rounded-lg">
                      {restaurant.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="px-6 flex-1 flex flex-col relative z-20 pt-5">
              <h3 className="text-[19px] font-black text-slate-900 mb-1">{restaurant.name}</h3>
              <p className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 mb-8">
                <User className="w-3.5 h-3.5 text-slate-700" /> {restaurant.owner}
              </p>

              <div className="flex items-end justify-between mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-800 tracking-wider mb-1">BRANCHES</span>
                  <span className="text-[18px] font-black text-slate-900 leading-none">{restaurant.branches}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${
                  restaurant.status === 'Active' ? 'bg-[#E6F8EF] text-[#10B981]' : 'bg-[#FEE2E2] text-[#EF4444]'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${restaurant.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-wider">{restaurant.status}</span>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between text-[14px] text-slate-500 bg-transparent mt-8">
        <div className="font-medium text-slate-400 pl-2">Showing <span className="text-slate-800 font-bold">{filteredRestaurants.length}</span> of <span className="text-slate-800 font-bold">{restaurants.length}</span> entries</div>
        <div className="flex gap-2 bg-white p-1 rounded-full shadow-sm border border-slate-100">
          <Button variant="ghost" size="sm" disabled className="rounded-full font-bold h-10 px-5 text-slate-400">Previous</Button>
          <Button variant="outline" size="sm" className="bg-[#6D28D9] text-white border-transparent shadow-[0_4px_10px_rgba(109,40,217,0.3)] rounded-full font-black h-10 w-10">1</Button>
          <Button variant="ghost" size="sm" disabled className="rounded-full font-bold h-10 px-5 text-slate-400">Next</Button>
        </div>
      </div>
    </div>
  );
}
