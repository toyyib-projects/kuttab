"use client"

import { useEffect, useState, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  LayoutGrid, List, Plus, ChevronLeft, ChevronRight, 
  Edit2, Trash2, BookOpen, Clock, FileText, Target, LogOut, User as UserIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookCard } from "@/components/book-card"
import { BookUploadDialog } from "@/components/book-upload-dialog"
import { BookEditDialog } from "@/components/book-edit-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const CATEGORIES = [
  "Qur'an", "Hadith", "Fiqh", "Tafsir", "Aqeedah", "Seerah",
  "Usool Al-Fiqh", "Ilm Al-Hadith", "Arabic Language",
  "Uloom Al-Qur'an", "Qawaaid Al-fiqhiyyah", "Others"
]

export default function DashboardPage() {
  const [books, setBooks] = useState<any[]>([])
  const [profile, setProfile] = useState<{ display_name: string, avatar_url: string } | null>(null)
  const [stats, setStats] = useState({ totalBooks: 0, totalNotes: 0, totalReadingTime: 0, completedGoals: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [editingBook, setEditingBook] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs"
  )

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return; }

      // 1. Fetch Profile Data (Avatar and Username)
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single()
      
      if (profileData) setProfile(profileData)

      // 2. Fetch Books
      const { data: booksData } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setBooks(booksData || [])

      // 3. Fetch Statistics
      const [notesRes, sessionsRes, goalsRes] = await Promise.all([
        supabase.from("notes").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("reading_sessions").select("duration_minutes").eq("user_id", user.id),
        supabase.from("reading_goals").select("id", { count: "exact" }).eq("user_id", user.id).not("actual_completion_date", "is", null)
      ])

      setStats({
        totalBooks: booksData?.length || 0,
        totalNotes: notesRes.count || 0,
        totalReadingTime: sessionsRes.data?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0,
        completedGoals: goalsRes.count || 0,
      })
    } catch (err) { 
      console.error(err) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredBooks = useMemo(() => {
    return selectedCategory ? books.filter(b => b.category === selectedCategory) : books
  }, [books, selectedCategory])

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage)
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleDeleteBook = async (id: string) => {
    if (confirm("Delete this book?")) {
      await supabase.from("books").delete().eq("id", id)
      fetchData()
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 overflow-x-hidden">
      {/* Header / Navbar */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left Side: Add Book */}
          <Button 
            onClick={() => setShowUploadDialog(true)} 
            className="bg-[#00214d] hover:bg-[#00214d]/90 text-white font-bold rounded-xl px-4 h-10 shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5 stroke-[3px]" />
            <span className="text-xs sm:text-sm">Add Book</span>
          </Button>

          {/* Right Side: Interactive Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <h1 className="text-lg font-black text-[#00214d] uppercase tracking-tight hidden xs:block">
                  {profile?.display_name || "Username"}
                </h1>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border bg-[#00214d] flex items-center justify-center shadow-sm">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {profile?.display_name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {/* Settings removed per request */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Books", val: stats.totalBooks, icon: BookOpen },
            { label: "Notes", val: stats.totalNotes, icon: FileText },
            { label: "Mins", val: stats.totalReadingTime, icon: Clock },
            { label: "Goals", val: stats.completedGoals, icon: Target }
          ].map((s, i) => (
            <div key={i} className="bg-card p-3 rounded-xl border border-border shadow-sm flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg hidden sm:block">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-tighter text-muted-foreground font-bold">{s.label}</p>
                <p className="text-lg font-black">{s.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center gap-4 mb-6">
          <select
            value={selectedCategory || ""}
            onChange={(e) => { setSelectedCategory(e.target.value || null); setCurrentPage(1); }}
            className="h-9 px-3 text-xs font-bold rounded-lg border border-input bg-card w-full max-w-[150px] sm:max-w-[200px]"
          >
            <option value="">Categories</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <div className="flex bg-muted p-1 rounded-lg border border-border">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Books Display */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" 
            : "flex flex-col gap-2"
          }>
            {paginatedBooks.map((book) => (
              viewMode === "grid" ? (
                <div key={book.id} className="w-full max-w-[200px] mx-auto sm:max-w-none">
                  <Link href={`/read/${book.id}`} className="block h-full">
                    <BookCard book={book} onEdit={setEditingBook} onDelete={handleDeleteBook} />
                  </Link>
                </div>
              ) : (
                <div key={book.id} className="flex items-center justify-between p-3 bg-card border rounded-xl shadow-sm">
                  <Link href={`/read/${book.id}`} className="font-bold text-sm truncate flex-1 pr-4">{book.title}</Link>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingBook(book)}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBook(book.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-xs font-bold uppercase tracking-tighter">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        )}
      </main>

      {showUploadDialog && <BookUploadDialog onClose={() => { setShowUploadDialog(false); fetchData(); }} />}
      {editingBook && <BookEditDialog book={editingBook} onClose={() => setEditingBook(null)} onSave={fetchData} />}
    </div>
  )
}