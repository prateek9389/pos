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

async function deleteRepeatedInventory() {
  console.log("Fetching all documents from 'inventory' collection...");
  const snap = await db.collection("inventory").get();
  console.log(`Total documents found: ${snap.size}`);

  const items: any[] = [];
  snap.forEach(doc => {
    items.push({ id: doc.id, ...doc.data() });
  });

  // Group by normalized name
  const nameMap = new Map<string, any[]>();
  for (const item of items) {
    const normName = (item.name || "").trim().toLowerCase();
    if (!nameMap.has(normName)) {
      nameMap.set(normName, []);
    }
    nameMap.get(normName)!.push(item);
  }

  const toKeep: any[] = [];
  const toDelete: any[] = [];

  for (const [normName, group] of nameMap.entries()) {
    if (group.length > 1) {
      console.log(`\nFound ${group.length} duplicates for "${group[0].name}":`);
      // Keep the first item (or the one with the most complete data / best stock)
      // Pick one that has current > 0 if available, or just the first
      const sorted = [...group].sort((a, b) => {
        if (a.current > 0 && b.current === 0) return -1;
        if (b.current > 0 && a.current === 0) return 1;
        return 0;
      });

      const keepItem = sorted[0];
      toKeep.push(keepItem);
      console.log(`  [KEEP]   ID: ${keepItem.id} | Branch: ${keepItem.branchName} | Current: ${keepItem.current} ${keepItem.unit} | Cost: ₹${keepItem.unitCost}`);

      const deleteItems = sorted.slice(1);
      for (const delItem of deleteItems) {
        toDelete.push(delItem);
        console.log(`  [DELETE] ID: ${delItem.id} | Branch: ${delItem.branchName} | Current: ${delItem.current} ${delItem.unit}`);
      }
    } else {
      toKeep.push(group[0]);
    }
  }

  console.log(`\n----------------------------------------`);
  console.log(`Unique items to KEEP: ${toKeep.length}`);
  console.log(`Repeated items to DELETE from database: ${toDelete.length}`);
  console.log(`----------------------------------------\n`);

  if (toDelete.length === 0) {
    console.log("No repeated items found to delete.");
    return;
  }

  // Perform deletion in batches
  const batchSize = 500;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = db.batch();
    const chunk = toDelete.slice(i, i + batchSize);
    for (const item of chunk) {
      batch.delete(db.collection("inventory").doc(item.id));
    }
    await batch.commit();
    console.log(`Deleted batch of ${chunk.length} duplicate items.`);
  }

  // Also check inventoryItems collection just in case
  const snapItems = await db.collection("inventoryItems").get();
  if (!snapItems.empty) {
    console.log(`\nChecking 'inventoryItems' collection (${snapItems.size} items)...`);
    const batch = db.batch();
    snapItems.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Deleted all ${snapItems.size} items from legacy 'inventoryItems'.`);
  }

  console.log("\nDeletion completed successfully! Verifying database...");
  const finalSnap = await db.collection("inventory").get();
  console.log(`Final count of unique items in 'inventory': ${finalSnap.size}`);
  finalSnap.forEach(d => {
    const data = d.data();
    console.log(`- ${data.name} (Stock: ${data.current} ${data.unit}, Branch: ${data.branchName})`);
  });
}

deleteRepeatedInventory().catch(console.error);
