"use client";

import { useState, useEffect } from "react";
import { Search, UserCheck, Star, IndianRupee, ArrowRight, MoreHorizontal, Edit, Trash, Activity, Plus, X, User, Phone, Mail, Loader2 } from "lucide-react";
import { useBranchContext } from "@/context/BranchContext";
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
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, getDocs, where } from "firebase/firestore";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  orders: number;
  spending: number;
  points: number;
  branchId?: string;
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);
  const { selectedBranchId } = useBranchContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    status: "Active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewDetailsCustomer, setViewDetailsCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [customerReservations, setCustomerReservations] = useState<any[]>([]);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const fetchCustomerDetails = async (customer: Customer) => {
    setViewDetailsCustomer(customer);
    setIsFetchingDetails(true);
    try {
      const ordersQ = query(collection(db, "orders"), where("customer", "==", customer.name));
      const ordersSnap = await getDocs(ordersQ);
      const ordersData = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomerOrders(ordersData);

      const resQ = query(collection(db, "reservations"), where("customer", "==", customer.name));
      const resSnap = await getDocs(resQ);
      const resData = resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomerReservations(resData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer history");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "customers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Customer[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openDialog = (mode: "add" | "edit", customer?: Customer) => {
    setDialogMode(mode);
    if (customer) {
      setFormData(customer);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        status: "Active",
        branchId: selectedBranchId === "all" ? "global" : selectedBranchId
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Name and phone are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        name: formData.name,
        email: formData.email || "",
        phone: formData.phone,
        status: formData.status || "Active",
        orders: formData.id ? formData.orders : 0,
        spending: formData.id ? formData.spending : 0,
        points: formData.id ? formData.points : 0,
        branchId: formData.branchId || (selectedBranchId === "all" ? "global" : selectedBranchId),
      };

      if (dialogMode === "add") {
        await addDoc(collection(db, "customers"), data);
        toast.success("Customer added successfully!");
      } else if (formData.id) {
        await updateDoc(doc(db, "customers", formData.id), data);
        toast.success("Customer updated successfully!");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this customer?")) {
      try {
        await deleteDoc(doc(db, "customers", id));
        toast.success("Customer removed");
      } catch (error) {
        toast.error("Failed to remove customer");
      }
    }
  };

  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = 
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "All Status" || cust.status === statusFilter;
    const matchesBranch = selectedBranchId === "all" || cust.branchId === selectedBranchId || cust.branchId === "global" || !cust.branchId;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const totalCustomers = customers.length;
  const vipMembers = customers.filter(c => c.status === "VIP").length;
  const avgSpending = totalCustomers > 0 
    ? (customers.reduce((acc, curr) => acc + (curr.spending || 0), 0) / totalCustomers)
    : 0;

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-[3px] border-transparent hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Customers</p>
              <h3 className="text-2xl font-bold text-foreground">{totalCustomers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[3px] border-transparent hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">VIP Members</p>
              <h3 className="text-2xl font-bold text-foreground">{vipMembers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[3px] border-transparent hover:border-[#A855F7] shadow-[0_4px_25px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Avg. Spending</p>
              <h3 className="text-2xl font-bold text-foreground">₹{avgSpending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full mb-8">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#A855F7] transition-colors" />
          <Input 
            placeholder="Search by name, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-14 h-[52px] bg-white border-slate-100 rounded-full shadow-[0_2px_15px_rgb(0,0,0,0.02)] focus-visible:ring-4 focus-visible:ring-purple-500/10 focus-visible:border-purple-300 transition-all text-[15px] font-medium placeholder:text-slate-400"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => openDialog("add")} className="h-[52px] rounded-full px-8 bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all w-full sm:w-auto ml-auto font-bold text-[15px] border-0" />}>
            <Plus className="w-5 h-5 mr-2 font-black" /> Add Customer
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="w-full sm:max-w-4xl overflow-y-auto max-h-[90vh] p-0 gap-0 bg-[#F8F9FA] rounded-[2rem] shadow-[rgba(0,0,0,0.15)_0px_10px_40px] outline-none border-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-8 pb-24 shrink-0">
              <DialogClose render={<button className="absolute top-6 right-6 w-8 h-8 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-md flex items-center justify-center z-50 transition-colors" />}>
                <X className="w-4 h-4" />
              </DialogClose>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <DialogHeader className="text-left p-0 space-y-0.5">
                  <DialogTitle className="text-[20px] font-bold text-white tracking-tight">{dialogMode === "add" ? "Add Customer" : "Edit Customer"}</DialogTitle>
                  <DialogDescription className="text-white/80 text-[13px] font-medium leading-relaxed">
                    Manually {dialogMode === "add" ? "add a new customer to" : "update customer in"} the database
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
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input 
                      value={formData.name || ""}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Aarav Patel" 
                      className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input 
                      type="email" 
                      value={formData.email || ""}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="e.g. aarav@example.com" 
                      className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Phone Number <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A855F7] transition-colors pointer-events-none" />
                    <Input 
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+91" 
                      className="h-[48px] pl-11 bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#A855F7] focus-visible:border-[#A855F7] focus-visible:text-slate-900 rounded-xl transition-all font-medium text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 md:col-span-2">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Status</Label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="radio" name="cust-status" value="Active" checked={formData.status === "Active"} onChange={() => setFormData({...formData, status: "Active"})} className="peer sr-only" />
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                      </div>
                      <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">Active</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="radio" name="cust-status" value="VIP" checked={formData.status === "VIP"} onChange={() => setFormData({...formData, status: "VIP"})} className="peer sr-only" />
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#A855F7] transition-colors"></div>
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-[#A855F7] scale-0 peer-checked:scale-100 transition-transform"></div>
                      </div>
                      <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#A855F7] transition-colors">VIP</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="radio" name="cust-status" value="Inactive" checked={formData.status === "Inactive"} onChange={() => setFormData({...formData, status: "Inactive"})} className="peer sr-only" />
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
                <Button type="submit" disabled={isSubmitting} className="h-[48px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all border-0">
                  {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-1.5" />} 
                  Save Customer
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
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <UserCheck className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No customers found</h3>
          <p className="text-slate-500 font-medium">Add customers to see them here.</p>
        </div>
      ) : (
        <div className="space-y-0 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Orders & Points</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.slice(0, viewAll ? undefined : 5).map((cust) => (
                  <tr 
                    key={cust.id} 
                    onClick={() => fetchCustomerDetails(cust)}
                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[14px] font-black shrink-0 bg-purple-100 text-purple-600">
                          {cust.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <h3 className="text-[14px] font-bold text-slate-900 truncate max-w-[150px]">{cust.name}</h3>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-[12px] font-medium">{cust.phone || "No phone"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-[12px] font-medium truncate max-w-[120px]">{cust.email || "No email"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-bold text-slate-900">{cust.orders || 0} Orders</div>
                      <div className="text-[12px] font-medium text-slate-500 mt-0.5">{cust.points || 0} Pts</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-bold text-slate-900">₹{(cust.spending || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-black tracking-widest uppercase ${cust.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {cust.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none">
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px] rounded-xl shadow-lg border-slate-100 p-2">
                          <DropdownMenuItem onClick={() => openDialog("edit", cust)} className="cursor-pointer font-medium text-[13px] rounded-lg hover:bg-slate-50">
                            <Edit className="mr-2 h-4 w-4 text-slate-400" /> Edit Details
                          </DropdownMenuItem>
                          <div className="h-px bg-slate-100 my-1 mx-1"></div>
                          <DropdownMenuItem onClick={() => handleDelete(cust.id)} className="cursor-pointer font-medium text-[13px] rounded-lg text-red-500 focus:text-red-600 focus:bg-red-50">
                            <Trash className="mr-2 h-4 w-4" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length > 5 && (
            <div className="border-t border-slate-100 px-8 py-5 flex justify-center bg-slate-50/50">
              <button 
                onClick={() => setViewAll(!viewAll)}
                className="px-6 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 text-[13px] font-bold shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2"
              >
                {viewAll ? "View Less" : `View All Customers (${filteredCustomers.length})`}
                <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${viewAll ? '-rotate-90' : 'rotate-90'}`} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Customer Details Modal */}
      <Dialog open={!!viewDetailsCustomer} onOpenChange={(open) => !open && setViewDetailsCustomer(null)}>
        <DialogContent className="max-w-3xl bg-[#FAFAFD] p-0 overflow-hidden border-0 shadow-2xl rounded-[2rem]">
          {viewDetailsCustomer && (
            <>
              <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-10 pb-16 shrink-0">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                
                <div className="relative z-10 flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-white border-4 border-white/20 shadow-xl overflow-hidden shrink-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${viewDetailsCustomer.name}`} alt={viewDetailsCustomer.name} className="w-full h-full object-cover bg-slate-100" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-[28px] font-black text-white tracking-tight leading-none mb-2">{viewDetailsCustomer.name}</DialogTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <DialogDescription className="text-white/90 text-[14px] font-medium flex items-center gap-1.5">
                        <Phone className="w-4 h-4" /> {viewDetailsCustomer.phone}
                      </DialogDescription>
                      <DialogDescription className="text-white/90 text-[14px] font-medium flex items-center gap-1.5">
                        <Mail className="w-4 h-4" /> {viewDetailsCustomer.email || "No Email"}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-xl flex items-center gap-2 bg-white/20 border border-white/20 backdrop-blur-md`}>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    <span className="text-[12px] font-black text-white uppercase tracking-wider">{viewDetailsCustomer.status}</span>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 -mt-8 relative z-20">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Spent</span>
                    <span className="text-[20px] font-black text-[#A855F7]">₹{(viewDetailsCustomer.spending || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Orders</span>
                    <span className="text-[20px] font-black text-slate-800">{viewDetailsCustomer.orders || 0}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Points</span>
                    <span className="text-[20px] font-black text-[#10B981]">{viewDetailsCustomer.points || 0}</span>
                  </div>
                </div>

                <div className="space-y-6 max-h-[45vh] overflow-y-auto pr-2">
                  {isFetchingDetails ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-8 h-8 animate-spin text-[#A855F7]" />
                    </div>
                  ) : (
                    <>
                      {/* Past Orders */}
                      <div className="space-y-3">
                        <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#A855F7]" /> Recent Orders
                        </h4>
                        
                        {customerOrders.length > 0 ? (
                          <div className="space-y-3">
                            {customerOrders.slice(0, 5).map((order) => (
                              <div key={order.id} className="flex flex-col p-4 bg-white border border-slate-100 rounded-2xl hover:border-purple-100 hover:shadow-sm transition-all">
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800">{order.orderId || "Unknown Order"} • {order.branch}</span>
                                    <span className="text-[12px] text-slate-500 font-medium mt-0.5">{order.time} • {order.type}</span>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="font-black text-slate-800">₹{(order.amount || order.totalAmount || 0).toLocaleString()}</span>
                                    <span className={`text-[10px] font-bold uppercase mt-0.5 ${order.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{order.status}</span>
                                  </div>
                                </div>
                                {order.items && order.items.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-slate-100 border-dashed space-y-2">
                                    {order.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center text-[13px]">
                                        <span className="font-medium text-slate-600"><span className="text-slate-400 mr-1">{item.quantity}x</span> {item.name}</span>
                                        <span className="font-bold text-slate-700">₹{item.price * item.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-white rounded-2xl border border-slate-100 border-dashed">
                            <p className="text-slate-500 font-medium text-[13px]">No order history found.</p>
                          </div>
                        )}
                      </div>

                      {/* Past Reservations */}
                      <div className="space-y-3">
                        <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <Star className="w-4 h-4 text-[#A855F7]" /> Recent Table Bookings
                        </h4>
                        
                        {customerReservations.length > 0 ? (
                          <div className="space-y-3">
                            {customerReservations.slice(0, 5).map((res) => (
                              <div key={res.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-purple-100 hover:shadow-sm transition-all">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800">Table {res.table} • {res.branch}</span>
                                  <span className="text-[12px] text-slate-500 font-medium mt-0.5">{res.date} at {res.time} • {res.guests} Guests</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase mt-0.5 ${res.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : res.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{res.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-white rounded-2xl border border-slate-100 border-dashed">
                            <p className="text-slate-500 font-medium text-[13px]">No reservation history found.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
