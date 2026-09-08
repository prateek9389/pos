import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function main() {
  console.log("Fetching branches and menuItems...");
  const branchesSnap = await db.collection("branches").get();
  const branches = branchesSnap.docs.map(d => ({ id: d.id, name: d.data().name }));

  const menuSnap = await db.collection("menuItems").get();
  const menuItems = menuSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Found ${branches.length} branches and ${menuItems.length} menu items.`);

  // 1. Clean up & standardize existing orders
  const ordersSnap = await db.collection("orders").get();
  console.log(`Current orders in Firestore: ${ordersSnap.size}`);

  let patchedCount = 0;
  for (const doc of ordersSnap.docs) {
    const data = doc.data();
    let updates: any = {};

    // Standardize customer
    let c = data.customer;
    if (!c || typeof c !== 'object') {
      if (typeof c === 'string' && c.trim()) {
        updates.customer = { name: c, phone: "+91 98111 22334", initials: c.charAt(0).toUpperCase() };
        updates.customerName = c;
      } else {
        const fallbackName = data.table ? `Table ${data.table} Patron` : "Walk-in Guest";
        updates.customer = { name: fallbackName, phone: "+91 98222 33445", initials: fallbackName.charAt(0) };
        updates.customerName = fallbackName;
      }
    } else if (!data.customerName && c.name) {
      updates.customerName = c.name;
    }

    // Standardize branch
    if (!data.branch || data.branch.includes("Restaurant")) {
      const bObj = branches.find(b => b.id === data.branchId);
      if (bObj) {
        updates.branch = bObj.name;
        updates.branchName = bObj.name;
      }
    }
    if (!data.branchName && data.branch) {
      updates.branchName = data.branch;
    }

    // Standardize time and date from createdAt
    if (!data.time && data.createdAt) {
      const d = new Date(data.createdAt);
      if (!isNaN(d.getTime())) {
        updates.time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (!data.date) {
          updates.date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
    }

    // Standardize table
    if (!data.table) {
      updates.table = data.type === "Dine In" ? "Table 3" : (data.type || "Dine In");
    }

    // Standardize status
    if (data.status) {
      const s = data.status.trim().toLowerCase();
      if (s === "pending" || s === "sent to kitchen" || s === "bill_requested") {
        updates.status = "Pending";
        updates.orderStatus = "PENDING";
      } else if (s === "completed" || s === "paid") {
        updates.status = "Completed";
        updates.orderStatus = "COMPLETED";
      }
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      patchedCount++;
    }
  }
  console.log(`Standardized ${patchedCount} existing orders.`);

  // 2. Check orders per branch and seed for other branches
  const ordersByBranch = new Map<string, number>();
  const recheckSnap = await db.collection("orders").get();
  recheckSnap.docs.forEach(d => {
    const bId = d.data().branchId;
    ordersByBranch.set(bId, (ordersByBranch.get(bId) || 0) + 1);
  });

  const now = Date.now();
  const sampleCustomers = [
    { name: "Aarav Mehra", phone: "+91 98201 44556", initials: "AM" },
    { name: "Ananya Deshmukh", phone: "+91 98332 55667", initials: "AD" },
    { name: "Rohan Kulkarni", phone: "+91 98443 66778", initials: "RK" },
    { name: "Pooja Singhania", phone: "+91 98554 77889", initials: "PS" },
    { name: "Vikram Malhotra", phone: "+91 98665 88990", initials: "VM" },
    { name: "Sneha Kapoor", phone: "+91 98776 99001", initials: "SK" },
    { name: "Karan Johar", phone: "+91 98887 11223", initials: "KJ" },
    { name: "Divya Bansal", phone: "+91 98998 22334", initials: "DB" },
  ];

  let seededCount = 0;
  for (const branch of branches) {
    const existing = ordersByBranch.get(branch.id) || 0;
    if (existing >= 4) {
      console.log(`Branch "${branch.name}" already has ${existing} orders. Skipping seed.`);
      continue;
    }

    const needed = 5 - existing;
    console.log(`Seeding ${needed} orders for branch "${branch.name}" (${branch.id})...`);

    for (let i = 0; i < needed; i++) {
      const cust = sampleCustomers[(seededCount + i) % sampleCustomers.length];
      const typeChoice = i % 3 === 0 ? "Dine In" : i % 3 === 1 ? "Takeaway" : "Delivery";
      const tableChoice = typeChoice === "Dine In" ? `Table ${((i + 1) * 2)}` : typeChoice;
      const statusChoice = i === 0 ? "Pending" : i === 1 ? "Preparing" : i === 2 ? "Ready" : "Completed";
      const paymentChoice = statusChoice === "Completed" ? "PAID" : i % 2 === 0 ? "PAID" : "PENDING";
      const paymentMethod = i % 3 === 0 ? "UPI" : i % 3 === 1 ? "Card" : "Cash";

      // Pick 1 to 3 items from menuItems
      const item1 = menuItems[(i * 2) % menuItems.length] || { name: "Cappuccino", price: 180, isVeg: true };
      const item2 = menuItems[(i * 2 + 1) % menuItems.length] || { name: "Croissant", price: 120, isVeg: true };

      const orderItems = [
        {
          id: `item-${i}-1`,
          menuItemId: item1.id || `m-${i}-1`,
          name: item1.name,
          price: Number(item1.price) || 200,
          quantity: 1,
          isVeg: item1.isVeg ?? true,
          image: item1.image || ""
        },
        {
          id: `item-${i}-2`,
          menuItemId: item2.id || `m-${i}-2`,
          name: item2.name,
          price: Number(item2.price) || 150,
          quantity: (i % 2) + 1,
          isVeg: item2.isVeg ?? true,
          image: item2.image || ""
        }
      ];

      const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const tax = Math.round(subtotal * 0.05);
      const deliveryCharge = typeChoice === "Delivery" ? 40 : 0;
      const grandTotal = subtotal + tax + deliveryCharge;

      // Time offset: from 15 mins ago to 8 hours ago
      const orderTimeEpoch = now - (i * 45 + 15) * 60 * 1000 - (seededCount * 30 * 60 * 1000);
      const dateObj = new Date(orderTimeEpoch);
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      const orderNum = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

      await db.collection("orders").add({
        orderId: orderNum,
        orderNumber: orderNum,
        customer: cust,
        customerName: cust.name,
        branchId: branch.id,
        branch: branch.name,
        branchName: branch.name,
        type: typeChoice,
        orderType: typeChoice,
        table: tableChoice,
        status: statusChoice,
        orderStatus: statusChoice.toUpperCase(),
        paymentStatus: paymentChoice,
        payment: paymentChoice,
        paymentMethod: paymentMethod,
        items: orderItems,
        subtotal: subtotal,
        tax: tax,
        deliveryCharge: deliveryCharge,
        amount: grandTotal,
        totalAmount: grandTotal,
        total: grandTotal,
        createdAt: orderTimeEpoch,
        time: timeStr,
        date: dateStr,
        day: dayStr,
        restaurantId: "R-1"
      });

      seededCount++;
    }
  }

  console.log(`\nSuccessfully seeded ${seededCount} real orders across all branches!`);
  const finalSnap = await db.collection("orders").get();
  console.log(`Total orders in Firestore now: ${finalSnap.size}`);
}

main().catch(console.error);
