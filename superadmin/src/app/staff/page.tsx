"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Edit, Trash, Power, User, Mail, Phone, Briefcase, Store, Lock, ShieldCheck, X, Loader2, Eye, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import Image from "next/image";
import { useBranchContext } from "@/context/BranchContext";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  branchId: string;
  password?: string;
  status: "Active" | "Inactive";
}

interface Branch {
  id: string;
  name: string;
  restaurantId: string;
  img?: string;
}

interface Restaurant {
  id: string;
  name: string;
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const { selectedBranchId, branches: contextBranches } = useBranchContext();
  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Staff>>({
    name: "",
    email: "",
    phone: "",
    role: "Manager",
    branchId: "",
    password: "",
    status: "Active",
  });

  // Fetch Data
  useEffect(() => {
    const unsubStaff = onSnapshot(collection(db, "staff"), (snapshot) => {
      setStaffList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
      setIsLoading(false);
    });

    const unsubBranches = onSnapshot(collection(db, "branches"), (snapshot) => {
      setBranches(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, restaurantId: doc.data().restaurantId, img: doc.data().img } as Branch)));
    });

    const unsubRestaurants = onSnapshot(collection(db, "restaurants"), (snapshot) => {
      setRestaurants(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Restaurant)));
    });

    return () => {
      unsubStaff();
      unsubBranches();
      unsubRestaurants();
    };
  }, []);

  // Filter Data
  const filteredStaff = staffList.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All Roles" || staff.role === roleFilter;
    const matchesBranch = selectedBranchId === "all" || staff.branchId === selectedBranchId || staff.branchId === (contextBranches.find(b => b.id === selectedBranchId)?.name);
    return matchesSearch && matchesRole && matchesBranch;
  });

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return "Unknown Branch";
    const restaurant = restaurants.find(r => r.id === branch.restaurantId);
    return restaurant ? `${branch.name} (${restaurant.name})` : branch.name;
  };



  const openDialog = (mode: "add" | "edit" | "view", staff?: Staff) => {
    setDialogMode(mode);
    if (staff) {
      setFormData(staff);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "Manager",
        branchId: selectedBranchId === "all" ? (branches.length > 0 ? branches[0].id : "") : selectedBranchId,
        password: "",
        status: "Active",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role || !formData.branchId) {
      toast.error("Please fill all required fields");
      return;
    }
    
    if (dialogMode === "add" && !formData.password) {
      toast.error("Password is required for new accounts");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedBranch = branches.find(b => b.id === formData.branchId);
      const restaurantId = selectedBranch ? selectedBranch.restaurantId : "";

      const staffData = { ...formData, restaurantId };
      delete staffData.id;

      if (dialogMode === "add") {
        // Create Firebase Auth user using a secondary app instance to avoid logging out superadmin
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        };
        
        let secondaryApp;
        const existingApp = getApps().find(app => app.name === "SecondaryApp");
        if (existingApp) {
          secondaryApp = existingApp;
        } else {
          secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        }
        
        const secondaryAuth = getAuth(secondaryApp);
        await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password || "");
        await signOut(secondaryAuth);
        // Do not deleteApp immediately if using hot-reload, just reuse it as we did above.
        
        await addDoc(collection(db, "staff"), staffData);
        toast.success("Staff account created successfully");
      } else if (dialogMode === "edit" && formData.id) {
        // If they edit the password, we ideally should update Firebase Auth, 
        // but for now we'll just update the Firestore doc as requested.
        await updateDoc(doc(db, "staff", formData.id), staffData);
        toast.success("Staff details updated");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving staff:", error);
      toast.error(error.message || "Failed to save staff data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, "staff", id), {
        status: currentStatus === "Active" ? "Inactive" : "Active"
      });
      toast.success(`Staff account ${currentStatus === "Active" ? "deactivated" : "activated"}`);
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  const deleteStaff = async (id: string) => {
    if (window.confirm("Are you sure you want to completely delete this staff account? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "staff", id));
        toast.success("Staff account deleted");
      } catch (error) {
        console.error("Error deleting staff:", error);
        toast.error("Failed to delete account");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex-1 w-full flex items-center gap-4 flex-wrap">
          <div className="relative w-full sm:max-w-xs group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#A855F7] transition-colors" />
            <Input 
              placeholder="Search staff..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 h-[52px] bg-white border-slate-100 rounded-full shadow-[0_2px_15px_rgb(0,0,0,0.02)] focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 transition-all text-[15px] font-medium placeholder:text-slate-400"
            />
          </div>
          
          <div className="relative">
            <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || "All Roles")}>
              <SelectTrigger className="h-[52px] pl-12 pr-5 bg-white border border-slate-100 rounded-full text-[14.5px] font-bold text-slate-700 shadow-[0_2px_15px_rgb(0,0,0,0.02)] hover:border-slate-300 transition-all min-w-[160px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                <SelectItem value="All Roles" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">All Roles</SelectItem>
                <SelectItem value="Manager" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>


        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => openDialog("add")} className="h-[52px] rounded-full px-8 bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all w-full sm:w-auto font-bold text-[15px] border-0" />}>
            <Plus className="w-5 h-5 mr-2 font-black" /> Add Staff
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="w-full sm:max-w-4xl overflow-y-auto max-h-[90vh] p-0 gap-0 bg-[#F8F9FA] rounded-[2rem] shadow-[rgba(0,0,0,0.15)_0px_10px_40px] outline-none border-0">
            {/* Header Area */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-8 pb-24 shrink-0">
              <DialogClose className="absolute top-6 right-6 w-8 h-8 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-md flex items-center justify-center z-50 transition-colors">
                <X className="w-4 h-4" />
              </DialogClose>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative">
                  <User className="w-6 h-6 text-white" />
                </div>
                <DialogHeader className="text-left p-0 space-y-0.5">
                  <DialogTitle className="text-[20px] font-bold text-white tracking-tight">
                    {dialogMode === "add" ? "Create Staff Account" : dialogMode === "edit" ? "Edit Staff Account" : "View Staff Details"}
                  </DialogTitle>
                  <DialogDescription className="text-white/80 text-[13px] font-medium leading-relaxed">
                    {dialogMode === "view" ? "Review staff profile and assignment details." : "Manage credentials and branch assignment for this staff member."}
                  </DialogDescription>
                </DialogHeader>
              </div>

            </div>

            <form onSubmit={handleSave} className="p-8 pt-4 pb-8">
              <fieldset disabled={dialogMode === "view" || isSubmitting}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                      <Input 
                        id="name" 
                        value={formData.name || ""}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. John Doe" 
                        className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Email <span className="text-red-500">*</span></Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                      <Input 
                        id="email" 
                        type="email" 
                        value={formData.email || ""}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="john@foodiepos.com" 
                        className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Phone</Label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                      <Input 
                        id="phone" 
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+91 98765 43210" 
                        className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Role <span className="text-red-500">*</span></Label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none z-10" />
                      <Select 
                        value={formData.role} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, role: val || "" }))}
                        disabled={dialogMode === "view"}
                      >
                        <SelectTrigger className="h-[48px] w-full pl-11 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-600 data-[state=open]:border-[#A855F7] data-[state=open]:ring-1 data-[state=open]:ring-[#A855F7]">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                          <SelectItem value="Manager" className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Branch <span className="text-red-500">*</span></Label>
                    <div className="relative group">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none z-10" />
                      <Select 
                        value={formData.branchId} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, branchId: val || "" }))}
                        disabled={dialogMode === "view"}
                      >
                        <SelectTrigger className="h-[48px] w-full pl-11 pr-4 bg-white border border-slate-200 focus:ring-1 focus:ring-[#A855F7] focus:border-[#A855F7] rounded-xl transition-all font-medium text-[14px] shadow-sm text-slate-600 data-[state=open]:border-[#A855F7] data-[state=open]:ring-1 data-[state=open]:ring-[#A855F7]">
                          <SelectValue placeholder="Select Branch">
                            {formData.branchId ? getBranchName(formData.branchId) : "Select Branch"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 max-h-[250px]">
                          {branches.map(b => (
                            <SelectItem key={b.id} value={b.id} className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium">
                              {getBranchName(b.id)}
                            </SelectItem>
                          ))}
                          {branches.length === 0 && (
                            <div className="p-2 text-sm text-slate-500 text-center">No branches available</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {dialogMode !== "view" && (
                    <div className="space-y-2">
                      <Label htmlFor="pass" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                        {dialogMode === "add" ? "Temporary Password " : "Change Password "}
                        {dialogMode === "add" && <span className="text-red-500">*</span>}
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                        <Input 
                          id="pass" 
                          type="text" 
                          value={formData.password || ""}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder={dialogMode === "add" ? "Enter temporary password" : "Leave blank to keep current"} 
                          className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                          required={dialogMode === "add"}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-2 md:col-span-2">
                    <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Account Status</Label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="radio" 
                            name="status" 
                            checked={formData.status === "Active"}
                            onChange={() => setFormData({...formData, status: "Active"})}
                            className="peer sr-only" 
                            disabled={dialogMode === "view"}
                          />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">Active</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="radio" 
                            name="status" 
                            checked={formData.status === "Inactive"}
                            onChange={() => setFormData({...formData, status: "Inactive"})}
                            className="peer sr-only" 
                            disabled={dialogMode === "view"}
                          />
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end items-center gap-4 mt-8">
                  <DialogClose render={<Button type="button" variant="outline" className="h-[48px] px-8 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" />}>
                    {dialogMode === "view" ? "Close" : "Cancel"}
                  </DialogClose>
                  {dialogMode !== "view" && (
                    <Button type="submit" disabled={isSubmitting} className="h-[48px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all border-0">
                      {(isSubmitting) ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                      ) : (
                        <><Plus className="w-5 h-5 mr-1.5" /> {dialogMode === "add" ? "Create Account" : "Save Changes"}</>
                      )}
                    </Button>
                  )}
                </div>
              </fieldset>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#A855F7]" />
            <p className="font-medium">Loading staff...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <User className="w-16 h-16 text-slate-200 mb-4" />
            <p className="font-medium text-lg text-slate-500">No staff found</p>
          </div>
        ) : filteredStaff.map((staff) => (
          <div key={staff.id} className="group bg-white rounded-[2rem] border-[3px] border-purple-200 hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col">
            
            <div className="px-6 flex-1 flex flex-col relative z-20 pt-6 pb-2 bg-white">
              <div className="flex justify-between items-start mb-6">
                <div 
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => openDialog("view", staff)}
                >
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-[19px] font-black text-slate-900 leading-tight truncate hover:text-[#A855F7] transition-colors">{staff.name}</h3>
                    <p className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <span className={`font-bold ${
                          staff.role === 'Manager' ? 'text-[#9333EA]' : 
                          staff.role === 'Cashier' ? 'text-blue-700' :
                          staff.role === 'Waiter' ? 'text-orange-700' : 'text-emerald-700'
                        }`}>{staff.role}</span> <span className="text-slate-600">•</span> <span className="truncate text-slate-700">{getBranchName(staff.branchId)}</span>
                    </p>
                  </div>
                </div>

                <div 
                  className="relative z-30 ml-2" 
                  onClick={(e) => e.stopPropagation()} 
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          type="button"
                          className="h-8 w-8 text-slate-800 shrink-0 hover:bg-slate-100 rounded-full cursor-pointer" 
                        />
                      }
                    >
                      <MoreVertical className="w-5 h-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[170px] rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 z-50 bg-white">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          openDialog("edit", staff);
                        }} 
                        className="cursor-pointer hover:bg-purple-50 hover:text-[#A855F7] rounded-lg font-medium py-2 px-2.5 text-[13px] flex items-center"
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          openDialog("view", staff);
                        }} 
                        className="cursor-pointer hover:bg-slate-50 rounded-lg font-medium py-2 px-2.5 text-[13px] flex items-center"
                      >
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-100 my-1" />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(staff.id, staff.status);
                        }} 
                        className="cursor-pointer text-orange-600 hover:bg-orange-50 rounded-lg font-medium py-2 px-2.5 text-[13px] flex items-center"
                      >
                        <Power className="mr-2 h-4 w-4" /> {staff.status === 'Active' ? 'Disable Account' : 'Enable Account'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStaff(staff.id);
                        }} 
                        className="cursor-pointer text-red-600 hover:bg-red-50 rounded-lg font-medium py-2 px-2.5 text-[13px] flex items-center"
                      >
                        <Trash className="mr-2 h-4 w-4" /> Delete Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div 
                className="flex items-end justify-between mb-4 cursor-pointer"
                onClick={() => openDialog("view", staff)}
              >
                <div className="flex flex-col flex-1 min-w-0 pr-4">
                  <span className="text-[10px] font-black text-slate-800 tracking-wider mb-1">EMAIL</span>
                  <span className="text-[13px] font-black text-slate-900 leading-none truncate">{staff.email}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 shrink-0 ${
                  staff.status === 'Active' ? 'bg-[#E6F8EF] text-[#10B981]' : 'bg-[#FEE2E2] text-[#EF4444]'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${staff.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-wider">{staff.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredStaff.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("All Roles");
            }}
            className="h-[48px] px-8 rounded-full font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#A855F7] hover:border-[#A855F7] transition-all shadow-sm"
          >
            View All
          </Button>
        </div>
      )}
    </div>
  );
}
