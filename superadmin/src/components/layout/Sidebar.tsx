"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  MapPin,
  Users,
  MenuSquare,
  ShoppingCart,
  CalendarCheck,
  UserSquare2,
  Package,
  Ticket,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Crown,
  ChevronDown,
  Armchair,
  Tag
} from "lucide-react";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const sidebarLinks = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Restaurants", href: "/restaurants", icon: Store },
  { name: "Branches", href: "/branches", icon: MapPin },
  { name: "Staff Management", href: "/staff", icon: Users },
  { name: "Categories", href: "/categories", icon: Tag },
  { name: "Menu Management", href: "/menu", icon: MenuSquare },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Coupons & Offers", href: "/coupons", icon: Ticket },
  { name: "Tables", href: "/tables", icon: Armchair },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Reservations", href: "/reservations", icon: CalendarCheck },
  { name: "Customers", href: "/customers", icon: UserSquare2 },
  { name: "Payments", href: "/payments", icon: CreditCard },

  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Logout", href: "/login", icon: LogOut },
];

export function Sidebar({ isMobile = false }: { isMobile?: boolean } = {}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  // Hide sidebar on auth pages
  if (pathname.includes('/login')) {
    return null;
  }

  return (
    <aside className={cn("w-[280px] bg-[#0F1021] text-white h-screen flex flex-col shrink-0", !isMobile && "hidden md:flex")}>
      
      {/* Logo Area */}
      <div className="h-16 flex items-center px-8 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6366F1] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-white text-xl">🍴</span>
          </div>
          <div>
            <span className="text-[22px] font-bold tracking-tight block leading-tight">Foodie POS</span>
            <span className="text-xs text-slate-400 font-medium">Super Admin</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(`${link.href}/`) && link.href !== '/');
          const Icon = link.icon;
          const isLogout = link.name === "Logout";
          
          return (
            <Link
              key={link.name}
              href={isLogout ? "#" : link.href}
              onClick={isLogout ? handleLogout : undefined}
              className={cn(
                "flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 text-[15px] font-semibold tracking-wide",
                isActive && !isLogout
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white shadow-[0_4px_20px_rgba(124,58,237,0.3)]" 
                  : isLogout
                    ? "text-red-500 hover:bg-red-500/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive && !isLogout ? "text-white" : isLogout ? "text-red-500" : "text-slate-400")} />
              {link.name}
            </Link>
          );
        })}
      </div>



      {/* User Profile */}
      <div className="p-4 border-t border-white/5 bg-[#0F1021]">
        <Link href="/profile" className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors block w-full">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
              <Image 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" 
                alt="Super Admin" 
                fill 
                className="object-cover"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0F1021]"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Super Admin</p>
              <p className="text-[11px] text-slate-400 font-medium truncate w-[160px]">administrator@foodiepos.com</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        </Link>
      </div>
    </aside>
  );
}
