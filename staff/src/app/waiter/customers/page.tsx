"use client";

import { useState, useEffect } from "react";
import { 
  Search, Users, Filter, Plus, UserCircle, Phone, Clock,
  MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown, TrendingUp
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit, addDoc, serverTimestamp } from "firebase/firestore";

import { 
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WaiterCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    const sessionStr = localStorage.getItem("staffSession");
    const session = sessionStr ? JSON.parse(sessionStr) : {};
    
    const q = query(collection(db, "customers"), orderBy("name", "asc"), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resData: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const visits = data.totalOrders || 0;
        const spent = data.totalSpent || 0;
        let status = "Active";
        if (spent > 5000) status = "VIP";
        else if (visits === 0) status = "Inactive";
        
        if (!data.branchId || data.branchId === "global" || data.branchId === session.branchId) {
          resData.push({ 
            id: doc.id, 
            ...data,
            visits,
            spent,
            status,
            customerId: data.customerId || `CUST-${doc.id.substring(0, 4).toUpperCase()}`
          });
        }
      });
      setCustomers(resData);
    });

    return () => unsubscribe();
  }, []);
  
  // Add Customer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredCustomers = customers.filter(c => {
    return (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (c.phone || "").includes(searchQuery);
  });
  
  const displayedCustomers = showAll ? filteredCustomers : filteredCustomers.slice(0, 5);

  const handleAddCustomer = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    
    try {
      const sessionStr = localStorage.getItem("staffSession");
      const session = sessionStr ? JSON.parse(sessionStr) : {};

      await addDoc(collection(db, "customers"), {
        customerId: `CUST-${1000 + customers.length + 1}`,
        name: newName,
        phone: newPhone,
        email: "",
        visits: 0,
        spent: 0,
        totalSpent: 0,
        lastVisit: "Never",
        status: "Active",
        branchId: session.branchId || "global",
        createdAt: serverTimestamp()
      });
      
      toast.success("Customer added successfully!");
      setIsModalOpen(false);
      setNewName("");
      setNewPhone("");
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer. Please try again.");
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 -mx-4 lg:-mx-8 -my-4 lg:-my-8 font-sans">
      
      {/* Actions Area */}
      <div className="px-8 pt-6 pb-2 shrink-0 flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-11 px-5 rounded-full bg-[#5D34F5] text-white flex items-center gap-2 font-black text-[13px] hover:bg-[#4A2ABF] shadow-md shadow-[#5D34F5]/20 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider pl-8">Customer</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider">Total Visits</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider">Last Visit</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-wider text-center pr-8">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedCustomers.map((customer, i) => (
                  <tr key={customer.id || i} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="px-6 py-4 pl-7">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F8F7FF] text-[#5D34F5] flex items-center justify-center">
                          <UserCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-slate-900">{customer.name || "Unknown"}</p>
                          <p className="text-[12px] font-bold text-slate-500">#{customer.customerId || customer.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {customer.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[14px] font-black text-slate-900">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        {customer.visits || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[15px] font-black text-slate-900">₹{(customer.spent || customer.totalSpent || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {customer.lastVisit || "Never"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.status === "VIP" && (
                        <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 text-[11px] font-black tracking-widest uppercase">VIP</span>
                      )}
                      {customer.status === "Active" && (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[11px] font-black tracking-widest uppercase">Active</span>
                      )}
                      {customer.status === "Inactive" && (
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[11px] font-black tracking-widest uppercase">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center pr-8">
                      <button className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F8F7FF] text-[#5D34F5] hover:bg-[#5D34F5] hover:text-white transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {displayedCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* View All Button */}
          {filteredCustomers.length > 5 && (
            <div className="border-t border-slate-200 px-8 py-5 flex justify-center bg-slate-50/50">
              <button 
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 text-[13px] font-bold shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2"
              >
                {showAll ? "View Less" : `View All Customers (${filteredCustomers.length})`}
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Add Customer Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-[32px]">
          <div className="p-8">
            <DialogTitle className="text-2xl font-black text-slate-900 mb-6">Add New Customer</DialogTitle>
            
            <div className="space-y-5">
              <div>
                <label className="text-[13px] font-bold text-slate-500 mb-1 block">Full Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="e.g. Aditi Sharma"
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#5D34F5]/20 focus:border-[#5D34F5]"
                />
              </div>
              <div>
                <label className="text-[13px] font-bold text-slate-500 mb-1 block">Phone Number</label>
                <input 
                  type="tel" 
                  value={newPhone} 
                  onChange={(e) => setNewPhone(e.target.value)} 
                  placeholder="e.g. 98765 43210"
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#5D34F5]/20 focus:border-[#5D34F5]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 font-black rounded-xl border-slate-200">
                Cancel
              </Button>
              <Button onClick={handleAddCustomer} className="flex-1 h-12 font-black rounded-xl bg-[#5D34F5] hover:bg-[#4A2ABF]">
                Add Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
