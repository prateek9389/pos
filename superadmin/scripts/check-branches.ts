import * as admin from 'firebase-admin';

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

async function run() {
  const snap = await db.collection("branches").get();
  console.log(`Found ${snap.docs.length} total branches in DB`);
  snap.docs.forEach(d => {
    console.log(d.id, "=>", d.data().name);
  });
}

run();
