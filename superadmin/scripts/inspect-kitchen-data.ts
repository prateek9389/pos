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
  console.log("=== ORDERS ===");
  const ordersSnap = await db.collection("orders").limit(10).get();
  console.log(`Total orders found (sample 10): ${ordersSnap.size}`);
  ordersSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Order: ${data.orderId || doc.id}, branchId: ${data.branchId}, status: ${data.status}, orderStatus: ${data.orderStatus}, createdAt: ${data.createdAt} (${typeof data.createdAt}), items: ${data.items?.length}`);
    if (data.items?.length > 0) {
      console.log(`   First item:`, data.items[0]);
    }
  });

  console.log("\n=== TABLES ===");
  const tablesSnap = await db.collection("tables").limit(10).get();
  console.log(`Total tables found (sample 10): ${tablesSnap.size}`);
  tablesSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Table: ${doc.id}, name: ${data.name || data.tableNo}, status: ${data.status}, branchId: ${data.branchId}`);
  });

  console.log("\n=== INVENTORY COLLECTIONS ===");
  const invSnap = await db.collection("inventory").get();
  console.log(`'inventory' docs count: ${invSnap.size}`);
  invSnap.forEach(doc => console.log('inv:', doc.id, doc.data()));

  const invItemsSnap = await db.collection("inventoryItems").get();
  console.log(`'inventoryItems' docs count: ${invItemsSnap.size}`);
  invItemsSnap.forEach(doc => console.log('invItems:', doc.id, doc.data()));

  const stockSnap = await db.collection("stock").get();
  console.log(`'stock' docs count: ${stockSnap.size}`);
  stockSnap.forEach(doc => console.log('stock:', doc.id, doc.data()));

  console.log("\n=== MENU ITEMS ===");
  const menuSnap = await db.collection("menuItems").limit(5).get();
  console.log(`'menuItems' count: ${menuSnap.size}`);
  menuSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Item: ${data.name}, prepTime: ${data.prepTime || data.preparationTime}, image: ${data.image ? 'has image' : 'no image'}`);
  });

  console.log("\n=== BRANCHES ===");
  const branchesSnap = await db.collection("branches").get();
  console.log(`'branches' count: ${branchesSnap.size}`);
  branchesSnap.forEach(doc => console.log(`Branch: ${doc.id} - ${doc.data().name}`));

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
