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

async function enhanceTodayOrders() {
  const branchId = 'R4NVTuAAyjc0U2icb46A';
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const baseTime = todayStart.getTime();

  console.log(`Base time for today: ${new Date(baseTime).toISOString()}`);

  const extraOrders = [
    // 8:30 AM
    {
      orderId: "ORD-8210",
      branchId,
      orderType: "DINE_IN",
      tableId: "T-1",
      customerName: "Rohan Varma",
      items: [
        { name: "Classic Espresso", quantity: 2, price: 120, isVeg: true },
        { name: "Blueberry Muffin", quantity: 1, price: 150, isVeg: true }
      ],
      total: 390,
      orderStatus: "COMPLETED",
      status: "Completed",
      createdAt: baseTime + (8 * 3600 + 30 * 60) * 1000,
      updatedAt: baseTime + (8 * 3600 + 41 * 60) * 1000 // 11 min prep
    },
    // 8:45 AM
    {
      orderId: "ORD-8211",
      branchId,
      orderType: "TAKEAWAY",
      customerName: "Pooja Singh",
      items: [
        { name: "Earl Grey Tea", quantity: 1, price: 160, isVeg: true },
        { name: "French Butter Croissants", quantity: 2, price: 85, isVeg: true }
      ],
      total: 330,
      orderStatus: "COMPLETED",
      status: "Completed",
      createdAt: baseTime + (8 * 3600 + 45 * 60) * 1000,
      updatedAt: baseTime + (8 * 3600 + 55 * 60) * 1000 // 10 min prep
    },
    // 10:40 AM (Overdue order - took 25 min)
    {
      orderId: "ORD-8212",
      branchId,
      orderType: "DINE_IN",
      tableId: "T-3",
      customerName: "Vikram Malhotra",
      items: [
        { name: "Grilled Veggie Panini", quantity: 2, price: 280, isVeg: true },
        { name: "Mango Tango", quantity: 2, price: 280, isVeg: true }
      ],
      total: 1120,
      orderStatus: "COMPLETED",
      status: "Completed",
      createdAt: baseTime + (10 * 3600 + 40 * 60) * 1000,
      updatedAt: baseTime + (11 * 3600 + 5 * 60) * 1000 // 25 min prep (overdue!)
    },
    // 11:15 AM
    {
      orderId: "ORD-8213",
      branchId,
      orderType: "DINE_IN",
      tableId: "T-4",
      customerName: "Sneha Patel",
      items: [
        { name: "Classic Espresso", quantity: 1, price: 120, isVeg: true },
        { name: "Blueberry Muffin", quantity: 2, price: 150, isVeg: true }
      ],
      total: 420,
      orderStatus: "COMPLETED",
      status: "Completed",
      createdAt: baseTime + (11 * 3600 + 15 * 60) * 1000,
      updatedAt: baseTime + (11 * 3600 + 26 * 60) * 1000 // 11 min prep
    },
    // 12:45 PM (Lunch peak)
    {
      orderId: "ORD-8214",
      branchId,
      orderType: "DINE_IN",
      tableId: "T-2",
      customerName: "Devansh Goel",
      items: [
        { name: "Grilled Veggie Panini", quantity: 3, price: 280, isVeg: true },
        { name: "Mango Tango", quantity: 3, price: 280, isVeg: true }
      ],
      total: 1680,
      orderStatus: "COMPLETED",
      status: "Completed",
      createdAt: baseTime + (12 * 3600 + 45 * 60) * 1000,
      updatedAt: baseTime + (13 * 3600 + 12 * 60) * 1000 // 27 min prep (overdue!)
    },
    // 1:15 PM (Lunch peak)
    {
      orderId: "ORD-8215",
      branchId,
      orderType: "TAKEAWAY",
      customerName: "Nisha Rao",
      items: [
        { name: "Classic Espresso", quantity: 2, price: 120, isVeg: true },
        { name: "Grilled Veggie Panini", quantity: 1, price: 280, isVeg: true }
      ],
      total: 520,
      orderStatus: "COMPLETED",
      status: "Completed",
      createdAt: baseTime + (13 * 3600 + 15 * 60) * 1000,
      updatedAt: baseTime + (13 * 3600 + 28 * 60) * 1000 // 13 min prep
    },
    // 2:30 PM
    {
      orderId: "ORD-8216",
      branchId,
      orderType: "DINE_IN",
      tableId: "T-1",
      customerName: "Tarun Bajaj",
      items: [
        { name: "Earl Grey Tea", quantity: 2, price: 160, isVeg: true },
        { name: "Blueberry Muffin", quantity: 2, price: 150, isVeg: true }
      ],
      total: 620,
      orderStatus: "COMPLETED",
      status: "Completed",
      createdAt: baseTime + (14 * 3600 + 30 * 60) * 1000,
      updatedAt: baseTime + (14 * 3600 + 42 * 60) * 1000 // 12 min prep
    },
    // 3:15 PM
    {
      orderId: "ORD-8217",
      branchId,
      orderType: "TAKEAWAY",
      customerName: "Meera Nair",
      items: [
        { name: "Mango Tango", quantity: 2, price: 280, isVeg: true }
      ],
      total: 560,
      orderStatus: "COMPLETED",
      status: "Completed",
      createdAt: baseTime + (15 * 3600 + 15 * 60) * 1000,
      updatedAt: baseTime + (15 * 3600 + 23 * 60) * 1000 // 8 min prep
    }
  ];

  for (const ord of extraOrders) {
    const ref = await db.collection("orders").add(ord);
    console.log(`Added ${ord.orderId}: ${ref.id}`);
  }

  console.log("Finished adding realistic trend orders for today.");
  process.exit(0);
}

enhanceTodayOrders().catch(console.error);
