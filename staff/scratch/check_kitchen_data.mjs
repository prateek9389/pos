import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6ih59k0lalIPvOBUICTy3Wl9xu3NEx1A",
  authDomain: "restaurant-pos-1015f.firebaseapp.com",
  projectId: "restaurant-pos-1015f",
  storageBucket: "restaurant-pos-1015f.firebasestorage.app",
  messagingSenderId: "787299663251",
  appId: "1:787299663251:web:15554da9e13007853c7c66"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  console.log("=== Checking Orders ===");
  const ordersSnap = await getDocs(query(collection(db, "orders"), limit(5)));
  console.log(`Total sample orders found: ${ordersSnap.size}`);
  ordersSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Order ID: ${data.orderId || doc.id}, status: ${data.status}, orderStatus: ${data.orderStatus}, branchId: ${data.branchId}, createdAt: ${data.createdAt} (${typeof data.createdAt}), items count: ${data.items?.length}`);
    if (data.items?.length) {
      console.log("   sample item:", data.items[0]);
    }
  });

  console.log("\n=== Checking Tables ===");
  const tablesSnap = await getDocs(query(collection(db, "tables"), limit(5)));
  console.log(`Total sample tables found: ${tablesSnap.size}`);
  tablesSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Table ID: ${doc.id}, name: ${data.name || data.tableNo}, status: ${data.status}, branchId: ${data.branchId}`);
  });

  console.log("\n=== Checking Inventory / InventoryItems ===");
  const inv1 = await getDocs(query(collection(db, "inventory"), limit(5)));
  console.log(`collection 'inventory' count: ${inv1.size}`);
  inv1.forEach(d => console.log("inv1:", d.id, d.data()));

  const inv2 = await getDocs(query(collection(db, "inventoryItems"), limit(5)));
  console.log(`collection 'inventoryItems' count: ${inv2.size}`);
  inv2.forEach(d => console.log("inv2:", d.id, d.data()));

  const stockSnap = await getDocs(query(collection(db, "stock"), limit(5)));
  console.log(`collection 'stock' count: ${stockSnap.size}`);

  const menuSnap = await getDocs(query(collection(db, "menuItems"), limit(5)));
  console.log(`collection 'menuItems' count: ${menuSnap.size}`);
  menuSnap.forEach(d => {
    const data = d.data();
    console.log(`MenuItem: ${data.name}, prepTime: ${data.prepTime || data.preparationTime}, image: ${!!data.image}`);
  });

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
