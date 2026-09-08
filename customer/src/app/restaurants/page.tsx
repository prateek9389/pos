"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Clock, Navigation, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const MOCK_RESTAURANTS = [
  {
    id: "r1",
    name: "Foodie POS - Connaught Place",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop",
    address: "B-45, Inner Circle, Connaught Place, New Delhi",
    phone: "+91 11 4567 8900",
    hours: "11:00 AM - 11:30 PM (Mon-Sun)",
    rating: 4.8,
    reviews: 1240,
    isOpen: true,
    features: ["Dine-in", "Takeaway", "Outdoor Seating"]
  },
  {
    id: "r2",
    name: "Foodie POS - Cyber Hub",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop",
    address: "Unit 2A, DLF Cyber Hub, Gurugram",
    phone: "+91 124 456 7890",
    hours: "12:00 PM - 1:00 AM (Mon-Sun)",
    rating: 4.9,
    reviews: 2150,
    isOpen: true,
    features: ["Dine-in", "Takeaway", "Bar", "Live Music"]
  },
  {
    id: "r3",
    name: "Foodie POS - Saket",
    image: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?q=80&w=2000&auto=format&fit=crop",
    address: "Select Citywalk Mall, Saket, New Delhi",
    phone: "+91 11 2345 6789",
    hours: "10:00 AM - 10:30 PM (Mon-Sun)",
    rating: 4.6,
    reviews: 890,
    isOpen: false,
    features: ["Dine-in", "Takeaway", "Mall Parking"]
  }
];

export default function RestaurantsPage() {
  return (
    <div className="flex flex-col flex-1 pb-20 bg-slate-50 min-h-screen font-sans">
      
      {/* Premium Page Header */}
      <div className="bg-slate-900 pt-16 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338988a2e8c0?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/20 to-transparent"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4"
          >
            Our Locations
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-300 font-medium text-lg max-w-xl mx-auto"
          >
            Find a Foodie POS restaurant near you and experience culinary excellence in a beautiful ambiance.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 -mt-10 relative z-20">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {MOCK_RESTAURANTS.map((restaurant, index) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              key={restaurant.id}
            >
              <Card className="rounded-[2rem] border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden bg-white h-full flex flex-col group">
                <div className="relative w-full h-64 overflow-hidden">
                  <Image
                    src={restaurant.image}
                    alt={restaurant.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-black shadow-lg backdrop-blur-md flex items-center gap-1.5 ${
                      restaurant.isOpen ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
                    }`}>
                      <span className={`w-2 h-2 rounded-full bg-white ${restaurant.isOpen ? 'animate-pulse' : ''}`} />
                      {restaurant.isOpen ? 'OPEN NOW' : 'CLOSED'}
                    </span>
                  </div>
                  
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full font-black text-slate-900 shadow-lg flex items-center gap-1 text-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {restaurant.rating}
                  </div>
                  
                  {/* Title overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                     <h2 className="text-2xl font-black text-white leading-tight">{restaurant.name}</h2>
                  </div>
                </div>
                
                <CardContent className="p-6 flex flex-col flex-1">
                  
                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">{restaurant.address}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-slate-600 font-medium text-sm">{restaurant.hours}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-slate-600 font-medium text-sm">{restaurant.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {restaurant.features.map(feature => (
                      <span key={feature} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-100">
                    <Button variant="outline" className="w-full rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 h-12">
                      <Navigation className="w-4 h-4" /> Directions
                    </Button>
                    <Link href={`/reservations?restaurant=${restaurant.id}`}>
                      <Button className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-12">
                        Book a Table
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Mock Map Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-white rounded-[2rem] p-4 lg:p-8 shadow-xl shadow-slate-200/50 border border-slate-100"
        >
           <div className="flex flex-col lg:flex-row gap-8 items-center">
              <div className="w-full lg:w-1/3">
                 <h2 className="text-3xl font-black text-slate-900 mb-4">Find us on the map</h2>
                 <p className="text-slate-500 font-medium mb-8">
                   We are expanding! Currently serving in 3 prime locations across the NCR region. 
                   More locations coming soon.
                 </p>
                 <div className="space-y-4">
                   <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                       <MapPin className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                       <p className="font-bold text-slate-900">Delhi NCR Region</p>
                       <p className="text-xs font-medium text-slate-500">3 Active Branches</p>
                     </div>
                   </div>
                 </div>
              </div>
              <div className="w-full lg:w-2/3 h-[400px] bg-slate-100 rounded-[1.5rem] relative overflow-hidden border border-slate-200">
                 {/* Visual representation of a map since we don't have Google Maps API here */}
                 <Image 
                   src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                   alt="Map"
                   fill
                   className="object-cover opacity-60 mix-blend-luminosity"
                 />
                 <div className="absolute inset-0 bg-primary/5"></div>
                 
                 {/* Fake Map Pins */}
                 <div className="absolute top-[40%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                    <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">Connaught Place</div>
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                 </div>
                 
                 <div className="absolute top-[20%] left-[60%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                    <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">Cyber Hub</div>
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                 </div>
                 
                 <div className="absolute top-[60%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                    <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">Saket</div>
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>

      </div>
    </div>
  );
}
