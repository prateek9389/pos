"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  ListFilter,
  UserCheck,
  UserMinus,
  Building,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  MoreVertical,
  Phone,
  Mail,
  UserPlus,
  Camera,
  Loader2,
  Eye,
  Power,
  Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Firebase
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";

// --- Interfaces ---
interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  branchId: string;
  restaurantId: string;
  password?: string;
  status: "Active" | "Inactive";
  img?: string;
  createdAt?: string;
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  
  // Session
  const [session, setSession] = useState<any>(null);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Staff>>({
    name: "",
    email: "",
    phone: "",
    role: "Cashier",
    password: "",
    status: "Active",
  });

  useEffect(() => {
    // Get session
    const sessionStr = localStorage.getItem("staffSession");
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        setSession(parsed);
        
        // Fetch staff for this branch
        const q = query(
          collection(db, "staff"), 
          where("branchId", "==", parsed.branchId)
        );
        
        const unsub = onSnapshot(q, (snapshot) => {
          const fetchedStaff = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Staff))
            .filter(s => s.role !== "Manager"); // Exclude managers
          setStaffList(fetchedStaff);
          setIsLoading(false);
        });
        
        return () => unsub();
      } catch (e) {
        console.error("Invalid session");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const openDialog = (mode: "add" | "edit" | "view", staff?: Staff) => {
    setDialogMode(mode);
    if (staff) {
      setFormData(staff);
      setPreviewUrl(staff.img || null);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "Cashier",
        password: "",
        status: "Active",
      });
      setPreviewUrl(null);
    }
    setIsDialogOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      await uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", "restaurant_pos"); // Cloudinary upload preset

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dwhee5w49/image/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      setPreviewUrl(data.secure_url);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      toast.error("Please fill all required fields");
      return;
    }
    if (dialogMode === "add" && (!formData.password || formData.password.length < 6)) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!session) {
      toast.error("Session not found");
      return;
    }

    setIsSubmitting(true);
    try {
      const staffData = { 
        ...formData, 
        img: previewUrl || "",
        branchId: session.branchId || "",
        restaurantId: session.restaurantId || "",
        createdAt: new Date().toISOString()
      };
      delete staffData.id;

      if (dialogMode === "add") {
        // Create Firebase Auth user using a secondary app instance
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
        
        await addDoc(collection(db, "staff"), staffData);
        toast.success("Staff account created successfully");
      } else if (dialogMode === "edit" && formData.id) {
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
      toast.success(`Status updated successfully`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  const deleteStaff = async (id: string) => {
    if (confirm("Are you sure you want to delete this staff member? Note: This will not delete their Firebase Auth credential, only their profile data.")) {
      try {
        await deleteDoc(doc(db, "staff", id));
        toast.success("Staff member deleted");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete staff member");
      }
    }
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All Roles" || s.role === roleFilter;
    const matchesStatus = statusFilter === "All Status" || s.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleStyle = (role: string) => {
    if (role === 'Cashier') return 'bg-purple-50 text-purple-600';
    if (role === 'Waiter') return 'bg-blue-50 text-blue-500';
    if (role === 'Kitchen Staff') return 'bg-orange-50 text-orange-500';
    return 'bg-slate-50 text-slate-600';
  };

  // KPI Calculations
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.status === "Active").length;
  const inactiveStaff = staffList.filter(s => s.status === "Inactive").length;
  const departments = new Set(staffList.map(s => s.role)).size;

  const kpis = [
    { 
      id: "total",
      title: "Total Staff", 
      value: totalStaff, 
      subtitle: "All staff members", 
      icon: Users, 
      theme: "purple",
      iconBg: "bg-purple-100", 
      iconColor: "text-purple-600",
      active: statusFilter === "All Status" && roleFilter === "All Roles",
      onClick: () => {
        setStatusFilter("All Status");
        setRoleFilter("All Roles");
      }
    },
    { 
      id: "active",
      title: "Active Staff", 
      value: activeStaff, 
      subtitle: "Currently working", 
      icon: UserCheck, 
      theme: "emerald",
      iconBg: "bg-emerald-100", 
      iconColor: "text-emerald-600",
      active: statusFilter === "Active",
      onClick: () => {
        if (statusFilter === "Active") {
          setStatusFilter("All Status");
        } else {
          setStatusFilter("Active");
        }
      }
    },
    { 
      id: "inactive",
      title: "Inactive Staff", 
      value: inactiveStaff, 
      subtitle: "Not active", 
      icon: UserMinus, 
      theme: "orange",
      iconBg: "bg-orange-100", 
      iconColor: "text-orange-500",
      active: statusFilter === "Inactive",
      onClick: () => {
        if (statusFilter === "Inactive") {
          setStatusFilter("All Status");
        } else {
          setStatusFilter("Inactive");
        }
      }
    },
    { 
      id: "departments",
      title: "Departments", 
      value: departments, 
      subtitle: "Different departments", 
      icon: Building, 
      theme: "blue",
      iconBg: "bg-blue-100", 
      iconColor: "text-blue-600",
      active: roleFilter !== "All Roles",
      onClick: () => {
        const uniqueRoles = Array.from(new Set(staffList.map(s => s.role))).filter(Boolean);
        const roles = uniqueRoles.length > 0 ? uniqueRoles : ["Cashier", "Waiter", "Kitchen Staff"];
        const currentIndex = roles.indexOf(roleFilter);
        if (currentIndex === -1) {
          setRoleFilter(roles[0]);
        } else if (currentIndex === roles.length - 1) {
          setRoleFilter("All Roles");
        } else {
          setRoleFilter(roles[currentIndex + 1]);
        }
      }
    }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
        <p className="mt-4 text-slate-500 font-medium">Loading staff...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          let activeClasses = "border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-slate-200";
          if (kpi.active) {
            if (kpi.theme === "emerald") {
              activeClasses = "border-2 border-emerald-500 ring-4 ring-emerald-500/15 shadow-lg bg-emerald-50/20";
            } else if (kpi.theme === "orange") {
              activeClasses = "border-2 border-orange-500 ring-4 ring-orange-500/15 shadow-lg bg-orange-50/20";
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
              className={`bg-white rounded-2xl p-6 relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[140px] cursor-pointer select-none ${activeClasses}`}
            >
              <div className="flex items-center gap-4 mb-2 z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                  <kpi.icon className={`w-7 h-7 ${kpi.iconColor}`} />
                </div>
                <div className="flex flex-col">
                  <p className="text-[13px] font-bold text-slate-500">{kpi.title}</p>
                  <h3 className="text-[32px] font-black text-slate-900 leading-none mt-1">{kpi.value}</h3>
                </div>
              </div>
              
              <div className="mt-4 z-10 relative flex items-center text-slate-400">
                <span className="text-[12px] font-semibold">{kpi.subtitle}</span>
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff by name, role or email..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-semibold focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Dropdowns & Filter */}
        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || "All Roles")}>
            <SelectTrigger className="w-[140px] border border-slate-200 bg-white px-4 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors font-bold text-slate-700">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
              <SelectItem value="All Roles" className="font-semibold cursor-pointer rounded-lg hover:bg-slate-50">All Roles</SelectItem>
              <SelectItem value="Cashier" className="font-semibold cursor-pointer rounded-lg hover:bg-slate-50">Cashier</SelectItem>
              <SelectItem value="Waiter" className="font-semibold cursor-pointer rounded-lg hover:bg-slate-50">Waiter</SelectItem>
              <SelectItem value="Kitchen Staff" className="font-semibold cursor-pointer rounded-lg hover:bg-slate-50">Kitchen Staff</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "All Status")}>
            <SelectTrigger className="w-[140px] border border-slate-200 bg-white px-4 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors font-bold text-slate-700">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
              <SelectItem value="All Status" className="font-semibold cursor-pointer rounded-lg hover:bg-slate-50">All Status</SelectItem>
              <SelectItem value="Active" className="font-semibold cursor-pointer rounded-lg hover:bg-slate-50">Active</SelectItem>
              <SelectItem value="Inactive" className="font-semibold cursor-pointer rounded-lg hover:bg-slate-50">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => openDialog("add")} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-semibold shadow-sm transition-all" />}>
                <Plus className="w-5 h-5 mr-2" />
                Add Staff Member
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-6 bg-white rounded-2xl border-slate-100 shadow-xl overflow-hidden">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-[20px] font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center">
                  {dialogMode === "add" ? <UserPlus className="w-5 h-5" /> : dialogMode === "edit" ? <Edit2 className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </div>
                {dialogMode === "add" ? "Add Staff Member" : dialogMode === "edit" ? "Edit Staff Member" : "Staff Details"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSaveStaff}>
              <fieldset disabled={dialogMode === "view" || isSubmitting || isUploading} className="space-y-4">
                
                {/* Image Upload Area */}
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-100 flex items-center justify-center relative">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-10 h-10 text-slate-300" />
                      )}
                    </div>
                    {dialogMode !== "view" && (
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-colors group">
                        <Camera className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>
                  {isUploading && <p className="text-xs text-[#7C3AED] mt-3 font-semibold flex items-center"><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Uploading image...</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Full Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.name || ""}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Role <span className="text-red-500">*</span></label>
                    <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val || "Cashier"})}>
                      <SelectTrigger className="w-full h-[46px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[14px] font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all data-[state=open]:ring-1 data-[state=open]:ring-[#7C3AED]">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                        <SelectItem value="Cashier" className="cursor-pointer hover:bg-slate-50 rounded-lg font-semibold">Cashier</SelectItem>
                        <SelectItem value="Waiter" className="cursor-pointer hover:bg-slate-50 rounded-lg font-semibold">Waiter</SelectItem>
                        <SelectItem value="Kitchen Staff" className="cursor-pointer hover:bg-slate-50 rounded-lg font-semibold">Kitchen Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+91"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Email Address <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    value={formData.email || ""}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                  />
                </div>

                {dialogMode !== "view" && (
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">
                      {dialogMode === "add" ? "Temporary Password" : "Change Password"} 
                      {dialogMode === "add" && <span className="text-red-500">*</span>}
                    </label>
                    <input 
                      type="text" 
                      value={formData.password || ""}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder={dialogMode === "add" ? "Enter temporary password" : "Leave blank to keep current"} 
                      required={dialogMode === "add"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                    />
                  </div>
                )}
                
                <div className="space-y-3 pt-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Account Status</label>
                    <div className="flex items-center gap-6 ml-1">
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
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#7C3AED] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#7C3AED] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-semibold text-slate-700 group-hover:text-[#7C3AED] transition-colors">Active</span>
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
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#7C3AED] transition-colors"></div>
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-[#7C3AED] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                        <span className="text-[14px] font-semibold text-slate-700 group-hover:text-[#7C3AED] transition-colors">Inactive</span>
                      </label>
                    </div>
                  </div>

              </fieldset>
              
              <DialogFooter className="mt-6 border-t-0 bg-transparent p-0 flex flex-row gap-3 sm:justify-end">
                <DialogClose render={<Button type="button" variant="outline" className="rounded-xl font-bold h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto m-0" />}>
                    {dialogMode === "view" ? "Close" : "Cancel"}
                </DialogClose>
                {dialogMode !== "view" && (
                  <Button type="submit" disabled={isSubmitting || isUploading} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-bold shadow-sm w-full sm:w-auto">
                    {(isSubmitting || isUploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {dialogMode === "add" ? "Create Account" : "Save Changes"}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        </div>
      </div>

      {/* 4. Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStaff.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-white rounded-2xl border border-slate-100 shadow-sm">
            No staff members found matching your criteria.
          </div>
        ) : filteredStaff.map((staff) => (
          <div key={staff.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative group">
            
            {/* Top action menu */}
            <div 
              className="absolute top-3 right-3 z-20 opacity-80 hover:opacity-100 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger render={<button type="button" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-600 hover:text-[#7C3AED] hover:bg-white shadow-sm transition-colors cursor-pointer" />}>
                  <MoreVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[170px] rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 z-50 bg-white">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      openDialog("edit", staff);
                    }} 
                    className="cursor-pointer hover:bg-purple-50 hover:text-[#7C3AED] rounded-lg font-medium py-2 px-2.5 text-[13px] flex items-center"
                  >
                    <Edit2 className="mr-2 h-4 w-4" /> Edit Details
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
                    <Power className="mr-2 h-4 w-4" /> {staff.status === 'Active' ? 'Disable' : 'Enable'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStaff(staff.id);
                    }} 
                    className="cursor-pointer text-red-600 hover:bg-red-50 rounded-lg font-medium py-2 px-2.5 text-[13px] flex items-center"
                  >
                    <Trash className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Profile Section */}
            <div className="p-6 pb-5 flex flex-col items-center text-center border-b border-slate-50 relative">
              <Avatar className="w-20 h-20 border-4 border-white shadow-sm mb-3">
                <AvatarImage src={staff.img || undefined} className="object-cover" />
                <AvatarFallback className="bg-purple-100 text-[#7C3AED] font-black text-xl">{staff.name.substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h3 className="font-black text-slate-900 text-[18px]">{staff.name}</h3>
              <span className={`mt-2 inline-block px-3 py-1 rounded-full text-[12px] font-bold ${getRoleStyle(staff.role)}`}>
                {staff.role}
              </span>
            </div>

            {/* Contact Details */}
            <div className="p-5 flex-1 flex flex-col justify-center space-y-3 bg-slate-50/50">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-[13px] font-semibold truncate" title={staff.email}>{staff.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-[13px] font-semibold">{staff.phone || "Not Provided"}</span>
              </div>
            </div>

            {/* Status Footer */}
            <div className="px-5 py-3.5 border-t border-slate-50 bg-white flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
              {staff.status === "Active" ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[11px] font-bold text-emerald-600 tracking-wide">ACTIVE</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  <span className="text-[11px] font-bold text-red-500 tracking-wide">INACTIVE</span>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
