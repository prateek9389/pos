"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Star, Clock, MapPin, ChefHat, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { useBranchStore } from "@/lib/branch-store";

export default function Home() {
  const { selectedBranchId } = useBranchStore();
  const [specialItems, setSpecialItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([
    { id: "all", name: "All", icon: "🍱", count: 86, isStatic: true }
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "menuCategories"));
        const fetched = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          image: doc.data().image,
          count: doc.data().items || 0,
          isStatic: false
        }));
        setCategories([
          { id: "all", name: "All", icon: "🍱", count: fetched.reduce((acc, cat) => acc + cat.count, 0), isStatic: true },
          ...fetched
        ]);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);
  useEffect(() => {
    const fetchSpecialItems = async () => {
      if (!selectedBranchId) return;
      try {
        const q = query(
          collection(db, "menuItems"), 
          where("available", "==", true)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(item => !item.branchId || item.branchId === selectedBranchId)
          .slice(0, 3);
        setSpecialItems(items);
      } catch (error) {
        console.error("Failed to fetch special items:", error);
      }
    };
    fetchSpecialItems();
  }, [selectedBranchId]);
  const fadeUp: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col flex-1 bg-background overflow-hidden pb-10">

      {/* Premium Hero Section */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-20 pb-32">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-orange-500/5 rounded-full blur-[100px] -z-10 -translate-x-1/3 translate-y-1/3" />

        <div className="container mx-auto px-6 lg:px-8 flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-8">

          {/* Left Text */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp}
            className="w-full lg:w-1/2 flex flex-col items-start space-y-8 z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              Freshly prepared every day
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Delicious food, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
                delivered
              </span> to you.
            </h1>

            <p className="text-lg lg:text-xl text-slate-600 font-medium max-w-lg leading-relaxed">
              Experience the finest culinary delights crafted by our master chefs. Order now and satisfy your cravings with just a few clicks.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/menu"
                className={buttonVariants({
                  size: "lg",
                  className: "w-full sm:w-[220px] justify-center h-14 px-8 rounded-full text-lg font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                })}
              >
                Explore Menu <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/reservations"
                className={buttonVariants({
                  size: "lg",
                  className: "w-full sm:w-[220px] justify-center h-14 px-8 rounded-full text-lg font-bold bg-blue-600 text-white hover:bg-blue-700 border-0 shadow-lg shadow-blue-600/30 gap-2 hover:scale-105 transition-transform"
                })}
              >
                Book Table
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-8 pt-6 border-t border-slate-200 w-full max-w-md">
              <div>
                <p className="text-3xl font-black text-slate-900">4.9</p>
                <div className="flex items-center gap-1 text-amber-500 mt-1">
                  <Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" />
                </div>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div>
                <p className="text-3xl font-black text-slate-900">10k+</p>
                <p className="text-sm font-bold text-slate-500 mt-1">Happy Customers</p>
              </div>
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full lg:w-1/2 relative z-10 mt-8 lg:mt-0"
          >
            <div className="relative w-full h-[350px] sm:h-[450px] lg:h-[550px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/pizza.avif"
                alt="Signature Dish Banner"
                fill
                className="object-cover"
                priority
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Explore Menu CTA */}
      <section className="pb-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 py-16 sm:py-24 px-6 text-center isolate shadow-2xl">
            {/* Background Marquee Text */}
            <div className="absolute inset-0 flex items-center overflow-hidden opacity-[0.03] pointer-events-none -z-10 select-none">
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
                className="flex whitespace-nowrap text-[10rem] sm:text-[14rem] font-black text-white leading-none tracking-tighter"
              >
                <span>HUNGRY FOR MORE? CRAVING DELICIOUS FOOD?&nbsp;</span>
                <span>HUNGRY FOR MORE? CRAVING DELICIOUS FOOD?&nbsp;</span>
              </motion.div>
            </div>

            {/* Ambient glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/30 blur-[120px] rounded-full -z-10" />

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-white text-xs sm:text-sm font-bold tracking-widest uppercase mb-6 border border-white/20 backdrop-blur-md shadow-lg">
                <ChefHat className="w-4 h-4 text-primary" />
                <span>Over 50+ Signature Dishes</span>
              </span>

              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Discover a world of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">flavors</span> waiting for you.
              </h3>

              <p className="text-slate-300 font-medium text-base sm:text-lg mb-10 max-w-xl">
                From sizzling appetizers to decadent desserts, explore our full menu handcrafted with love and the freshest ingredients.
              </p>

              <Link
                href="/menu"
                className="group relative inline-flex items-center justify-center h-16 px-10 rounded-full font-black text-lg bg-white text-slate-900 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 ring-4 ring-white/10"
              >
                <div className="absolute inset-0 bg-slate-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                  Explore Full Menu <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Culinary Portfolio Style */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-[#6B21A8] font-bold tracking-widest uppercase text-xs mb-4 block">
                Culinary Portfolio
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
                Explore our <br className="hidden sm:block" /> signatures.
              </h2>
            </div>
            <div className="pb-2">
              <Link href="/menu" className="group flex items-center gap-3 text-sm sm:text-base font-bold text-slate-900">
                View All Categories
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-sm">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                </span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {categories.slice(0, 6).map((category, idx) => {
              const cardColors = [
                "bg-[#F3E8FF] text-[#6B21A8]", // Purple
                "bg-[#FFEDD5] text-[#C2410C]", // Orange
                "bg-[#FEF3C7] text-[#B45309]", // Amber
                "bg-[#FFE4E6] text-[#BE123C]", // Rose
                "bg-[#E0F2FE] text-[#0369A1]", // Sky
                "bg-[#FCE7F3] text-[#BE185D]", // Pink
              ][idx % 6];

              return (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                  key={category.id}
                  className="h-full"
                >
                  <Link href={`/menu?category=${category.name.toLowerCase() === 'all' ? 'all' : category.name}`} className="block h-full outline-none">
                    <div className={`group relative rounded-[2rem] p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-500 ease-out h-full overflow-hidden isolate ${cardColors} border-2 border-transparent hover:border-black/10 hover:shadow-xl hover:-translate-y-2`}>

                      <div className="mb-4 sm:mb-6 transform group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
                        {category.isStatic ? (
                          <span className="text-4xl sm:text-5xl">{category.icon}</span>
                        ) : (
                          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-md">
                            <Image src={category.image} alt={category.name} fill className="object-cover" />
                          </div>
                        )}
                      </div>

                      <h3 className="font-black text-lg sm:text-xl mb-1.5 tracking-tight">
                        {category.name}
                      </h3>

                      <p className="text-[11px] sm:text-xs font-bold opacity-75">
                        {category.count} items
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending Dishes */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Trending Today</h2>
            <p className="text-slate-500 font-medium text-lg">Our most loved dishes, handpicked just for you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {specialItems.map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                key={item.id}
              >
                <Card className="rounded-[2rem] overflow-hidden border-0 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                  <Link href={`/food/${item.id}`} className="block h-full w-full cursor-pointer">
                  <div className="relative h-64 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900/10 z-10 group-hover:bg-transparent transition-colors" />
                    <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full font-black text-slate-900 shadow-sm flex items-center gap-1 text-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 4.8
                    </div>
                  </div>
                  <CardContent className="p-6 bg-white relative">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black text-xl text-slate-900 group-hover:text-primary transition-colors">{item.name}</h3>
                      <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 ${item.isVeg ? 'border-emerald-500' : 'border-red-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      </div>
                    </div>
                    <p className="text-slate-500 font-medium text-sm mb-6 line-clamp-2">
                      {item.description}
                    </p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-900">₹{item.price}</span>
                        </div>
                        <Button 
                          className="rounded-full font-bold px-6 bg-slate-900 hover:bg-primary shadow-md relative z-20"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16 max-w-2xl mx-auto flex flex-col items-center">
            <Link href="/menu" className="group relative inline-flex items-center justify-center h-14 px-10 rounded-full font-bold text-lg bg-slate-900 text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-slate-900/20">
              <span className="relative z-10 flex items-center gap-2">
                Explore Full Menu <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
