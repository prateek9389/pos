"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Home,
  ChefHat,
  ListOrdered,
  CheckCircle2,
  CheckCircle,
  MenuSquare,
  BarChart3,
  Settings,
  LogOut,
  UtensilsCrossed
} from "lucide-react";

const getSidebarLinks = (counts: { pending: number, preparing: number, ready: number }) => [
  { name: "Dashboard", href: "/kitchen/dashboard", icon: Home },
  { name: "Order Queue", href: "/kitchen/order-queue", icon: ListOrdered, badge: counts.pending, badgeColor: "bg-[#5D34F5]" },
  { name: "Preparing", href: "/kitchen/preparing", icon: ChefHat, badge: counts.preparing, badgeColor: "bg-[#D97706]" },
  { name: "Ready Orders", href: "/kitchen/ready", icon: CheckCircle2, badge: counts.ready, badgeColor: "bg-[#059669]" },
  { name: "Completed", href: "/kitchen/completed", icon: CheckCircle },
  { name: "Menu", href: "/kitchen/menu", icon: MenuSquare },
  { name: "Settings", href: "/kitchen/settings", icon: Settings },
];

export function KitchenSidebar({ isMobile = false }: { isMobile?: boolean } = {}) {
  const pathname = usePathname();
  const [counts, setCounts] = useState({ pending: 0, preparing: 0, ready: 0 });

  useEffect(() => {
    const sessionStr = localStorage.getItem("staffSession");
    if (!sessionStr) return;
    
    try {
      const parsed = JSON.parse(sessionStr);
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const qOrders = query(
        collection(db, "orders"),
        where("branchId", "==", parsed.branchId),
        where("createdAt", ">=", startOfDay.getTime()),
        orderBy("createdAt", "desc")
      );

      const unsub = onSnapshot(qOrders, (snapshot) => {
        let pending = 0;
        let preparing = 0;
        let ready = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.orderStatus === 'PENDING' || data.status === 'Pending') pending++;
          if (data.orderStatus === 'PREPARING' || data.status === 'Preparing') preparing++;
          if (data.orderStatus === 'READY' || data.status === 'Ready') ready++;
        });

        setCounts({ pending, preparing, ready });
      });

      return () => unsub();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const sidebarLinks = getSidebarLinks(counts);

  return (
    <aside className={cn("w-[280px] bg-[#111322] text-white h-screen flex flex-col shrink-0 z-20 border-r border-[#1F223B]", !isMobile && "hidden lg:flex")}>
      {/* Brand */}
      <div className="h-24 flex items-center px-8 shrink-0">
        <Link href="/kitchen/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5D34F5] rounded-full flex items-center justify-center shadow-lg shadow-[#5D34F5]/30">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[18px] font-black block leading-none text-white tracking-tight">Foodie POS</span>
            <span className="text-[11px] font-black text-[#5D34F5] tracking-widest uppercase mt-1.5 block">Kitchen Panel</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="overflow-y-auto py-4 px-4 space-y-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300 text-[14px] font-bold group",
                isActive
                  ? "bg-[#5D34F5] text-white shadow-lg shadow-[#5D34F5]/25"
                  : "text-[#8E95AD] hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-4">
                <Icon className={cn("w-[20px] h-[20px] shrink-0 transition-colors", isActive ? "text-white" : "text-[#8E95AD] group-hover:text-slate-300")} strokeWidth={isActive ? 2.5 : 2} />
                {link.name}
              </div>
              {link.badge && (
                <span className={cn("text-[11px] font-black px-2 py-0.5 rounded-full text-white", link.badgeColor)}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}


      </div>

      {/* Logout Footer */}
      <div className="p-4 mt-8">
        <Link href="/login" className="flex items-center gap-4 w-full transition-all duration-200 group hover:bg-red-500/10 px-5 py-3.5 rounded-2xl">
          <LogOut className="w-[20px] h-[20px] shrink-0 text-red-500 group-hover:text-red-400 transition-colors" strokeWidth={2} />
          <span className="text-[14px] font-bold text-red-500 group-hover:text-red-400 transition-colors">Logout</span>
        </Link>
      </div>
    </aside>
  );
}
