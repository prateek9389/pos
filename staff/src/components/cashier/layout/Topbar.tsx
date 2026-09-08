"use client";

import { Bell, MapPin, Menu, Printer, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CashierSidebar from "./Sidebar";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function CashierTopbar() {
  const [branchName, setBranchName] = useState("Loading...");
  const [userName, setUserName] = useState("Cashier");
  const [userRole, setUserRole] = useState("cashier");
  const [userImg, setUserImg] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const sessionStr = localStorage.getItem("staffSession");
      if (sessionStr) {
        try {
          const parsed = JSON.parse(sessionStr);
          if (parsed.branchId) {
            try {
              const branchRef = doc(db, "branches", parsed.branchId);
              const branchSnap = await getDoc(branchRef);
              if (branchSnap.exists() && branchSnap.data().name) {
                setBranchName(branchSnap.data().name);
              } else {
                setBranchName(parsed.branchId);
              }
            } catch (err) {
              setBranchName(parsed.branchId);
            }
          } else if (parsed.branchName) {
            setBranchName(parsed.branchName);
          } else {
            setBranchName("Main Branch");
          }

          if (parsed.id) {
            const docRef = doc(db, "staff", parsed.id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.name) setUserName(data.name);
              if (data.role) setUserRole(data.role);
              if (data.img) setUserImg(data.img);
            }
          }
        } catch (e) {
          console.error("Error parsing session", e);
        }
      }
    };
    fetchUser();
  }, []);

  const handleNotificationsClick = () => {
    toast.info("You have 6 new notifications.");
  };

  const handlePrintClick = () => {
    window.print();
  };


  return (
    <header className="h-[70px] bg-white flex items-center justify-between px-6 lg:px-10 z-40 shrink-0 border-b border-slate-200/60 print:hidden">
      
      {/* Left side */}
      <div className="flex items-center gap-4 lg:gap-2">
        <Sheet>
          <SheetTrigger className="text-slate-500 hover:text-slate-900 transition-colors lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100">
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-none w-[280px] bg-[#141226]">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            <div className="h-full w-full flex flex-col overflow-hidden [&>aside]:w-full [&>aside]:h-full [&>aside]:relative [&>aside]:left-auto [&>aside]:top-auto">
              <CashierSidebar isMobile />
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-col pl-1 lg:pl-2 mt-1">
          <h1 className="text-[18px] lg:text-[20px] font-black text-slate-900 tracking-tight flex items-center gap-2">
            {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening"}, {userName.split(' ')[0]}! 👋
          </h1>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-end gap-3 px-6">
        {/* Left of Calendar: Search Bar */}
        <div className="relative w-full max-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search orders..." className="w-full h-10 bg-slate-50 border border-slate-200 rounded-full pl-9 pr-10 text-[13px] font-medium text-slate-700 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] transition-all placeholder:text-slate-400" />
          
          <DropdownMenu>
            <DropdownMenuTrigger className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-[#5D34F5] hover:bg-indigo-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#5D34F5]/50">
              <Filter className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100 p-2">
              <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">Filter Options</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer font-medium text-[13px] rounded-lg">All Transactions</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-medium text-[13px] rounded-lg">Cash Payments</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-medium text-[13px] rounded-lg">Card Payments</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-medium text-[13px] rounded-lg">Online Payments</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Branch Display */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-4 h-10 rounded-full border border-slate-100 shadow-sm w-fit max-w-[180px]">
          <MapPin className="w-4 h-4 text-[#5D34F5] shrink-0" />
          <span className="font-bold text-slate-700 text-[13px] truncate">{branchName}</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {/* Notifications & Print */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleNotificationsClick}
            className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-500 border border-slate-200 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">6</span>
          </button>
          
          <button 
            onClick={handlePrintClick}
            className="w-10 h-10 rounded-full bg-[#F8F7FF] flex items-center justify-center text-[#5D34F5] hover:bg-[#5D34F5] hover:text-white transition-colors border border-[#E5DFFF]"
            title="Print"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>

        <div className="w-[1px] h-8 bg-slate-200 mx-1 hidden sm:block" />

        {/* Profile */}
        <Link
          href="/cashier/profile"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity pl-2"
        >
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-black text-slate-900 leading-tight">{userName}</p>
            <p className="text-[11px] font-bold text-[#5D34F5] mt-0.5 capitalize">{userRole}</p>
          </div>
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:ring-[#5D34F5] transition-colors">
              <AvatarImage src={userImg || `https://ui-avatars.com/api/?name=${userName}&background=random`} alt={userName} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
        </Link>
      </div>
    </header>
  );
}
