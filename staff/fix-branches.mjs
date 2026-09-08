import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Fix menu items filtering
  content = content.replace(
    /if \(!session\.restaurantId \|\| data\.restaurantId === session\.restaurantId \|\| !data\.restaurantId\) \{/g,
    'if (!data.branchId || data.branchId === "global" || data.branchId === session.branchId) {'
  );

  // Fix menu Categories filtering (in useEffect)
  // from: where("restaurantId", "==", session.restaurantId)
  // to: where("branchId", "in", [session.branchId, "global"])
  // But be careful not to replace it if it's already using branchId
  content = content.replace(
    /const qCat = session\.restaurantId[\s\S]*?query\(collection\(db, "menuCategories"\), where\("restaurantId", "==", session\.restaurantId\)\)/,
    `const qCat = session.branchId 
      ? query(collection(db, "menuCategories"), where("branchId", "in", [session.branchId, "global"]))`
  );

  // Fix offers/discounts Coupons fetching
  // Usually it is just query(collection(db, "coupons")) with no filter.
  // We should fetch all and filter in JS if needed, or query if we can.
  // Let's just fix it if they have onSnapshot(q, ...)
  if (filePath.includes('offers') || filePath.includes('discounts') || filePath.includes('coupons')) {
    content = content.replace(
      /items\.push\(\{ id: doc\.id, \.\.\.doc\.data\(\) \} as Coupon\);/g,
      `const data = doc.data();
        if (!data.branchId || data.branchId === "global" || data.branchId === session.branchId) {
          items.push({ id: doc.id, ...data } as Coupon);
        }`
    );
    // Note: session is not defined in the useEffect in discounts/page.tsx! We must add it.
    if (!content.includes('const session = JSON.parse(sessionStr);') && content.includes('const q = query(collection(db, "coupons"));')) {
      content = content.replace(
        /const q = query\(collection\(db, "coupons"\)\);/,
        `const sessionStr = localStorage.getItem("staffSession");
    const session = sessionStr ? JSON.parse(sessionStr) : {};
    const q = query(collection(db, "coupons"));`
      );
    }
  }

  // Also make sure addDoc for coupons has branchId
  if (filePath.includes('offers') || filePath.includes('discounts')) {
    if (!content.includes('branchId:')) {
      content = content.replace(
        /image: formData\.image \|\| ""/,
        `image: formData.image || "",
        branchId: session.branchId || ""`
      );
      // Need session inside handleSave
      if (!content.includes('const sessionStr = localStorage.getItem("staffSession");') && content.includes('const data = {') && !content.includes('const session = ')) {
        content = content.replace(
          /const data = \{/,
          `const sessionStr = localStorage.getItem("staffSession");
      const session = sessionStr ? JSON.parse(sessionStr) : {};
      const data = {`
        );
      }
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir('d:/Projects/Cafe/staff/src/app');
