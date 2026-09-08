"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ChevronRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      // 1. Authenticate with Firebase Auth
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);

      // 2. Fetch the staff profile from Firestore now that we have permissions
      let querySnapshot = await getDocs(
        query(collection(db, "staff"), where("email", "==", cleanEmail))
      );
      
      if (querySnapshot.empty) {
        // Fallback: match case-insensitively across staff docs
        const allStaffSnap = await getDocs(collection(db, "staff"));
        const match = allStaffSnap.docs.find(
          (d) => (d.data().email || "").trim().toLowerCase() === cleanEmail
        );
        if (match) {
          querySnapshot = { docs: [match], empty: false } as any;
        } else {
          throw new Error("Staff profile not found in database.");
        }
      }

      const staffDoc = querySnapshot.docs[0];
      const staffData = staffDoc.data();
      
      if (staffData.status !== "Active") {
        throw new Error("Your account has been disabled. Please contact the administrator.");
      }
      
      // Store session data
      const sessionData = {
        id: staffDoc.id,
        name: staffData.name,
        role: staffData.role,
        branchId: staffData.branchId,
        restaurantId: staffData.restaurantId
      };
      localStorage.setItem("staffSession", JSON.stringify(sessionData));

      setIsSuccess(true);
      
      setTimeout(() => {
        const role = (staffData.role || "").toLowerCase().trim();
        if (role.includes("cashier")) {
          router.push("/cashier/pos");
        } else if (role.includes("waiter")) {
          router.push("/waiter/dashboard");
        } else if (role.includes("kitchen") || role.includes("chef") || role.includes("cook")) {
          router.push("/kitchen/dashboard");
        } else {
          router.push("/manager/dashboard");
        }
      }, 600);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 relative overflow-hidden font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />

      {/* Left side: Premium Branding */}
      <div className="hidden lg:flex w-[55%] relative items-center justify-center overflow-hidden p-12">
        {/* Deep, rich background image with gradient overlay */}
        <div className="absolute inset-0 bg-slate-900 z-0"></div>
        {/* Using a visually similar high-quality Unsplash image of a sunny wooden restaurant patio. To use the exact local file, change this to '/your-image-name.jpg' */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-60 mix-blend-luminosity z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-purple-900/80 z-10"></div>
        
        {/* Floating Abstract Elements */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} 
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-24 left-24 w-32 h-32 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md z-20 flex items-center justify-center"
        >
          <ShieldCheck className="w-12 h-12 text-purple-300/50" />
        </motion.div>

        <motion.div 
          animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-32 right-32 w-40 h-40 rounded-full border border-white/10 bg-white/5 backdrop-blur-md z-20 flex items-center justify-center"
        >
          <Zap className="w-16 h-16 text-blue-300/50" />
        </motion.div>

        {/* Content */}
        <div className="relative z-30 max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold tracking-wide mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM ONLINE
            </div>
            <h1 className="text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Manage your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">restaurant</span><br/>
              with brilliance.
            </h1>
            <p className="text-xl text-slate-300 font-medium leading-relaxed mb-12">
              Foodie POS provides an intuitive, real-time operating system for your entire staff.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl">
                 <h3 className="text-white font-bold text-2xl mb-1">99.9%</h3>
                 <p className="text-slate-400 text-sm font-medium">Uptime Guarantee</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl">
                 <h3 className="text-white font-bold text-2xl mb-1">&lt;50ms</h3>
                 <p className="text-slate-400 text-sm font-medium">Real-time Sync</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side: Glassmorphism Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 z-20">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-[440px]"
        >
          {/* Glass Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">
            
            {/* Glossy highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />

            <div className="text-center lg:text-left mb-10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 mx-auto lg:mx-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 mt-2 font-medium">Enter your credentials to access the POS</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-bold ml-1">Email or Username</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@foodiepos.com"
                    className="pl-12 h-14 bg-slate-50/50 border-slate-200/60 rounded-2xl text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-purple-500/20 focus-visible:border-purple-500/50 focus-visible:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-slate-700 font-bold">Password</Label>
                  <button type="button" className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors">Forgot Password?</button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 h-14 bg-slate-50/50 border-slate-200/60 rounded-2xl text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-purple-500/20 focus-visible:border-purple-500/50 focus-visible:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pb-4 pt-1 ml-1">
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input type="checkbox" id="remember" className="rounded-md border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4 bg-slate-50 cursor-pointer transition-all" />
                  </div>
                  <div className="ml-3 text-sm">
                    <Label htmlFor="remember" className="text-slate-600 font-bold cursor-pointer select-none">Remember me for 30 days</Label>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={loading || isSuccess}
                  className={`w-full h-14 rounded-2xl text-base font-black transition-all duration-300 relative overflow-hidden ${
                    isSuccess 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30" 
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-0.5"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Authenticating...</span>
                      </motion.div>
                    ) : isSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                        <span>Success!</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="default"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2 w-full"
                      >
                        <span>Sign In</span>
                        <ChevronRight className="w-5 h-5 opacity-70" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-sm font-bold text-slate-500">
                Need help? <a href="#" className="text-purple-600 hover:text-purple-700 hover:underline transition-all">Contact IT Support</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
