"use client"

import type React from "react"
import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import Image from "next/image" // Added missing import
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase.from("user_profiles").insert([
          {
            id: data.user.id,
            display_name: displayName,
          },
        ])

        if (profileError) {
          console.error("Profile creation error:", profileError)
        }

        setSuccess(true)
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm p-8 text-center">
          <div className="text-5xl mb-4 text-accent">✓</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Account Created!</h2>
          <p className="text-muted-foreground mb-4">Please check your email to verify your account. Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm p-8">
        <div className="text-center mb-8 flex flex-col items-center">
          {/* FIXED: Restored consistent Image logo */}
          <Link href="/" className="hover:opacity-80 transition-opacity mb-4">
            <Image 
              src="/logo.png" 
              alt="Kuttab Logo" 
              width={120} 
              height={40} 
              className="h-8 w-auto object-contain" 
              priority 
            />
          </Link>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
            <Input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted border-border"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-muted border-border"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-muted border-border"
              required
            />
          </div>

          {error && <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm">{error}</div>}

          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-accent text-primary-foreground font-medium">
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:text-accent font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}