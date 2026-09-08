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

async function main() {
  const snap = await db.collection("orders").get();
  console.log(`Total orders before cleanup: ${snap.size}`);

  const seededSampleNames = new Set([
    "Aarav Mehra",
    "Ananya Deshmukh",
    "Rohan Kulkarni",
    "Pooja Singhania",
    "Vikram Malhotra",
    "Sneha Kapoor",
    "Karan Johar",
    "Divya Bansal"
  ]);

  let deletedCount = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const custName = data.customerName || (typeof data.customer === 'object' ? data.customer?.name : data.customer);
    
    if (seededSampleNames.has(custName)) {
      console.log(`Deleting fake/seeded order: ${doc.id} | OrderId: ${data.orderId} | Customer: ${custName} | Branch: ${data.branch}`);
      await doc.ref.delete();
      deletedCount++;
    }
  }

  console.log(`\nSuccessfully deleted ${deletedCount} fake orders!`);

  const remainingSnap = await db.collection("orders").get();
  console.log(`Remaining REAL orders in Firestore: ${remainingSnap.size}`);
  remainingSnap.docs.forEach((d, i) => {
    const data = d.data();
    console.log(`${i + 1}. [${d.id}] Order: ${data.orderId || data.id} | Customer: ${data.customerName || data.customer?.name || data.customer} | Branch: ${data.branch} | Amount: ₹${data.totalAmount || data.amount || data.total}`);
  });
}

main().catch(console.error);
