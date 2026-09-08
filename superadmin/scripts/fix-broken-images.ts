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

const uploadToCloudinary = async (url: string) => {
  try {
    const uploadData = new FormData();
    uploadData.append("file", url);
    uploadData.append("upload_preset", "restaurant_pos");
    const res = await fetch("https://api.cloudinary.com/v1_1/dwhee5w49/image/upload", {
      method: "POST",
      body: uploadData,
    });
    const data = await res.json();
    return data.secure_url || null;
  } catch (err) {
    console.error("Cloudinary upload failed for", url, err);
    return null;
  }
};

const DEFAULT_IMAGE = "https://res.cloudinary.com/dwhee5w49/image/upload/v1787569852/w4u4cas5xwc3rskevuk6.jpg"; // Classic Espresso as fallback

async function run() {
  const snap = await db.collection("menuItems").get();
  
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.image && data.image.includes("unsplash.com")) {
      console.log(`Fixing ${data.name}...`);
      let newUrl = await uploadToCloudinary(data.image);
      
      // If it still fails, try changing the unsplash params to make it smaller
      if (!newUrl) {
        console.log(`Retrying with smaller image for ${data.name}...`);
        const smallerUrl = data.image.replace("w=500", "w=300").replace("q=80", "q=60");
        newUrl = await uploadToCloudinary(smallerUrl);
      }
      
      // If it STILL fails, use a fallback
      if (!newUrl) {
         console.log(`Falling back to default for ${data.name}...`);
         newUrl = DEFAULT_IMAGE;
      }
      
      await doc.ref.update({ image: newUrl });
      console.log(`Updated ${data.name} to ${newUrl}`);
    }
  }
  console.log("Done fixing images!");
}

run();
