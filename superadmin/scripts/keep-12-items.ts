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

async function run() {
  try {
    // 1. Ensure B-1 is "Vijay Nagar" and R-1 is "Premium Restaurant"
    const b1Ref = db.collection('branches').doc('B-1');
    const r1Ref = db.collection('restaurants').doc('R-1');
    
    await r1Ref.set({ name: "Premium Restaurant", active: true }, { merge: true });
    await b1Ref.set({ name: "Vijay Nagar", restaurantId: "R-1", active: true }, { merge: true });

    // 2. Fetch the exactly 5 categories
    const catsSnap = await db.collection("menuCategories").get();
    const categories = catsSnap.docs.map(d => ({ id: d.id, name: d.data().name }));

    // 3. Process Menu Items
    const itemsRef = db.collection('menuItems');
    const itemsSnap = await itemsRef.get();
    const allDocs = itemsSnap.docs;

    const docsToKeep = allDocs.slice(0, 12);
    const docsToDelete = allDocs.slice(12);

    const batch = db.batch();

    // Delete excess
    docsToDelete.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // We will generate items dynamically based on the category name to ensure they make sense
    const generateItemForCategory = (categoryName: string, index: number) => {
      const nameLower = categoryName.toLowerCase();
      if (nameLower.includes("coffee")) {
        return [
          { name: "Classic Espresso", desc: "Strong, rich, and perfectly extracted espresso", price: 150, isVeg: true, image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&q=80" },
          { name: "Caramel Macchiato", desc: "Espresso with steamed milk and sweet caramel drizzle", price: 240, isVeg: true, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&q=80" },
          { name: "Iced Americano", desc: "Chilled espresso poured over ice and water", price: 180, isVeg: true, image: "https://images.unsplash.com/photo-1517701550927-30cfcb64c485?w=500&q=80" }
        ][index % 3];
      } else if (nameLower.includes("tea") || nameLower.includes("matcha")) {
        return [
          { name: "Matcha Latte", desc: "Premium Japanese green tea with steamed milk", price: 280, isVeg: true, image: "https://images.unsplash.com/photo-1515823662972-da6a2b4d3002?w=500&q=80" },
          { name: "Earl Grey Tea", desc: "Classic black tea infused with bergamot oil", price: 160, isVeg: true, image: "https://images.unsplash.com/photo-1594315590298-329f49c8dcb9?w=500&q=80" },
          { name: "Iced Peach Tea", desc: "Refreshing sweet tea with real peach slices", price: 200, isVeg: true, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80" }
        ][index % 3];
      } else if (nameLower.includes("pastries") || nameLower.includes("dessert")) {
        return [
          { name: "Butter Croissant", desc: "Flaky, buttery, freshly baked French pastry", price: 180, isVeg: true, image: "https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?w=500&q=80" },
          { name: "Chocolate Danish", desc: "Sweet pastry filled with rich dark chocolate", price: 210, isVeg: true, image: "https://images.unsplash.com/photo-1601000938259-9e92002320b2?w=500&q=80" },
          { name: "Blueberry Muffin", desc: "Soft muffin loaded with fresh wild blueberries", price: 150, isVeg: true, image: "https://images.unsplash.com/photo-1525124568695-c4c6cd3ea3fa?w=500&q=80" }
        ][index % 3];
      } else if (nameLower.includes("sandwich")) {
        return [
          { name: "Grilled Veggie Panini", desc: "Roasted peppers, zucchini, and mozzarella", price: 280, isVeg: true, image: "https://images.unsplash.com/photo-1528735602780-2ea56774e153?w=500&q=80" },
          { name: "Chicken Tikka Sandwich", desc: "Spiced chicken with mint chutney in focaccia", price: 320, isVeg: false, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&q=80" },
          { name: "Egg & Cheese Toast", desc: "Scrambled eggs and cheddar on toasted brioche", price: 250, isVeg: false, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=80" }
        ][index % 3];
      } else {
        // Fallback for Smoothies, Salads, etc.
        return [
          { name: "Berry Blast Smoothie", desc: "Mixed berries blended with Greek yogurt", price: 260, isVeg: true, image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500&q=80" },
          { name: "Mango Tango", desc: "Fresh mango, pineapple, and coconut milk", price: 280, isVeg: true, image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&q=80" },
          { name: "Green Detox Bowl", desc: "Kale, spinach, avocado, and chia seeds", price: 340, isVeg: true, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80" }
        ][index % 3];
      }
    };

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
        return data.secure_url || url;
      } catch (err) {
        console.error("Cloudinary upload failed for", url, err);
        return url;
      }
    };

    // Ensure we have EXACTLY 12 docs in docsToKeep
    let i = 0;
    while (docsToKeep.length < 12) {
      const newRef = itemsRef.doc();
      const tempDoc = await newRef.get();
      docsToKeep.push(tempDoc);
    }

    // Update the 12 items to be distributed perfectly among the 5 categories
    for (let idx = 0; idx < docsToKeep.length; idx++) {
      const doc = docsToKeep[idx];
      const cat = categories[idx % categories.length];
      const mock = generateItemForCategory(cat.name, idx);
      
      const cloudinaryUrl = await uploadToCloudinary(mock.image);

      batch.set(doc.ref, {
        name: mock.name,
        desc: mock.desc,
        price: mock.price,
        isVeg: mock.isVeg,
        image: cloudinaryUrl,
        category: cat.name,
        categoryId: cat.id,
        restaurantId: "R-1", // Premium Restaurant
        branchId: "B-1", // Vijay Nagar
        active: true,
        available: true
      });
    }

    await batch.commit();
    console.log(`Successfully kept exactly 12 items. Seeded perfectly under B-1 (Vijay Nagar) and distributed across ${categories.length} categories. Deleted ${docsToDelete.length} extra items.`);

  } catch (error: any) {
    console.error('Error keeping 12 items:', error.message);
  }
}

run();
