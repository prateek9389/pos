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

async function cleanAndPatchCustomers() {
  try {
    const custSnap = await db.collection("customers").get();
    
    const allDocs = custSnap.docs;
    
    // Keep exactly 12 customers
    const docsToKeep = allDocs.slice(0, 12);
    const docsToDelete = allDocs.slice(12);
    
    const batch = db.batch();
    let count = 0;
    
    const commitBatchIfNeeded = async () => {
      if (count >= 450) {
        await batch.commit();
        count = 0;
      }
    };

    // 1. Delete excess 
    for (const doc of docsToDelete) {
      batch.delete(doc.ref);
      count++;
      await commitBatchIfNeeded();
    }

    // 2. Patch the kept ones
    const customers = [
      "Rahul Mehta", "Sneha Kapoor", "Amit Singh", "Priya Desai", 
      "Vikram Malhotra", "Anjali Verma", "Rohan Das", "Kavya Joshi", 
      "Siddharth Rao", "Neha Sharma", "Arjun Patel", "Simran Kaur"
    ];
    const statuses = ["Active", "VIP", "Inactive"];

    docsToKeep.forEach((doc, index) => {
      const name = customers[index];
      const email = `${name.toLowerCase().replace(" ", ".")}@example.com`;
      const phone = `+91 ${randomInt(9000000000, 9999999999)}`;
      const status = pick(statuses);
      const orders = randomInt(1, 50);
      const spending = orders * randomInt(300, 1500);
      const points = Math.floor(spending * 0.05);
      
      batch.update(doc.ref, {
        name,
        email,
        phone,
        status,
        orders,
        spending,
        points,
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }

    console.log(`Successfully patched ${docsToKeep.length} unique customers and deleted ${docsToDelete.length} excess.`);

  } catch (error: any) {
    console.error("Failed to process customers:", error.message);
  }
}

cleanAndPatchCustomers();
