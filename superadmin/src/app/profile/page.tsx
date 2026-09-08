"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, Mail, Phone, Lock, Camera } from "lucide-react";
import { auth, db } from "@/lib/firebase/config";
import { updateProfile, updatePassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState("Loading...");
  const [displayName, setDisplayName] = useState("Super Admin");
  const [firstName, setFirstName] = useState("Super");
  const [lastName, setLastName] = useState("Admin");
  const [phone, setPhone] = useState("+91 98765 00000");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserEmail(user.email || "No email provided");
        if (user.displayName) {
          setDisplayName(user.displayName);
          const parts = user.displayName.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
        
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.firstName) setFirstName(data.firstName);
            if (data.lastName) setLastName(data.lastName);
            if (data.phone) setPhone(data.phone);
            if (data.photoURL) setAvatarUrl(data.photoURL);
            else if (user.photoURL) setAvatarUrl(user.photoURL);
            
            if (data.firstName || data.lastName) {
              setDisplayName(`${data.firstName || ""} ${data.lastName || ""}`.trim());
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setIsUploading(true);
    let uploadedImageUrl = avatarUrl;
    
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "restaurant_pos");
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData,
        });
        
        const data = await res.json();
        if (data.secure_url) {
          uploadedImageUrl = data.secure_url;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const newDisplayName = `${firstName} ${lastName}`.trim();
      await updateProfile(auth.currentUser, { 
        displayName: newDisplayName,
        photoURL: uploadedImageUrl
      });
      
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, {
        firstName,
        lastName,
        phone,
        email: userEmail,
        role: "superadmin",
        photoURL: uploadedImageUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setDisplayName(newDisplayName);
      setAvatarUrl(uploadedImageUrl);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile.");
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      await updatePassword(auth.currentUser, newPassword);
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Please log out and log back in to change your password.");
      } else {
        toast.error(error.message || "Failed to update password.");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your Super Admin account details and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Overview */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm text-center">
            <CardContent className="pt-8 pb-6 flex flex-col items-center">
              <div className="relative group">
                <input type="file" id="avatarUpload" className="hidden" accept="image/*" onChange={handleFileChange} />
                <label htmlFor="avatarUpload" className="cursor-pointer">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-lg relative overflow-hidden">
                    <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">{firstName.charAt(0)}{lastName.charAt(0)}</AvatarFallback>
                    
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </Avatar>
                </label>
                <div className="absolute bottom-0 right-0 bg-emerald-500 w-5 h-5 rounded-full border-4 border-white pointer-events-none"></div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-4">{displayName}</h3>
              <p className="text-sm text-slate-500 mb-4">{userEmail}</p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" /> System Administrator
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 font-medium truncate w-full" title={userEmail}>{userEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 font-medium">{isLoading ? "Loading..." : phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 font-medium">Last login: Today</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="space-y-4" onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-slate-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={userEmail} disabled className="bg-slate-100 text-slate-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-slate-50" />
                </div>
                <div className="pt-4">
                  <Button type="submit" className="shadow-md shadow-primary/20" disabled={isUploading}>
                    {isUploading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Update Password</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="space-y-4" onSubmit={handleUpdatePassword}>
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password (optional for demo)</Label>
                  <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-slate-50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new">New Password</Label>
                    <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm New Password</Label>
                    <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-slate-50" />
                  </div>
                </div>
                <div className="pt-4">
                  <Button type="submit" variant="outline" className="text-primary border-primary hover:bg-primary hover:text-white">Update Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
