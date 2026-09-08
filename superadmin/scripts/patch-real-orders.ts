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
  console.log(`Patching ${snap.size} real orders in Firestore...`);

  for (const doc of snap.docs) {
    const data = doc.data();
    const totalVal = Number(data.total ?? data.totalAmount ?? data.amount ?? 0);
    const orderStatusVal = data.status || (data.orderStatus ? (data.orderStatus.charAt(0).toUpperCase() + data.orderStatus.slice(1).toLowerCase()) : "Completed");
    const typeVal = data.type || data.orderType || "Dine In";

    const updates: any = {
      status: orderStatusVal,
      orderStatus: (data.orderStatus || orderStatusVal).toUpperCase(),
      amount: totalVal,
      totalAmount: totalVal,
      total: totalVal,
      type: typeVal,
      orderType: typeVal,
    };

    if (!data.orderNumber && data.orderId) {
      updates.orderNumber = data.orderId;
    }

    if (!data.customerName) {
      if (typeof data.customer === 'object' && data.customer?.name) {
        updates.customerName = data.customer.name;
      } else if (typeof data.customer === 'string') {
        updates.customerName = data.customer;
      } else {
        updates.customerName = "Walk-in Guest";
      }
    }

    await doc.ref.update(updates);
    console.log(`Updated order ${doc.id} (${data.orderId}) with clean status & totals.`);
  }

  console.log("All real orders patched successfully!");
}

main().catch(console.error);
