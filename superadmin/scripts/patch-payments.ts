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

async function cleanAndPatchPayments() {
  try {
    const paymentsSnap = await db.collection("payments").get();
    
    // We only want 10 payments
    const allDocs = paymentsSnap.docs;
    
    const docsToKeep = allDocs.slice(0, 10);
    const docsToDelete = allDocs.slice(10);
    
    const batch = db.batch();
    
    // 1. Delete excess payments
    for (const doc of docsToDelete) {
      batch.delete(doc.ref);
    }

    // 2. Patch the 10 payments to have rich, real-looking data
    const customers = ["Rahul Mehta", "Sneha Kapoor", "Amit Singh", "Priya Desai", "Vikram Malhotra", "Anjali Verma", "Rohan Das", "Kavya Joshi", "Siddharth Rao", "Neha Sharma"];
    const methods = ["Credit Card", "UPI", "Debit Card", "Cash", "Wallet"];
    const statuses = ["Successful", "Successful", "Successful", "Pending", "Refunded"];
    const amounts = [1085.00, 705.00, 568.00, 2450.00, 3120.00, 890.00, 125.00, 4500.00, 675.00, 1980.00];

    const generatedPayments = [];

    for (let i = 0; i < 10; i++) {
      const docRef = i < docsToKeep.length ? docsToKeep[i].ref : db.collection("payments").doc();
      
      const paymentData = {
        transactionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        orderId: `ORD-${2000 + i}`,
        customer: customers[i],
        amount: amounts[i],
        method: pick(methods),
        status: pick(statuses),
        date: `Oct ${randomInt(1, 31)}, 2023`,
        createdAt: new Date().toISOString()
      };
      
      batch.set(docRef, paymentData, { merge: true });
      generatedPayments.push(paymentData);
    }

    await batch.commit();
    
    console.log(`Successfully patched 10 payments.`);
    
  } catch (error) {
    console.error("Error processing payments:", error);
  }
}

cleanAndPatchPayments();
