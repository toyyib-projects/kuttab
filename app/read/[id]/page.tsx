"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
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
import { Toaster } from "@/components/ui/toaster"

import { 
  BookOpen, FileText, Bookmark, 
  Languages, Target, Mic, 
  ChevronLeft, StickyNote, X,
  RefreshCw, Check 
} from "lucide-react"

// --- SKELETON COMPONENTS ---
function LoadingSkeleton() {
  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden animate-pulse">
      <nav className="h-14 border-b flex items-center justify-between px-4 bg-white shrink-0">
        <div className="w-8 h-8 bg-slate-200 rounded-full" />
        <div className="w-48 h-6 bg-slate-200 rounded" />
        <div className="w-24 h-6 bg-slate-200 rounded-full" />
      </nav>
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        <div className="flex-[3] bg-white rounded-xl border border-slate-200" />
        <div className="hidden lg:block flex-[1] max-w-[400px] bg-white rounded-xl border border-slate-200" />
      </div>
    </div>
  )
}

export default function ReadPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs"
  )

  const [book, setBook] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [hasBookmark, setHasBookmark] = useState(false)
  const [hasNotes, setHasNotes] = useState(false)
  const [activeMobileTab, setActiveMobileTab] = useState<string | null>(null)

  // 1. INITIAL LOAD
  useEffect(() => {
    async function initSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return router.push("/auth/login")

        const [bookData, sessionData] = await Promise.all([
          supabase.from("books").select("*").eq("id", bookId).single(),
          supabase.from("reading_sessions")
            .select("current_page")
            .eq("book_id", bookId)
            .eq("user_id", user.id)
            .maybeSingle()
        ])

        if (bookData.error) throw bookData.error
        setBook(bookData.data)
        if (sessionData.data) setCurrentPage(sessionData.data.current_page)
      } catch (err) {
        console.error("Reader Error:", err)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }
    initSession()
  }, [bookId, supabase, router])

  // 2. SAVING LOGIC (Using your "updated_at" column)
  useEffect(() => {
    if (loading || !bookId) return

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    setSaveStatus('saving')

    saveTimeoutRef.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("reading_sessions")
        .upsert({
          book_id: bookId,
          user_id: user.id,
          current_page: currentPage,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'book_id,user_id' })

      if (error) {
        console.error("Sync Failed:", error.message)
        setSaveStatus('idle')
      } else {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    }, 1500)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [currentPage, bookId, supabase, loading])

  // 3. INDICATORS
  useEffect(() => {
    async function checkIndicators() {
      const { data: bmarks } = await supabase.from("bookmarks").select("id").eq("book_id", bookId).eq("page_number", currentPage).limit(1)
      const { data: notes } = await supabase.from("notes").select("id").eq("book_id", bookId).eq("page_number", currentPage).limit(1)
      setHasBookmark((bmarks?.length ?? 0) > 0)
      setHasNotes((notes?.length ?? 0) > 0)
    }
    if (bookId && !loading) checkIndicators()
  }, [currentPage, bookId, supabase, loading])

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage)
  }, [])

  const proxiedPdfUrl = useMemo(() => {
    if (!book?.pdf_url) return ""
    return book.pdf_url.startsWith('/') || book.pdf_url.includes('proxy-pdf') 
      ? book.pdf_url 
      : `/api/proxy-pdf?url=${encodeURIComponent(book.pdf_url)}`
  }, [book?.pdf_url])

  // Return Skeleton while loading
  if (loading) return <LoadingSkeleton />

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden relative">
      <Toaster />
      
      {/* HEADER */}
      <nav className="h-14 border-b flex items-center justify-between px-4 bg-white shrink-0 z-30 shadow-sm">
        <div className="flex-1 flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="hover:bg-slate-100 p-2 rounded-full transition-colors text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1.5">
            {saveStatus === 'saving' ? (
              <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            ) : saveStatus === 'saved' ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : null}
            <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:block">
              {saveStatus === 'saving' ? 'Syncing' : saveStatus === 'saved' ? 'Saved' : 'Online'}
            </span>
          </div>
        </div>
        
        <div className="flex-[2] text-center">
          <h1 className="font-bold text-slate-800 truncate text-sm px-2">
            {book?.title}
          </h1>
        </div>

        <div className="flex-1 flex justify-end">
          <div className="text-[11px] font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
            P. {currentPage}
          </div>
        </div>
      </nav>

      <Tabs defaultValue="notes" className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-row overflow-hidden p-2 md:p-4 gap-4 pb-20 lg:pb-4">
          <section className="flex-[3] h-full flex flex-col relative min-w-0">
            {/* INDICATORS OVERLAY */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
               {hasBookmark && <div className="text-orange-500 bg-white p-1.5 rounded-full border shadow-sm"><Bookmark size={18} fill="currentColor" /></div>}
               {hasNotes && <div className="text-blue-600 bg-white p-1.5 rounded-full border shadow-sm"><StickyNote size={18} /></div>}
            </div>

            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <PdfViewerReactPdf 
                pdfUrl={proxiedPdfUrl} 
                onPageChange={handlePageChange} 
                currentPage={currentPage}
              />
            </div>
          </section>

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
              <div className="flex-1 overflow-y-auto custom-scrollbar">
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

      {/* MOBILE PANEL MODAL */}
      {activeMobileTab && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-slate-800 capitalize">{activeMobileTab}</h2>
              <button 
                onClick={() => setActiveMobileTab(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeMobileTab === 'resources' && <ResourcesPanel bookId={bookId} />}
              {activeMobileTab === 'notes' && <NotesPanel bookId={bookId} currentPage={currentPage} bookTitle={book?.title} />}
              {activeMobileTab === 'bookmarks' && <BookmarksPanel bookId={bookId} onBookmarkClick={(page) => { handlePageChange(page); setActiveMobileTab(null); }} />}
              {activeMobileTab === 'glossary' && <GlossaryPanel bookId={bookId} />}
              {activeMobileTab === 'goals' && <ReadingGoalsPanel bookId={bookId} totalPages={book?.total_pages} />}
              {activeMobileTab === 'memorize' && <MemoizationPanel bookId={bookId} />}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white border-t flex items-center justify-around px-2 pb-safe shadow-lg">
          <MobileNavIcon icon={<BookOpen size={20} />} active={activeMobileTab === 'resources'} onClick={() => setActiveMobileTab(activeMobileTab === 'resources' ? null : 'resources')} />
          <MobileNavIcon icon={<FileText size={20} />} active={activeMobileTab === 'notes'} onClick={() => setActiveMobileTab(activeMobileTab === 'notes' ? null : 'notes')} />
          <MobileNavIcon icon={<Bookmark size={20} />} active={activeMobileTab === 'bookmarks'} onClick={() => setActiveMobileTab(activeMobileTab === 'bookmarks' ? null : 'bookmarks')} />
          <MobileNavIcon icon={<Languages size={20} />} active={activeMobileTab === 'glossary'} onClick={() => setActiveMobileTab(activeMobileTab === 'glossary' ? null : 'glossary')} />
          <MobileNavIcon icon={<Target size={20} />} active={activeMobileTab === 'goals'} onClick={() => setActiveMobileTab(activeMobileTab === 'goals' ? null : 'goals')} />
          <MobileNavIcon icon={<Mic size={20} />} active={activeMobileTab === 'memorize'} onClick={() => setActiveMobileTab(activeMobileTab === 'memorize' ? null : 'memorize')} />
      </div>
    </div>
  )
}

function PanelIconTrigger({ value, icon }: { value: string, icon: React.ReactNode }) {
  return (
    <TabsTrigger value={value} className="flex-1 h-full rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400 transition-all">{icon}</TabsTrigger>
  )
}

function MobileNavIcon({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`p-3 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg -translate-y-2' : 'text-slate-400'}`}>{icon}</button>
  )
}