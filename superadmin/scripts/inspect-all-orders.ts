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

async function inspectAllOrders() {
  const snap = await db.collection("orders").get();
  console.log(`Total orders in DB: ${snap.size}`);
  
  const byBranch: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  
  snap.docs.forEach(d => {
    const data = d.data();
    byBranch[data.branchId] = (byBranch[data.branchId] || 0) + 1;
    const st = `${data.status} / ${data.orderStatus}`;
    byStatus[st] = (byStatus[st] || 0) + 1;
  });

  console.log("Orders by branch:", byBranch);
  console.log("Orders by status:", byStatus);
  
  const dates = snap.docs.map(d => {
    const raw = d.data().createdAt;
    return { id: d.id, orderId: d.data().orderId, branchId: d.data().branchId, raw, date: new Date(raw).toISOString() };
  });
  console.log("Sample order dates:", dates.slice(0, 10));

  process.exit(0);
}

inspectAllOrders().catch(console.error);
