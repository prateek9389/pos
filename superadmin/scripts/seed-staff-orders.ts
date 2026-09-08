import * as admin from 'firebase-admin';

// Initialize Firebase Admin
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

// Helpers
const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedOrders() {
  try {
    const ordersRef = db.collection("orders");
    
    // Optional: Delete existing orders to have a clean slate for the new schema
    const existingSnap = await ordersRef.get();
    const batchDelete = db.batch();
    existingSnap.docs.forEach(doc => batchDelete.delete(doc.ref));
    await batchDelete.commit();
    console.log(`Deleted ${existingSnap.size} old orders.`);

    const batch = db.batch();
    const customerNames = ["Rahul Mehta", "Sneha Kapoor", "Amit Singh", "Priya Desai", "Vikram Malhotra"];
    const orderTypes = ["Dine In", "Takeaway", "Delivery"];
    const statuses = ["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
    const paymentMethods = ["UPI", "Card", "Cash"];
    const paymentStatuses = ["PENDING", "PAID"];
    const itemsMock = [
      { id: "i1", menuItemId: "m1", name: "Margherita Pizza", price: 450, quantity: 1, isVeg: true, image: "https://via.placeholder.com/150" },
      { id: "i2", menuItemId: "m2", name: "Pasta Alfredo", price: 350, quantity: 2, isVeg: true, image: "https://via.placeholder.com/150" },
      { id: "i3", menuItemId: "m3", name: "Chicken Tikka", price: 550, quantity: 1, isVeg: false, image: "https://via.placeholder.com/150" },
      { id: "i4", menuItemId: "m4", name: "Cold Coffee", price: 180, quantity: 3, isVeg: true, image: "https://via.placeholder.com/150" },
    ];

    for (let i = 0; i < 20; i++) {
      const orderId = `ORD-${3000 + i}`;
      const customerName = pick(customerNames);
      const orderType = pick(orderTypes);
      const orderStatus = statuses[i % statuses.length]; // Even distribution
      const paymentStatus = orderStatus === "COMPLETED" ? "PAID" : pick(paymentStatuses);
      const paymentMethod = paymentStatus === "PAID" ? pick(paymentMethods) : undefined;
      const guests = orderType === "Dine In" ? randomInt(1, 6) : undefined;
      const tableId = orderType === "Dine In" ? `T-${randomInt(1, 15)}` : undefined;
      const priority = pick(["High", "Normal", "Low"]);
      
      const numItems = randomInt(1, 3);
      const items = [];
      let subtotal = 0;
      for (let j = 0; j < numItems; j++) {
        const item = pick(itemsMock);
        items.push(item);
        subtotal += item.price * item.quantity;
      }
      
      const tax = Math.round(subtotal * 0.05); // 5% GST
      const serviceCharge = orderType === "Dine In" ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal + tax + serviceCharge;

      // Distribute created time over the last few hours
      const createdAt = Date.now() - randomInt(0, 10000000); 

      const orderData: any = {
        orderId,
        restaurantId: "R-1", // Match defaults
        branchId: "B-1", // Match defaults
        customerName,
        cashierId: "C-1",
        tableId,
        orderType,
        items,
        subtotal,
        tax,
        serviceCharge,
        discount: 0,
        deliveryCharge: 0,
        total,
        paymentStatus,
        paymentMethod,
        orderStatus,
        priority,
        guests,
        createdAt,
        updatedAt: createdAt
      };

      // Remove undefined values since Firestore rejects them
      Object.keys(orderData).forEach(key => {
        if (orderData[key] === undefined) {
          delete orderData[key];
        }
      });

      const newDocRef = ordersRef.doc();
      batch.set(newDocRef, orderData);
    }

    await batch.commit();
    console.log("Successfully seeded 20 new orders perfectly mapped for Cashier, Waiter, and Kitchen panels.");
  } catch (error: any) {
    console.error("Error seeding orders:", error.message);
  }
}

seedOrders();
