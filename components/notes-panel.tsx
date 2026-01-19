"use client"

import { useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from '@/hooks/use-toast'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Download, Plus, StickyNote, Eye, X, FileText, Loader2 } from "lucide-react"
// @ts-ignore - html2pdf doesn't have official types but works fine
import html2pdf from 'html2pdf.js'

interface Note {
  id: string
  page_number: number
  content: string
  title?: string
  created_at: string
  updated_at?: string
  formatting?: { bold?: boolean; italic?: boolean; underline?: boolean } | null
}

interface NotesPanelProps {
  bookId: string
  currentPage: number
  bookTitle?: string
}

export function NotesPanel({ bookId, currentPage, bookTitle = "My Book" }: NotesPanelProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Modal States
  const [modalMode, setModalMode] = useState<'none' | 'edit' | 'view' | 'preview'>('none')
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  
  // Form State
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  useEffect(() => {
    fetchNotes()
  }, [bookId])

  async function fetchNotes() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("book_id", bookId)
        .order("page_number", { ascending: true })
      if (!error) setNotes(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // --- Handlers ---
  const closeModals = () => {
    setModalMode('none')
    setActiveNote(null)
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl)
      setPdfPreviewUrl(null)
    }
  }

  const openEditModal = (note: Note | null = null) => {
    if (note) {
      setActiveNote(note)
      setEditTitle(note.title || "")
      setEditContent(note.content)
    } else {
      setActiveNote(null)
      setEditTitle("")
      setEditContent("")
    }
    setModalMode('edit')
  }

  async function saveNote() {
    if (!editContent.trim() || isSaving) return
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const noteData = {
        user_id: user?.id,
        book_id: bookId,
        page_number: currentPage,
        title: editTitle || `Page ${currentPage}`,
        content: editContent,
      }

      const { error } = activeNote 
        ? await supabase.from("notes").update(noteData).eq("id", activeNote.id)
        : await supabase.from("notes").insert([noteData])

      if (error) throw error
      toast({ title: "Saved" })
      fetchNotes()
      closeModals()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // --- PDF Logic with html2pdf ---
  async function generatePDFPreview() {
    setIsGenerating(true)
    const element = document.getElementById('pdf-content')
    
    const opt = {
      margin: 15,
      filename: `${bookTitle}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    try {
      const pdfBlob = await html2pdf().from(element).set(opt).output('blob')
      const url = URL.createObjectURL(pdfBlob)
      setPdfPreviewUrl(url)
      setModalMode('preview')
    } catch (err) {
      toast({ title: "PDF Error", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => openEditModal()} className="flex-1"><Plus className="w-4 h-4 mr-2"/> New Note</Button>
        <Button variant="outline" onClick={generatePDFPreview} disabled={notes.length === 0 || isGenerating} className="flex-1">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <FileText className="w-4 h-4 mr-2"/>}
          Preview PDF
        </Button>
      </div>

      {/* List */}
      <div className="grid gap-2 overflow-y-auto max-h-[500px] pr-2">
        {notes.map(note => (
          <div key={note.id} onClick={() => { setActiveNote(note); setModalMode('view'); }} 
               className="p-3 bg-card border rounded-lg cursor-pointer hover:border-primary transition-all group">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-sm truncate">{note.title}</h4>
              <button onClick={(e) => { e.stopPropagation(); openEditModal(note); }} className="opacity-0 group-hover:opacity-100 p-1"><Edit2 className="w-3 h-3"/></button>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2" dir="auto">{note.content}</p>
          </div>
        ))}
      </div>

      {/* VIEW MODAL */}
      {modalMode === 'view' && activeNote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-lg rounded-xl shadow-xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-muted/20">
              <h3 className="font-bold">Page {activeNote.page_number}</h3>
              <Button variant="ghost" size="icon" onClick={closeModals}><X/></Button>
            </div>
            <div className="p-6 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4" dir="auto">{activeNote.title}</h2>
              <p className="whitespace-pre-wrap leading-relaxed" dir="auto">{activeNote.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {modalMode === 'edit' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl rounded-xl shadow-xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{activeNote ? 'Edit Note' : 'New Note'}</h3>
              <Button variant="ghost" size="icon" onClick={closeModals}><X/></Button>
            </div>
            <div className="p-6 space-y-4">
              <Input placeholder="Title" value={editTitle} onChange={e => setEditTitle(e.target.value)} dir="auto" />
              <textarea ref={textareaRef} className="w-full min-h-[250px] p-4 bg-muted rounded-lg resize-none" 
                        placeholder="Write here... (Arabic supported)" value={editContent} 
                        onChange={e => setEditContent(e.target.value)} dir="auto" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={closeModals}>Cancel</Button>
                <Button onClick={saveNote} disabled={isSaving}>{isSaving ? "Saving..." : "Save Note"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {modalMode === 'preview' && pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex flex-col items-center justify-center p-4">
          <div className="bg-background w-full max-w-5xl h-[90vh] rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-card">
              <h3 className="font-bold">PDF Preview (Arabic Shaping Applied)</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeModals}>Close</Button>
                <Button onClick={() => { const a = document.createElement('a'); a.href = pdfPreviewUrl; a.download = `${bookTitle}.pdf`; a.click(); }}>
                  <Download className="w-4 h-4 mr-2"/> Download
                </Button>
              </div>
            </div>
            <iframe src={pdfPreviewUrl} className="flex-1 w-full border-none" />
          </div>
        </div>
      )}

      {/* HIDDEN PDF TEMPLATE (The logic uses this to build the PDF) */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div id="pdf-content" style={{ padding: '20px', width: '180mm', color: 'black', background: 'white' }}>
          <h1 style={{ fontSize: '24pt', fontWeight: 'bold', borderBottom: '2px solid black', marginBottom: '20px' }}>{bookTitle}</h1>
          {notes.map(note => (
            <div key={note.id} style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '16pt', fontWeight: 'bold' }}>{note.title}</h3>
                <span style={{ fontSize: '10pt', color: '#666' }}>Page {note.page_number}</span>
              </div>
              <p style={{ fontSize: '12pt', whiteSpace: 'pre-wrap', lineHeight: '1.6' }} dir="auto">
                {note.content}
              </p>
              <div style={{ borderBottom: '1px solid #eee', marginTop: '15px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}