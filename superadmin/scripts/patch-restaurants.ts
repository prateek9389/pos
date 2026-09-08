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

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function updateRestaurants() {
  try {
    const restaurantsSnap = await db.collection("restaurants").get();
    const batch = db.batch();
    
    // We only seeded one restaurant usually, but let's loop
    restaurantsSnap.forEach(doc => {
      batch.update(doc.ref, {
        owner: "Rahul Sharma",
        phone: `+91 ${randomInt(9000000000, 9999999999)}`,
        email: "admin@thecafeco.in",
        address: "123, Food Street, High Street Avenue",
        city: "New Delhi",
        state: "Delhi (DL)",
        gst: "07AAAAA0000A1Z5",
        openingTime: "08:00",
        closingTime: "23:00",
        branches: 3,
        status: "Active",
        img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
      });
    });

    await batch.commit();
    console.log("Successfully updated restaurants with missing fields.");

  } catch (error: any) {
    console.error("Failed to update restaurants:", error.message);
  }
}

updateRestaurants();
