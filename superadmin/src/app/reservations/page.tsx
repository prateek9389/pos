"use client";

import { useState, useEffect } from "react";
import { Search, Calendar as CalendarIcon, Plus, MoreHorizontal, CheckCircle, XCircle, Edit, Eye, User, Phone, Store, Clock, Users, FileText, X, MapPin, Loader2, Trash, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, getDocs } from "firebase/firestore";

interface Reservation {
  id: string;
  customer: string;
  phone: string;
  guests: number;
  branchId: string;
  branchName: string;
  table: string;
  date: string;
  time: string;
  notes: string;
  status: string;
  createdAt: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Confirmed:  { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  Pending:    { bg: "bg-orange-50",  text: "text-orange-500",  dot: "bg-orange-500"  },
  Upcoming:   { bg: "bg-blue-50",    text: "text-blue-500",    dot: "bg-blue-500"    },
  Completed:  { bg: "bg-slate-50",   text: "text-slate-500",   dot: "bg-slate-400"   },
  Cancelled:  { bg: "bg-red-50",     text: "text-red-500",     dot: "bg-red-500"     },
};

function getStatusStyle(s: string) {
  return STATUS_STYLES[s] ?? { bg: "bg-slate-50", text: "text-slate-500", dot: "bg-slate-400" };
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewAll, setViewAll] = useState(false);
  const [viewDetailsRes, setViewDetailsRes] = useState<Reservation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [assignTableRes, setAssignTableRes] = useState<Reservation | null>(null);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [tables, setTables] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Reservation>>({
    customer: "", phone: "", guests: 2, branchId: "", table: "", date: "", time: "", notes: "", status: "Upcoming",
  });

