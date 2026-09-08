import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// The firebase config from customer/src/lib/firebase.ts
const firebaseConfig = {
  apiKey: "fake-api-key", // In local emulator, doesn't matter
  authDomain: "cafe-app.firebaseapp.com",
  projectId: "cafe-app",
  storageBucket: "cafe-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// In local emulator we need to connect to it
import { connectFirestoreEmulator } from "firebase/firestore";
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function main() {
  const snap = await getDocs(collection(db, "reservations"));
  console.log("Total reservations:", snap.size);
  snap.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
}

main().catch(console.error);
