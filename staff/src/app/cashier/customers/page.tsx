"use client";

import { 
  Search, Filter, Plus, Users, TrendingUp, 
  ShoppingBag, ShoppingCart, Download, Crown,
  Phone, Mail, BarChart2, MoreVertical,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cashierService, type Customer } from "@/services/cashierService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'C';

const mapCustomerToUI = (cust: Customer) => {
  const ltvNum = cust.totalSpent || 0;
  let ltvStatus = "New Customer";
  let statusColor = "text-slate-500";
  let progressColor = "bg-slate-400";
  let progress = 10;
  
  if (ltvNum > 5000) { ltvStatus = "VIP Customer"; statusColor = "text-[#5D34F5]"; progressColor = "bg-[#5D34F5]"; progress = 100; }
  else if (ltvNum > 2000) { ltvStatus = "High Value"; statusColor = "text-emerald-500"; progressColor = "bg-emerald-500"; progress = 70; }
  else if (ltvNum > 500) { ltvStatus = "Medium Value"; statusColor = "text-orange-500"; progressColor = "bg-orange-400"; progress = 40; }
  
  return {
    ...cust,
    initials: getInitials(cust.name || "Customer"),
    name: cust.name || "Unknown Customer",
    isLoyalty: cust.totalOrders > 5,
    phone: cust.phone || "No phone",
    email: (cust as any).email || "No email",
    orders: cust.totalOrders || 0,
    ltv: `₹${ltvNum.toFixed(2)}`,
    ltvStatus,
    progress,
    progressColor,
    statusColor,
    avatarBg: "bg-[#F8F7FF]",
    avatarText: "text-[#5D34F5]",
    visitDate: cust.lastOrder || "Never",
    visitTime: ""
  };
};

