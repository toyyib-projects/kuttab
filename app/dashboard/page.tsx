"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookCard } from "@/components/book-card"
import { BookUploadDialog } from "@/components/book-upload-dialog"
import { BookEditDialog } from "@/components/book-edit-dialog"
import { UserNav } from "@/components/user-nav"

const CATEGORIES = [
  "Qur'an",
  "Hadith",
  "Fiqh",
  "Tafsir",
  "Aqeedah",
  "Seerah",
  "Usool Al-Fiqh",
  "Ilm Al-Hadith",
  "Arabic Language",
  "Uloom Al-Qur'an",
  "Qawaaid Al-fiqhiyyah",
  "Others"
]

export default function DashboardPage() {
  const [books, setBooks] = useState<any[]>([])
  const [stats, setStats] = useState({ totalBooks: 0, totalNotes: 0, totalReadingTime: 0, completedGoals: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [editingBook, setEditingBook] = useState<any>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      let query = supabase.from("books").select("*").eq("user_id", user.id)

      if (selectedCategory) {
        query = query.eq("category", selectedCategory)
      }

      const { data: booksData } = await query

      setBooks(booksData || [])

      // Fetch statistics
      const { data: allBooks } = await supabase.from("books").select("id").eq("user_id", user.id)

      const { data: notesData } = await supabase
        .from("notes")
        .select("id")
        .eq("user_id", user.id)

      const { data: sessionsData } = await supabase
        .from("reading_sessions")
        .select("duration_minutes")
        .eq("user_id", user.id)

      const { data: goalsData } = await supabase
        .from("reading_goals")
        .select("id")
        .eq("user_id", user.id)
        .not("actual_completion_date", "is", null)

      const totalReadingTime = sessionsData?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0

      setStats({
        totalBooks: allBooks?.length || 0,
        totalNotes: notesData?.length || 0,
        totalReadingTime,
        completedGoals: goalsData?.length || 0,
      })
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedCategory, supabase, router])

  const handleEditBook = (book: any) => {
    setEditingBook(book)
  }

  const handleSaveBook = async (updatedData: any) => {
    try {
      const { error } = await supabase
        .from("books")
        .update(updatedData)
        .eq("id", editingBook.id)

      if (error) throw error

      // Refresh the books list
      await fetchData()
      setEditingBook(null)
    } catch (err) {
      console.error("Error updating book:", err)
      throw err
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    try {
      // Delete associated data first
      await supabase.from("notes").delete().eq("book_id", bookId)
      await supabase.from("reading_sessions").delete().eq("book_id", bookId)
      await supabase.from("reading_goals").delete().eq("book_id", bookId)
      
      // Delete the book
      const { error } = await supabase.from("books").delete().eq("id", bookId)

      if (error) throw error

      // Refresh the books list
      await fetchData()
    } catch (err) {
      console.error("Error deleting book:", err)
      alert("Failed to delete book. Please try again.")
    }
  }

  const filteredBooks = selectedCategory ? books.filter((b) => b.category === selectedCategory) : books

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="w-full px-2 sm:px-6 lg:px-8 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-1 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 flex-1">
              <Link href="/" className="text-primary hover:opacity-80 transition-opacity flex-shrink-0">
                <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 rotate-180" />
              </Link>
              <h1 className="text-base sm:text-2xl font-bold text-primary truncate">Kuttab</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <Button 
                onClick={() => setShowUploadDialog(true)} 
                className="px-1.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm bg-primary hover:bg-accent text-primary-foreground whitespace-nowrap transition-colors duration-200 h-7 sm:h-auto"
              >
                + Add
              </Button>
              <div className="flex-shrink-0 scale-75 sm:scale-100 origin-right">
                <UserNav />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="w-full px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-card border border-border rounded-lg p-2 sm:p-6 shadow-sm hover:border-accent transition-colors duration-200">
            <p className="text-muted-foreground text-[10px] sm:text-sm font-medium">Books</p>
            <p className="text-xl sm:text-3xl font-bold text-primary mt-0.5 sm:mt-2">{stats.totalBooks}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-2 sm:p-6 shadow-sm hover:border-accent transition-colors duration-200">
            <p className="text-muted-foreground text-[10px] sm:text-sm font-medium">Notes</p>
            <p className="text-xl sm:text-3xl font-bold text-primary mt-0.5 sm:mt-2">{stats.totalNotes}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-2 sm:p-6 shadow-sm hover:border-accent transition-colors duration-200">
            <p className="text-muted-foreground text-[10px] sm:text-sm font-medium">Time</p>
            <p className="text-xl sm:text-3xl font-bold text-primary mt-0.5 sm:mt-2">{Math.round(stats.totalReadingTime)}m</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-2 sm:p-6 shadow-sm hover:border-accent transition-colors duration-200">
            <p className="text-muted-foreground text-[10px] sm:text-sm font-medium">Goals</p>
            <p className="text-xl sm:text-3xl font-bold text-primary mt-0.5 sm:mt-2">{stats.completedGoals}</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-4 sm:mb-8">
          {/* Mobile Dropdown */}
          <div className="md:hidden">
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="w-full px-3 py-2 text-sm rounded-lg font-medium bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          
          {/* Desktop Buttons */}
          <div className="hidden md:flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                selectedCategory === null 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-foreground hover:bg-muted/80 border border-border"
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  selectedCategory === cat 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse">
              <div className="h-40 w-40 bg-muted rounded-lg"></div>
            </div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No books found. Start by adding your first book!</p>
            <Button 
              onClick={() => setShowUploadDialog(true)} 
              className="bg-primary hover:bg-accent text-primary-foreground"
            >
              Add Your First Book
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredBooks.map((book) => (
              <Link key={book.id} href={`/read/${book.id}`}>
                <BookCard 
                  book={book} 
                  onEdit={handleEditBook}
                  onDelete={handleDeleteBook}
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <BookUploadDialog
          onClose={() => {
            setShowUploadDialog(false)
            fetchData()
          }}
        />
      )}

      {/* Edit Dialog */}
      {editingBook && (
        <BookEditDialog
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSave={handleSaveBook}
        />
      )}
    </div>
  )
}