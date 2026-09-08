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

async function main() {
  const invSnap = await db.collection("inventory").get();
  const invItemsSnap = await db.collection("inventoryItems").get();

  console.log(`\n========================================`);
  console.log(`TOTAL IN 'inventory': ${invSnap.size}`);
  console.log(`TOTAL IN 'inventoryItems': ${invItemsSnap.size}`);
  console.log(`========================================\n`);

  const invList: any[] = [];
  invSnap.forEach(d => invList.push({ id: d.id, ...d.data() }));

  const invItemsList: any[] = [];
  invItemsSnap.forEach(d => invItemsList.push({ id: d.id, ...d.data() }));

  // Check 1: Duplicate by (name + branchId) in 'inventory'
  const branchNameMap = new Map<string, any[]>();
  for (const item of invList) {
    const key = `${(item.name || "").trim().toLowerCase()}____${item.branchId || item.branchName}`;
    if (!branchNameMap.has(key)) branchNameMap.set(key, []);
    branchNameMap.get(key)!.push(item);
  }

  console.log(`--- Checking Duplicates within SAME Branch (name + branchId) ---`);
  let branchDups = 0;
  for (const [key, items] of branchNameMap.entries()) {
    if (items.length > 1) {
      branchDups++;
      console.log(`\nDUPLICATE in branch (${items.length} items): "${items[0].name}" at Branch "${items[0].branchName}" (${items[0].branchId})`);
      items.forEach(it => console.log(`   - ID: ${it.id} | stock: ${it.current} | unitCost: ${it.unitCost} | date: ${it.date || it.createdAt}`));
    }
  }
  if (branchDups === 0) {
    console.log("No duplicate items within the SAME branch in 'inventory'.");
  }

  // Check 2: What is in 'inventoryItems'?
  console.log(`\n--- Items in 'inventoryItems' collection: ---`);
  if (invItemsList.length === 0) {
    console.log("None");
  } else {
    invItemsList.forEach(it => console.log(`   - ID: ${it.id} | name: "${it.name}" | branch: "${it.branchName}" (${it.branchId})`));
  }

  // Check 3: Check by item name across all records
  console.log(`\n--- Item Name frequencies across 'inventory': ---`);
  const nameFreq = new Map<string, any[]>();
  for (const item of invList) {
    const name = (item.name || "").trim();
    if (!nameFreq.has(name)) nameFreq.set(name, []);
    nameFreq.get(name)!.push(item);
  }

  for (const [name, items] of nameFreq.entries()) {
    console.log(`"${name}": count = ${items.length}, branches = [${items.map(i => i.branchName || i.branchId).join(", ")}]`);
  }
}

main().catch(console.error);
