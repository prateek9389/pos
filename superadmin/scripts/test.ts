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

async function check() {
  const snap = await db.collection("menuItems").get();
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`- ${data.name} | resId: ${data.restaurantId} | cat: ${data.category}`);
  });
}
check();
