async function testUpload() {
  const uploadData = new FormData();
  uploadData.append("file", "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400"); // Almond milk
  uploadData.append("upload_preset", "restaurant_pos"); 

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/dwhee5w49/image/upload", {
      method: "POST",
      body: uploadData,
    });
    const data = await res.json();
    console.log("Upload result:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

testUpload();
