"use client";

import { Bell, Menu, ChevronDown, Volume2, MapPin, User, Settings, LogOut, Moon, Sun, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { KitchenSidebar } from "./Sidebar";

export function KitchenTopbar() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [branchName, setBranchName] = useState("Loading...");
  const [userName, setUserName] = useState("Kitchen Staff");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("kitchen");
  const [userImg, setUserImg] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const sessionStr = localStorage.getItem("staffSession");
      if (sessionStr) {
        try {
          const parsed = JSON.parse(sessionStr);
          if (parsed.name) {
             setUserName(parsed.name);
             setUserRole(parsed.role || "kitchen");
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
              if (data.email) setUserEmail(data.email);
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
    <header className="h-[70px] bg-white dark:bg-[#0F111A] flex items-center justify-between px-6 lg:px-10 border-b border-slate-100/50 dark:border-white/5 shrink-0 transition-colors">
      <div className="flex items-center gap-4">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger className="lg:hidden text-slate-500 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer outline-none">
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-none w-[280px]">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            <div className="flex flex-col h-full w-full [&>aside]:flex [&>aside]:w-full">
              <KitchenSidebar isMobile />
            </div>
          </SheetContent>
        </Sheet>

        {/* Left: Greeting */}
        <div className="hidden lg:flex items-center gap-2 ml-2">
          <h2 className="text-[18px] font-black text-slate-900 dark:text-slate-100 leading-none tracking-tight">{new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening"} Kitchen 👋</h2>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-end gap-3 px-6">
        {/* Search Bar with Filter */}
        <div className="relative w-full max-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search orders..." className="w-full h-10 bg-slate-50 dark:bg-[#1A1D27] border border-slate-200 dark:border-white/10 rounded-full pl-9 pr-10 text-[13px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#5D34F5] focus:ring-1 focus:ring-[#5D34F5] transition-all placeholder:text-slate-400" />
          
          <DropdownMenu>
            <DropdownMenuTrigger className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-[#5D34F5] hover:bg-indigo-50 dark:hover:bg-[#5D34F5]/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#5D34F5]/50 dark:focus:ring-offset-[#0F111A]">
              <Filter className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200 dark:border-slate-800 p-2">
              <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
              <DropdownMenuItem className="cursor-pointer font-medium text-[13px] rounded-lg">All Orders</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer font-medium text-[13px] rounded-lg text-amber-600 focus:text-amber-700 focus:bg-amber-50 dark:focus:bg-amber-900/20">Pending</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer font-medium text-[13px] rounded-lg text-blue-600 focus:text-blue-700 focus:bg-blue-50 dark:focus:bg-blue-900/20">Preparing</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer font-medium text-[13px] rounded-lg text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-900/20">Ready</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Branch Display */}
        <div className="hidden lg:flex items-center gap-2 bg-white dark:bg-[#1A1D27] border border-slate-200 dark:border-white/10 h-10 px-4 rounded-full shadow-sm w-fit max-w-[180px]">
          <MapPin className="w-4 h-4 text-[#5D34F5] dark:text-[#A78BFA] shrink-0" />
          <span className="font-bold text-slate-700 dark:text-slate-200 text-[13px] truncate">{branchName}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Sound Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            const newState = !soundEnabled;
            setSoundEnabled(newState);
            toast.success(newState ? "Sound notifications enabled" : "Sound notifications disabled", {
              position: "top-center"
            });
          }}
          className={`relative rounded-full transition-colors w-10 h-10 ${soundEnabled ? 'text-[#5D34F5] bg-purple-50 dark:bg-[#5D34F5]/20 dark:text-[#A78BFA] hover:bg-purple-100 dark:hover:bg-[#5D34F5]/30' : 'text-slate-400 bg-slate-50 dark:bg-white/5 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}
          title="Toggle Sound"
        >
          <Volume2 className="w-[18px] h-[18px]" />
          {!soundEnabled && <div className="absolute inset-0 m-auto w-[22px] border-b-[2px] border-slate-400 -rotate-45" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex items-center justify-center text-slate-600 hover:text-[#5D34F5] hover:bg-purple-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 w-10 h-10 rounded-full outline-none cursor-pointer transition-colors">
            <Bell className="w-[20px] h-[20px]" />
            <span className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-[2px] border-white dark:border-[#0F111A] leading-none">3</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-2xl border-slate-200 shadow-xl p-2">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-black text-slate-900 px-2 py-1.5">Notifications (3)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer rounded-xl mb-1 hover:bg-slate-50 focus:bg-slate-50">
                <span className="font-bold text-slate-900 text-sm">New Order #1025</span>
                <span className="text-xs text-slate-500 font-medium">Table 4 just placed an order.</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer rounded-xl mb-1 hover:bg-slate-50 focus:bg-slate-50">
                <span className="font-bold text-red-600 text-sm">Order #1018 Overdue</span>
                <span className="text-xs text-slate-500 font-medium">Prep time exceeded 25 mins.</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer rounded-xl mb-1 hover:bg-slate-50 focus:bg-slate-50">
                <span className="font-bold text-slate-900 text-sm">Stock Alert</span>
                <span className="text-xs text-slate-500 font-medium">Pizza dough is running low.</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center font-bold text-[#5D34F5] cursor-pointer rounded-xl focus:bg-purple-50 focus:text-[#5D34F5]">
                Mark all as read
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <Link 
          href="/kitchen/profile"
          className="flex items-center gap-3 pl-2 group cursor-pointer hover:opacity-80 transition-opacity outline-none"
        >
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-[#5D34F5] dark:group-hover:border-[#A78BFA] transition-colors shadow-sm">
              <AvatarImage src={userImg || `https://ui-avatars.com/api/?name=${userName}&background=random`} alt={userName} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(255,255,255,1)]"></div>
          </div>
          <div className="flex flex-col items-start hidden sm:flex">
            <span className="text-[14px] font-black text-slate-900 dark:text-slate-200 leading-none">{userName}</span>
            <span className="text-[12px] font-bold text-[#5D34F5] dark:text-[#A78BFA] leading-none mt-1 capitalize">{userRole}</span>
          </div>
        </Link>

      </div>
    </header>
  );
}
