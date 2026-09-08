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

async function run() {
  const snap = await db.collection('orders').get();
  const seededNames = new Set([
    'Aarav Mehra', 'Ananya Deshmukh', 'Rohan Kulkarni', 'Pooja Singhania',
    'Vikram Malhotra', 'Sneha Kapoor', 'Karan Johar', 'Divya Bansal'
  ]);

  let realOrders: any[] = [];
  snap.docs.forEach(doc => {
    const d = doc.data();
    const custName = d.customerName || (typeof d.customer === 'object' ? d.customer?.name : d.customer);
    if (!seededNames.has(custName)) {
      realOrders.push({
        id: doc.id,
        orderId: d.orderId,
        customer: d.customer,
        customerName: d.customerName,
        branch: d.branch,
        branchName: d.branchName,
        branchId: d.branchId,
        total: d.totalAmount || d.amount || d.total,
        status: d.status,
        orderStatus: d.orderStatus,
        paymentStatus: d.paymentStatus,
        type: d.type || d.orderType,
        table: d.table,
        createdAt: d.createdAt,
        items: d.items
      });
    }
  });

  console.log(`REAL ORDERS COUNT: ${realOrders.length}`);
  realOrders.forEach((o, i) => {
    console.log(`${i + 1}. [${o.id}] Order: ${o.orderId} | Customer: ${o.customerName} | Branch: ${o.branch} | Amount: ₹${o.total} | Status: ${o.status}`);
  });

  const seededDocs = snap.docs.filter(doc => {
    const d = doc.data();
    const custName = d.customerName || (typeof d.customer === 'object' ? d.customer?.name : d.customer);
    return seededNames.has(custName);
  });
  console.log(`\nSEEDED ORDERS TO DELETE COUNT: ${seededDocs.length}`);
  seededDocs.forEach((d, i) => {
    console.log(`${i + 1}. [${d.id}] ${d.data().orderId} - ${d.data().customerName} (${d.data().branch})`);
  });
}

run().catch(console.error);
