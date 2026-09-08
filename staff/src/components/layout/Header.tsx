"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Bell, Menu, Search, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

export function Header() {
  const [branchName, setBranchName] = useState("Loading...");
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState("Manager");
  const [userRole, setUserRole] = useState("manager");
  const [userImg, setUserImg] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const sessionStr = localStorage.getItem("staffSession");
      if (sessionStr) {
        try {
          const parsed = JSON.parse(sessionStr);
          if (parsed.name) {
             setUserName(parsed.name);
             setUserRole(parsed.role || "staff");
          }
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
          console.error("Error fetching user for header", e);
        }
      }
    };
    fetchUser();
  }, []);
  return (
    <header className="h-[70px] bg-white border-b border-slate-100 flex items-center justify-between px-8 lg:px-10 sticky top-0 z-40 transition-all duration-300">
      
      {/* Left: Welcome */}
      <div className="flex items-center gap-4 lg:gap-2 flex-1">
        <Sheet>
          <SheetTrigger className="lg:hidden text-slate-600 hover:text-slate-900 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-none w-[280px] bg-[#0F1021]">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            <div className="h-full w-full flex flex-col overflow-hidden [&>aside]:w-full [&>aside]:h-full [&>aside]:relative [&>aside]:left-auto [&>aside]:top-auto">
              <Sidebar isMobile />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex flex-col pl-1 lg:pl-2 mt-1">
          <h1 className="text-[18px] lg:text-[20px] font-black text-slate-900 tracking-tight flex items-center gap-2">
            {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening"}, {userName.split(' ')[0]} <span className="text-xl">👋</span>
          </h1>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex items-center justify-center flex-1 hidden xl:flex">
        <div className="relative group w-full max-w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-[#7C3AED]" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                toast.success(`Searching for "${searchQuery}"...`);
              }
            }}
            className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-transparent rounded-full text-[14px] font-semibold focus:outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all text-slate-700 placeholder:text-slate-400"
          />
          <DropdownMenu>
            <DropdownMenuTrigger className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-[#7C3AED] hover:bg-purple-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#7C3AED]/50">
              <Filter className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100 p-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">Filter Options</div>
              <div className="h-px bg-slate-100 my-1 mx-1"></div>
              <DropdownMenuItem onClick={() => toast.info("Filter applied: All Categories")} className="cursor-pointer font-medium text-[13px] rounded-lg mt-1">All Categories</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Filter applied: Staff")} className="cursor-pointer font-medium text-[13px] rounded-lg">Staff</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Filter applied: Inventory")} className="cursor-pointer font-medium text-[13px] rounded-lg">Inventory</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Filter applied: Reports")} className="cursor-pointer font-medium text-[13px] rounded-lg">Reports</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center justify-end gap-3 lg:gap-4 flex-1">
        
        {/* Branch Display */}
        <div className="hidden lg:flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm w-fit max-w-[180px]">
          <MapPin className="w-4 h-4 text-[#7C3AED] shrink-0" />
          <span className="font-bold text-slate-900 text-[13px] truncate">{branchName}</span>
        </div>

        {/* Notification Bell */}
        <Button onClick={() => toast.info("You have 3 new notifications.")} variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700 bg-white rounded-full h-10 w-10 border border-slate-200 shadow-sm transition-all hover:bg-slate-50 ml-1">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 h-[18px] w-[18px] rounded-full bg-[#EF4444] text-[9px] font-black text-white flex items-center justify-center shadow-sm border-2 border-white translate-x-1/4 -translate-y-1/4">3</span>
        </Button>

        {/* Profile */}
        <Link href="/manager/profile" className="flex items-center gap-3 pl-1 cursor-pointer hover:opacity-80 transition-opacity ml-1">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
            <Avatar className="h-full w-full">
              <AvatarImage src={userImg || `https://ui-avatars.com/api/?name=${userName}&background=random`} alt={userName} className="object-cover" />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col items-start hidden sm:flex">
            <span className="text-[13px] font-black text-slate-900 leading-none">{userName}</span>
            <span className="text-[11px] text-[#7C3AED] font-bold mt-1 leading-none capitalize">{userRole}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
