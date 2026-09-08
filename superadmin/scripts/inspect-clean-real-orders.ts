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
  console.log(`Remaining orders: ${snap.size}`);

  snap.docs.forEach((doc, idx) => {
    const d = doc.data();
    console.log(`\n--- [${idx + 1}] ID: ${doc.id} ---`);
    console.log(`Order ID:`, d.orderId, `| Number:`, d.orderNumber);
    console.log(`Customer:`, JSON.stringify(d.customer), `| Name:`, d.customerName);
    console.log(`Branch:`, d.branch, `| BranchName:`, d.branchName, `| BranchId:`, d.branchId);
    console.log(`Status:`, d.status, `| orderStatus:`, d.orderStatus, `| paymentStatus:`, d.paymentStatus);
    console.log(`Type:`, d.type, `| orderType:`, d.orderType, `| table:`, d.table);
    console.log(`Timing:`, `createdAt:`, d.createdAt, `date:`, d.date, `time:`, d.time);
    console.log(`Totals:`, `amount:`, d.amount, `totalAmount:`, d.totalAmount, `total:`, d.total, `subtotal:`, d.subtotal, `tax:`, d.tax);
    console.log(`Items (${d.items?.length || 0}):`, d.items?.map((it: any) => `${it.name} (qty: ${it.quantity}, ₹${it.price}, veg: ${it.isVeg}, img: ${Boolean(it.image)})`).join('; '));
  });
}

main().catch(console.error);
