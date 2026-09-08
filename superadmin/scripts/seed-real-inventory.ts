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

interface SeedItemTemplate {
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  min: number;
  currentRange: [number, number];
  image: string;
}

const itemTemplates: SeedItemTemplate[] = [
  {
    name: "Premium Arabica Coffee Beans",
    category: "Coffee & Beans",
    unit: "kg",
    unitCost: 650,
    min: 25,
    currentRange: [30, 60],
    image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&auto=format&fit=crop"
  },
  {
    name: "Espresso Dark Roast Beans",
    category: "Coffee & Beans",
    unit: "kg",
    unitCost: 750,
    min: 20,
    currentRange: [15, 45], // Can be low stock sometimes
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop"
  },
  {
    name: "Fresh Whole Milk",
    category: "Dairy & Milk",
    unit: "liters",
    unitCost: 65,
    min: 40,
    currentRange: [50, 100],
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop"
  },
  {
    name: "Organic Almond Milk",
    category: "Dairy & Milk",
    unit: "liters",
    unitCost: 180,
    min: 15,
    currentRange: [18, 40],
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop"
  },
  {
    name: "Heavy Whipping Cream",
    category: "Dairy & Milk",
    unit: "liters",
    unitCost: 220,
    min: 10,
    currentRange: [8, 25],
    image: "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=500&auto=format&fit=crop"
  },
  {
    name: "French Butter Croissants",
    category: "Bakery & Pastry",
    unit: "pcs",
    unitCost: 85,
    min: 20,
    currentRange: [25, 50],
    image: "https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?w=500&auto=format&fit=crop"
  },
  {
    name: "Belgian Chocolate Muffins",
    category: "Bakery & Pastry",
    unit: "pcs",
    unitCost: 95,
    min: 15,
    currentRange: [18, 40],
    image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500&auto=format&fit=crop"
  },
  {
    name: "Artisan Sourdough Loaf",
    category: "Bakery & Pastry",
    unit: "pcs",
    unitCost: 140,
    min: 10,
    currentRange: [5, 20],
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop"
  },
  {
    name: "Madagascar Vanilla Syrup",
    category: "Syrups & Flavoring",
    unit: "bottles",
    unitCost: 380,
    min: 8,
    currentRange: [10, 25],
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop"
  },
  {
    name: "Salted Caramel Syrup",
    category: "Syrups & Flavoring",
    unit: "bottles",
    unitCost: 380,
    min: 8,
    currentRange: [4, 18],
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop"
  },
  {
    name: "Japanese Ceremonial Matcha",
    category: "Beverages & Tea",
    unit: "kg",
    unitCost: 950,
    min: 12,
    currentRange: [10, 24],
    image: "https://images.unsplash.com/photo-1582782782161-0428d096bce7?w=500&auto=format&fit=crop"
  },
  {
    name: "Organic Assam Black Tea",
    category: "Beverages & Tea",
    unit: "kg",
    unitCost: 450,
    min: 15,
    currentRange: [12, 35],
    image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=500&auto=format&fit=crop"
  },
  {
    name: "Brown Sugar Packets",
    category: "Condiments & Sugar",
    unit: "boxes",
    unitCost: 120,
    min: 20,
    currentRange: [25, 60],
    image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=500&auto=format&fit=crop"
  },
  {
    name: "Takeaway Cups (Medium)",
    category: "Packaging & Disposables",
    unit: "sleeves",
    unitCost: 150,
    min: 30,
    currentRange: [35, 90],
    image: "https://images.unsplash.com/photo-1595908129746-5741f0217ec3?w=500&auto=format&fit=crop"
  },
  {
    name: "Eco Sipper Lids",
    category: "Packaging & Disposables",
    unit: "packs",
    unitCost: 110,
    min: 25,
    currentRange: [20, 75],
    image: "https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?w=500&auto=format&fit=crop"
  },
  {
    name: "Kraft Paper Carry Bags",
    category: "Packaging & Disposables",
    unit: "packs",
    unitCost: 180,
    min: 20,
    currentRange: [22, 60],
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop"
  }
];

function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedRealInventory() {
  console.log("Fetching branches from Firestore...");
  const bSnap = await db.collection("branches").get();
  const branches: { id: string; name: string }[] = [];
  bSnap.forEach(d => {
    branches.push({ id: d.id, name: d.data().name });
  });

  console.log(`Found ${branches.length} branches:`);
  branches.forEach(b => console.log(`- ${b.name} (${b.id})`));

  if (branches.length === 0) {
    console.error("No branches found! Aborting.");
    process.exit(1);
  }

  // Clear existing inventory
  console.log("Cleaning up old inventory collection...");
  const oldSnap = await db.collection("inventory").get();
  const batchSize = 400;
  let batch = db.batch();
  let count = 0;

  for (const doc of oldSnap.docs) {
    batch.delete(doc.ref);
    count++;
    if (count % batchSize === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  if (count % batchSize !== 0) {
    await batch.commit();
  }
  console.log(`Deleted ${oldSnap.size} old inventory documents.`);

  // Also clean up any legacy inventoryItems
  const legacySnap = await db.collection("inventoryItems").get();
  if (legacySnap.size > 0) {
    let legBatch = db.batch();
    legacySnap.forEach(doc => legBatch.delete(doc.ref));
    await legBatch.commit();
    console.log(`Deleted ${legacySnap.size} legacy inventoryItems.`);
  }

  // Now seed real inventory for EACH branch
  console.log("Seeding real inventory across all branches...");
  let insertBatch = db.batch();
  let totalInserted = 0;

  for (let bIndex = 0; bIndex < branches.length; bIndex++) {
    const branch = branches[bIndex];
    // Each branch gets 10-12 items
    const selectedTemplates = itemTemplates.slice(0, 12);

    for (let tIndex = 0; tIndex < selectedTemplates.length; tIndex++) {
      const template = selectedTemplates[tIndex];
      const docRef = db.collection("inventory").doc();

      // Make 1 or 2 items low-stock, and 1 out-of-stock for realism in some branches
      let currentStock: number;
      if (tIndex === 2 && bIndex % 2 === 0) {
        // Low Stock
        currentStock = Math.max(1, Math.floor(template.min * 0.6));
      } else if (tIndex === 7 && bIndex === 1) {
        // Out of Stock
        currentStock = 0;
      } else {
        currentStock = randBetween(template.currentRange[0], template.currentRange[1]);
      }

      const itemData = {
        name: template.name,
        category: template.category,
        branchId: branch.id,
        branchName: branch.name,
        current: currentStock,
        min: template.min,
        unit: template.unit,
        unitCost: template.unitCost,
        image: template.image,
        date: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
        updatedAt: Date.now()
      };

      insertBatch.set(docRef, itemData);
      totalInserted++;

      if (totalInserted % 400 === 0) {
        await insertBatch.commit();
        insertBatch = db.batch();
      }
    }
  }

  if (totalInserted % 400 !== 0) {
    await insertBatch.commit();
  }

  console.log(`\nSuccessfully seeded ${totalInserted} real inventory items across ${branches.length} branches!`);
  process.exit(0);
}

seedRealInventory().catch(err => {
  console.error("Error seeding inventory:", err);
  process.exit(1);
});
