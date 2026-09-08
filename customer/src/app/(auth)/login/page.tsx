"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Mail, Lock, ChevronRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  email: z.string().min(1, "Email or Phone Number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().default(false).optional(),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 600);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in. Please check your credentials.");
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 600);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in with Google.");
      setIsLoading(false);
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">
        
        {/* Glossy highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />

        <div className="text-center lg:text-left mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 mt-2 font-medium">Log in to track orders and save your favorites.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label className="text-slate-700 font-bold ml-1">Email or Phone Number</Label>
                  <FormControl>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <Input 
                        placeholder="you@example.com" 
                        className="pl-12 h-14 bg-slate-50/50 border-slate-200/60 rounded-2xl text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary/20 focus-visible:border-primary/50 focus-visible:bg-white transition-all shadow-sm" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="ml-1 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label className="text-slate-700 font-bold">Password</Label>
                    <Link href="/forgot-password" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-12 h-14 bg-slate-50/50 border-slate-200/60 rounded-2xl text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary/20 focus-visible:border-primary/50 focus-visible:bg-white transition-all shadow-sm"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-10 w-10 hover:bg-slate-100 rounded-xl transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-slate-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="ml-1 text-xs" />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-3 pb-4 pt-1 ml-1">
              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 relative">
                    <FormControl>
                      <input 
                        type="checkbox" 
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded-md border-slate-300 text-primary focus:ring-primary h-4 w-4 bg-slate-50 cursor-pointer transition-all" 
                      />
                    </FormControl>
                    <Label className="text-slate-600 font-bold cursor-pointer select-none text-sm">
                      Remember me for 30 days
                    </Label>
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || isSuccess}
              className={`w-full h-14 rounded-2xl text-base font-black transition-all duration-300 relative overflow-hidden ${
                isSuccess 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30" 
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:-translate-y-0.5"
              }`}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </motion.div>
                ) : isSuccess ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Success!</span>
                  </motion.div>
                ) : (
                  <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 w-full">
                    <span>Sign In</span>
                    <ChevronRight className="w-5 h-5 opacity-70" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </form>
        </Form>

        <div className="relative py-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
            <span className="bg-white px-4 text-slate-400">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button onClick={handleGoogleSignIn} disabled={isLoading || isSuccess} variant="outline" type="button" className="w-full h-14 rounded-2xl border-slate-200 font-bold gap-3 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all text-slate-700">
            <Image src="https://www.svgrepo.com/show/475656/google-color.svg" width={20} height={20} alt="Google" />
            Google
          </Button>
        </div>

        <div className="text-center text-sm font-bold text-slate-600 mt-10">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors">
            Create an account
          </Link>
        </div>

      </div>
    </motion.div>
  );
}
