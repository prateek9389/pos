"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TerminalSquare, ClipboardList, ReceiptText, Grid2X2, Users,
  BookOpen, BadgePercent, BarChart3, Settings,
  PauseCircle, RotateCcw, UserPlus, LogOut, Utensils
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "POS", href: "/cashier/pos", icon: TerminalSquare },
  { name: "Orders", href: "/cashier/orders", icon: ClipboardList },
  { name: "Transactions", href: "/cashier/transactions", icon: ReceiptText },
  { name: "Tables", href: "/cashier/tables", icon: Grid2X2 },
  { name: "Customers", href: "/cashier/customers", icon: Users },
  { name: "Menu", href: "/cashier/menu", icon: BookOpen },
  { name: "Discounts", href: "/cashier/discounts", icon: BadgePercent },

  { name: "Settings", href: "/cashier/settings", icon: Settings },
];

export default function CashierSidebar({ isMobile = false }: { isMobile?: boolean } = {}) {
  const pathname = usePathname();

  return (
    <aside className={cn("w-[280px] bg-[#141226] text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto hide-scrollbar z-50 print:hidden", !isMobile && "hidden lg:flex")}>

      {/* Logo Area */}
      <div className="p-8 shrink-0">
        <Link href="/cashier/pos" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#5D34F5] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#5D34F5]/30 group-hover:scale-105 transition-transform">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[18px] font-black tracking-tight text-white leading-none mb-1">Foodie POS</h1>
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5D34F5]" />
              <p className="text-[10px] font-black tracking-widest text-[#A2A1A8] uppercase">Cashier Panel</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.name === "POS" && pathname.startsWith("/cashier/pos"));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[14px] font-bold transition-all relative ${isActive
                  ? "bg-[#5D34F5] text-white shadow-lg shadow-[#5D34F5]/25"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/40"}`} />
              {item.name}
            </Link>
          );
        })}
      </div>



      {/* Logout Button */}
      <div className="p-4 shrink-0">
        <Link
          href="/login"
          className="flex items-center gap-3 px-5 py-4 rounded-xl text-[14px] font-bold text-white hover:bg-white/5 transition-all group"
        >
          <LogOut className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
