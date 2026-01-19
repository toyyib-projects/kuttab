"use client"

import React, { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from '@/hooks/use-toast'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Loader2, ChevronLeft, User, CheckCircle2, AlertCircle } from "lucide-react"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [profileImageUrl, setProfileImageUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
  )

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push("/auth/login")
          return
        }
        setUser(user)

        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') throw profileError

        if (profileData) {
          setDisplayName(profileData.display_name || "")
          setBio(profileData.bio || "")
          setProfileImageUrl(profileData.avatar_url || "")
        }
      } catch (error: any) {
        toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [supabase, router, toast])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max size is 5MB', variant: 'destructive' })
      return
    }

    setUploadingImage(true)
    try {
      const fileExt = file.name.split(".").pop()
      const filePath = `profile-images/${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("user-upload")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("user-upload")
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      if (updateError) throw updateError

      setProfileImageUrl(publicUrl)
      toast({ title: 'Image Uploaded', description: 'Your profile picture has been updated.' })
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSaveProfile() {
    if (!user) return
    setIsSaving(true)
    setSaveStatus("idle")

    try {
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          display_name: displayName,
          bio: bio,
          avatar_url: profileImageUrl,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      
      setSaveStatus("success")
      toast({ title: 'Success', description: 'Profile changes saved.' })
      
      // Reset success status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (err: any) {
      setSaveStatus("error")
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.push("/dashboard")} 
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Update your photo and personal details</p>
          </div>

          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Profile Picture</label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md cursor-pointer hover:opacity-90 transition-opacity">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingImage ? "Uploading..." : "Change Image"}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input value={user?.email || ""} disabled className="bg-muted opacity-60" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder="How you appear to others"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a bit about yourself..."
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving || uploadingImage} 
                variant={saveStatus === "success" ? "outline" : "default"}
                className={`w-full sm:w-auto min-w-[160px] transition-all duration-300 ${
                  saveStatus === "success" ? "border-green-500 text-green-600 hover:bg-green-50" : ""
                }`}
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : saveStatus === "success" ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Changes Saved</>
                ) : saveStatus === "error" ? (
                  <><AlertCircle className="w-4 h-4 mr-2" /> Try Again</>
                ) : (
                  "Save Profile"
                )}
              </Button>

              {saveStatus === "success" && (
                <span className="text-sm text-green-600 font-medium animate-in fade-in slide-in-from-left-2">
                  Saved successfully!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}