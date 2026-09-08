import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config();

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

async function fixDatabase() {
  const batch = db.batch();
  const resId = "R-1";

  // 1. Fix Staff
  const staffSnap = await db.collection("staff").get();
  staffSnap.docs.forEach(d => {
    batch.update(d.ref, { restaurantId: resId });
  });

  // 2. Fix Menu Items
  const menuSnap = await db.collection("menuItems").get();
  menuSnap.docs.forEach(d => {
    batch.update(d.ref, { restaurantId: resId });
  });

  // 3. Fix Menu Categories
  const catSnap = await db.collection("menuCategories").get();
  catSnap.docs.forEach(d => {
    batch.update(d.ref, { restaurantId: resId });
  });

  await batch.commit();
  console.log("Database fixed! All staff, menu items, and categories are now linked to R-1.");
}

fixDatabase();
