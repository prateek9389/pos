"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Edit, Crown, Award, LogOut, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ProtectedRoute, useAuth } from "@/components/AuthProvider";

interface Address {
  id: string;
  type: string;
  details: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("Home");
  const [modalStreet, setModalStreet] = useState("");
  const [modalLandmark, setModalLandmark] = useState("");
  const [modalCity, setModalCity] = useState("");
  const [modalState, setModalState] = useState("");
  const [modalPincode, setModalPincode] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setPhone(data.phone || user.phoneNumber || "");
          setAddresses(data.addresses || []);
        } else {
          // Initialize user doc
          const email = user.email || "";
          const nameParts = user.displayName ? user.displayName.split(' ') : [];
          const defaultFirst = nameParts.length > 0 ? nameParts[0] : (email ? email.split('@')[0] : "");
          const defaultLast = nameParts.length > 1 ? nameParts.slice(1).join(' ') : "";
          
          const initialData = {
            firstName: defaultFirst,
            lastName: defaultLast,
            email: user.email,
            phone: user.phoneNumber || "",
            addresses: [],
            points: 0,
            tier: "New"
          };
          
          await setDoc(userRef, initialData);
          setFirstName(defaultFirst);
          setLastName(defaultLast);
          setPhone(user.phoneNumber || "");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const email = user?.email || "";

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        firstName,
        lastName,
        phone
      });
      
      const newFullName = `${firstName} ${lastName}`.trim();
      if (newFullName && newFullName !== user.displayName) {
        await updateProfile(user, { displayName: newFullName });
      }
      
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!user || !modalStreet.trim() || !modalCity.trim()) return;
    
    let newAddresses = [...addresses];
    const details = [modalStreet, modalLandmark, modalCity, modalState, modalPincode].filter(Boolean).join(", ");
    
    const addressData = {
      type: modalType,
      details,
      street: modalStreet,
      landmark: modalLandmark,
      city: modalCity,
      state: modalState,
      pincode: modalPincode
    };

    if (editingId) {
      newAddresses = newAddresses.map(addr => 
        addr.id === editingId ? { ...addr, ...addressData } : addr
      );
    } else {
      newAddresses.push({
        id: Date.now().toString(),
        ...addressData
      });
    }
    
    try {
      await updateDoc(doc(db, "users", user.uid), { addresses: newAddresses });
      setAddresses(newAddresses);
      setShowModal(false);
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address.");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user || !confirm("Delete this address?")) return;
    const newAddresses = addresses.filter(a => a.id !== id);
    try {
      await updateDoc(doc(db, "users", user.uid), { addresses: newAddresses });
      setAddresses(newAddresses);
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const openAddressModal = (address?: Address) => {
    if (address) {
      setEditingId(address.id);
      setModalType(address.type);
      setModalStreet(address.street || address.details || "");
      setModalLandmark(address.landmark || "");
      setModalCity(address.city || "");
      setModalState(address.state || "");
      setModalPincode(address.pincode || "");
    } else {
      setEditingId(null);
      setModalType("Home");
      setModalStreet("");
      setModalLandmark("");
      setModalCity("");
      setModalState("");
      setModalPincode("");
    }
    setShowModal(true);
  };

  return (
    <ProtectedRoute redirectTo="/login">
      <div className="min-h-screen bg-[#F8FAFC] font-sans relative overflow-hidden">
      
      {/* Decorative Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <div>
            <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">My Profile</h1>
            <p className="text-[15px] font-medium text-slate-500">Manage your personal details and addresses</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
          
          {/* Left Col: Profile & Points (Light Theme) */}
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-[#7C3AED] hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-center relative overflow-hidden flex-1 flex flex-col items-center group">
              {/* Purple top glow */}
              <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#6D28D9]/10 via-indigo-600/5 to-transparent pointer-events-none rounded-t-[2.5rem]"></div>
              
              <div className="w-28 h-28 bg-white rounded-full mx-auto relative z-10 p-1.5 mb-5 mt-4 backdrop-blur-md border border-slate-100 shadow-[0_0_40px_rgba(109,40,217,0.15)]">
                <div className="w-full h-full bg-gradient-to-br from-[#6366F1] to-[#D946EF] rounded-full flex items-center justify-center text-white text-[36px] font-black uppercase">
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </div>
              </div>
              
              <h2 className="text-[26px] font-black text-slate-900 mb-1 relative z-10 capitalize">{firstName} {lastName}</h2>
              <p className="text-[14px] font-medium text-slate-500 mb-8 relative z-10">{email}</p>
              
              <Button variant="outline" className="w-full h-12 rounded-2xl font-bold text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-all relative z-10 mt-auto shadow-sm">
                <Edit className="w-4 h-4 mr-2" /> Edit Picture
              </Button>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-[#7C3AED] hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden shrink-0 group">
              <Crown className="absolute -right-4 -top-4 w-32 h-32 text-amber-500 opacity-[0.05]" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span className="font-bold tracking-widest uppercase text-[12px] text-amber-600">Gold Tier</span>
                </div>
                <h3 className="text-[44px] font-black mb-1 leading-none tracking-tight">1,240</h3>
                <p className="text-[14px] font-medium text-slate-500 mb-8">Loyalty Points Balance</p>
                
                <div className="bg-amber-100 rounded-full h-2 mb-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full w-[70%]"></div>
                </div>
                <p className="text-[12px] font-bold text-slate-500">260 points away from <span className="text-slate-800">Platinum</span></p>
              </div>
            </div>
          </div>

          {/* Right Col: Forms & Addresses */}
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-100 hover:border-[#7C3AED] hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border-l-[6px] border-l-[#8B5CF6] group">
              <h3 className="text-[22px] font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#7C3AED]" />
                </div>
                Personal Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-7">
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-600 uppercase tracking-wide">First Name</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-[52px] bg-[#F8FAFC] border-slate-200 focus-visible:border-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/20 rounded-xl px-4 text-[15px] font-medium text-slate-900 transition-all capitalize" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-600 uppercase tracking-wide">Last Name</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-[52px] bg-[#F8FAFC] border-slate-200 focus-visible:border-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/20 rounded-xl px-4 text-[15px] font-medium text-slate-900 transition-all capitalize" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-600 uppercase tracking-wide">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={email} disabled className="h-[52px] pl-11 bg-slate-100 border-slate-200 rounded-xl text-[15px] font-medium text-slate-700 disabled:opacity-100 disabled:cursor-not-allowed" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-600 uppercase tracking-wide">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C3AED]" />
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Add your phone number" className="h-[52px] pl-11 bg-[#F8FAFC] border-slate-200 focus-visible:border-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/20 rounded-xl text-[15px] font-medium text-slate-900 transition-all" />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving} className="rounded-2xl h-[48px] px-8 font-bold text-[15px] bg-gradient-to-r from-[#6366F1] to-[#D946EF] hover:from-[#4F46E5] hover:to-[#C026D3] text-white shadow-[0_8px_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-all border-0">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-100 hover:border-emerald-500 hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border-l-[6px] border-l-emerald-500 group">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[22px] font-black text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  Saved Addresses
                </h3>
                <Button onClick={() => openAddressModal()} variant="outline" size="sm" className="rounded-xl font-bold text-[13px] h-10 px-5 border-slate-200 hover:bg-slate-50 text-slate-700">Add New</Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {addresses.length === 0 ? (
                  <p className="text-slate-500 text-sm">No saved addresses.</p>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className="border border-slate-100 p-6 rounded-2xl bg-white shadow-sm hover:border-emerald-500 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[11px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-md">{addr.type}</span>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); openAddressModal(addr); }} className="text-slate-400 hover:text-emerald-600 text-[13px] font-bold transition-colors">Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }} className="text-slate-400 hover:text-rose-500 text-[13px] font-bold transition-colors"><X className="w-4 h-4"/></button>
                        </div>
                      </div>
                      <p className="text-[14px] text-slate-600 font-medium leading-relaxed">{addr.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 pr-4">
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 text-rose-500 font-bold text-[15px] hover:text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>

          </div>
        </div>

      </div>
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-[20px] font-black text-slate-900 mb-6">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-slate-600 uppercase">Label (e.g., Home, Office)</Label>
                <Input value={modalType} onChange={e => setModalType(e.target.value)} className="h-[48px] rounded-xl" placeholder="Home" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-slate-600 uppercase">Street Address / House No.</Label>
                <Input value={modalStreet} onChange={e => setModalStreet(e.target.value)} className="h-[48px] rounded-xl" placeholder="123 Main Street, Apt 4B" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-slate-600 uppercase">Landmark (Optional)</Label>
                <Input value={modalLandmark} onChange={e => setModalLandmark(e.target.value)} className="h-[48px] rounded-xl" placeholder="Near Central Park" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-600 uppercase">City</Label>
                  <Input value={modalCity} onChange={e => setModalCity(e.target.value)} className="h-[48px] rounded-xl" placeholder="New York" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-600 uppercase">State</Label>
                  <Input value={modalState} onChange={e => setModalState(e.target.value)} className="h-[48px] rounded-xl" placeholder="NY" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-slate-600 uppercase">Pincode / Zip</Label>
                <Input value={modalPincode} onChange={e => setModalPincode(e.target.value)} className="h-[48px] rounded-xl" placeholder="10001" />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3">
              <Button onClick={() => setShowModal(false)} variant="outline" className="rounded-xl font-bold h-11 border-slate-200">Cancel</Button>
              <Button onClick={handleSaveAddress} className="rounded-xl font-bold h-11 bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-6">Save Address</Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
