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

// Absolute paths to the generated images
const IMAGES: Record<string, string> = {
  Beverages: "C:/Users/prate/.gemini/antigravity-ide/brain/b2332214-20f2-47f0-b3a1-7b6a0715e073/beverage_premium_1787560136727.jpg",
  Pizza: "C:/Users/prate/.gemini/antigravity-ide/brain/b2332214-20f2-47f0-b3a1-7b6a0715e073/pizza_premium_1787560153215.jpg",
  Burgers: "C:/Users/prate/.gemini/antigravity-ide/brain/b2332214-20f2-47f0-b3a1-7b6a0715e073/burger_premium_1787560170464.jpg",
  Desserts: "C:/Users/prate/.gemini/antigravity-ide/brain/b2332214-20f2-47f0-b3a1-7b6a0715e073/dessert_premium_1787560188970.jpg",
  Pasta: "C:/Users/prate/.gemini/antigravity-ide/brain/b2332214-20f2-47f0-b3a1-7b6a0715e073/pasta_premium_1787560208447.jpg"
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

async function patchProducts() {
  try {
    const snap = await db.collection("menuItems").get();
    let count = 0;
    
    // First, upload all 5 base images so we don't spam Cloudinary with identical uploads
    console.log("Pre-uploading 5 premium images to Cloudinary...");
    const cloudinaryUrls: Record<string, string> = {};
    for (const [cat, filePath] of Object.entries(IMAGES)) {
      console.log(`Uploading ${cat}...`);
      cloudinaryUrls[cat] = await uploadToCloudinary(filePath);
    }
    
    console.log("Uploads complete. Updating Firestore...");
    
    const batch = db.batch();
    for (const doc of snap.docs) {
      const data = doc.data();
      const name = data.name || "";
      
      let category = "Beverages"; // default
      if (name.includes("Pizza")) category = "Pizza";
      else if (name.includes("Burger")) category = "Burgers";
      else if (name.includes("Dessert")) category = "Desserts";
      else if (name.includes("Pasta")) category = "Pasta";
      
      const secureUrl = cloudinaryUrls[category];
      
      batch.update(doc.ref, {
        image: secureUrl
      });
      count++;
    }

    if (count > 0) {
      await batch.commit();
    }
    
    console.log(`Successfully patched ${count} products with unique Cloudinary images.`);

  } catch (error: any) {
    console.error("Failed to patch products:", error.message);
  }
}

patchProducts();
