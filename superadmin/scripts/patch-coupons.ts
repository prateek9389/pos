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

async function cleanAndPatchCoupons() {
  try {
    const snap = await db.collection("coupons").get();
    
    // Keep 8 coupons
    const allDocs = snap.docs;
    const docsToKeep = allDocs.slice(0, 8);
    const docsToDelete = allDocs.slice(8);
    
    const batch = db.batch();
    for (const doc of docsToDelete) {
      batch.delete(doc.ref);
    }

    const couponsData = [
      { code: "FLAT100", type: "Flat Amount (₹)", value: 100, file: "restaurant_promo_flat100_1787557973436.jpg", applicableProduct: "All Menu Items" },
      { code: "HAPPYHOUR", type: "Percentage (%)", value: 15, file: "restaurant_promo_50off_1787557947965.jpg", applicableProduct: "Beverages & Cocktails" },
      { code: "FESTIVE", type: "Flat Amount (₹)", value: 250, file: "restaurant_promo_flat100_1787557973436.jpg", applicableProduct: "Family Combos" },
      { code: "WEEKEND20", type: "Percentage (%)", value: 20, file: "restaurant_promo_50off_1787557947965.jpg", applicableProduct: "Pizzas & Pasta" },
      { code: "WELCOME", type: "Percentage (%)", value: 50, file: "restaurant_promo_50off_1787557947965.jpg", applicableProduct: "Appetizers" },
      { code: "BOGO", type: "Percentage (%)", value: 50, file: "restaurant_promo_50off_1787557947965.jpg", applicableProduct: "Burgers" },
      { code: "LUNCH10", type: "Flat Amount (₹)", value: 50, file: "restaurant_promo_flat100_1787557973436.jpg", applicableProduct: "Lunch Bowls" },
      { code: "DINNER", type: "Percentage (%)", value: 25, file: "restaurant_promo_50off_1787557947965.jpg", applicableProduct: "Steaks & Grills" }
    ];

    while (docsToKeep.length < 8) {
      const newRef = db.collection("coupons").doc();
      docsToKeep.push(await newRef.get()); 
    }

    const fs = require('fs');
    const path = require('path');

    const uploadToCloudinary = async (localFilename: string) => {
      const filePath = path.join("C:\\Users\\prate\\.gemini\\antigravity-ide\\brain\\b2332214-20f2-47f0-b3a1-7b6a0715e073", localFilename);
      const fileData = fs.readFileSync(filePath);
      const base64Data = `data:image/jpeg;base64,${fileData.toString('base64')}`;

      const uploadData = new FormData();
      uploadData.append("file", base64Data);
      uploadData.append("upload_preset", "restaurant_pos");
      
      const res = await fetch("https://api.cloudinary.com/v1_1/dwhee5w49/image/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      if (!data.secure_url) {
        console.error("Cloudinary upload failed for", localFilename, data);
      }
      return data.secure_url;
    };

    const COLORS = ["bg-purple-600", "bg-blue-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600"];

    for (let i = 0; i < docsToKeep.length; i++) {
      const doc = docsToKeep[i];
      const data = couponsData[i];
      
      console.log(`Uploading image for ${data.code}...`);
      const secureUrl = await uploadToCloudinary(data.file) || "https://res.cloudinary.com/dwhee5w49/image/upload/v1739006093/Placeholder_Image.png";
      
      const docRef = doc.ref || db.collection("coupons").doc(doc.id);
      batch.set(docRef, {
        code: data.code,
        type: data.type,
        value: data.value,
        applicableProduct: data.applicableProduct,
        validUntil: doc.data?.().validUntil || "Dec 31, 2026",
        usage: doc.data?.().usage || Math.floor(Math.random() * 50) + " / Unlimited",
        status: doc.data?.().status || "Active",
        createdAt: doc.data?.().createdAt || new Date().toISOString(),
        image: secureUrl
      }, { merge: true });
    }

    await batch.commit();
    console.log("Coupons patched with Cloudinary images successfully.");

  } catch (error: any) {
    console.error("Failed to process coupons:", error.message);
  }
}

cleanAndPatchCoupons();
