import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

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

async function deleteCollection(collectionPath: string) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__');

  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    console.log(`Collection ${collectionPath} is empty.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  console.log(`Deleted ${batchSize} documents from ${collectionPath}.`);
}

async function main() {
  try {
    console.log('Starting deletion process...');
    await deleteCollection('customerAddresses');
    console.log('Deletion complete!');
  } catch (error) {
    console.error('Error deleting data:', error);
  }
}

main();
