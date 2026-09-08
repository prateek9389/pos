"use client";

import Image from "next/image";
import { Leaf, Award, Heart, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-1 bg-white min-h-screen font-sans overflow-hidden">
      
      {/* Hero Section */}
      <div className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden">
        {/* Premium Background Elements */}
        <div className="absolute inset-0 bg-slate-50 z-0"></div>
        <div className="absolute inset-0 z-0 bg-slate-50 [background-size:32px_32px] [background-image:linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] opacity-20" />
        <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute top-20 left-0 w-[40vw] h-[40vw] bg-rose-500/5 rounded-full blur-[120px] -z-10 -translate-x-1/2" />
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10 mt-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="max-w-3xl flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6"
              >
                ESTABLISHED 2018
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6"
              >
                Passion for food, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">love for people.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl"
              >
                Foodie POS started with a simple vision: to create a dining experience that combines exceptional culinary artistry with warm, genuine hospitality.
              </motion.p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
              className="flex-1 relative w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <Image 
                src="/hero-interior.jpg"
                alt="Cafe Interior"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Our Story Grid */}
      <section className="py-24 relative z-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative h-[600px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
                <Image 
                  src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop"
                  alt="Restaurant interior"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-white p-6 rounded-[2rem] shadow-xl w-64 hidden md:block border border-slate-100">
                <p className="text-5xl font-black text-primary mb-2">1M+</p>
                <p className="font-bold text-slate-900 text-lg">Meals Served</p>
                <p className="text-sm text-slate-500 font-medium mt-1">Across our 3 branches since 2018.</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="space-y-8 lg:pl-10"
            >
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Our Story</h2>
              
              <div className="space-y-6 text-lg text-slate-600 font-medium leading-relaxed">
                <p>
                  It all began in a small kitchen in New Delhi. Our founder, driven by a passion for authentic flavors and modern culinary techniques, decided to create a space where food is celebrated.
                </p>
                <p>
                  We believe that a great meal is more than just food on a plate—it's an experience. From the carefully sourced local ingredients to the meticulously designed interiors, every detail at Foodie POS is crafted to bring you joy.
                </p>
                <p>
                  Today, we are proud to serve thousands of happy customers every week, continually pushing the boundaries of taste while staying true to our roots.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                <div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <Leaf className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="font-black text-slate-900 text-lg mb-1">Farm to Table</h4>
                  <p className="text-sm text-slate-500 font-medium">Fresh, local ingredients sourced daily.</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <h4 className="font-black text-slate-900 text-lg mb-1">Award Winning</h4>
                  <p className="text-sm text-slate-500 font-medium">Recognized for culinary excellence.</p>
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-black mb-4">Our Core Values</h2>
            <p className="text-slate-400 font-medium text-lg">The principles that guide everything we do in our kitchens and dining rooms.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Heart className="w-8 h-8 text-rose-400" />, title: "Hospitality First", desc: "We treat every guest like family, ensuring every visit is memorable and warm." },
              { icon: <ShieldCheck className="w-8 h-8 text-blue-400" />, title: "Uncompromising Quality", desc: "From ingredients to execution, we never settle for anything less than perfection." },
              { icon: <Leaf className="w-8 h-8 text-emerald-400" />, title: "Sustainability", desc: "Committed to eco-friendly practices and minimizing our environmental footprint." }
            ].map((value, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-black mb-3">{value.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
