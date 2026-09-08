"use client";

import { useState, useEffect } from "react";
import { 
  Check, X, ShieldAlert, Plus, Shield, UserCog, Settings, 
  CheckSquare, Save, RotateCcw, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

type PermissionLevel = "full" | "limited" | "view" | "none";

interface PermissionRow {
  name: string;
  manager: PermissionLevel;
  cashier: PermissionLevel;
  waiter: PermissionLevel;
  kitchen: PermissionLevel;
  [customRole: string]: string;
}

const DEFAULT_PERMISSIONS: PermissionRow[] = [
  { name: "View Orders", manager: "full", cashier: "full", waiter: "full", kitchen: "full" },
  { name: "Create Orders", manager: "full", cashier: "full", waiter: "full", kitchen: "none" },
  { name: "Billing & Payments", manager: "full", cashier: "full", waiter: "none", kitchen: "none" },
  { name: "Inventory Management", manager: "full", cashier: "none", waiter: "none", kitchen: "none" },
  { name: "View Reports", manager: "full", cashier: "limited", waiter: "none", kitchen: "none" },
  { name: "Manage Tables", manager: "full", cashier: "full", waiter: "full", kitchen: "none" },
  { name: "Menu Configuration", manager: "full", cashier: "view", waiter: "view", kitchen: "view" },
  { name: "Staff Management", manager: "full", cashier: "none", waiter: "none", kitchen: "none" },
];

const CYCLE_ORDER: PermissionLevel[] = ["full", "limited", "view", "none"];

const renderPermissionBadge = (type: string) => {
  if (type === "full") return <div className="mx-auto w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-xs" title="Full Access (Click to change)"><Check className="w-4 h-4 text-emerald-600 font-black" /></div>;
  if (type === "none") return <div className="mx-auto w-7 h-7 rounded-full bg-red-100 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-xs" title="No Access (Click to change)"><X className="w-4 h-4 text-red-600 font-black" /></div>;
  if (type === "limited") return <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md cursor-pointer hover:bg-amber-200 transition-colors inline-block" title="Limited Access (Click to change)">Limited</span>;
  if (type === "view") return <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md cursor-pointer hover:bg-blue-200 transition-colors inline-block" title="View Only (Click to change)">View Only</span>;
  return null;
};

export default function RolesPermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionRow[]>(DEFAULT_PERMISSIONS);
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePerms, setNewRolePerms] = useState<Record<string, boolean>>({});
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const loadMatrix = async () => {
      try {
        const docRef = doc(db, "rolesPermissions", "global");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.permissions && Array.isArray(data.permissions)) {
            setPermissions(data.permissions);
          }
          if (data.customRoles && Array.isArray(data.customRoles)) {
            setCustomRoles(data.customRoles);
          }
        }
      } catch (e) {
        console.error("Error loading permissions matrix:", e);
      }
    };
    loadMatrix();
  }, []);

  const cyclePermission = (rowIndex: number, roleKey: string) => {
    setPermissions(prev => {
      const updated = [...prev];
      const current = updated[rowIndex][roleKey] as PermissionLevel || "none";
      const currentIndex = CYCLE_ORDER.indexOf(current);
      const nextIndex = (currentIndex + 1) % CYCLE_ORDER.length;
      updated[rowIndex] = {
        ...updated[rowIndex],
        [roleKey]: CYCLE_ORDER[nextIndex]
      };
      return updated;
    });
  };

  const handleSaveMatrix = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, "rolesPermissions", "global");
      await setDoc(docRef, {
        permissions,
        customRoles,
        updatedAt: Date.now()
      }, { merge: true });
      toast.success("Roles & permissions saved successfully!");
    } catch (e) {
      console.error("Error saving roles & permissions:", e);
      toast.error("Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setPermissions(DEFAULT_PERMISSIONS);
    setCustomRoles([]);
    toast.info("Permissions reset to defaults");
  };

  const handleCreateCustomRole = () => {
    if (!newRoleName.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    const roleKey = newRoleName.trim().toLowerCase().replace(/\s+/g, "_");
    if (["manager", "cashier", "waiter", "kitchen"].includes(roleKey) || customRoles.includes(newRoleName.trim())) {
      toast.error("A role with this name already exists");
      return;
    }

    const updatedRoles = [...customRoles, newRoleName.trim()];
    setCustomRoles(updatedRoles);

    setPermissions(prev => prev.map(p => ({
      ...p,
      [roleKey]: newRolePerms[p.name] ? "full" : "none"
    })));

    setNewRoleName("");
    setNewRolePerms({});
    setSheetOpen(false);
    toast.success(`Role "${newRoleName.trim()}" added! Don't forget to save changes.`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Role Permissions</h2>
          <p className="text-slate-500">Configure access levels for different staff roles. Click on any permission to cycle its status.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleDiscard}
            className="h-[48px] rounded-xl px-5 bg-white border-slate-200 shadow-xs hover:border-slate-300 font-bold transition-all text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Discard
          </Button>

          <Button 
            onClick={handleSaveMatrix}
            disabled={isSaving}
            className="h-[48px] rounded-xl px-6 bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-md font-bold text-[14px] border-0 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger render={<Button className="h-[48px] rounded-xl px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] border-0" />}>
              <Plus className="w-4 h-4 mr-2 font-black" /> Add Custom Role
            </SheetTrigger>
            <SheetContent showCloseButton={false} className="w-full sm:max-w-md overflow-y-auto p-0 gap-0 bg-[#F8F9FA] border-l-0 shadow-2xl outline-none">
              {/* Header Area */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#A855F7] to-[#7C3AED] px-8 pt-10 pb-20 shrink-0">
                <SheetClose className="absolute top-6 right-6 w-8 h-8 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-md flex items-center justify-center z-50 transition-colors">
                  <X className="w-4 h-4" />
                </SheetClose>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <SheetHeader className="text-left p-0 space-y-0.5">
                    <SheetTitle className="text-[20px] font-bold text-white tracking-tight">Add Custom Role</SheetTitle>
                    <SheetDescription className="text-white/80 text-[13px] font-medium">
                      Define a new role and configure its permissions
                    </SheetDescription>
                  </SheetHeader>
                </div>
              </div>

              {/* Form Area */}
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="role-name" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Role Name <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      id="role-name" 
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. Host / Greeter, Delivery Partner" 
                      className="h-[50px] pl-11 bg-white border-slate-200 rounded-xl font-medium text-[14px]" 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Initial Permissions</Label>
                  <div className="bg-white border border-slate-200 rounded-2xl p-2 divide-y divide-slate-100">
                    {permissions.map((p) => (
                      <div 
                        key={p.name} 
                        onClick={() => setNewRolePerms(prev => ({ ...prev, [p.name]: !prev[p.name] }))}
                        className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors rounded-xl cursor-pointer"
                      >
                        <span className="text-[14px] font-medium text-slate-700">{p.name}</span>
                        <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${newRolePerms[p.name] ? 'border-[#A855F7] bg-[#A855F7]' : 'border-slate-300'}`}>
                          {newRolePerms[p.name] && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <SheetClose render={<Button variant="outline" className="flex-1 h-[48px] rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50" />}>
                    Cancel
                  </SheetClose>
                  <Button 
                    onClick={handleCreateCustomRole}
                    className="flex-[1.5] h-[48px] rounded-xl font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white border-0"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Save Role
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                Click any permission cell to cycle between Full Access, Limited, View Only, and No Access.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white border-b-2 border-slate-100">
                <TableHead className="font-bold text-slate-900 w-[240px] py-4">Module / Action</TableHead>
                <TableHead className="font-bold text-slate-900 text-center py-4">Manager</TableHead>
                <TableHead className="font-bold text-slate-900 text-center py-4">Cashier</TableHead>
                <TableHead className="font-bold text-slate-900 text-center py-4">Waiter</TableHead>
                <TableHead className="font-bold text-slate-900 text-center py-4">Kitchen</TableHead>
                {customRoles.map(cr => (
                  <TableHead key={cr} className="font-bold text-slate-900 text-center py-4">{cr}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((perm, i) => (
                <TableRow key={i} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="font-bold text-slate-800 py-4">{perm.name}</TableCell>
                  <TableCell className="text-center py-4" onClick={() => cyclePermission(i, "manager")}>
                    {renderPermissionBadge(perm.manager)}
                  </TableCell>
                  <TableCell className="text-center py-4" onClick={() => cyclePermission(i, "cashier")}>
                    {renderPermissionBadge(perm.cashier)}
                  </TableCell>
                  <TableCell className="text-center py-4" onClick={() => cyclePermission(i, "waiter")}>
                    {renderPermissionBadge(perm.waiter)}
                  </TableCell>
                  <TableCell className="text-center py-4" onClick={() => cyclePermission(i, "kitchen")}>
                    {renderPermissionBadge(perm.kitchen)}
                  </TableCell>
                  {customRoles.map(cr => {
                    const k = cr.toLowerCase().replace(/\s+/g, "_");
                    return (
                      <TableCell key={cr} className="text-center py-4" onClick={() => cyclePermission(i, k)}>
                        {renderPermissionBadge(perm[k] || "none")}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-4 text-purple-900 text-sm">
        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
          <span className="font-bold text-[#A855F7]">✦</span>
        </div>
        <p>
          <strong>Interactive Matrix:</strong> Click any cell in the table to toggle its permission status. After making changes, click <strong>Save Changes</strong> above to persist your updates to the live database.
        </p>
      </div>
    </div>
  );
}
