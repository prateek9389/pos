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

async function checkStaff() {
  const snap = await db.collection("staff").get();
  console.log(`Staff count: ${snap.size}`);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(d.id, data.name, data.role, data.email, data.branchId, data.branchName);
  });
  process.exit(0);
}

checkStaff().catch(console.error);
