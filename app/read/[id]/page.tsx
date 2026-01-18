"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  // Stable Supabase Client
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs"
  ), [])

  // Component State
  const [book, setBook] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [panelMenuOpen, setPanelMenuOpen] = useState(false)
  const [pageStartTime, setPageStartTime] = useState<number>(Date.now())

  // Proxy external URLs (Archive.org/Drive) through our local API to bypass CORS
  const proxiedPdfUrl = useMemo(() => {
    if (!book?.pdf_url) return ""
    // If it's already a local path or proxied, don't double-proxy
    if (book.pdf_url.startsWith('/') || book.pdf_url.includes('proxy-pdf')) return book.pdf_url
    return `/api/proxy-pdf?url=${encodeURIComponent(book.pdf_url)}`
  }, [book?.pdf_url])

  // Initial Data Fetch
  useEffect(() => {
    async function initSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return router.push("/auth/login")

        // Fetch book and last session in parallel
        const [bookData, sessionData] = await Promise.all([
          supabase.from("books").select("*").eq("id", bookId).single(),
          supabase.from("reading_sessions")
            .select("current_page")
            .eq("book_id", bookId)
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        ])

        if (bookData.error) throw bookData.error
        setBook(bookData.data)
        
        if (sessionData.data) {
          setCurrentPage(sessionData.data.current_page)
        }
      } catch (err) {
        console.error("Error loading reader:", err)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    initSession()
  }, [bookId, supabase, router])

  // Save Progress Logic
  const handlePageChange = useCallback(async (newPage: number) => {
    const timeSpentSeconds = Math.round((Date.now() - pageStartTime) / 1000)
    
    // Update local state immediately for snappy UI
    setCurrentPage(newPage)
    setPageStartTime(Date.now())

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Using UPSERT logic to handle session tracking
    const { data: existingSession } = await supabase
      .from("reading_sessions")
      .select("id, duration_minutes")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingSession) {
      const totalMinutes = (existingSession.duration_minutes || 0) + (timeSpentSeconds / 60)
      await supabase
        .from("reading_sessions")
        .update({ 
          current_page: newPage, 
          duration_minutes: totalMinutes,
          updated_at: new Date().toISOString() 
        })
        .eq("id", existingSession.id)
    } else {
      await supabase.from("reading_sessions").insert([{
        user_id: user.id,
        book_id: bookId,
        current_page: newPage,
        duration_minutes: timeSpentSeconds / 60
      }])
    }
  }, [bookId, pageStartTime, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Loading your library...</p>
        </div>
      </div>
    )
  }

  if (!book) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard")} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              ← <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="h-4 w-[1px] bg-border hidden sm:block"></div>
            <h1 className="text-lg font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
              {book.title}
            </h1>
          </div>
          <div className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
            Page {currentPage} {book.total_pages ? `of ${book.total_pages}` : ''}
          </div>
        </div>
      </nav>

      {/* Main Content Grid */}
      <main className="max-w-[1600px] mx-auto w-full px-4 py-4 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* PDF Viewer Section (Col 7/12) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
            {book.pdf_url ? (
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-lg" style={{ height: "calc(100vh - 120px)" }}>
                <PdfViewerReactPdf 
                  pdfUrl={proxiedPdfUrl} 
                  onPageChange={handlePageChange} 
                  currentPage={currentPage}
                />
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 text-center h-[60vh] flex flex-col items-center justify-center">
                <div className="text-4xl mb-4 text-muted-foreground">📄</div>
                <p className="text-foreground font-medium">No PDF source found</p>
                <p className="text-sm text-muted-foreground mt-2">Update the book details to include a valid PDF URL.</p>
              </div>
            )}
          </div>

          {/* Interactive Panels Section (Col 5/12) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full">
            <Tabs defaultValue="resources" className="flex flex-col h-full bg-card rounded-xl border border-border shadow-md overflow-hidden" style={{ height: "calc(100vh - 120px)" }}>
              <div className="bg-muted p-1 border-b border-border">
                <TabsList className="w-full flex justify-start overflow-x-auto no-scrollbar bg-transparent h-auto p-0">
                  <TabsTrigger value="resources" className="flex-1 py-2 text-xs uppercase tracking-wider">Source</TabsTrigger>
                  <TabsTrigger value="notes" className={`flex-1 py-2 text-xs uppercase tracking-wider ${!panelMenuOpen ? "hidden md:inline-flex" : ""}`}>Notes</TabsTrigger>
                  <TabsTrigger value="bookmarks" className={`flex-1 py-2 text-xs uppercase tracking-wider ${!panelMenuOpen ? "hidden md:inline-flex" : ""}`}>Marks</TabsTrigger>
                  <TabsTrigger value="glossary" className={`flex-1 py-2 text-xs uppercase tracking-wider ${!panelMenuOpen ? "hidden md:inline-flex" : ""}`}>Vocab</TabsTrigger>
                  <TabsTrigger value="goals" className={`flex-1 py-2 text-xs uppercase tracking-wider ${!panelMenuOpen ? "hidden md:inline-flex" : ""}`}>Goal</TabsTrigger>
                  <TabsTrigger value="memorize" className={`flex-1 py-2 text-xs uppercase tracking-wider ${!panelMenuOpen ? "hidden md:inline-flex" : ""}`}>A.I.</TabsTrigger>
                  <button 
                    onClick={() => setPanelMenuOpen(!panelMenuOpen)}
                    className="md:hidden px-3 text-muted-foreground hover:text-foreground"
                  >
                    {panelMenuOpen ? "✕" : "☰"}
                  </button>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <TabsContent value="resources" className="m-0 p-4"><ResourcesPanel bookId={bookId} /></TabsContent>
                <TabsContent value="notes" className="m-0 p-4"><NotesPanel bookId={bookId} currentPage={currentPage} bookTitle={book.title} /></TabsContent>
                <TabsContent value="bookmarks" className="m-0 p-4"><BookmarksPanel bookId={bookId} onBookmarkClick={handlePageChange} /></TabsContent>
                <TabsContent value="glossary" className="m-0 p-4"><GlossaryPanel bookId={bookId} /></TabsContent>
                <TabsContent value="goals" className="m-0 p-4"><ReadingGoalsPanel bookId={bookId} totalPages={book.total_pages} /></TabsContent>
                <TabsContent value="memorize" className="m-0 p-4"><MemoizationPanel bookId={bookId} /></TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  )
}