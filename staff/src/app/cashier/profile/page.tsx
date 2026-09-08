"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, Mail, Phone, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function CashierProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("Loading...");
  const [displayName, setDisplayName] = useState("Cashier");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [userImg, setUserImg] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const sessionStr = localStorage.getItem("staffSession");
      if (sessionStr) {
        try {
          const parsed = JSON.parse(sessionStr);
          setUserId(parsed.id || parsed.uid);
          setUserEmail(auth.currentUser?.email || parsed.email || "");

          const docRef = doc(db, "staff", parsed.id || parsed.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            
            const nameParts = (data.name || "").split(" ");
            const fName = nameParts[0] || "";
            const lName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
            
            setFirstName(fName);
            setLastName(lName);
            setPhone(data.phone || "");
            if (data.img) setUserImg(data.img);
            
            if (data.name) {
              setDisplayName(data.name);
            } else {
              setDisplayName("Cashier");
            }
          }
        } catch (e) {
          console.error("Error fetching cashier data", e);
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      const docRef = doc(db, "staff", userId);
      const fullName = `${firstName} ${lastName}`.trim();
      await updateDoc(docRef, {
        name: fullName,
        phone,
      });

      setDisplayName(fullName);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile", error);
      toast.error("Failed to update profile.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5D34F5]" />
        <p className="mt-4 text-slate-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your cashier account details and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Overview */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[1.5rem] text-center bg-white relative overflow-hidden">
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-[#5D34F5]/10 rounded-full blur-2xl pointer-events-none"></div>
            <CardContent className="pt-8 pb-6 flex flex-col items-center relative z-10">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
                  <AvatarImage src={userImg || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`} alt={displayName} />
                  <AvatarFallback className="text-2xl bg-[#5D34F5]/10 text-[#5D34F5]">
                    {firstName.charAt(0)}{lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-emerald-500 w-5 h-5 rounded-full border-4 border-white"></div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-4">{displayName}</h3>
              <p className="text-sm text-slate-500 mb-4">{userEmail}</p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5D34F5] bg-[#5D34F5]/10 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" /> Cashier
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[1.5rem] bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 font-medium truncate w-full" title={userEmail}>{userEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 font-medium">{phone || "No phone added"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 font-medium">Logged in securely</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[1.5rem] bg-white relative overflow-hidden">
             <div className="absolute -top-6 -right-6 w-40 h-40 bg-[#3B82F6]/10 rounded-full blur-2xl pointer-events-none"></div>
            <CardHeader className="border-b border-slate-100 relative z-10">
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              <form className="space-y-4" onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-slate-50 focus-visible:ring-[#5D34F5]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-slate-50 focus-visible:ring-[#5D34F5]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={userEmail} disabled className="bg-slate-100 text-slate-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-slate-50 focus-visible:ring-[#5D34F5]" />
                </div>
                <div className="pt-4">
                  <Button type="submit" className="bg-[#5D34F5] hover:bg-[#4A2ABF] text-white shadow-[0_4px_15px_rgba(93,52,245,0.3)] border-0">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[1.5rem] bg-white relative overflow-hidden">
             <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-[#F59E0B]/10 rounded-full blur-2xl pointer-events-none"></div>
            <CardHeader className="border-b border-slate-100 relative z-10">
              <CardTitle>Update Password</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.info('Password updates not implemented in demo'); }}>
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input id="current" type="password" className="bg-slate-50 focus-visible:ring-[#5D34F5]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new">New Password</Label>
                    <Input id="new" type="password" className="bg-slate-50 focus-visible:ring-[#5D34F5]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm New Password</Label>
                    <Input id="confirm" type="password" className="bg-slate-50 focus-visible:ring-[#5D34F5]" />
                  </div>
                </div>
                <div className="pt-4">
                  <Button type="submit" variant="outline" className="text-[#5D34F5] border-[#5D34F5] hover:bg-[#5D34F5] hover:text-white transition-colors">Update Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
