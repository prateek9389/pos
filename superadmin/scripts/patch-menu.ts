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

async function cleanAndPatchMenu() {
  try {
    const snap = await db.collection("menuCategories").get();
    
    // We want to keep exactly 12 categories
    const allDocs = snap.docs;
    const docsToKeep = allDocs.slice(0, 12);
    const docsToDelete = allDocs.slice(12);
    
    const batch = db.batch();
    
    for (const doc of docsToDelete) {
      batch.delete(doc.ref);
    }

    const categoriesData = [
      { name: "Coffee", desc: "Freshly brewed artisanal coffees", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400" },
      { name: "Tea & Matcha", desc: "Soothing teas and rich matcha blends", image: "https://images.unsplash.com/photo-1594315590298-329f49c8dcb9?w=400" },
      { name: "Pastries", desc: "Fresh baked croissants and sweet treats", image: "https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?w=400" },
      { name: "Sandwiches", desc: "Hearty sandwiches and savory bites", image: "https://images.unsplash.com/photo-1528735602780-2ea56774e153?w=400" },
      { name: "Smoothies", desc: "Healthy and refreshing fruit smoothies", image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400" },
      { name: "Salads", desc: "Crisp, organic greens and fresh bowls", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400" },
      { name: "Desserts", desc: "Decadent cakes and sweet indulgences", image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400" },
      { name: "Cold Brews", desc: "Steeped cold coffee with rich flavor", image: "https://images.unsplash.com/photo-1461023058943-0708f5299281?w=400" },
      { name: "Breakfast", desc: "Morning classics to start your day right", image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400" },
      { name: "Mocktails", desc: "Refreshing non-alcoholic beverages", image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400" },
      { name: "Burgers", desc: "Juicy patties with melted cheese and fresh buns", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
      { name: "Pizzas", desc: "Wood-fired artisanal pizzas", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400" }
    ];

    while (docsToKeep.length < 12) {
      const newRef = db.collection("menuCategories").doc();
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
      const data = categoriesData[i];
      
      console.log(`Uploading image for ${data.name}...`);
      const secureUrl = await uploadToCloudinary(data.image) || "https://res.cloudinary.com/dwhee5w49/image/upload/v1739006093/Placeholder_Image.png";
      
      const docRef = doc.ref || db.collection("menuCategories").doc(doc.id);
      batch.set(docRef, {
        name: data.name,
        description: data.desc,
        image: secureUrl,
        status: "Active",
        items: Math.floor(Math.random() * 20) + 5
      }, { merge: true });
    }

    await batch.commit();
    console.log("Menu categories patched with Cloudinary images successfully.");

  } catch (error: any) {
    console.error("Failed to process menu categories:", error.message);
  }
}

cleanAndPatchMenu();
