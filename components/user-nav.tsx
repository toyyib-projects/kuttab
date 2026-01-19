"use client"

import { LogOut, User as UserIcon } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserNav() {
  const router = useRouter()
  const [initials, setInitials] = useState("")
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs"
  )

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Try to get the name from the user_profiles table first
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()

      if (profile?.display_name) {
        const names = profile.display_name.split(" ")
        setInitials(names.map((n: string) => n[0]).join("").toUpperCase())
      } else if (user?.email) {
        setInitials(user.email[0].toUpperCase())
      }
    }
    getUserData()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Changed to an invisible overlay trigger so it sits on top of the avatar in your dashboard */}
        <button className="flex-shrink-0 w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-xs font-bold hover:bg-black/5 transition-colors">
          <span className="sr-only">Open user menu</span>
          {/* We keep the initials here as a small indicator if the main avatar fails to load */}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">
              Manage your profile
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        {/* Settings Item Removed */}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}