"use client"

import React from "react"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from '@/hooks/use-toast'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload } from "lucide-react"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )
  const { toast } = useToast()

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile(profileData)
        setDisplayName(profileData.display_name || "")
        setBio(profileData.bio || "")
        setProfileImageUrl(profileData.profile_image_url || "")
      }
    }

    fetchProfile()
  }, [supabase, router])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      try { toast({ title: 'Image too large', description: 'Image must be less than 2MB' }) } catch {}
      return
    }

    setUploadingImage(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-profile.${fileExt}`
      const filePath = `profile-images/${fileName}`

      // Upload to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from("user-uploads")
        .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("user-uploads")
        .getPublicUrl(filePath)

      const imageUrl = publicUrlData?.publicUrl

      // Update profile with image URL
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          profile_image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (!updateError) {
        setProfileImageUrl(imageUrl)
        setSaved(true)
        try { toast({ title: 'Saved', description: 'Profile image updated' }) } catch {}
        setTimeout(() => setSaved(false), 2000)
      } else {
        try { toast({ title: 'Error', description: 'Failed to update profile image' }) } catch {}
      }
    } catch (err) {
      console.error("Error uploading image:", err)
      try { toast({ title: 'Error', description: 'Failed to upload image' }) } catch {}
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSaveProfile() {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          display_name: displayName,
          bio: bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (!error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => router.push("/dashboard")} className="text-primary hover:text-accent transition-colors">
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-foreground mb-8">My Profile</h1>

          <div className="space-y-6">
            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Profile Picture</label>
              <div className="flex items-center gap-6">
                {profileImageUrl && (
                  <div className="relative">
                    <img
                      src={profileImageUrl || "/placeholder.svg"}
                      alt="Profile"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-border"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingImage ? "Uploading..." : "Choose Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input type="email" value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Your email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
              <Input 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                placeholder="Your name"
                className="bg-muted border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground"
                rows={4}
              />
            </div>

            {saved && <p className="text-accent text-sm font-medium">Profile saved successfully!</p>}

            <Button 
              onClick={handleSaveProfile} 
              disabled={loading} 
              className="bg-primary hover:bg-accent text-primary-foreground"
            >
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
