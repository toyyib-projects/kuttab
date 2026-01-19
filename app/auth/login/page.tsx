"use client"

import type React from "react"
import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import Image from "next/image" // FIXED: Added this import
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      router.push("/dashboard")
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm p-8">
        <div className="text-center mb-8 flex flex-col items-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            {/* Logo is now functional with the import above */}
            <Image 
              src="/logo.png" 
              alt="Kuttab Logo" 
              width={120} 
              height={40} 
              className="h-8 w-auto object-contain" 
              priority 
            />
          </Link>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

          {error && <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm">{error}</div>}

          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-accent text-primary-foreground font-medium">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-primary hover:text-accent font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}