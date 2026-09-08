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
    })
  });
}

const db = admin.firestore();

async function run() {
  const branchesSnapshot = await db.collection('branches').get();
  let targetBranchId = '';
  branchesSnapshot.forEach(doc => {
    if (doc.data().name.includes('Premium') || doc.data().name.includes('Vijay')) {
      targetBranchId = doc.id;
    }
  });

  if (!targetBranchId) {
    console.log('Branch not found');
    return;
  }

  console.log('Target Branch ID:', targetBranchId);

  const collections = ['staff', 'menuCategories', 'menuItems', 'inventory', 'tables', 'orders', 'reservations', 'payments', 'coupons', 'customers'];
  for (const coll of collections) {
    const snapshot = await db.collection(coll).get();
    let count = 0;
    const batch = db.batch();
    
    for (const document of snapshot.docs) {
      batch.update(document.ref, { branchId: targetBranchId });
      count++;
    }
    
    if (count > 0) {
      await batch.commit();
    }
    console.log(`Updated ${count} documents in ${coll}`);
  }
}

run().catch(console.error);
