import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

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

// Absolute paths to the newly generated category images
const IMAGES: Record<string, string> = {
  "Pastries": "C:/Users/prate/.gemini/antigravity-ide/brain/b2332214-20f2-47f0-b3a1-7b6a0715e073/pastries_premium_1787561056939.jpg",
  "Sandwiches": "C:/Users/prate/.gemini/antigravity-ide/brain/b2332214-20f2-47f0-b3a1-7b6a0715e073/sandwiches_premium_1787561077841.jpg",
  "Cold Brews": "C:/Users/prate/.gemini/antigravity-ide/brain/b2332214-20f2-47f0-b3a1-7b6a0715e073/coldbrews_premium_1787561098632.jpg"
};

async function uploadToCloudinary(filePath: string): Promise<string> {
  const fileData = fs.readFileSync(filePath);
  const base64Data = fileData.toString('base64');
  const dataUri = `data:image/jpeg;base64,${base64Data}`;

  const uploadData = new FormData();
  uploadData.append("file", dataUri);
  uploadData.append("upload_preset", "restaurant_pos");
  
  const res = await fetch("https://api.cloudinary.com/v1_1/dwhee5w49/image/upload", {
    method: "POST",
    body: uploadData,
  });
  
  const data = await res.json();
  if (data.secure_url) {
    return data.secure_url;
  }
  throw new Error(`Cloudinary upload failed: ${JSON.stringify(data)}`);
}

async function patchCategories() {
  try {
    const snap = await db.collection("menuCategories").get();
    let count = 0;
    
    console.log("Pre-uploading 3 premium category images to Cloudinary...");
    const cloudinaryUrls: Record<string, string> = {};
    for (const [catName, filePath] of Object.entries(IMAGES)) {
      console.log(`Uploading ${catName}...`);
      cloudinaryUrls[catName] = await uploadToCloudinary(filePath);
    }
    
    console.log("Uploads complete. Updating Firestore categories...");
    
    const batch = db.batch();
    for (const doc of snap.docs) {
      const data = doc.data();
      const name = data.name || "";
      
      if (cloudinaryUrls[name]) {
        batch.update(doc.ref, {
          image: cloudinaryUrls[name]
        });
        count++;
        console.log(`Updated category: ${name}`);
      }
    }

    if (count > 0) {
      await batch.commit();
    }
    
    console.log(`Successfully patched ${count} categories with unique Cloudinary images.`);

  } catch (error: any) {
    console.error("Failed to patch categories:", error.message);
  }
}

patchCategories();