  useEffect(() => {
    getDocs(collection(db, "branches")).then((snap) => {
      setBranches(snap.docs.map((d) => ({ id: d.id, name: (d.data().name as string) ?? d.id })));
    }).catch(console.error);
    getDocs(collection(db, "tables")).then((snap) => {
      setTables(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }).catch(console.error);

  }, []);

  useEffect(() => {
    const q = query(collection(db, "reservations"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: Reservation[] = snapshot.docs.map((d) => {
        const data = d.data();
        const bId = (data.branchId ?? data.branch ?? "") as string;
        const bName = branches.find((b) => b.id === bId)?.name ?? bId ?? "Unknown";
        return {
          id: d.id,
          customer:   (data.userName ?? data.customer ?? "Guest") as string,
          phone:      (data.customerPhone ?? data.phone ?? "N/A")  as string,
          guests:     (data.guests ?? 2) as number,
          branchId:   bId,
          branchName: bName,
          table:      (data.tablePreference ?? data.table ?? "") as string,
          date:       (data.date ?? "N/A") as string,
          time:       (data.time ?? "N/A") as string,
          notes:      (data.notes ?? "") as string,
          status:     (data.status ?? "Upcoming") as string,
          createdAt:  (data.createdAt ?? 0) as number,
        };
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setReservations(items);
      setLoading(false);
    }, (err) => {
      console.error("Reservations error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [branches]);

  const filtered = reservations.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = r.customer.toLowerCase().includes(q) || r.phone.includes(searchTerm) || r.date.includes(searchTerm) || r.id.toLowerCase().includes(q);
    const matchBranch = filterBranch === "all" || r.branchId === filterBranch;
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchBranch && matchStatus;
  });

  const displayed = viewAll ? filtered : filtered.slice(0, 8);

  const openDialog = (mode: "add" | "edit", res?: Reservation) => {
    setDialogMode(mode);
    setFormData(res ?? { customer: "", phone: "", guests: 2, branchId: "", table: "", date: "", time: "", notes: "", status: "Upcoming" });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer || !formData.date || !formData.time) { toast.error("Name, date and time are required"); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        userName: formData.customer, customer: formData.customer,
        customerPhone: formData.phone ?? "", phone: formData.phone ?? "",
        guests: Number(formData.guests) || 2,
        branchId: formData.branchId ?? "", branch: formData.branchId ?? "",
        tablePreference: formData.table ?? "", table: formData.table ?? "",
        date: formData.date, time: formData.time,
        notes: formData.notes ?? "",
        status: formData.status ?? "Upcoming",
        createdAt: Date.now(),
      };
      if (dialogMode === "add") {
        await addDoc(collection(db, "reservations"), payload);
        toast.success("Reservation created!");
      } else if (formData.id) {
        await updateDoc(doc(db, "reservations", formData.id), payload);
        toast.success("Reservation updated!");
      }
      setIsDialogOpen(false);
    } catch { toast.error("Failed to save"); }
    finally { setIsSubmitting(false); }
  };

  const handleAssignTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTableRes || !selectedTableId) return;
    setIsSubmitting(true);
    try {
      const table = tables.find(t => t.id === selectedTableId);
      const tableName = table?.tableId || table?.name || selectedTableId;
      await updateDoc(doc(db, "reservations", assignTableRes.id), { 
        table: tableName, 
        status: "Confirmed"
      });
      await updateDoc(doc(db, "tables", selectedTableId), {
        status: "Reserved",
        customer: assignTableRes.customer,
        time: assignTableRes.time,
      });
      toast.success("Table assigned and reservation confirmed!");
      setAssignTableRes(null);
    } catch { toast.error("Failed to assign table"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reservation?")) return;
    try { await deleteDoc(doc(db, "reservations", id)); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await updateDoc(doc(db, "reservations", id), { status }); toast.success("Status updated"); }
    catch { toast.error("Failed"); }
  };

  const kpis = [
    { label: "Total Bookings", value: reservations.length,                                       color: "text-purple-600",  bg: "bg-purple-50", border: "border-purple-100", icon: <CalendarDays className="w-6 h-6 text-purple-600" />, gradient: "from-purple-50/50 to-transparent" },
    { label: "Confirmed",      value: reservations.filter(r => r.status === "Confirmed").length, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: <CheckCircle className="w-6 h-6 text-emerald-600" />, gradient: "from-emerald-50/50 to-transparent" },
    { label: "Pending",        value: reservations.filter(r => r.status === "Pending").length,   color: "text-orange-500",  bg: "bg-orange-50", border: "border-orange-100", icon: <Clock className="w-6 h-6 text-orange-500" />, gradient: "from-orange-50/50 to-transparent" },
    { label: "Cancelled",      value: reservations.filter(r => r.status === "Cancelled").length, color: "text-red-500",     bg: "bg-red-50", border: "border-red-100", icon: <XCircle className="w-6 h-6 text-red-500" />, gradient: "from-red-50/50 to-transparent" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Reservations</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            {loading ? "Loading..." : `${filtered.length} reservation${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => openDialog("add")} className="h-[48px] rounded-xl px-6 bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold border-0 shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:-translate-y-0.5 transition-all" />}>
            <Plus className="w-4 h-4 mr-2" /> Add Reservation
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="w-full sm:max-w-2xl p-0 gap-0 bg-[#F8F9FA] rounded-[2rem] shadow-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-8 pb-6 relative">
              <DialogClose render={<button className="absolute top-5 right-5 w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center justify-center" />}><X className="w-4 h-4" /></DialogClose>
              <DialogHeader className="p-0 text-left">
                <DialogTitle className="text-xl font-bold text-white">{dialogMode === "add" ? "New Reservation" : "Edit Reservation"}</DialogTitle>
                <DialogDescription className="text-white/80 text-sm mt-1">{dialogMode === "add" ? "Create a new table booking" : "Update booking details"}</DialogDescription>
              </DialogHeader>
            </div>
            <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Customer Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input value={formData.customer ?? ""} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} placeholder="e.g. Rahul Sharma" className="pl-10 h-[44px] bg-white border-slate-200 rounded-xl text-sm font-medium" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input value={formData.phone ?? ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91" className="pl-10 h-[44px] bg-white border-slate-200 rounded-xl text-sm font-medium" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Guests</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type="number" min="1" value={formData.guests ?? 2} onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })} className="pl-10 h-[44px] bg-white border-slate-200 rounded-xl text-sm font-medium" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date *</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type="date" value={formData.date ?? ""} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="pl-10 h-[44px] bg-white border-slate-200 rounded-xl text-sm font-medium" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type="time" value={formData.time ?? ""} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="pl-10 h-[44px] bg-white border-slate-200 rounded-xl text-sm font-medium" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Branch</Label>
                <Select value={formData.branchId ?? ""} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
                  <SelectTrigger className="h-[44px] bg-white border-slate-200 rounded-xl text-sm font-medium text-slate-600"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                  <SelectContent className="rounded-xl">{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Table / Preference</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input value={formData.table ?? ""} onChange={(e) => setFormData({ ...formData, table: e.target.value })} placeholder="e.g. Window Seat" className="pl-10 h-[44px] bg-white border-slate-200 rounded-xl text-sm font-medium" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notes</Label>
                <Input value={formData.notes ?? ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Special requests..." className="h-[44px] bg-white border-slate-200 rounded-xl text-sm font-medium" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <DialogClose render={<Button type="button" variant="outline" className="h-[44px] px-6 rounded-xl font-bold border-slate-200" />}>Cancel</DialogClose>
                <Button type="submit" disabled={isSubmitting} className="h-[44px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white border-0">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {dialogMode === "add" ? "Create Reservation" : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>



      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="group relative bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${k.gradient}`} />
            <div className={`p-3 rounded-xl ${k.bg} border ${k.border} group-hover:scale-110 transition-transform duration-300 relative z-10 shrink-0`}>
              {k.icon}
            </div>
            <div className="relative z-10">
              <h3 className={`text-2xl font-black ${k.color} tracking-tight leading-none mb-1`}>{k.value}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-purple-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4"><CalendarDays className="w-10 h-10 text-purple-300" /></div>
          <h3 className="text-xl font-bold text-slate-700 mb-1">No reservations found</h3>
          <p className="text-slate-400 text-sm">Try adjusting your filters or add a new reservation.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map((res) => {
              const ss = getStatusStyle(res.status);
              return (
                <div key={res.id} onClick={() => { setAssignTableRes(res); setSelectedTableId(""); }} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#A855F7] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer">
                  <div className="h-1 bg-gradient-to-r from-[#A855F7] to-[#7C3AED]" />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-base shrink-0">
                          {(res.customer[0] ?? "G").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate">{res.customer}</h3>
                          <p className="text-xs text-slate-500 font-medium truncate">{res.phone}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" onClick={(e) => e.stopPropagation()} className="h-8 w-8 p-0 hover:bg-slate-100 rounded-xl text-slate-400 shrink-0" />}><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl border-slate-100 shadow-lg p-1.5">
                          <DropdownMenuItem onClick={() => setViewDetailsRes(res)} className="cursor-pointer rounded-lg text-sm"><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDialog("edit", res)} className="cursor-pointer rounded-lg text-sm"><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateStatus(res.id, "Confirmed")} className="cursor-pointer text-emerald-600 rounded-lg text-sm"><CheckCircle className="mr-2 h-4 w-4" /> Confirm</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(res.id, "Completed")} className="cursor-pointer text-blue-600 rounded-lg text-sm"><CheckCircle className="mr-2 h-4 w-4" /> Complete</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(res.id, "Cancelled")} className="cursor-pointer text-red-600 rounded-lg text-sm"><XCircle className="mr-2 h-4 w-4" /> Cancel</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(res.id)} className="cursor-pointer text-red-600 rounded-lg text-sm"><Trash className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#A855F7] shrink-0" />
                        <span className="font-semibold">{res.date}</span>
                        <span className="text-slate-300">|</span>
                        <Clock className="w-3.5 h-3.5 text-[#A855F7] shrink-0" />
                        <span className="font-semibold">{res.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Users className="w-3.5 h-3.5 text-[#A855F7] shrink-0" />
                        <span className="font-semibold">{res.guests} Guests</span>
                      </div>
                      {res.table ? (<div className="flex items-center gap-2 text-xs text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="font-semibold truncate">{res.table}</span></div>) : null}
                      {(res.branchName && res.branchName !== res.branchId) ? (<div className="flex items-center gap-2 text-xs text-slate-600"><Store className="w-3.5 h-3.5 text-[#A855F7] shrink-0" /><span className="font-semibold truncate">{res.branchName}</span></div>) : null}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${ss.bg}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                        <span className={`text-[10px] font-black uppercase tracking-wider ${ss.text}`}>{res.status}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">#{res.id.slice(0,6).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length > 8 && !viewAll && (
            <div className="flex justify-center">
              <Button onClick={() => setViewAll(true)} variant="outline" className="h-[44px] px-8 rounded-xl font-bold border-2 border-slate-200 hover:border-[#A855F7] hover:text-[#A855F7]">
                View All {filtered.length} Reservations
              </Button>
            </div>
          )}
        </>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!viewDetailsRes} onOpenChange={(open) => !open && setViewDetailsRes(null)}>
        <DialogContent className="max-w-md bg-white p-0 overflow-hidden border-0 shadow-2xl rounded-[2rem]">
          {viewDetailsRes && (
            <>
              <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-8 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black text-white">{(viewDetailsRes.customer[0] ?? "G").toUpperCase()}</div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-white">{viewDetailsRes.customer}</DialogTitle>
                    <DialogDescription className="text-white/80 text-sm mt-0.5">{viewDetailsRes.phone}</DialogDescription>
                  </div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {[
                  { icon: <CalendarIcon className="w-4 h-4" />, label: "Date",   value: viewDetailsRes.date },
                  { icon: <Clock className="w-4 h-4" />,        label: "Time",   value: viewDetailsRes.time },
                  { icon: <Users className="w-4 h-4" />,        label: "Guests", value: `${viewDetailsRes.guests} people` },
                  { icon: <MapPin className="w-4 h-4" />,       label: "Table",  value: viewDetailsRes.table || "Not specified" },
                  { icon: <Store className="w-4 h-4" />,        label: "Branch", value: viewDetailsRes.branchName || "Not specified" },
                  { icon: <FileText className="w-4 h-4" />,     label: "Status", value: viewDetailsRes.status },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[#A855F7] mb-1">{item.icon}</div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
                {viewDetailsRes.notes ? (
                  <div className="col-span-2 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm font-medium text-slate-700 italic">&ldquo;{viewDetailsRes.notes}&rdquo;</p>
                  </div>
                ) : null}
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <Button onClick={() => { openDialog("edit", viewDetailsRes); setViewDetailsRes(null); }} variant="outline" className="flex-1 h-11 rounded-xl font-bold border-slate-200"><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                <Button onClick={() => setViewDetailsRes(null)} className="flex-1 h-11 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white border-0">Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Table Dialog */}
      <Dialog open={!!assignTableRes} onOpenChange={(open) => !open && setAssignTableRes(null)}>
        <DialogContent onClick={(e) => e.stopPropagation()} className="max-w-md bg-white p-0 overflow-hidden border-0 shadow-2xl rounded-[2rem]">
          <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-8 pb-6 relative">
            <DialogClose render={<button className="absolute top-5 right-5 w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center justify-center" />}><X className="w-4 h-4" /></DialogClose>
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="text-xl font-bold text-white">Assign Table</DialogTitle>
              <DialogDescription className="text-white/80 text-sm mt-1">Assign a specific table to {assignTableRes?.customer}</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleAssignTable} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Table</Label>
              <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                <SelectTrigger className="h-[44px] bg-white border-slate-200 rounded-xl text-sm font-medium text-slate-600">
                  <SelectValue placeholder="Select a table">
                    {selectedTableId && tables.find(t => t.id === selectedTableId) 
                      ? `${tables.find(t => t.id === selectedTableId).tableId || tables.find(t => t.id === selectedTableId).name || tables.find(t => t.id === selectedTableId).id} (Seats: ${tables.find(t => t.id === selectedTableId).seats})`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {tables.filter(t => !assignTableRes?.branchId || t.branchId === assignTableRes.branchId).map((t) => (
                    <SelectItem key={t.id} value={t.id} disabled={t.status !== "Available"}>
                      {t.tableId || t.name || t.id} (Seats: {t.seats}) {t.status !== "Available" ? ` - ${t.status}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <DialogClose render={<Button type="button" variant="outline" className="h-[44px] px-6 rounded-xl font-bold border-slate-200" />}>Cancel</DialogClose>
              <Button type="submit" disabled={isSubmitting || !selectedTableId} className="h-[44px] px-8 rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white border-0">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Assign & Confirm
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
