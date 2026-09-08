"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Filter, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { useBranchContext } from "@/context/BranchContext";
import { Store, ChevronDown } from "lucide-react";

import { Sidebar } from "./Sidebar";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedBranchId, setSelectedBranchId, branches, loadingBranches } = useBranchContext();
  const calendarRef = useRef<HTMLInputElement>(null);
  const [currentDate, setCurrentDate] = useState("Loading...");
  const [userEmail, setUserEmail] = useState("admin@foodiepos.com");
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    
    const hour = today.getHours();
    if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good Evening");
    } else if (hour >= 21 || hour < 4) {
      setGreeting("Good Night");
    }
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        setUserEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  if (pathname.includes('/login')) {
    return null;
  }

  // Determine title based on pathname
  let pageTitle = "Dashboard";
  const path = pathname.split('/')[1];
  if (path) {
    pageTitle = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
  }

  return (
    <header className="h-[70px] bg-white flex items-center justify-between px-6 lg:px-10 shrink-0">

      <div className="flex items-center gap-3 lg:gap-5">
        <Sheet>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="md:hidden text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl" />
          }>
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-none w-[280px] bg-[#0F1021]">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            <div className="h-full w-full flex flex-col overflow-hidden [&>aside]:w-full [&>aside]:h-full">
              <Sidebar isMobile />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-col pl-1 lg:pl-2 mt-1">
          <p className="text-[18px] lg:text-[22px] font-black text-slate-900 flex items-center gap-2 leading-none">
            {greeting} Superadmin <span className="animate-bounce origin-bottom inline-block">👋</span>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center px-6">
        <div className="relative w-full max-w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            type="text" 
            placeholder="Search..." 
            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-full pl-9 pr-10 text-[14px] font-semibold text-slate-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-400" 
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Global Branch Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-[14px] font-bold text-slate-700 shadow-sm transition-all focus:outline-none">
            <Store className="w-4 h-4 text-purple-600" />
            <span className="truncate max-w-[120px]">
              {loadingBranches ? "Loading..." : (selectedBranchId === "all" ? "All Branches" : branches.find(b => b.id === selectedBranchId)?.name || "Select Branch")}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border border-slate-100 shadow-xl p-2">
            <DropdownMenuItem onClick={() => setSelectedBranchId("all")} className={`cursor-pointer font-medium text-[13px] rounded-lg p-2 ${selectedBranchId === "all" ? "bg-purple-50 text-purple-700" : ""}`}>All Branches</DropdownMenuItem>
            {branches.map(branch => (
              <DropdownMenuItem 
                key={branch.id} 
                onClick={() => setSelectedBranchId(branch.id)}
                className={`cursor-pointer font-medium text-[13px] rounded-lg p-2 ${selectedBranchId === branch.id ? "bg-purple-50 text-purple-700" : ""}`}
              >
                {branch.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>


        <Sheet>
          <SheetTrigger render={
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:shadow-sm hover:scale-105 transition-all group shadow-sm"
            />
          }>
            <Bell className="w-5 h-5 group-hover:animate-swing" />
            <span className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-red-500 border-2 border-white text-[9px] font-bold text-white flex items-center justify-center shadow-md animate-pulse">3</span>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] bg-[#0F1021] border-l border-white/10 text-white p-6">
            <SheetHeader>
              <SheetTitle className="text-white text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" /> Notifications
              </SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex gap-4 items-start p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                  <span className="text-lg">📦</span>
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-white">New Order #1024</h4>
                  <p className="text-[13px] text-slate-400 mt-1 leading-snug">Received a new order from Connaught Place branch for $142.50.</p>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">2 mins ago</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                  <span className="text-lg">👥</span>
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-white">New Staff Member</h4>
                  <p className="text-[13px] text-slate-400 mt-1 leading-snug">Sarah Jenkins was added to the team by Manager Rahul.</p>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">1 hour ago</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                  <span className="text-lg">⚠️</span>
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-white">Low Inventory Alert</h4>
                  <p className="text-[13px] text-slate-400 mt-1 leading-snug">Tomato stock is running low (below 10 kg) at MG Road branch.</p>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">3 hours ago</p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative w-12 h-12 rounded-2xl overflow-hidden border-[3px] border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_rgba(124,58,237,0.15)] hover:scale-105 hover:border-purple-200 transition-all focus:outline-none">
            <Image src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="Admin" fill className="object-cover" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mt-2 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-2" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-[15px] font-bold text-slate-900 leading-none">Super Admin</p>
                  <p className="text-[12px] font-medium text-slate-500 mt-1">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem 
                className="p-3 text-[14px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl cursor-pointer transition-colors"
                onClick={() => router.push('/profile')}
              >
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="p-3 text-[14px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl cursor-pointer transition-colors"
                onClick={() => router.push('/settings')}
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem 
                className="p-3 text-[14px] text-red-600 font-bold cursor-pointer hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors"
                onClick={handleLogout}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
