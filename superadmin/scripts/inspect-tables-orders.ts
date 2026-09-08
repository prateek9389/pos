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

async function inspectTablesAndOrders() {
  const branchId = 'R4NVTuAAyjc0U2icb46A';
  console.log(`Checking tables for branch: ${branchId}`);
  const tablesSnap = await db.collection("tables").where("branchId", "==", branchId).get();
  console.log(`Tables count: ${tablesSnap.size}`);
  tablesSnap.forEach(t => console.log(t.id, t.data()));

  const ordersSnap = await db.collection("orders").where("branchId", "==", branchId).get();
  console.log(`Orders count: ${ordersSnap.size}`);
  ordersSnap.forEach(o => console.log(o.id, o.data().orderId, o.data().status, o.data().orderStatus, o.data().createdAt));

  process.exit(0);
}

inspectTablesAndOrders().catch(console.error);
