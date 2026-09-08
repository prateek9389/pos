"use client";

import { Bell, Menu, MapPin, Volume2, VolumeX, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { WaiterSidebar } from "./Sidebar";
import { useWaiterStore } from "@/lib/waiter-store";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export function WaiterTopbar() {
  const router = useRouter();
  const { searchQuery, setSearchQuery, selectedDate, setSelectedDate, selectedBranch, setSelectedBranch } = useWaiterStore();
  const [isMuted, setIsMuted] = useState(false);
  const [branchName, setBranchName] = useState("Loading...");
  const [userName, setUserName] = useState("Waiter");
  const [userRole, setUserRole] = useState("waiter");
  const [userImg, setUserImg] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const sessionStr = localStorage.getItem("staffSession");
      if (sessionStr) {
        try {
          const parsed = JSON.parse(sessionStr);
          if (parsed.name) {
             setUserName(parsed.name);
             setUserRole(parsed.role || "waiter");
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
    <header className="h-[70px] bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-10 shrink-0">
      <div className="flex items-center gap-4 lg:gap-2">
        <Sheet>
          <SheetTrigger className="lg:hidden text-slate-500 hover:text-slate-900 flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer outline-none">
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-none w-[260px] bg-[#141226]">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            <div className="h-full w-full flex flex-col overflow-hidden [&>aside]:w-full [&>aside]:h-full">
              <WaiterSidebar isMobile />
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Left: Greeting */}
        <div className="flex flex-col ml-1 lg:ml-2 mt-0.5">
          <h2 className="text-[18px] lg:text-[18px] font-black text-slate-900 leading-none tracking-tight">{new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening"}, {userName.split(' ')[0]}! 👋</h2>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-end gap-3 px-6">
        {/* Left of Calendar: Search Bar */}
        <div className="relative w-full max-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-full pl-9 pr-10 text-[13px] font-medium text-slate-700 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] transition-all placeholder:text-slate-400" 
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-[#5D34F5] hover:bg-indigo-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#5D34F5]/50">
              <Filter className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100 p-2">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => router.push('/waiter/orders?status=All')} className="cursor-pointer font-medium text-[13px] rounded-lg">All Orders</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/waiter/orders?status=Pending')} className="cursor-pointer font-medium text-[13px] rounded-lg text-amber-600 focus:text-amber-700 focus:bg-amber-50">Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/waiter/orders?status=Preparing')} className="cursor-pointer font-medium text-[13px] rounded-lg text-blue-600 focus:text-blue-700 focus:bg-blue-50">Preparing</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/waiter/orders?status=Ready')} className="cursor-pointer font-medium text-[13px] rounded-lg text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">Ready</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/waiter/orders?status=Completed')} className="cursor-pointer font-medium text-[13px] rounded-lg text-slate-500 focus:text-slate-600 focus:bg-slate-50">Completed</DropdownMenuItem>
              </DropdownMenuGroup>
              <div className="h-2"></div>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">Filter by Type</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => router.push('/waiter/orders?type=Dine In')} className="cursor-pointer font-medium text-[13px] rounded-lg">Dine-in</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/waiter/orders?type=Takeaway')} className="cursor-pointer font-medium text-[13px] rounded-lg">Takeaway</DropdownMenuItem>
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

      <div className="flex items-center gap-4">
        <Button 
          onClick={() => toast.info("You have 3 new notifications!")}
          variant="ghost" 
          size="icon" 
          className="relative text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full h-10 w-10"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 h-2.5 w-2.5 rounded-full bg-[#EF4444] ring-2 ring-white flex items-center justify-center text-[9px] text-white font-bold">3</span>
        </Button>
        
        <Button 
          onClick={() => {
            setIsMuted(!isMuted);
            toast.success(isMuted ? "Sound unmuted" : "Sound muted");
          }}
          variant="ghost" 
          size="icon" 
          className="text-[#5D34F5] bg-[#5D34F5]/10 hover:bg-[#5D34F5]/20 rounded-full h-10 w-10 transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>

        <Link href="/waiter/profile" className="flex items-center gap-3 pl-4 ml-2 border-l border-slate-200 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[13px] font-bold text-slate-900 leading-none">{userName}</span>
            <span className="text-[11px] text-[#5D34F5] font-bold mt-1 capitalize">{userRole}</span>
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
