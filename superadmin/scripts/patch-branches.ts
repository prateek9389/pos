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

// Helper for random choice
const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
// Helper for random int
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function updateBranches() {
  try {
    const branchesSnap = await db.collection("branches").get();
    const batch = db.batch();
    
    // We should get the restaurant name first if needed, but the default seeded one was "The Cafe Co."
    const restaurantName = "The Cafe Co.";

    branchesSnap.forEach(doc => {
      const data = doc.data();
      const city = pick(["New Delhi", "Mumbai", "Bangalore"]);
      
      batch.update(doc.ref, {
        restaurantName: restaurantName,
        phone: `+91 ${randomInt(9000000000, 9999999999)}`,
        email: `contact@${data.name.toLowerCase().replace(/ /g, '')}.com`,
        address: `${randomInt(10, 200)}, Main Market Road, ${data.name}`,
        city: city,
        state: city === "New Delhi" ? "Delhi (DL)" : city === "Mumbai" ? "Maharashtra (MH)" : "Karnataka (KA)",
        openingTime: "09:00",
        closingTime: "23:00"
      });
    });

    await batch.commit();
    console.log("Successfully updated all branches with missing fields.");

  } catch (error: any) {
    console.error("Failed to update branches:", error.message);
  }
}

updateBranches();
