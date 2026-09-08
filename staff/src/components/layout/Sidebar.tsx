"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  Grid2X2,
  MenuSquare,
  Package,
  Users,
  UserSquare2,
  CalendarCheck,
  BarChart3,
  Ticket,
  Settings,
  LogOut,
  X,
  Tags
} from "lucide-react";

import Image from "next/image";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const sidebarLinks = [
  { name: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/manager/orders", icon: ShoppingCart },
  { name: "Tables", href: "/manager/tables", icon: Grid2X2 },
  { name: "Categories", href: "/manager/categories", icon: Tags },
  { name: "Menu Management", href: "/manager/menu", icon: MenuSquare },
  { name: "Inventory", href: "/manager/inventory", icon: Package },
  { name: "Staff Management", href: "/manager/staff", icon: Users },
  { name: "Customers", href: "/manager/customers", icon: UserSquare2 },

  { name: "Reservations", href: "/manager/reservations", icon: CalendarCheck },
  { name: "Offers", href: "/manager/offers", icon: Ticket },
  { name: "Settings", href: "/manager/settings", icon: Settings },
  { name: "Logout", href: "/login", icon: LogOut },
];

export function Sidebar({ isMobile }: { isMobile?: boolean }) {
  const pathname = usePathname();
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
          console.error("Error fetching user for sidebar", e);
        }
      }
    };
    fetchUser();
  }, []);

  return (
    <aside className={cn("w-[280px] bg-[#0F1021] text-white h-screen flex flex-col shrink-0 sticky top-0 z-50", !isMobile && "hidden lg:flex")}>

      {/* Logo Area */}
      <div className="h-16 flex items-center px-8 border-b border-white/5">
        <Link href="/manager/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6366F1] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-white text-xl">🍴</span>
          </div>
          <div>
            <span className="text-[22px] font-bold tracking-tight block leading-tight">Foodie POS</span>
            <span className="text-xs text-slate-400 font-medium">Manager Panel</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" data-lenis-prevent>
        {sidebarLinks.filter(l => l.name !== "Logout").map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(`${link.href}/`) && link.href !== '/manager/dashboard');
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3.5 px-4 py-3 rounded-[14px] transition-all duration-300 text-[14px] font-semibold tracking-wide",
                isActive
                  ? "bg-[#6366F1] text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("w-[20px] h-[20px] shrink-0", isActive ? "text-white" : "text-slate-400")} />
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="px-4 pb-6 mt-auto">


        <Link href="/login" className="flex items-center gap-3.5 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-[14px] transition-all font-bold text-[14px]">
           <LogOut className="w-[20px] h-[20px] shrink-0 text-red-500" />
           Logout
        </Link>
      </div>
    </aside>
  );
}
