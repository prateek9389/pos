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
  const doc = await db.collection('orders').doc('644q3EHnvXdxXYSCAL6J').get();
  console.log('Sample order data:');
  console.log(JSON.stringify(doc.data(), null, 2));

  const branchesSnap = await db.collection('branches').get();
  console.log('\n--- Branches in DB ---');
  branchesSnap.docs.forEach(d => {
    console.log(`ID: ${d.id} | Name: "${d.data().name}"`);
  });
}

main().catch(console.error);