export default function CashierCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All Customers");
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const loadCustomers = async () => {
    setIsLoading(true);
    const data = await cashierService.getCustomers();
    setCustomers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSaveCustomer = async () => {
    if (!newName || !newPhone) {
      toast.error("Name and Phone are required!");
      return;
    }
    await cashierService.addCustomer({ name: newName, phone: newPhone, email: newEmail } as Partial<Customer>);
    toast.success("Customer added successfully!");
    setIsNewCustomerOpen(false);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    loadCustomers(); // Reload list
  };

  const mappedCustomers = customers.map(mapCustomerToUI);

  const filteredCustomers = mappedCustomers.filter(cust => 
    cust.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cust.phone.includes(searchQuery) || 
    cust.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedCustomers = showAll ? filteredCustomers : filteredCustomers.slice(0, 5);

  return (
    <div className="p-8 font-sans pb-32 lg:pb-8 bg-[#F8F9FD] min-h-[calc(100vh-80px)]">
      
      {/* Header Removed */}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex items-center gap-4 transition-all duration-200 hover:border-[#5D34F5] hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#F8F7FF]">
            <Users className="w-7 h-7 text-[#5D34F5]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900 mb-0.5">Total Members</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none">{customers.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex items-center gap-4 transition-all duration-200 hover:border-[#5D34F5] hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50">
            <TrendingUp className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900 mb-0.5">New This Week</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none">{customers.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex items-center gap-4 transition-all duration-200 hover:border-[#5D34F5] hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-orange-50">
            <ShoppingBag className="w-7 h-7 text-orange-500" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900 mb-0.5">Average Lifetime Value</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none">₹{(customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / (customers.length || 1)).toFixed(0)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex items-center gap-4 transition-all duration-200 hover:border-[#5D34F5] hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50">
            <ShoppingCart className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900 mb-0.5">Total Orders</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none">{customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)}</h3>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-[350px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, phone or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] transition-all shadow-sm"
          />
        </div>
        <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
          <DialogTrigger render={<button className="bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl h-11 px-6 font-semibold shadow-sm transition-all shrink-0 flex items-center w-full sm:w-auto justify-center" />}>
              <Plus className="w-5 h-5 mr-2" />
              Add Customer
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900">Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-[13px] font-bold text-slate-700">Full Name</label>
                <input id="name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="E.g. John Doe" className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] transition-all" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-[13px] font-bold text-slate-700">Phone Number</label>
                <input id="phone" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="E.g. 98765 43210" className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] transition-all" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-[13px] font-bold text-slate-700">Email Address (Optional)</label>
                <input id="email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="E.g. john@example.com" className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] transition-all" />
              </div>
            </div>
            <DialogFooter className="mt-2">
              <DialogClose render={<button className="rounded-xl font-bold h-11 px-6 border border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto m-0" />}>Cancel</DialogClose>
              <button 
                onClick={handleSaveCustomer}
                className="h-11 px-5 rounded-xl bg-[#5D34F5] text-white font-black text-[13px] shadow-lg shadow-[#5D34F5]/30 hover:bg-[#4A2ABF] transition-colors"
              >
                Save Customer
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Tabs Row */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-8 min-w-max">
            {["All Customers", "Top Customers", "Inactive Customers"].map(tab => (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab); toast.info(`Viewing ${tab}`); }}
                className={`py-4 border-b-2 text-[13px] font-black transition-colors ${activeTab === tab ? 'border-[#5D34F5] text-[#5D34F5]' : 'border-transparent text-slate-500 hover:text-slate-800 font-bold'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={() => toast.success("Export started!")} className="h-9 px-4 rounded-xl border border-slate-200 text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors text-[12px] font-bold shrink-0 ml-4">
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export
          </button>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Headers */}
            <div className="grid grid-cols-[1.5fr_1.5fr_0.8fr_1.2fr_1fr_0.8fr] gap-4 px-6 py-5 border-b border-slate-100">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider pl-4">Customer</div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Contact Info</div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Orders</div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Spent (LTV)</div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Last Visit</div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider text-center">Actions</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-50">
              {displayedCustomers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-bold">No customers found.</div>
              ) : displayedCustomers.map((cust, i) => (
                <div key={i} className="grid grid-cols-[1.5fr_1.5fr_0.8fr_1.2fr_1fr_0.8fr] gap-4 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                  
                  {/* Customer */}
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full ${cust.avatarBg} ${cust.avatarText} flex items-center justify-center text-[15px] font-black shrink-0`}>
                      {cust.initials}
                    </div>
                    <div>
                      <p className="text-[14px] font-black text-slate-900 leading-tight mb-1">{cust.name}</p>
                      {cust.isLoyalty && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F8F7FF] text-[#5D34F5] border border-[#E5DFFF]">
                          <Crown className="w-3 h-3" />
                          <span className="text-[10px] font-black tracking-wide">Loyalty Member</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[12px] font-bold">{cust.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[12px] font-bold">{cust.email}</span>
                    </div>
                  </div>

                  {/* Orders */}
                  <div>
                    <p className="text-[15px] font-black text-slate-900">{cust.orders}</p>
                    <p className="text-[11px] font-bold text-slate-400">Orders</p>
                  </div>

                  {/* Total Spent LTV */}
                  <div className="pr-8">
                    <p className="text-[15px] font-black text-slate-900 mb-1.5">{cust.ltv}</p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mb-1.5 overflow-hidden">
                      <div className={`h-full ${cust.progressColor} rounded-full`} style={{ width: `${cust.progress}%` }}></div>
                    </div>
                    <p className={`text-[10px] font-black ${cust.statusColor}`}>{cust.ltvStatus}</p>
                  </div>

                  {/* Last Visit */}
                  <div>
                    <p className="text-[13px] font-black text-slate-900">{cust.visitDate}</p>
                    <p className="text-[11px] font-bold text-[#5D34F5]">{cust.visitTime}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toast.info(`Viewing analytics for ${cust.name}`)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                      <BarChart2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toast.info(`More options for ${cust.name}`)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
            
            {filteredCustomers.length > 5 && (
              <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/30">
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



      </div>

    </div>
  );
}
