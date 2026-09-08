"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Armchair,
  Receipt,
  User,
  Plus,
  Loader2,
  Trash
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { useBranchContext } from "@/context/BranchContext";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";

interface TableData {
  id: string;
  tableId?: string;
  name?: string;
  seats: number;
  status: string;
  floorName?: string;
  floor?: string;
  customer?: string;
  bill?: string;
  time?: string;
  branchId?: string;
  restaurantId?: string;
}

interface Floor {
  name: string;
  tables: TableData[];
}

const getNormalizedStatus = (status?: string) => {
  if (!status) return "Available";
  const s = status.toUpperCase();
  if (s === "OCCUPIED") return "Occupied";
  if (s === "RESERVED") return "Reserved";
  return "Available";
};

export default function TablesPage() {
  const [activeTab, setActiveTab] = useState("All Tables");
  const [allTables, setAllTables] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedBranchId, branches } = useBranchContext();
  
  // Modal State
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [newTableFloor, setNewTableFloor] = useState("Ground Floor");
  const [newTableId, setNewTableId] = useState("");
  const [newTableSeats, setNewTableSeats] = useState("4");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "tables"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableData));
      
      // Sort tables by ID numerically if possible
      fetched.sort((a, b) => {
        const numA = parseInt((a.tableId || a.name || "").replace(/\D/g, '')) || 0;
        const numB = parseInt((b.tableId || b.name || "").replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      
      setAllTables(fetched);
      setIsLoading(false);
    });
    
    return () => unsub();
  }, []);

  const tables = allTables.filter(t => selectedBranchId === "all" || t.branchId === selectedBranchId || t.branchId === "global" || !t.branchId);

  // Group tables by floor
  const floors = tables.reduce((acc, table) => {
    const floorLabel = table.floorName || table.floor || "Main Floor";
    const floorObj = acc.find(f => f.name === floorLabel);
    if (floorObj) {
      floorObj.tables.push(table);
    } else {
      acc.push({ name: floorLabel, tables: [table] });
    }
    return acc;
  }, [] as Floor[]);

  // Statistics
  const totalTables = tables.length;
  const availableCount = tables.filter(t => getNormalizedStatus(t.status) === "Available").length;
  const occupiedCount = tables.filter(t => getNormalizedStatus(t.status) === "Occupied").length;
  const reservedCount = tables.filter(t => getNormalizedStatus(t.status) === "Reserved").length;

  // Actions
  const handleTableClick = (table: TableData) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const updateTableStatus = async (tableId: string, newStatus: string, extraData: any = {}) => {
    try {
      const updateData = newStatus === "Available" 
        ? { status: newStatus, customer: "", bill: "", time: "" }
        : { status: newStatus, ...extraData };
        
      await updateDoc(doc(db, "tables", tableId), updateData);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update table status");
    }
  };

  const handleAssignWalkIn = () => {
    if(!selectedTable) return;
    updateTableStatus(selectedTable.id, "Occupied", { customer: "Walk-in Customer", bill: "₹0.00", time: "1 min" });
    toast.success(`Table ${selectedTable.tableId || selectedTable.name} assigned.`);
  };

  const handleClearTable = () => {
    if(!selectedTable) return;
    updateTableStatus(selectedTable.id, "Available");
    toast.success(`Table ${selectedTable.tableId || selectedTable.name} cleared.`);
  };

  const handleCustomerArrived = () => {
    if(!selectedTable) return;
    updateTableStatus(selectedTable.id, "Occupied", { customer: selectedTable.customer || "Reserved Guest", bill: "₹0.00", time: "1 min" });
    toast.success(`Guest arrived for Table ${selectedTable.tableId || selectedTable.name}.`);
  };

  const handleReserve = () => {
    if(!selectedTable) return;
    updateTableStatus(selectedTable.id, "Reserved", { customer: "New Reservation", time: "8:00 PM" });
    toast.success(`Table ${selectedTable.tableId || selectedTable.name} has been reserved.`);
  };

  const handleDeleteTable = async () => {
    if(!selectedTable) return;
    if (confirm(`Are you sure you want to delete table ${selectedTable.tableId || selectedTable.name}?`)) {
      try {
        await deleteDoc(doc(db, "tables", selectedTable.id));
        toast.success("Table deleted successfully");
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error deleting table:", error);
        toast.error("Failed to delete table");
      }
    }
  };

  const handleAddTable = async () => {
    if (!newTableId.trim()) {
      toast.error("Please enter a Table ID");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newTable = {
        tableId: newTableId,
        name: newTableId,
        seats: parseInt(newTableSeats),
        status: "Available",
        floorName: newTableFloor,
        floor: newTableFloor,
        branchId: selectedBranchId === "all" ? "global" : selectedBranchId,
      };

      await addDoc(collection(db, "tables"), newTable);
      toast.success(`Table ${newTableId} added successfully to ${newTableFloor}!`);
      setIsAddTableModalOpen(false);
      setNewTableId("");
      setNewTableSeats("4");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add table");
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueFloors = Array.from(new Set(tables.map(t => t.floorName || t.floor || "Main Floor")));
  if (!uniqueFloors.includes("Ground Floor")) uniqueFloors.unshift("Ground Floor");
  if (!uniqueFloors.includes("First Floor")) uniqueFloors.push("First Floor");
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
        <p className="mt-4 text-slate-500 font-medium">Loading tables...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Stats & Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-2 pl-4 pr-2 rounded-2xl border border-slate-100 shadow-sm">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab("All Tables")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[14px] transition-colors whitespace-nowrap ${activeTab === "All Tables" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            All Tables <span className="bg-white/20 px-2 py-0.5 rounded-md text-[11px] ml-1">{totalTables}</span>
          </button>
          <button onClick={() => setActiveTab("Available")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[14px] transition-colors whitespace-nowrap ${activeTab === "Available" ? "bg-emerald-500 text-white" : "text-emerald-600 hover:bg-emerald-50"}`}>
            Available <span className={`px-2 py-0.5 rounded-md text-[11px] ml-1 ${activeTab === "Available" ? "bg-white/20" : "bg-emerald-100"}`}>{availableCount}</span>
          </button>
          <button onClick={() => setActiveTab("Occupied")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[14px] transition-colors whitespace-nowrap ${activeTab === "Occupied" ? "bg-amber-500 text-white" : "text-amber-600 hover:bg-amber-50"}`}>
            Occupied <span className={`px-2 py-0.5 rounded-md text-[11px] ml-1 ${activeTab === "Occupied" ? "bg-white/20" : "bg-amber-100"}`}>{occupiedCount}</span>
          </button>
          <button onClick={() => setActiveTab("Reserved")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[14px] transition-colors whitespace-nowrap ${activeTab === "Reserved" ? "bg-purple-500 text-white" : "text-purple-600 hover:bg-purple-50"}`}>
            Reserved <span className={`px-2 py-0.5 rounded-md text-[11px] ml-1 ${activeTab === "Reserved" ? "bg-white/20" : "bg-purple-100"}`}>{reservedCount}</span>
          </button>
        </div>

        <Dialog open={isAddTableModalOpen} onOpenChange={setIsAddTableModalOpen}>
          <DialogTrigger render={<Button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-semibold shadow-sm transition-all ml-2 w-full sm:w-auto"><Plus className="w-5 h-5 mr-2" />Add Table</Button>} />
          <DialogContent className="sm:max-w-[400px] p-6 bg-white rounded-2xl border-slate-100 shadow-xl overflow-hidden">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-[20px] font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                Add New Table
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Floor / Area</label>
                <div className="relative">
                  <Select value={newTableFloor} onValueChange={(val) => setNewTableFloor(val as string)}>
                    <SelectTrigger className="w-full h-[46px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[14px] font-semibold focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all data-[state=open]:ring-1 data-[state=open]:ring-[#7C3AED]">
                      <SelectValue placeholder="Select Floor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl shadow-slate-200/50 p-1.5">
                      {uniqueFloors.map(name => (
                        <SelectItem key={name as string} value={name as string} className="cursor-pointer hover:bg-slate-50 rounded-lg font-semibold">{name as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Table ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. T-13"
                    value={newTableId}
                    onChange={(e) => setNewTableId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Seats Capacity</label>
                  <input 
                    type="number" 
                    value={newTableSeats}
                    onChange={(e) => setNewTableSeats(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 border-t-0 bg-transparent p-0 flex flex-row gap-3 sm:justify-end">
              <DialogClose render={<Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto m-0" />}>Cancel</DialogClose>
              <Button onClick={handleAddTable} disabled={isSubmitting} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl h-11 px-6 font-bold shadow-sm w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Add Table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      {/* Floor Layouts */}
      <div className="space-y-12">
        {floors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
            <Armchair className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No tables found</h3>
            <p className="text-slate-500 mt-2">Add some tables to manage your floor plan.</p>
          </div>
        ) : (
          floors.map((floor) => {
            // Filter tables for this floor
            const visibleTables = floor.tables.filter(table => {
              const status = getNormalizedStatus(table.status);
              if (activeTab === "Available" && status !== "Available") return false;
              if (activeTab === "Occupied" && status !== "Occupied") return false;
              if (activeTab === "Reserved" && status !== "Reserved") return false;
              return true;
            });

            if (visibleTables.length === 0) return null;

            return (
              <div key={floor.name} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-[20px] font-black text-slate-900">{floor.name}</h2>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
                  {visibleTables.map((table) => {
                    const status = getNormalizedStatus(table.status);
                    
                    // Style logic
                    let borderStyle = "border-slate-100 hover:border-slate-300";
                    let badgeBg = "bg-slate-100";
                    let badgeText = "text-slate-600";
                    let badgeDot = "bg-slate-400";
                    
                    if (status === "Available") {
                      borderStyle = "border-emerald-100 hover:border-emerald-400 hover:shadow-[0_8px_20px_rgba(16,185,129,0.12)]";
                      badgeBg = "bg-emerald-50";
                      badgeText = "text-emerald-600";
                      badgeDot = "bg-emerald-500";
                    } else if (status === "Occupied") {
                      borderStyle = "border-amber-100 hover:border-amber-400 hover:shadow-[0_8px_20px_rgba(245,158,11,0.12)] bg-amber-50/10";
                      badgeBg = "bg-amber-100";
                      badgeText = "text-amber-700";
                      badgeDot = "bg-amber-500";
                    } else if (status === "Reserved") {
                      borderStyle = "border-purple-100 hover:border-purple-400 hover:shadow-[0_8px_20px_rgba(168,85,247,0.12)] bg-purple-50/10";
                      badgeBg = "bg-purple-100";
                      badgeText = "text-purple-700";
                      badgeDot = "bg-purple-500";
                    }

                    return (
                      <div 
                        key={table.id}
                        onClick={() => handleTableClick(table)}
                        className={`bg-white rounded-2xl p-5 border-2 transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[160px] ${borderStyle}`}
                      >
                        {/* Top Row: Seats & Status */}
                        <div className="flex justify-between items-start mb-auto">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Users className="w-4 h-4" />
                            <span className="text-[13px] font-bold">{table.seats}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${badgeBg}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${badgeDot}`}></div>
                            <span className={`text-[11px] font-black uppercase tracking-wider ${badgeText}`}>{status}</span>
                          </div>
                        </div>

                        {/* Middle: Table ID */}
                        <div className="mt-4 mb-2">
                          <h3 className="text-[28px] font-black text-slate-900 leading-none">{table.tableId || table.name || "Unknown"}</h3>
                        </div>

                        {/* Bottom Context */}
                        <div className="mt-2 min-h-[30px] flex items-end">
                          {status === "Available" && (
                            <span className="text-[13px] font-bold text-emerald-600/80">Ready to seat</span>
                          )}
                          {status === "Occupied" && (
                            <div className="w-full flex justify-between items-center text-[13px] font-bold text-amber-700/80">
                              <span>{table.bill || "₹0.00"}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {table.time || "Just seated"}</span>
                            </div>
                          )}
                          {status === "Reserved" && (
                            <div className="w-full flex justify-between items-center text-[13px] font-bold text-purple-700/80">
                              <span className="truncate pr-2">{table.customer || "Guest"}</span>
                              <span className="flex items-center gap-1 shrink-0"><Clock className="w-3.5 h-3.5" /> {table.time || "TBD"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-100 rounded-2xl shadow-2xl p-6">
          <DialogHeader className="mb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                {selectedTable?.tableId || selectedTable?.name}
                <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                   getNormalizedStatus(selectedTable?.status) === 'Available' ? 'bg-emerald-50 text-emerald-600' :
                   getNormalizedStatus(selectedTable?.status) === 'Occupied' ? 'bg-amber-50 text-amber-600' :
                   'bg-purple-50 text-purple-600'
                }`}>
                  {getNormalizedStatus(selectedTable?.status)}
                </span>
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 font-medium">
              Capacity: {selectedTable?.seats} Seats
            </DialogDescription>
          </DialogHeader>

          {/* Modal Content Based on Status */}
          <div className="py-4">
            
            {getNormalizedStatus(selectedTable?.status) === "Available" && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-emerald-500"><CheckCircle2 className="w-5 h-5" /></div>
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-900">Table is ready!</h4>
                    <p className="text-[13px] text-slate-500 mt-1">This table is clean and ready for new guests to be seated.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button onClick={handleAssignWalkIn} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold h-12 rounded-xl shadow-sm">Assign Walk-in</Button>
                  <Button onClick={handleReserve} variant="outline" className="border-slate-200 text-slate-700 font-bold h-12 rounded-xl">Reserve</Button>
                </div>
              </div>
            )}

            {getNormalizedStatus(selectedTable?.status) === "Occupied" && (
              <div className="space-y-4">
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-amber-600/70 uppercase tracking-widest mb-1">Customer</p>
                    <p className="font-bold text-amber-900 text-[14px] flex items-center gap-2"><User className="w-4 h-4 text-amber-600" /> {selectedTable?.customer || "Walk-in"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-amber-600/70 uppercase tracking-widest mb-1">Seated For</p>
                    <p className="font-bold text-amber-900 text-[14px] flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /> {selectedTable?.time || "1 min"}</p>
                  </div>
                  <div className="col-span-2 pt-3 border-t border-amber-200/50 mt-1">
                    <p className="text-[11px] font-bold text-amber-600/70 uppercase tracking-widest mb-1">Current Bill</p>
                    <p className="font-black text-amber-900 text-[24px] flex items-center gap-2"><Receipt className="w-6 h-6 text-amber-600" /> {selectedTable?.bill || "₹0.00"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 pt-4">
                  <Button onClick={handleClearTable} variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-bold h-12 rounded-xl">Clear Table</Button>
                </div>
              </div>
            )}

            {getNormalizedStatus(selectedTable?.status) === "Reserved" && (
              <div className="space-y-4">
                <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-[11px] font-bold text-purple-600/70 uppercase tracking-widest mb-1">Reserved For</p>
                    <p className="font-bold text-purple-900 text-[16px] flex items-center gap-2"><User className="w-5 h-5 text-purple-600" /> {selectedTable?.customer || "Guest"}</p>
                  </div>
                  <div className="col-span-2 pt-3 border-t border-purple-200/50 mt-1">
                    <p className="text-[11px] font-bold text-purple-600/70 uppercase tracking-widest mb-1">Arrival Time</p>
                    <p className="font-black text-purple-900 text-[24px] flex items-center gap-2"><Clock className="w-6 h-6 text-purple-600" /> {selectedTable?.time || "TBD"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button onClick={handleClearTable} variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-100 font-bold h-12 rounded-xl">Cancel Reservation</Button>
                  <Button onClick={handleCustomerArrived} className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 rounded-xl shadow-sm">Guest Arrived</Button>
                </div>
              </div>
            )}

            {/* Superadmin Actions */}
            <div className="pt-6 mt-6 border-t border-slate-100">
               <Button onClick={handleDeleteTable} variant="outline" className="w-full text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700 font-bold rounded-xl h-12">
                 <Trash className="w-4 h-4 mr-2" /> Delete Table
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
