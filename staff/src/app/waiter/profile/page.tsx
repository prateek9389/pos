"use client";

import { 
  UserCircle, Star, Clock, Calendar, 
  MapPin, Phone, Mail, Award, TrendingUp, Shield, Loader2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function WaiterProfile() {
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("Waiter");
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
          console.error("Error fetching waiter data", e);
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
    <div className="h-full flex flex-col bg-slate-50 -mx-4 lg:-mx-8 -my-4 lg:-my-8 font-sans overflow-auto p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F8F7FF] flex items-center justify-center border border-[#E5DFFF]">
            <UserCircle className="w-6 h-6 text-[#5D34F5]" />
          </div>
          <div>
            <h1 className="text-[22px] font-black text-slate-900 leading-tight">My Profile</h1>
            <p className="text-[13px] font-bold text-slate-500 mt-0.5">View your performance and personal details.</p>
          </div>
        </div>
        <Link 
          href="/waiter/settings"
          className="h-11 px-5 rounded-full border border-slate-200 bg-white flex items-center gap-2 text-slate-700 font-black text-[13px] hover:bg-slate-50 transition-colors shadow-sm"
        >
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
        
        {/* Left Column - Main Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-8 text-center flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[#5D34F5] to-[#8B5CF6] opacity-10" />
            
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
                <AvatarImage src={userImg || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`} alt={displayName} className="object-cover" />
                <AvatarFallback className="text-2xl bg-[#5D34F5]/10 text-[#5D34F5]">
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <h2 className="text-[22px] font-black text-slate-900 leading-tight mt-4">{displayName}</h2>
            <p className="text-[13px] font-bold text-[#5D34F5] mb-4">Waiter</p>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mb-6">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black tracking-wide uppercase">Verified Employee</span>
            </div>

            <div className="w-full space-y-3 text-left border-t border-slate-100 pt-6 mt-2">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[13px] font-bold text-slate-700">{phone || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[13px] font-bold text-slate-700">{userEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[13px] font-bold text-slate-700">Mumbai, Maharashtra</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-[24px] font-black text-slate-900 leading-none mb-1">4.8</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Rating</p>
            </div>
            
            <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-[24px] font-black text-slate-900 leading-none mb-1">104</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hours/Mo</p>
            </div>
            
            <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-[24px] font-black text-slate-900 leading-none mb-1">1.2k</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Orders</p>
            </div>
            
            <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 text-[#5D34F5] flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-[24px] font-black text-slate-900 leading-none mb-1">Top</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rank</p>
            </div>
          </div>

          {/* Shift Details */}
          <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm">
            <h3 className="text-[16px] font-black text-slate-900 mb-6">Current Schedule & Assignment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shift Timing</p>
                  <p className="text-[14px] font-black text-slate-900">Morning Shift</p>
                  <p className="text-[13px] font-bold text-[#5D34F5] mt-0.5">08:00 AM - 04:00 PM</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Working Days</p>
                  <p className="text-[14px] font-black text-slate-900">Mon, Tue, Wed, Fri, Sat</p>
                  <p className="text-[13px] font-bold text-rose-500 mt-0.5">Off: Thursday, Sunday</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
