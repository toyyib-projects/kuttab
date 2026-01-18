"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import PdfViewerReactPdf from "@/components/pdf-viewer-reactpdf"
import { NotesPanel } from "@/components/notes-panel"
import { BookmarksPanel } from "@/components/bookmarks-panel"
import { GlossaryPanel } from "@/components/glossary-panel"
import { ResourcesPanel } from "@/components/resources-panel"
import { ReadingGoalsPanel } from "@/components/reading-goals-panel"
import { MemoizationPanel } from "@/components/memorization-panel"

export default function ReadPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  const [book, setBook] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [panelMenuOpen, setPanelMenuOpen] = useState(false)
  const [readingTimeOnPage, setReadingTimeOnPage] = useState(0)
  const [pageStartTime, setPageStartTime] = useState<number>(Date.now())

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  useEffect(() => {
    async function fetchBook() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", bookId)
          .eq("user_id", user.id)
          .single()

        if (error) throw error

        setBook(data)

        // Fetch last reading session
        const { data: session } = await supabase
          .from("reading_sessions")
          .select("current_page")
          .eq("book_id", bookId)
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single()

        if (session) {
          setCurrentPage(session.current_page)
        }
      } catch (err) {
        console.error("Error fetching book:", err)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchBook()
  }, [bookId, supabase, router])

  // Track reading time on page
  useEffect(() => {
    const timer = setInterval(() => {
      setReadingTimeOnPage((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handlePageChange = async (newPage: number) => {
    // Record time spent on current page
    const timeSpentSeconds = Math.round((Date.now() - pageStartTime) / 1000)
    
    setCurrentPage(newPage)
    setPageStartTime(Date.now())
    setReadingTimeOnPage(0)

    // Update reading session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: existingSession } = await supabase
        .from("reading_sessions")
        .select("id, duration_minutes")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single()

      if (existingSession) {
        const totalMinutes = ((existingSession.duration_minutes || 0) * 60 + timeSpentSeconds) / 60
        await supabase
          .from("reading_sessions")
          .update({ 
            current_page: newPage, 
            updated_at: new Date().toISOString(),
            duration_minutes: totalMinutes 
          })
          .eq("id", existingSession.id)
      } else {
        await supabase.from("reading_sessions").insert([
          {
            user_id: user.id,
            book_id: bookId,
            current_page: newPage,
            duration_minutes: timeSpentSeconds / 60,
          },
        ])
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse">
          <div className="h-12 w-48 bg-muted rounded-lg mb-4"></div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground">Book not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/dashboard")} 
              className="text-primary hover:text-accent transition-colors duration-200"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-foreground hidden sm:block">{book.title}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage}
            </p>

          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-3 sm:gap-4 h-full">
          {/* PDF Viewer (50% width on large screens) */}
          <div className="lg:col-span-5 min-h-[60vh] sm:min-h-[70vh]">
            {book.pdf_url ? (
              <div className="animate-fade-in bg-card rounded-xl border border-border overflow-hidden shadow-sm" style={{ height: "80vh" }}>
                <PdfViewerReactPdf 
                  pdfUrl={book.pdf_url} 
                  onPageChange={handlePageChange} 
                  currentPage={currentPage}
                />
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-8 text-center shadow-sm">
                <p className="text-foreground mb-4 font-medium">No PDF available for this book</p>
                <p className="text-sm text-muted-foreground">Please add a PDF URL to this book to start reading</p>
              </div>
            )}
          </div>

          {/* Side Panels (50% width on large screens) */}
          <div className="lg:col-span-5 animate-slide-in">
            <Tabs defaultValue="resources" className="bg-card rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-between bg-muted rounded-t-xl p-2 border-b border-border">
                <TabsList className="w-full grid grid-cols-6 bg-transparent">
                  <TabsTrigger value="resources" className="text-xs sm:text-sm">Resources</TabsTrigger>
                  <TabsTrigger value="notes" className={`text-xs sm:text-sm ${!panelMenuOpen ? "hidden sm:inline-flex" : ""}`}>Notes</TabsTrigger>
                  <TabsTrigger value="bookmarks" className={`text-xs sm:text-sm ${!panelMenuOpen ? "hidden sm:inline-flex" : ""}`}>Marks</TabsTrigger>
                  <TabsTrigger value="glossary" className={`text-xs sm:text-sm ${!panelMenuOpen ? "hidden sm:inline-flex" : ""}`}>Words</TabsTrigger>
                  <TabsTrigger value="goals" className={`text-xs sm:text-sm ${!panelMenuOpen ? "hidden sm:inline-flex" : ""}`}>Goals</TabsTrigger>
                  <TabsTrigger value="memorize" className={`text-xs sm:text-sm ${!panelMenuOpen ? "hidden sm:inline-flex" : ""}`}>Voice</TabsTrigger>
                </TabsList>
                <button
                  onClick={() => setPanelMenuOpen(!panelMenuOpen)}
                  className="sm:hidden p-1 hover:bg-background rounded transition-colors ml-2"
                  title="Toggle menu"
                >
                  ☰
                </button>
              </div>

              <TabsContent value="resources" className="p-4 min-h-96">
                <ResourcesPanel bookId={bookId} />
              </TabsContent>

              <TabsContent value="notes" className="p-4 min-h-96">
                <NotesPanel bookId={bookId} currentPage={currentPage} bookTitle={book.title} />
              </TabsContent>

              <TabsContent value="bookmarks" className="p-4 min-h-96">
                <BookmarksPanel bookId={bookId} onBookmarkClick={(page) => handlePageChange(page)} />
              </TabsContent>

              <TabsContent value="glossary" className="p-4 min-h-96">
                <GlossaryPanel bookId={bookId} />
              </TabsContent>

              <TabsContent value="goals" className="p-4 min-h-96">
                <ReadingGoalsPanel bookId={bookId} totalPages={book.total_pages} />
              </TabsContent>

              <TabsContent value="memorize" className="p-4 min-h-96">
                <MemoizationPanel bookId={bookId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
