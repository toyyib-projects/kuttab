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

import { 
  BookOpen, FileText, Bookmark, 
  Languages, Target, Mic, 
  ChevronLeft, StickyNote, X 
} from "lucide-react"

export default function ReadPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string

 const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  // Book State
  const [book, setBook] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  
  // Indicators
  const [hasBookmark, setHasBookmark] = useState(false)
  const [hasNotes, setHasNotes] = useState(false)

  // Mobile Panel State
  const [activeMobileTab, setActiveMobileTab] = useState<string | null>(null)

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

  // Check for indicators on the current page
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
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden relative">
      
      {/* 1. HEADER: Centered title & wider page box */}
      <nav className="h-14 border-b flex items-center justify-between px-4 bg-white shrink-0 z-30">
        <div className="flex-1 flex items-center justify-start">
          <button onClick={() => router.push("/dashboard")} className="hover:bg-slate-100 p-2 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        <h1 className="flex-[2] text-center font-bold text-slate-800 truncate text-sm px-2">
          {book?.title}
        </h1>

        <div className="flex-1 flex justify-end">
          <div className="min-w-[70px] text-center text-[11px] font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
            Page {currentPage}
          </div>
        </div>
      </nav>

      {/* 2. MAIN LAYOUT */}
      <Tabs defaultValue="notes" className="flex flex-1 overflow-hidden h-full">
        <main className="flex flex-1 flex-row overflow-hidden p-2 md:p-4 gap-4 pb-20 lg:pb-4">
          
          {/* READER SECTION */}
          <section className="flex-[3] h-full flex flex-col relative min-w-0">
            
            {/* BOOKMARK INDICATOR: Top Center */}
            {hasBookmark && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 text-orange-500 drop-shadow-md">
                <Bookmark size={28} fill="currentColor" />
              </div>
            )}

            {/* NOTES INDICATOR: Left Middle */}
            {hasNotes && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-blue-600 text-white p-1.5 rounded-r-lg shadow-md">
                <StickyNote size={18} />
              </div>
            )}

            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <PdfViewerReactPdf 
                pdfUrl={proxiedPdfUrl} 
                onPageChange={handlePageChange} 
                currentPage={currentPage}
              />
            </div>
          </section>

          {/* DESKTOP INTERACTIVE PANEL */}
          <aside className="hidden lg:flex flex-[1] max-w-[400px] h-full flex-col shrink-0 overflow-hidden">
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <TabsList className="flex w-full h-11 bg-slate-50 border-b rounded-none p-1 gap-1">
                <PanelIconTrigger value="resources" icon={<BookOpen size={15} />} />
                <PanelIconTrigger value="notes" icon={<FileText size={15} />} />
                <PanelIconTrigger value="bookmarks" icon={<Bookmark size={15} />} />
                <PanelIconTrigger value="glossary" icon={<Languages size={15} />} />
                <PanelIconTrigger value="goals" icon={<Target size={15} />} />
                <PanelIconTrigger value="memorize" icon={<Mic size={15} />} />
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

      {/* 3. MOBILE INTERACTIVE DRAWER (Icon Rack) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div 
          className={`bg-white border-t rounded-t-3xl shadow-2xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
            activeMobileTab ? 'h-[55vh]' : 'h-0'
          }`}
        >
          <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{activeMobileTab}</span>
            <button onClick={() => setActiveMobileTab(null)} className="p-1 bg-slate-200 rounded-full text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-10">
            {activeMobileTab === 'resources' && <ResourcesPanel bookId={bookId} />}
            {activeMobileTab === 'notes' && <NotesPanel bookId={bookId} currentPage={currentPage} bookTitle={book?.title} />}
            {activeMobileTab === 'bookmarks' && <BookmarksPanel bookId={bookId} onBookmarkClick={handlePageChange} />}
            {activeMobileTab === 'glossary' && <GlossaryPanel bookId={bookId} />}
            {activeMobileTab === 'goals' && <ReadingGoalsPanel bookId={bookId} totalPages={book?.total_pages} />}
            {activeMobileTab === 'memorize' && <MemoizationPanel bookId={bookId} />}
          </div>
        </div>

        {/* BOTTOM NAV BAR */}
        <div className="h-16 bg-white border-t flex items-center justify-around px-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <MobileNavIcon icon={<BookOpen size={18} />} active={activeMobileTab === 'resources'} onClick={() => setActiveMobileTab('resources')} />
          <MobileNavIcon icon={<FileText size={18} />} active={activeMobileTab === 'notes'} onClick={() => setActiveMobileTab('notes')} />
          <MobileNavIcon icon={<Bookmark size={18} />} active={activeMobileTab === 'bookmarks'} onClick={() => setActiveMobileTab('bookmarks')} />
          <MobileNavIcon icon={<Languages size={18} />} active={activeMobileTab === 'glossary'} onClick={() => setActiveMobileTab('glossary')} />
          <MobileNavIcon icon={<Target size={18} />} active={activeMobileTab === 'goals'} onClick={() => setActiveMobileTab('goals')} />
          <MobileNavIcon icon={<Mic size={18} />} active={activeMobileTab === 'memorize'} onClick={() => setActiveMobileTab('memorize')} />
        </div>
      </div>
    </div>
  )
}

function PanelIconTrigger({ value, icon }: { value: string, icon: React.ReactNode }) {
  return (
    <TabsTrigger 
      value={value} 
      className="flex-1 h-full rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 text-slate-400"
    >
      {icon}
    </TabsTrigger>
  )
}

function MobileNavIcon({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg -translate-y-1' : 'text-slate-400'}`}
    >
      {icon}
    </button>
  )
}