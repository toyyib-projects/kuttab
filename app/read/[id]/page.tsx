"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import PdfViewerReactPdf from "@/components/pdf-viewer-reactpdf"
import { NotesPanel } from "@/components/notes-panel"
import { BookmarksPanel } from "@/components/bookmarks-panel"
import { GlossaryPanel } from "@/components/glossary-panel"
import { ResourcesPanel } from "@/components/resources-panel"
import { ReadingGoalsPanel } from "@/components/reading-goals-panel"
import { MemoizationPanel } from "@/components/memorization-panel"

import { 
  BookOpen, FileText, Bookmark, 
  Languages, Target, Mic, 
  ChevronLeft, Menu, StickyNote 
} from "lucide-react"

export default function ReadPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [book, setBook] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  
  // States for PDF Overlay Indicators
  const [hasBookmark, setHasBookmark] = useState(false)
  const [hasNotes, setHasNotes] = useState(false)

  useEffect(() => {
    async function initSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return router.push("/auth/login")

        const [bookData, sessionData] = await Promise.all([
          supabase.from("books").select("*").eq("id", bookId).single(),
          supabase.from("reading_sessions").select("current_page").eq("book_id", bookId).eq("user_id", user.id).maybeSingle()
        ])

        if (bookData.error) throw bookData.error
        setBook(bookData.data)
        if (sessionData.data) setCurrentPage(sessionData.data.current_page)
      } catch (err) {
        console.error("Error loading reader:", err)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }
    initSession()
  }, [bookId, supabase, router])

  // Effect to check for page indicators
  useEffect(() => {
    async function checkIndicators() {
      const { data: bmarks } = await supabase.from("bookmarks").select("id").eq("book_id", bookId).eq("page_number", currentPage).limit(1)
      const { data: notes } = await supabase.from("notes").select("id").eq("book_id", bookId).eq("page_number", currentPage).limit(1)
      
      setHasBookmark((bmarks?.length ?? 0) > 0)
      setHasNotes((notes?.length ?? 0) > 0)
    }
    if (bookId) checkIndicators()
  }, [currentPage, bookId, supabase])

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage)
  }, [])

  const proxiedPdfUrl = useMemo(() => {
    if (!book?.pdf_url) return ""
    return book.pdf_url.startsWith('/') || book.pdf_url.includes('proxy-pdf') 
      ? book.pdf_url 
      : `/api/proxy-pdf?url=${encodeURIComponent(book.pdf_url)}`
  }, [book?.pdf_url])

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden">
      
      {/* 1. GLOBAL HEADER */}
      <nav className="h-14 border-b flex items-center justify-between px-6 bg-white shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="hover:bg-slate-100 p-2 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-slate-800 truncate max-w-[300px]">{book?.title}</h1>
        </div>
        <div className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border">
          Page {currentPage}
        </div>
      </nav>

      {/* 2. MAIN LAYOUT */}
      <Tabs defaultValue="notes" className="flex flex-1 overflow-hidden h-full">
        <main className="flex flex-1 flex-row overflow-hidden p-4 gap-4">
          
          {/* READER SECTION (Most Space) */}
          <section className="flex-[3] h-full flex flex-col relative min-w-0">
            {/* PDF INDICATORS OVERLAY */}
            <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 pointer-events-none">
              {hasBookmark && (
                <div className="bg-orange-500 text-white p-2 rounded-bl-lg shadow-lg animate-in fade-in slide-in-from-top-2">
                  <Bookmark size={20} fill="currentColor" />
                </div>
              )}
              {hasNotes && (
                <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-4">
                  <StickyNote size={20} fill="currentColor" />
                </div>
              )}
            </div>

            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <PdfViewerReactPdf 
                pdfUrl={proxiedPdfUrl} 
                onPageChange={handlePageChange} 
                currentPage={currentPage}
              />
            </div>
          </section>

          {/* INTERACTIVE PANEL SECTION (Sidebar on top) */}
          <aside className="hidden lg:flex flex-[1] max-w-[420px] h-full flex-col shrink-0 overflow-hidden">
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              
              {/* NAVIGATION ON TOP OF PANEL */}
              <TabsList className="flex w-full h-14 bg-slate-50 border-b rounded-none p-1 gap-1">
                <PanelIconTrigger value="resources" icon={<BookOpen size={18} />} />
                <PanelIconTrigger value="notes" icon={<FileText size={18} />} />
                <PanelIconTrigger value="bookmarks" icon={<Bookmark size={18} />} />
                <PanelIconTrigger value="glossary" icon={<Languages size={18} />} />
                <PanelIconTrigger value="goals" icon={<Target size={18} />} />
                <PanelIconTrigger value="memorize" icon={<Mic size={18} />} />
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="resources" className="m-0 outline-none"><ResourcesPanel bookId={bookId} /></TabsContent>
                <TabsContent value="notes" className="m-0 outline-none p-4"><NotesPanel bookId={bookId} currentPage={currentPage} bookTitle={book?.title} /></TabsContent>
                <TabsContent value="bookmarks" className="m-0 outline-none p-4"><BookmarksPanel bookId={bookId} onBookmarkClick={handlePageChange} /></TabsContent>
                <TabsContent value="glossary" className="m-0 outline-none p-4"><GlossaryPanel bookId={bookId} /></TabsContent>
                <TabsContent value="goals" className="m-0 outline-none p-4"><ReadingGoalsPanel bookId={bookId} totalPages={book?.total_pages} /></TabsContent>
                <TabsContent value="memorize" className="m-0 outline-none p-4"><MemoizationPanel bookId={bookId} /></TabsContent>
              </div>
            </div>
          </aside>
        </main>
      </Tabs>
    </div>
  )
}

function PanelIconTrigger({ value, icon }: { value: string, icon: React.ReactNode }) {
  return (
    <TabsTrigger 
      value={value} 
      className="flex-1 h-full rounded-md transition-all
                 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600
                 text-slate-500 hover:text-slate-800"
    >
      {icon}
    </TabsTrigger>
  )
}

function MobilePanelContent({ bookId, currentPage, bookTitle, onPageChange }: any) {
  return (
    <Tabs defaultValue="notes" className="flex flex-col h-full bg-white">
      <TabsList className="grid grid-cols-6 h-12 bg-slate-50 border-b shrink-0">
        <TabsTrigger value="resources" className="data-[state=active]:bg-white"><BookOpen size={18} /></TabsTrigger>
        <TabsTrigger value="notes" className="data-[state=active]:bg-white"><FileText size={18} /></TabsTrigger>
        <TabsTrigger value="bookmarks" className="data-[state=active]:bg-white"><Bookmark size={18} /></TabsTrigger>
        <TabsTrigger value="glossary" className="data-[state=active]:bg-white"><Languages size={18} /></TabsTrigger>
        <TabsTrigger value="goals" className="data-[state=active]:bg-white"><Target size={18} /></TabsTrigger>
        <TabsTrigger value="memorize" className="data-[state=active]:bg-white"><Mic size={18} /></TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-y-auto p-4">
        {/* Contents same as Desktop TabsContent */}
      </div>
    </Tabs>
  )
}