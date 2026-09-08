import * as admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

const CATEGORY_IMAGES: Record<string, string> = {
  "Beverages": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80",
  "Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
  "Burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  "Desserts": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80",
  "Pasta": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
  "Default": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"
};

async function uploadToCloudinary(imageUrl: string, preset: string): Promise<string> {
  try {
    const res = await cloudinary.uploader.upload(imageUrl, {
      upload_preset: preset,
    });
    return res.secure_url;
  } catch (error: any) {
    console.error(`Cloudinary upload failed for ${imageUrl}: ${error.message}.`);
    return imageUrl; 
  }
}

async function updateMenuCategories() {
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "restaurant_pos";
  try {
    const snapshot = await db.collection("menuCategories").get();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const catName = data.name;
      
      const unsplashUrl = CATEGORY_IMAGES[catName] || CATEGORY_IMAGES["Default"];
      console.log(`Uploading image for category ${catName}...`);
      
      const secureUrl = await uploadToCloudinary(unsplashUrl, preset);
      
      await doc.ref.update({
        image: secureUrl,
        items: 5 // Since we seeded 5 items per category
      });
      console.log(`Successfully updated category ${catName} with Cloudinary image.`);
    }

    console.log("Finished patching menu categories!");
    process.exit(0);
  } catch (error: any) {
    console.error("Failed to update categories:", error.message);
    process.exit(1);
  }
}

updateMenuCategories();
