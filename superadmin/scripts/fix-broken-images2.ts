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
  const fixes: any = {
    "Blueberry Muffin": "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569856/siipfhmmtqaanvoggq0a.jpg", // Danish image
    "Grilled Veggie Panini": "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569856/ww5effzi7ozwwtmlfiq9.jpg", // Egg toast image
    "Iced Americano": "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569859/ygs9bd2utklumehiprs2.jpg", // Macchiato image
    "Matcha Latte": "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569859/xvb0bt98vqfp74gphicb.jpg" // Peach tea image
  };

  const snap = await db.collection("menuItems").get();
  
  for (const doc of snap.docs) {
    const data = doc.data();
    if (fixes[data.name]) {
      await doc.ref.update({ image: fixes[data.name] });
      console.log(`Updated ${data.name} to appropriate fallback.`);
    }
  }
}

run();
