import Image from "next/image";
import { ScanLine, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />

      {/* Left Side - Premium Branding */}
      <div className="hidden lg:flex flex-col w-[55%] relative items-center justify-center overflow-hidden p-12">
        <div className="absolute inset-0 bg-slate-900 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-primary/80 z-10"></div>
        
        {/* Floating Elements (CSS animated since layout is a server component) */}
        <div className="absolute top-24 left-24 w-32 h-32 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md z-20 flex items-center justify-center animate-[bounce_6s_infinite_ease-in-out]">
          <ShieldCheck className="w-12 h-12 text-primary-300/50" />
        </div>

        <div className="absolute bottom-32 right-32 w-40 h-40 rounded-full border border-white/10 bg-white/5 backdrop-blur-md z-20 flex items-center justify-center animate-[bounce_8s_infinite_ease-in-out]">
          <Zap className="w-16 h-16 text-orange-300/50" />
        </div>

        <div className="relative z-30 max-w-lg text-center lg:text-left w-full">
          <Link href="/" className="inline-block mb-10">
            <span className="text-3xl font-black flex items-center gap-3 text-white tracking-tight hover:text-primary-200 transition-colors">
              <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">🍽️</span> 
              Foodie POS
            </span>
          </Link>
          
          <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            Order food <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-orange-400">faster & easier.</span>
          </h1>
          <p className="text-xl text-slate-300 font-medium leading-relaxed mb-12">
            Join thousands of happy foodies who use our app for quick table ordering and exclusive delivery perks.
          </p>

          <button className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white p-5 rounded-2xl flex items-center gap-5 transition-all w-full max-w-sm group">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/20 group-hover:bg-white/30 transition-colors shrink-0">
              <ScanLine className="w-7 h-7 text-white" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-lg leading-tight mb-0.5">Scan QR on your table</h3>
              <p className="text-sm text-slate-300 font-medium">to view menu & place order</p>
            </div>
          </button>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 z-20 relative min-h-screen">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
}
