import { db } from '../src/lib/firebase-admin';

async function run() {
  const snap = await db.collection('branches').get();
  snap.forEach(doc => console.log(doc.id, doc.data().name));
}
run();
