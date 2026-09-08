import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials in environment variables.");
  process.exit(1);
}

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

// Helper for random choice
const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
// Helper for random int
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
  try {
    const batch = db.batch();
    let operationCount = 0;

    const commitBatchIfNeeded = async () => {
      if (operationCount >= 450) { // Firestore batch limit is 500
        await batch.commit();
        operationCount = 0;
      }
    };

    // 1. Restaurants & Branches
    const restaurantRef = db.collection("restaurants").doc();
    batch.set(restaurantRef, {
      name: "The Cafe Co.",
      description: "Premium coffee and artisan bakery.",
      createdAt: new Date().toISOString()
    });
    operationCount++;

    const branchesData = [
      { name: "Connaught Place", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80", status: "Active" },
      { name: "Cyber Hub", img: "https://images.unsplash.com/photo-1559925393-8be0a33e2a14?w=500&q=80", status: "Active" },
      { name: "Bandra West", img: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=500&q=80", status: "Active" }
    ];
    
    const branchIds: string[] = [];
    for (const b of branchesData) {
      const ref = db.collection("branches").doc();
      branchIds.push(ref.id);
      batch.set(ref, {
        ...b,
        restaurantId: restaurantRef.id,
        revenue: `₹${randomInt(2, 9)}.${randomInt(1, 9)}L`,
        createdAt: new Date().toISOString()
      });
      operationCount++;
    }

    // 2. Menu Categories & Items
    const categories = ["Beverages", "Pizza", "Burgers", "Desserts", "Pasta"];
    const categoryIds: string[] = [];
    
    for (const c of categories) {
      const ref = db.collection("menuCategories").doc();
      categoryIds.push(ref.id);
      batch.set(ref, {
        name: c,
        description: `Delicious ${c.toLowerCase()}`,
        status: "Active"
      });
      operationCount++;
      
      const items = Array.from({length: 5}).map((_, i) => ({
        name: `${c} Special ${i+1}`,
        description: `Our signature ${c.toLowerCase()} dish prepared with premium ingredients.`,
        price: randomInt(150, 800).toString(),
        status: pick(["Available", "Available", "Available", "Out of Stock"]), // mostly available
        type: pick(["Veg", "Non-Veg", "Egg"]),
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"
      }));

      for (const item of items) {
        const itemRef = db.collection("menuItems").doc();
        batch.set(itemRef, {
          ...item,
          categoryId: ref.id
        });
        operationCount++;
      }
    }

    // 3. Customers
    const names = ["Aarav Patel", "Riya Sharma", "Kabir Singh", "Ananya Verma", "Vihaan Gupta", "Zara Khan", "Ishaan Malhotra", "Myra Reddy", "Arjun Das", "Kavya Joshi"];
    const customersData = names.map((name, i) => ({
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      phone: `+91 ${randomInt(9000000000, 9999999999)}`,
      totalOrders: randomInt(1, 40),
      totalSpent: randomInt(500, 25000),
      status: pick(["Active", "Active", "Inactive"]),
      joinedAt: new Date(Date.now() - randomInt(0, 365)*86400000).toISOString(),
    }));

    const customerIds: string[] = [];
    for (const c of customersData) {
      const ref = db.collection("customers").doc();
      customerIds.push(ref.id);
      batch.set(ref, { ...c });
      operationCount++;
    }

    // 4. Orders (Last 7 days to populate revenue chart)
    const statuses = ["Preparing", "Ready", "Served", "Completed", "Completed", "Completed", "Cancelled"]; // bias towards completed
    const types = ["Dine-in", "Takeaway", "Delivery"];
    
    for (let i = 0; i < 150; i++) {
      const ref = db.collection("orders").doc();
      const daysAgo = randomInt(0, 7); // Spread over last 7 days
      const orderDate = new Date(Date.now() - (daysAgo * 86400000) - randomInt(0, 86400000));
      
      const numItems = randomInt(1, 5);
      const orderItems = Array.from({length: numItems}).map((_, idx) => {
        const cat = pick(categories);
        return {
          id: `mock-item-${idx}`,
          name: `${cat} Treat ${idx+1}`,
          price: randomInt(150, 600),
          quantity: randomInt(1, 4),
          category: cat
        };
      });
      
      const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      batch.set(ref, {
        orderNumber: `ORD-${1000 + i}`,
        branchId: pick(branchIds),
        customerId: pick(customerIds),
        type: pick(types),
        status: pick(statuses),
        items: orderItems,
        totalAmount,
        createdAt: orderDate.toISOString()
      });
      operationCount++;
      await commitBatchIfNeeded();
    }

    // 5. Reservations
    for (let i = 0; i < 20; i++) {
      const ref = db.collection("reservations").doc();
      const daysOffset = randomInt(-5, 10);
      const date = new Date(Date.now() + daysOffset * 86400000);
      batch.set(ref, {
        customer: pick(names),
        phone: `+91 ${randomInt(9000000000, 9999999999)}`,
        guests: randomInt(2, 10),
        branch: pick(["Connaught Place", "Cyber Hub", "Bandra West"]),
        table: `T-${randomInt(1, 25).toString().padStart(2, '0')}`,
        date: date.toISOString().split('T')[0],
        time: `${randomInt(17, 22)}:${pick(['00', '15', '30', '45'])}`,
        notes: pick(["", "", "Window seat preferred", "Anniversary dinner", "Birthday celebration"]),
        status: pick(["Upcoming", "Upcoming", "Completed", "Cancelled"])
      });
      operationCount++;
      await commitBatchIfNeeded();
    }

    // 6. Inventory
    const invItems = ["Premium Coffee Beans", "Whole Milk", "Refined Sugar", "All-Purpose Flour", "Mozzarella Cheese", "Fresh Tomatoes", "Red Onions", "Paper Cups (M)", "Napkins", "Caramel Syrup", "Baguette Bread", "Olive Oil"];
    for (const item of invItems) {
      const ref = db.collection("inventory").doc();
      const minStock = randomInt(20, 50);
      const isLow = pick([true, false, false]); // 33% chance of low stock
      
      batch.set(ref, {
        item,
        branchId: pick(branchIds),
        branchName: pick(["Connaught Place", "Cyber Hub", "Bandra West"]),
        current: isLow ? randomInt(0, minStock - 1) : randomInt(minStock + 10, minStock * 3),
        min: minStock,
        unit: pick(["kg", "ltr", "pcs", "packs"])
      });
      operationCount++;
      await commitBatchIfNeeded();
    }

    // 7. Coupons
    const promoCodes = ["WELCOME50", "WEEKEND20", "FLAT100", "FESTIVE", "HAPPYHOUR"];
    for (const code of promoCodes) {
      const ref = db.collection("coupons").doc();
      batch.set(ref, {
        code,
        type: pick(["Percentage (%)", "Flat (₹)"]),
        value: randomInt(10, 200).toString(),
        minOrder: randomInt(400, 1500).toString(),
        usageLimit: randomInt(100, 500).toString(),
        used: randomInt(0, 90).toString(),
        status: pick(["Active", "Active", "Expired"])
      });
      operationCount++;
      await commitBatchIfNeeded();
    }

    // 8. Payments
    for (let i = 0; i < 30; i++) {
      const ref = db.collection("payments").doc();
      batch.set(ref, {
        transactionId: `TXN${randomInt(10000000, 99999999)}`,
        orderId: `ORD-${randomInt(1000, 2000)}`,
        method: pick(["Credit Card", "Debit Card", "UPI", "Cash", "UPI"]),
        amount: randomInt(250, 4500),
        status: pick(["Success", "Success", "Success", "Failed", "Pending"]),
        date: new Date(Date.now() - randomInt(0, 10) * 86400000).toISOString(),
        customerInfo: pick(names)
      });
      operationCount++;
      await commitBatchIfNeeded();
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    console.log("Rich mock data successfully seeded into Firestore!");

  } catch (error: any) {
    console.error("Failed to seed data:", error.message);
  }
}

seed();
