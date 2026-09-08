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
  const snap = await db.collection("menuItems").where("branchId", "==", "B-1").get();
  
  const batch = db.batch();
  
  snap.docs.forEach(doc => {
    batch.update(doc.ref, { branchId: "R4NVTuAAyjc0U2icb46A" });
    console.log(`Updated ${doc.data().name} to branch R4NVTuAAyjc0U2icb46A`);
  });
  
  await batch.commit();
  console.log("All items updated.");
}

run();
