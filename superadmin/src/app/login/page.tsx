"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Lock, Mail, ShieldCheck, ChevronRight, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SuperadminLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (email !== "prateeksengar8882@gmail.com") {
        throw new Error("Unauthorized access. Superadmin only.");
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user.email !== "prateeksengar8882@gmail.com") {
        await signOut(auth);
        throw new Error("Unauthorized access. Superadmin only.");
      }

      router.push("/");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px]"></div>
      
      <div className="relative z-10 max-w-[440px] w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 p-8 sm:p-10">
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 shadow-sm rounded-2xl flex items-center justify-center mb-6 border border-indigo-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Superadmin Access</h1>
          <p className="text-sm font-medium text-slate-500">
            Please authenticate to access the master dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium rounded-2xl flex items-center gap-3">
            <TriangleAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[15px] font-semibold text-slate-700">
              Email or Username
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#A855F7] transition-colors" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-12 h-14 bg-white border-slate-200 focus:border-[#A855F7] focus:ring-4 focus:ring-[#A855F7]/10 rounded-2xl text-[16px] text-slate-900 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[15px] font-semibold text-slate-700">
                Password
              </label>
              <a href="#" className="text-[14px] font-semibold text-[#A855F7] hover:text-[#9333EA] transition-colors">
                Forgot Password?
              </a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#A855F7] transition-colors" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-12 h-14 bg-white border-slate-200 focus:border-[#A855F7] focus:ring-4 focus:ring-[#A855F7]/10 rounded-2xl text-[16px] text-slate-900 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2 pb-4">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-5 h-5 rounded border-slate-300 text-[#0F172A] focus:ring-[#0F172A] cursor-pointer"
            />
            <label htmlFor="remember" className="text-[15px] font-semibold text-slate-600 cursor-pointer select-none">
              Remember me for 30 days
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-[16px] font-bold rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-[#7C3AED]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? "Authenticating..." : "Sign In"}
            {!isLoading && <ChevronRight className="w-5 h-5 opacity-70" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
