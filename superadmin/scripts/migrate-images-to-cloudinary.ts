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

// Reliable fallback image if the URL fails to upload
const FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80";

async function uploadToCloudinary(imageUrl: string, preset: string): Promise<string> {
  try {
    const res = await cloudinary.uploader.upload(imageUrl, {
      upload_preset: preset,
    });
    return res.secure_url;
  } catch (error: any) {
    console.error(`Cloudinary upload failed for ${imageUrl}: ${error.message}. Using fallback...`);
    // Attempt fallback
    if (imageUrl !== FALLBACK_IMAGE_URL) {
      try {
        const res = await cloudinary.uploader.upload(FALLBACK_IMAGE_URL, { upload_preset: preset });
        return res.secure_url;
      } catch (fallbackError: any) {
         console.error(`Fallback also failed: ${fallbackError.message}`);
      }
    }
    return imageUrl; // If all fails, just return the original so it doesn't break everything
  }
}

async function migrateCollection(collectionName: string, imageField: string) {
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "restaurant_pos";
  console.log(`Starting migration for ${collectionName}...`);
  
  const snapshot = await db.collection(collectionName).get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const currentImageUrl = data[imageField];

    if (currentImageUrl && (currentImageUrl.includes('unsplash.com') || currentImageUrl.includes('images.unsplash.com') || !currentImageUrl.includes('cloudinary'))) {
      console.log(`Uploading image for ${collectionName}/${doc.id}...`);
      const secureUrl = await uploadToCloudinary(currentImageUrl, preset);
      
      if (secureUrl !== currentImageUrl) {
        await db.collection(collectionName).doc(doc.id).update({
          [imageField]: secureUrl
        });
        count++;
        console.log(`Successfully migrated ${collectionName}/${doc.id}`);
      }
    }
  }
  
  console.log(`Finished migrating ${count} documents in ${collectionName}.`);
}

async function runMigration() {
  try {
    await migrateCollection("branches", "img");
    await migrateCollection("restaurants", "img");
    await migrateCollection("menuItems", "image");
    
    console.log("Migration completely finished!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
