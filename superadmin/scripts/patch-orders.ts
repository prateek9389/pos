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

// Helper for random choice
const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function cleanAndPatchOrders() {
  try {
    const ordersSnap = await db.collection("orders").get();
    
    // We only want 10 orders
    const allDocs = ordersSnap.docs;
    
    const docsToKeep = allDocs.slice(0, 10);
    const docsToDelete = allDocs.slice(10);
    
    const batch = db.batch();
    let count = 0;
    
    const commitBatchIfNeeded = async () => {
      if (count >= 450) {
        await batch.commit();
        count = 0;
      }
    };

    // 1. Delete excess orders
    for (const doc of docsToDelete) {
      batch.delete(doc.ref);
      count++;
      await commitBatchIfNeeded();
    }

    // 2. Patch the 10 orders to have rich, unique, perfectly matched data
    const customers = ["Rahul Mehta", "Sneha Kapoor", "Amit Singh", "Priya Desai", "Vikram Malhotra", "Anjali Verma", "Rohan Das", "Kavya Joshi", "Siddharth Rao", "Neha Sharma"];
    const branches = ["Connaught Place", "Cyber Hub", "Bandra West"];
    const types = ["Dine In", "Takeaway", "Delivery"];
    const statuses = ["Preparing", "Ready", "Completed", "Pending", "Cancelled"];
    const paymentMethods = ["Credit Card", "UPI", "Debit Card", "Cash", "Wallet"];
    const paymentStatuses = ["Paid", "Paid", "Paid", "Pending", "Failed"];

    docsToKeep.forEach((doc, index) => {
      const orderId = `ORD-${2000 + index}`;
      const customer = customers[index]; // Ensures uniqueness for the 10 orders
      const branch = pick(branches);
      const type = pick(types);
      const status = pick(statuses);
      const paymentMethod = pick(paymentMethods);
      const paymentStatus = pick(paymentStatuses);
      const amount = randomInt(250, 1500);
      
      const timeStr = new Date(Date.now() - randomInt(0, 48) * 3600000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); // e.g. "10:30 AM"
      
      batch.update(doc.ref, {
        orderId,
        customer,
        branch,
        amount,
        status,
        type,
        paymentMethod,
        paymentStatus,
        time: timeStr,
        
        // Let's also leave the old fields in case dashboard relies on them for calculating revenue!
        // The dashboard uses `totalAmount` or `amount`, `createdAt` or `time`, `branchId` or `branch`.
        // To be safe for Dashboard Revenue Chart:
        totalAmount: amount,
        branchId: branch,
        createdAt: new Date(Date.now() - randomInt(0, 3) * 86400000).toISOString()
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }

    console.log(`Successfully patched 10 unique orders and deleted ${docsToDelete.length} excess orders.`);

  } catch (error: any) {
    console.error("Failed to process orders:", error.message);
  }
}

cleanAndPatchOrders();
