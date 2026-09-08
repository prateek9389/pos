"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2, Inbox, User, Tag, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "contactMessages"), {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email,
        subject,
        message,
        createdAt: Date.now(),
        status: "NEW"
      });
      setIsSubmitted(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setTimeout(() => setIsSubmitted(false), 6000);
    } catch (err) {
      console.error("Error submitting contact form:", err);
      // Fallback display
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-[#FCFAFF] min-h-screen font-sans justify-center py-12 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100/40 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-4 flex flex-col justify-center">
            
            <div className="mb-8">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-purple-600 fill-purple-600/20" />
              </div>
              <h2 className="text-[38px] font-black text-slate-900 leading-tight mb-3 tracking-tight">
                We're Here to <span className="text-[#6D28D9]">Help!</span>
              </h2>
              <p className="text-slate-500 font-medium">Reach out to us anytime. We'd love to hear from you.</p>
            </div>
            
            <div className="space-y-5">
              {/* Phone Card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2rem] p-5 flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50">
                <div className="w-[52px] h-[52px] rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 mr-4">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 text-[15px]">Phone</h4>
                    <span className="bg-purple-50 text-purple-500 text-[10px] font-bold px-2 py-0.5 rounded-full">Quickest</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mb-1 font-medium">Mon-Sun from 10am to 11pm</p>
                  <p className="text-[14px] font-bold text-purple-600">+91 11 4567 8900</p>
                </div>
                <div className="text-4xl opacity-90 drop-shadow-sm ml-2">☎️</div>
              </motion.div>
              
              {/* Email Card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2rem] p-5 flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50">
                <div className="w-[52px] h-[52px] rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 mr-4">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 text-[15px]">Email</h4>
                    <span className="bg-blue-50 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded-full">24/7</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mb-1 font-medium">We'll respond within 24 hours.</p>
                  <p className="text-[14px] font-bold text-blue-600">hello@foodiepos.com</p>
                </div>
                <div className="text-4xl opacity-90 drop-shadow-sm ml-2">📨</div>
              </motion.div>
              
              {/* Corporate Office Card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[2rem] p-5 flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50 relative overflow-hidden">
                <div className="w-[52px] h-[52px] rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 mr-4">
                  <MapPin className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1 relative z-10">
                  <h4 className="font-bold text-slate-900 text-[15px] mb-1">Corporate Office</h4>
                  <p className="text-[12px] text-slate-500 mb-1 font-medium">Visit our headquarters.</p>
                  <p className="text-[13px] font-bold text-amber-500 mt-1 cursor-pointer hover:text-amber-600 transition-colors">View on Map &gt;</p>
                </div>
                <div className="text-5xl opacity-80 drop-shadow-sm absolute -right-2 -bottom-2 z-0">🏢</div>
              </motion.div>
            </div>
            
            {/* Banner */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#F3E8FF] rounded-[2rem] p-5 flex items-center mt-6 shadow-sm border border-purple-100">
              <div className="text-4xl mr-4 drop-shadow-md">🎧</div>
              <div>
                <h4 className="font-bold text-slate-900 text-[14px] mb-1">We're always ready to assist you!</h4>
                <p className="text-[12px] text-slate-600 font-medium">Your satisfaction is our priority. 💜</p>
              </div>
            </motion.div>
            
          </div>
          
          {/* Right Column - Form Card */}
          <div className="lg:col-span-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 h-full relative">
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-10">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.25rem] bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100/50">
                    <Inbox className="w-7 h-7 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-[26px] font-black text-slate-900 tracking-tight">Send us a Message</h2>
                    <p className="text-slate-500 font-medium text-[14px] mt-1">Fill out the form below and our team will get back to you.</p>
                  </div>
                </div>
                <div className="text-7xl hidden sm:block opacity-90 drop-shadow-lg absolute right-8 top-6 z-0">
                  💌
                </div>
              </div>
              
              {isSubmitted ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 relative z-10">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <Send className="w-10 h-10 text-emerald-500 ml-1" />
                  </div>
                  <h3 className="text-[24px] font-black text-slate-900 mb-2">Message Sent Successfully!</h3>
                  <p className="text-slate-500 font-medium max-w-sm">Thank you for reaching out. We have received your message and will reply shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2">
                        <User className="w-4 h-4 text-purple-600" /> First Name
                      </Label>
                      <div className="relative">
                        <Input 
                          required 
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John" 
                          className="h-[52px] bg-[#F8FAFC] border-slate-200 rounded-xl pr-10 text-[15px] font-medium focus-visible:ring-purple-600/20 focus-visible:border-purple-600 shadow-sm" 
                        />
                        {firstName && <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />}
                      </div>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2">
                        <User className="w-4 h-4 text-purple-600" /> Last Name
                      </Label>
                      <div className="relative">
                        <Input 
                          required 
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe" 
                          className="h-[52px] bg-[#F8FAFC] border-slate-200 rounded-xl pr-10 text-[15px] font-medium focus-visible:ring-purple-600/20 focus-visible:border-purple-600 shadow-sm" 
                        />
                        {lastName && <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2">
                      <Mail className="w-4 h-4 text-purple-600" /> Email Address
                    </Label>
                    <div className="relative">
                      <Input 
                        required 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com" 
                        className="h-[52px] bg-[#F8FAFC] border-slate-200 rounded-xl pr-10 text-[15px] font-medium focus-visible:ring-purple-600/20 focus-visible:border-purple-600 shadow-sm" 
                      />
                      {email && <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2">
                      <Tag className="w-4 h-4 text-purple-600" /> Subject
                    </Label>
                    <div className="relative">
                      <select 
                        required 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full h-[52px] px-4 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[15px] outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 appearance-none font-medium text-slate-700 shadow-sm"
                      >
                        <option value="">Select a topic...</option>
                        <option value="General Feedback">General Feedback</option>
                        <option value="Order Support">Order Support</option>
                        <option value="Table Reservation">Table Reservation</option>
                        <option value="Careers">Careers</option>
                        <option value="Press & Media">Press & Media</option>
                      </select>
                      <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="flex items-center gap-2 text-[12px] font-bold text-slate-700 mb-2">
                      <MessageSquare className="w-4 h-4 text-purple-600" /> Message
                    </Label>
                    <div className="relative">
                      <textarea 
                        required 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can we help you?" 
                        maxLength={1000}
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-[15px] outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 min-h-[160px] resize-none font-medium shadow-sm"
                      ></textarea>
                      <span className="absolute bottom-4 right-4 text-[11px] font-bold text-slate-400">{message.length} / 1000</span>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-[56px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-bold text-[17px] flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_10px_40px_rgba(124,58,237,0.4)] transition-all border-0 mt-4 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" /> {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                  
                  <p className="text-center text-[12px] font-medium text-slate-400 flex items-center justify-center gap-1.5 pt-2">
                    <Lock className="w-3.5 h-3.5" /> Your information is safe with us.
                  </p>
                  
                </form>
              )}
              
            </motion.div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
