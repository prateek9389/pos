import * as admin from 'firebase-admin';

// Initialize Firebase Admin
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

async function keep5Categories() {
  try {
    const categoriesRef = db.collection('menuCategories');
    const snapshot = await categoriesRef.get();
    
    if (snapshot.empty) {
      console.log('No categories found.');
      return;
    }

    const docs = snapshot.docs;
    if (docs.length <= 5) {
      console.log(`Only ${docs.length} categories exist. No deletion needed.`);
      return;
    }

    const docsToDelete = docs.slice(5); // Keep the first 5
    const batch = db.batch();

    docsToDelete.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${docsToDelete.length} extra categories. Kept exactly 5.`);
  } catch (error) {
    console.error('Error keeping 5 categories:', error);
  }
}

keep5Categories();
