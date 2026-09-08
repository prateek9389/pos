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

// Helper for random choice
const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function cleanAndPatchInventory() {
  try {
    const invSnap = await db.collection("inventory").get();
    
    // We only want to keep 10 items total
    const allDocs = invSnap.docs;
    const docsToKeep = allDocs.slice(0, 10);
    const docsToDelete = allDocs.slice(10);
    
    const batch = db.batch();
    
    for (const doc of docsToDelete) {
      batch.delete(doc.ref);
    }

    const itemsData = [
      { item: "Premium Arabica Beans", unit: "kg", image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=400" },
      { item: "Whole Milk", unit: "liters", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
      { item: "Almond Milk", unit: "liters", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400" },
      { item: "Croissants", unit: "pieces", image: "https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?w=400" },
      { item: "Chocolate Muffins", unit: "pieces", image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400" },
      { item: "Sugar Packets", unit: "boxes", image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400" },
      { item: "Paper Cups (Medium)", unit: "sleeves", image: "https://images.unsplash.com/photo-1595908129746-5741f0217ec3?w=400" },
      { item: "Espresso Roast", unit: "kg", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400" },
      { item: "Green Tea Leaves", unit: "kg", image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400" },
      { item: "Matcha Powder", unit: "kg", image: "https://images.unsplash.com/photo-1582782782161-0428d096bce7?w=400" }
    ];

    const branches = [
      { id: "br-cyberhub", name: "Cyberhub" },
      { id: "br-cp", name: "Connaught Place" },
      { id: "br-vk", name: "Vasant Kunj" }
    ];

    // Create more if we don't have 10
    while (docsToKeep.length < 10) {
      const newRef = db.collection("inventory").doc();
      docsToKeep.push(await newRef.get()); // Mock a snapshot to satisfy loop
    }

    const uploadToCloudinary = async (url: string) => {
      const uploadData = new FormData();
      uploadData.append("file", url);
      uploadData.append("upload_preset", "restaurant_pos");
      const res = await fetch("https://api.cloudinary.com/v1_1/dwhee5w49/image/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      return data.secure_url;
    };

    for (let i = 0; i < docsToKeep.length; i++) {
      const doc = docsToKeep[i];
      const data = itemsData[i];
      const branch = pick(branches);
      const min = randomInt(10, 50);
      const current = randomInt(5, 100);
      
      console.log(`Uploading image for ${data.item}...`);
      const secureUrl = await uploadToCloudinary(data.image) || "https://res.cloudinary.com/dwhee5w49/image/upload/v1739006093/Placeholder_Image.png";
      
      const docRef = doc.ref || db.collection("inventory").doc(doc.id);
      batch.set(docRef, {
        item: data.item,
        unit: data.unit,
        image: secureUrl,
        branchId: branch.id,
        branchName: branch.name,
        current,
        min
      }, { merge: true });
    }

    await batch.commit();
    console.log("Inventory patched with Cloudinary images successfully.");

  } catch (error: any) {
    console.error("Failed to process inventory:", error.message);
  }
}

cleanAndPatchInventory();
