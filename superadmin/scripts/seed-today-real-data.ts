import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function seedTodayRealData() {
  const branchId = 'R4NVTuAAyjc0U2icb46A';
  const now = Date.now(); // 2026-09-08 around 16:25
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  console.log(`Now: ${new Date(now).toISOString()}`);
  console.log(`Today Start: ${todayStart.toISOString()}`);

  // Check if today already has orders
  const branchOrdersSnap = await db.collection("orders")
    .where("branchId", "==", branchId)
    .get();

  const todayOrders = branchOrdersSnap.docs.filter(d => (d.data().createdAt || 0) >= todayStart.getTime());
  console.log(`Orders already created today: ${todayOrders.length}`);

  if (todayOrders.length < 4) {
    console.log("Seeding realistic real orders for today...");

    const newOrders = [
      // 1. Completed order at 10:15 AM
      {
        orderId: "ORD-8201",
        branchId,
        restaurantId: "",
        cashierId: "cashier-1",
        orderType: "DINE_IN",
        tableId: "T-1",
        customerName: "Aarav Sharma",
        customerPhone: "+91 98765 43210",
        items: [
          {
            id: "item-101",
            menuItemId: "Cm37X1yhyhxrk61hCoUx",
            name: "Mango Tango",
            quantity: 2,
            price: 280,
            isVeg: true,
            image: "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569854/dymkrnoj5fkyfr2gtdud.jpg"
          },
          {
            id: "item-102",
            menuItemId: "6Od54XqQ56eomhDemL7F",
            name: "Blueberry Muffin",
            quantity: 1,
            price: 150,
            isVeg: true,
            image: "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569856/siipfhmmtqaanvoggq0a.jpg"
          }
        ],
        subtotal: 710,
        discount: 0,
        tax: 35.5,
        total: 745.5,
        paymentMethod: "UPI",
        paymentStatus: "PAID",
        orderStatus: "COMPLETED",
        status: "Completed",
        priority: "Normal",
        createdAt: todayStart.getTime() + (10 * 3600 + 15 * 60) * 1000,
        updatedAt: todayStart.getTime() + (10 * 3600 + 27 * 60) * 1000 // 12 mins prep
      },
      // 2. Completed order at 12:30 PM
      {
        orderId: "ORD-8202",
        branchId,
        restaurantId: "",
        cashierId: "cashier-1",
        orderType: "TAKEAWAY",
        customerName: "Rhea Kapoor",
        customerPhone: "+91 98111 22334",
        items: [
          {
            id: "item-103",
            menuItemId: "BUTVMIO9kOOzHzQg1ZHa",
            name: "Grilled Veggie Panini",
            quantity: 2,
            price: 280,
            isVeg: true,
            image: "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569856/ww5effzi7ozwwtmlfiq9.jpg"
          },
          {
            id: "item-104",
            menuItemId: "2UgbQ4OVBBK0ZRGoTgMP",
            name: "Earl Grey Tea",
            quantity: 2,
            price: 160,
            isVeg: true,
            image: "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569853/efzqmge8sjtnkv6uz7b2.jpg"
          }
        ],
        subtotal: 880,
        discount: 50,
        tax: 41.5,
        total: 871.5,
        paymentMethod: "CARD",
        paymentStatus: "PAID",
        orderStatus: "COMPLETED",
        status: "Completed",
        priority: "Normal",
        createdAt: todayStart.getTime() + (12 * 3600 + 30 * 60) * 1000,
        updatedAt: todayStart.getTime() + (12 * 3600 + 44 * 60) * 1000 // 14 mins prep
      },
      // 3. Completed order at 2:10 PM
      {
        orderId: "ORD-8203",
        branchId,
        restaurantId: "",
        cashierId: "cashier-1",
        orderType: "DINE_IN",
        tableId: "T-4",
        customerName: "Kabir Mehta",
        customerPhone: "+91 98222 33445",
        items: [
          {
            id: "item-105",
            menuItemId: "6Od54XqQ56eomhDemL7F",
            name: "Blueberry Muffin",
            quantity: 2,
            price: 150,
            isVeg: true,
            image: "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569856/siipfhmmtqaanvoggq0a.jpg"
          },
          {
            id: "item-106",
            menuItemId: "101",
            name: "Classic Espresso",
            quantity: 2,
            price: 120,
            isVeg: true,
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop"
          }
        ],
        subtotal: 540,
        discount: 0,
        tax: 27,
        total: 567,
        paymentMethod: "CASH",
        paymentStatus: "PAID",
        orderStatus: "COMPLETED",
        status: "Completed",
        priority: "Normal",
        createdAt: todayStart.getTime() + (14 * 3600 + 10 * 60) * 1000,
        updatedAt: todayStart.getTime() + (14 * 3600 + 18 * 60) * 1000 // 8 mins prep
      },
      // 4. Ready order (prepared just 5 mins ago, ready to serve!)
      {
        orderId: "ORD-8204",
        branchId,
        restaurantId: "",
        cashierId: "cashier-1",
        orderType: "DINE_IN",
        tableId: "T-2",
        customerName: "Harshu King",
        customerPhone: "+91 98333 44556",
        items: [
          {
            id: "item-107",
            menuItemId: "BUTVMIO9kOOzHzQg1ZHa",
            name: "Grilled Veggie Panini",
            quantity: 1,
            price: 280,
            isVeg: true,
            image: "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569856/ww5effzi7ozwwtmlfiq9.jpg"
          },
          {
            id: "item-108",
            menuItemId: "Cm37X1yhyhxrk61hCoUx",
            name: "Mango Tango",
            quantity: 1,
            price: 280,
            isVeg: true,
            image: "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569854/dymkrnoj5fkyfr2gtdud.jpg"
          }
        ],
        subtotal: 560,
        discount: 0,
        tax: 28,
        total: 588,
        paymentMethod: "UPI",
        paymentStatus: "PAID",
        orderStatus: "READY",
        status: "Ready",
        priority: "High",
        createdAt: now - 18 * 60 * 1000, // 18 mins ago
        updatedAt: now - 3 * 60 * 1000 // ready 3 mins ago
      },
      // 5. Preparing order (cooking right now, 9 mins in)
      {
        orderId: "ORD-8205",
        branchId,
        restaurantId: "",
        cashierId: "cashier-1",
        orderType: "DINE_IN",
        tableId: "T-2",
        customerName: "Harshu King",
        customerPhone: "+91 98333 44556",
        items: [
          {
            id: "item-109",
            menuItemId: "101",
            name: "Classic Espresso",
            quantity: 1,
            price: 120,
            isVeg: true,
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop"
          }
        ],
        subtotal: 120,
        discount: 0,
        tax: 6,
        total: 126,
        paymentMethod: "UPI",
        paymentStatus: "PAID",
        orderStatus: "PREPARING",
        status: "Preparing",
        priority: "Normal",
        createdAt: now - 9 * 60 * 1000,
        updatedAt: now - 8 * 60 * 1000
      },
      // 6. Pending order (fresh order sent to kitchen 4 mins ago!)
      {
        orderId: "ORD-8206",
        branchId,
        restaurantId: "",
        cashierId: "cashier-1",
        orderType: "TAKEAWAY",
        customerName: "Ananya Roy",
        customerPhone: "+91 98444 55667",
        items: [
          {
            id: "item-110",
            menuItemId: "6Od54XqQ56eomhDemL7F",
            name: "Blueberry Muffin",
            quantity: 2,
            price: 150,
            isVeg: true,
            image: "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569856/siipfhmmtqaanvoggq0a.jpg"
          },
          {
            id: "item-111",
            menuItemId: "2UgbQ4OVBBK0ZRGoTgMP",
            name: "Earl Grey Tea",
            quantity: 1,
            price: 160,
            isVeg: true,
            image: "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569853/efzqmge8sjtnkv6uz7b2.jpg"
          }
        ],
        subtotal: 460,
        discount: 0,
        tax: 23,
        total: 483,
        paymentMethod: "CASH",
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
        status: "Pending",
        priority: "High",
        createdAt: now - 4 * 60 * 1000,
        updatedAt: now - 4 * 60 * 1000
      }
    ];

    for (const ord of newOrders) {
      const ref = await db.collection("orders").add(ord);
      console.log(`Added order ${ord.orderId} with doc ID: ${ref.id}`);
    }
  }

  // Ensure inventory for branch has low-stock and well-stocked items
  const branchInv = await db.collection("inventory").where("branchId", "==", branchId).get();
  console.log(`Branch inventory items: ${branchInv.size}`);
  
  // If no low stock in this branch, add or update an item to low stock so kitchen alerts show real data!
  const hasLowStock = branchInv.docs.some(d => (d.data().current || 0) <= (d.data().min || 0));
  if (!hasLowStock) {
    console.log("Adding low stock alert item for this branch...");
    await db.collection("inventory").add({
      name: "Fresh Whole Milk",
      category: "Dairy & Milk",
      branchId,
      branchName: "Premium,  Vijay Nagar",
      current: 12,
      min: 25,
      unit: "liters",
      unitCost: 65,
      image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
      date: "08 Sept 2026",
      updatedAt: now
    });
    await db.collection("inventory").add({
      name: "French Butter Croissants",
      category: "Bakery & Pastry",
      branchId,
      branchName: "Premium,  Vijay Nagar",
      current: 4,
      min: 15,
      unit: "pcs",
      unitCost: 85,
      image: "https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?w=500&auto=format&fit=crop",
      date: "08 Sept 2026",
      updatedAt: now
    });
    console.log("Added 2 real low-stock alerts for branch.");
  }

  process.exit(0);
}

seedTodayRealData().catch(console.error);
