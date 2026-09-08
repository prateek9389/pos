"use client";

import { 
  User, Mail, Phone, MapPin, Calendar, Clock, 
  Award, TrendingUp, CheckCircle2, Shield, Settings,
  Edit2, Camera, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function KitchenProfile() {
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("Kitchen Staff");
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
          setUserEmail(auth.currentUser?.email || parsed.email || "");

          const docRef = doc(db, "staff", parsed.id || parsed.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Extract first and last name from the full name string
            const nameParts = (data.name || "").split(" ");
            const fName = nameParts[0] || "";
            const lName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
            
            setFirstName(fName);
            setLastName(lName);
            setPhone(data.phone || "");
            if (data.img) setUserImg(data.img);
            
            if (data.name) {
              setDisplayName(data.name);
            }
          }
        } catch (e) {
          console.error("Error fetching kitchen data", e);
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5D34F5]" />
        <p className="mt-4 text-slate-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Cover & Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="h-48 bg-gradient-to-r from-[#5D34F5] via-[#7B5BF2] to-[#9B82F8] relative">
          <div className="absolute inset-0 bg-white/10 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
          <Button variant="secondary" size="sm" className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white border-0 font-bold backdrop-blur-md transition-colors">
            <Camera className="w-4 h-4 mr-2" /> Change Cover
          </Button>
        </div>
        
        <div className="px-8 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 relative z-10 w-full sm:w-auto">
            <div className="relative group cursor-pointer shrink-0 -mt-16">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
                  <AvatarImage src={userImg || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`} alt={displayName} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-[#A78BFA]/10 text-[#A78BFA]">
                    {firstName.charAt(0)}{lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <button className="absolute bottom-2 right-2 w-8 h-8 bg-[#5D34F5] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#4B28C9] transition-colors border-2 border-white">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="text-center sm:text-left pb-2">
              <div className="flex items-center gap-3 justify-center sm:justify-start mb-1.5">
                <h1 className="text-[28px] font-black text-slate-900 leading-none">{displayName}</h1>
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"></div>
                  <span className="text-[10px] font-bold tracking-wide uppercase leading-none">Active</span>
                </div>
              </div>
              <p className="text-[15px] font-bold text-[#5D34F5] leading-none">Kitchen Staff</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto pb-2 shrink-0">
            <Button variant="outline" className="flex-1 sm:flex-none border-slate-200 font-bold gap-2 text-slate-700 h-11 rounded-xl shadow-sm hover:bg-slate-50">
              <Settings className="w-4 h-4" /> Settings
            </Button>
            <Button className="flex-1 sm:flex-none bg-[#5D34F5] hover:bg-[#4B28C9] text-white font-bold gap-2 h-11 rounded-xl shadow-md shadow-[#5D34F5]/20">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-[16px] font-black text-slate-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-[#5D34F5]" /> Personal Information
            </h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-[#5D34F5] transition-colors">
                  <Mail className="w-5 h-5 text-[#5D34F5] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-500 mb-0.5">Email Address</p>
                  <p className="text-[14px] font-bold text-slate-900">{userEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-[#5D34F5] transition-colors">
                  <Phone className="w-5 h-5 text-[#5D34F5] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-500 mb-0.5">Phone Number</p>
                  <p className="text-[14px] font-bold text-slate-900">{phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-[#5D34F5] transition-colors">
                  <MapPin className="w-5 h-5 text-[#5D34F5] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-500 mb-0.5">Location</p>
                  <p className="text-[14px] font-bold text-slate-900">Connaught Place, New Delhi</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-[16px] font-black text-slate-900 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#5D34F5]" /> Employment Details
            </h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                  <Calendar className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-500 mb-0.5">Joined Date</p>
                  <p className="text-[14px] font-bold text-slate-900">March 15, 2024</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                  <Clock className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-500 mb-0.5">Current Shift</p>
                  <p className="text-[14px] font-bold text-slate-900">Morning (08:00 AM - 04:00 PM)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          <h2 className="text-[18px] font-black text-slate-900">Performance Overview</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#5D34F5] transition-colors cursor-default">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-50 rounded-full group-hover:scale-125 transition-transform duration-700 ease-out opacity-50"></div>
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 text-[#5D34F5] shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-[32px] font-black text-slate-900 mb-1">12,450</h3>
                <p className="text-[13px] font-bold text-slate-500">Total Orders Prepared</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-500 transition-colors cursor-default">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-50 rounded-full group-hover:scale-125 transition-transform duration-700 ease-out opacity-50"></div>
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4 text-orange-500 shadow-inner">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-[32px] font-black text-slate-900 mb-1">14.2m</h3>
                <p className="text-[13px] font-bold text-slate-500">Average Prep Time</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[16px] font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#5D34F5]" /> Recent Achievements
              </h2>
              <a href="#" className="text-[#5D34F5] text-[13px] font-bold hover:underline">View All</a>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-purple-50/50 hover:border-purple-200 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-black text-slate-900 mb-0.5">Employee of the Month</h4>
                  <p className="text-[12px] font-bold text-slate-500">Awarded for exceptional speed and accuracy in August 2026.</p>
                </div>
                <span className="text-[12px] font-bold text-[#5D34F5] bg-purple-100 px-3 py-1 rounded-full">Aug '26</span>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-black text-slate-900 mb-0.5">Speed Demon Badge</h4>
                  <p className="text-[12px] font-bold text-slate-500">Maintained avg prep time below 15 mins for 30 straight days.</p>
                </div>
                <span className="text-[12px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Jul '26</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
