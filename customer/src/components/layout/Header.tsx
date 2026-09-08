"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, Bell, User, X, Heart, MapPin, ShoppingBag, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useBranchStore } from '@/lib/branch-store';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export function Header() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.getItemCount());
  const pathname = usePathname();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  const email = user?.email || "";
  const nameParts = user?.displayName ? user.displayName.split(' ') : [];
  let firstName = "";
  let lastName = "";
  
  if (nameParts.length > 0) {
    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(' ');
  } else if (email) {
    firstName = email.split('@')[0];
  }

  const initials = firstName ? firstName.charAt(0).toUpperCase() + (lastName ? lastName.charAt(0).toUpperCase() : "") : "";

  const { selectedBranchId, setSelectedBranch } = useBranchStore();
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const [brandName, setBrandName] = useState('Foodie Bites');
  const [brandIcon, setBrandIcon] = useState('🍴');

  useEffect(() => {
    setMounted(true);
    
    // Fetch Branches
    const fetchBranches = async () => {
      try {
        const snap = await getDocs(collection(db, "branches"));
        const b = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.id }));
        setBranches(b);
        if (b.length > 0) {
          if (!useBranchStore.getState().selectedBranchId || !b.find(br => br.id === useBranchStore.getState().selectedBranchId)) {
            setSelectedBranch(b[0].id, b[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    };
    fetchBranches();

    // Fetch Global Settings
    const fetchGlobalSettings = async () => {
      try {
        const docRef = doc(db, "siteSettings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.brandName) setBrandName(data.brandName);
          if (data.brandIcon) setBrandIcon(data.brandIcon);
        }
      } catch (err) {
        console.error("Failed to fetch global settings", err);
      }
    };
    fetchGlobalSettings();
  }, []);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const branchName = branches.find(b => b.id === selectedId)?.name || "Unknown Branch";
    setSelectedBranch(selectedId, branchName);
  };

  // Hide header on auth pages as per standard app design
  if (pathname.includes('/login') || pathname.includes('/signup')) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/menu?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="relative z-50 w-full border-b border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="container mx-auto px-4 h-[70px] flex items-center justify-between gap-4">
        {/* Left Logo */}
        <Link href="/" className="flex items-center gap-2 min-w-[150px] group">
          <span className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <span className="text-primary text-2xl group-hover:scale-110 transition-transform">{brandIcon}</span> {brandName}
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center justify-center gap-8 flex-1">
          <Link href="/" className={`text-sm font-medium transition-colors ${pathname === '/' ? 'text-primary relative after:absolute after:bottom-[-25px] after:left-0 after:w-full after:h-0.5 after:bg-primary' : 'hover:text-primary text-slate-600'}`}>Home</Link>
          <Link href="/menu" className={`text-sm font-medium transition-colors ${pathname.startsWith('/menu') ? 'text-primary relative after:absolute after:bottom-[-25px] after:left-0 after:w-full after:h-[3px] after:bg-primary' : 'hover:text-primary text-slate-600'}`}>Product</Link>
          <Link href="/about" className={`text-sm font-medium transition-colors ${pathname === '/about' ? 'text-primary relative after:absolute after:bottom-[-25px] after:left-0 after:w-full after:h-[3px] after:bg-primary' : 'hover:text-primary text-slate-600'}`}>About</Link>
          <Link href="/contact" className={`text-sm font-medium transition-colors ${pathname === '/contact' ? 'text-primary relative after:absolute after:bottom-[-25px] after:left-0 after:w-full after:h-[3px] after:bg-primary' : 'hover:text-primary text-slate-600'}`}>Contact</Link>
        </nav>

        {/* Right Actions & Search */}
        <div className="flex items-center justify-end flex-1 md:flex-none gap-2">
          {/* Branch Selector */}
          <div className="hidden lg:flex items-center ml-2 border border-slate-200 rounded-full px-3 h-9 bg-slate-50 transition-colors hover:bg-slate-100">
            <MapPin className="w-4 h-4 text-primary mr-1.5 shrink-0" />
            <select 
              value={selectedBranchId}
              onChange={handleBranchChange}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none appearance-none cursor-pointer pr-4 max-w-[120px] truncate"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.2rem top 50%', backgroundSize: '0.65rem auto' }}
            >
              {branches.length === 0 && <option value="">Loading...</option>}
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Shifted Search */}
          <form onSubmit={handleSearch} className="hidden lg:flex w-52 xl:w-64 relative mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-4 h-9 bg-slate-100 border-slate-200 rounded-full shadow-inner focus-visible:ring-1 focus-visible:ring-primary/50 text-sm text-slate-900 placeholder:text-slate-500 transition-colors"
            />
          </form>
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-slate-100 hover:text-slate-900 rounded-full w-10 h-10 hidden sm:flex text-slate-500"
            onClick={() => alert("No new notifications")}
          >
            <Bell className="w-6 h-6 text-amber-500" />
            <span className="absolute top-2 right-2.5 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-slate-950"></span>
          </Button>

          <Link href="/wishlist">
            <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 hover:text-slate-900 rounded-full w-10 h-10 text-slate-500">
              <Heart className="w-6 h-6 text-rose-500" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute right-0 top-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-slate-950">
                  {wishlistCount}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 hover:text-slate-900 rounded-full w-10 h-10 text-slate-500">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
              {mounted && itemCount > 0 && (
                <span className="absolute right-0 top-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 border-2 border-slate-950">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Profile */}
          <div className="hidden sm:block">
            {mounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap hover:bg-slate-100 hover:text-slate-900 rounded-full w-10 h-10 bg-slate-100 border border-slate-200 ml-1 text-slate-500 overflow-hidden cursor-pointer focus:outline-none">
                    {initials ? (
                      <span className="text-indigo-600 font-black text-sm tracking-widest">{initials}</span>
                    ) : (
                      <User className="w-5 h-5 text-indigo-500" />
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white/90 backdrop-blur-xl mt-2">
                  <DropdownMenuItem onClick={() => window.location.href = '/profile'} className="cursor-pointer font-bold text-[15px] text-slate-700 hover:text-[#6D28D9] focus:text-[#6D28D9] hover:bg-purple-50/80 focus:bg-purple-50/80 rounded-xl py-3 px-4 mb-1 transition-all flex items-center gap-3">
                    <User className="w-4 h-4 opacity-70" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/order-history'} className="cursor-pointer font-bold text-[15px] text-slate-700 hover:text-[#6D28D9] focus:text-[#6D28D9] hover:bg-purple-50/80 focus:bg-purple-50/80 rounded-xl py-3 px-4 mb-1 transition-all flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 opacity-70" />
                    Order History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/reservation-history'} className="cursor-pointer font-bold text-[15px] text-slate-700 hover:text-[#6D28D9] focus:text-[#6D28D9] hover:bg-purple-50/80 focus:bg-purple-50/80 rounded-xl py-3 px-4 transition-all flex items-center gap-3">
                    <Calendar className="w-4 h-4 opacity-70" />
                    Reservation History
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="icon" className="hover:bg-slate-100 hover:text-slate-900 rounded-full w-10 h-10 bg-slate-100 border border-slate-200 ml-1 text-slate-500 overflow-hidden">
                  <User className="w-5 h-5 text-indigo-500" />
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger className="md:hidden hover:bg-slate-100 hover:text-slate-900 text-slate-500 ml-1 w-10 h-10 flex items-center justify-center rounded-xl">
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-slate-950 border-slate-800 text-slate-200">
              <SheetHeader>
                <SheetTitle className="text-white text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 mt-6">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 h-11 bg-slate-900 border-slate-700/50 text-slate-200"
                  />
                </form>

                <nav className="flex flex-col gap-4">
                  <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors flex items-center gap-3">
                    Home
                  </Link>
                  <Link href="/menu" onClick={() => setIsMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors flex items-center gap-3">
                    Menu
                  </Link>
                  {isLoggedIn ? (
                    <>
                      <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors flex items-center gap-3">
                        <User className="w-5 h-5" />
                        My Profile
                      </Link>
                      <Link href="/order-history" onClick={() => setIsMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5" />
                        Order History
                      </Link>
                      <Link href="/reservation-history" onClick={() => setIsMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors flex items-center gap-3">
                        <Calendar className="w-5 h-5" />
                        Reservation History
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors flex items-center gap-3">
                        Log in
                      </Link>
                      <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors flex items-center gap-3">
                        Sign up
                      </Link>
                    </>
                  )}
                  <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors flex items-center gap-3">
                    Wishlist ({mounted ? wishlistCount : 0})
                  </Link>
                  <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className="text-lg hover:text-primary transition-colors flex items-center gap-3">
                    Cart ({mounted ? itemCount : 0})
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
