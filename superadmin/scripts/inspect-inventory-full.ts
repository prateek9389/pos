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

async function inspect() {
  console.log("=== BRANCHES ===");
  const bSnap = await db.collection("branches").get();
  const branchMap: Record<string, string> = {};
  bSnap.forEach(d => {
    const data = d.data();
    branchMap[d.id] = data.name;
    console.log(`Branch [${d.id}]: "${data.name}"`);
  });

  console.log("\n=== INVENTORY COLLECTION ===");
  const invSnap = await db.collection("inventory").get();
  console.log("Total in 'inventory':", invSnap.size);
  invSnap.forEach(d => {
    const data = d.data();
    console.log(`- [${d.id}]:`, {
      name: data.name || data.item,
      category: data.category,
      current: data.current,
      min: data.min,
      unit: data.unit,
      unitCost: data.unitCost,
      branchId: data.branchId,
      branchName: data.branchName || branchMap[data.branchId]
    });
  });

  console.log("\n=== INVENTORYITEMS COLLECTION ===");
  const invItemsSnap = await db.collection("inventoryItems").get();
  console.log("Total in 'inventoryItems':", invItemsSnap.size);
  invItemsSnap.forEach(d => {
    const data = d.data();
    console.log(`- [${d.id}]:`, {
      name: data.name || data.item,
      category: data.category,
      current: data.current,
      min: data.min,
      unit: data.unit,
      unitCost: data.unitCost,
      branchId: data.branchId,
      branchName: data.branchName || branchMap[data.branchId]
    });
  });
  
  process.exit(0);
}

inspect().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
