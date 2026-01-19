"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from '@/hooks/use-toast'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Download, Plus, StickyNote } from "lucide-react"
import jsPDF from "jspdf"

interface NotesPanelProps {
  bookId: string
  currentPage: number
  bookTitle?: string
}

interface Note {
  id: string
  page_number: number
  content: string
  title?: string
  created_at: string
  updated_at?: string
  formatting?: { bold?: boolean; italic?: boolean; underline?: boolean } | null
}

// Virtual scrolling config
const ITEM_HEIGHT = 120
const BUFFER_SIZE = 3

// Loading skeleton
function NoteSkeleton() {
  return (
    <div className="bg-muted border border-border rounded-lg p-3 animate-pulse space-y-2">
      <div className="flex justify-between">
        <div className="h-4 bg-muted-foreground/20 rounded w-1/3" />
        <div className="h-3 bg-muted-foreground/20 rounded w-1/4" />
      </div>
      <div className="h-3 bg-muted-foreground/20 rounded w-full" />
      <div className="h-3 bg-muted-foreground/20 rounded w-2/3" />
    </div>
  )
}

export function NotesPanel({ bookId, currentPage, bookTitle = "My Book" }: NotesPanelProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [formatting, setFormatting] = useState({ bold: false, italic: false, underline: false })
  const [savedIndicator, setSavedIndicator] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showCompileConfirm, setShowCompileConfirm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

 const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs"
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
        .order("created_at", { ascending: false })

      if (!error) {
        setNotes(data || [])
      }
    } catch (err) {
      console.error("Error loading notes:", err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-save debounced
  useEffect(() => {
    if (!showModal || !editContent.trim()) return

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveNote({ closeAfter: false, showToast: false })
    }, 3000) // Auto-save after 3 seconds of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [editContent, editTitle, showModal])

  function openEditModal(note: Note) {
    setEditingId(note.id)
    setEditTitle(note.title || `Page ${note.page_number}`)
    setEditContent(note.content)
    setFormatting({
      bold: !!note.formatting?.bold,
      italic: !!note.formatting?.italic,
      underline: !!note.formatting?.underline,
    })
    setShowModal(true)
  }

  function openNewNoteModal() {
    setEditingId(null)
    setEditTitle("")
    setEditContent("")
    setFormatting({ bold: false, italic: false, underline: false })
    setShowModal(true)
  }

  function applyFormatting(type: 'bold' | 'italic' | 'underline') {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    if (start === end) return

    const before = editContent.slice(0, start)
    const selected = editContent.slice(start, end)
    const after = editContent.slice(end)

    let wrapped = selected
    if (type === 'bold') wrapped = `**${selected}**`
    if (type === 'italic') wrapped = `_${selected}_`
    if (type === 'underline') wrapped = `<u>${selected}</u>`

    const newContent = before + wrapped + after
    setEditContent(newContent)

    requestAnimationFrame(() => {
      const offset = wrapped.length
      ta.selectionStart = start
      ta.selectionEnd = start + offset
      ta.focus()
    })
  }

  async function saveNote({ closeAfter = true, showToast = true }: { closeAfter?: boolean, showToast?: boolean } = {}) {
    if (!editContent.trim()) return

    // Create optimistic note for new notes
    const isNewNote = !editingId
    let optimisticNote: Note | null = null

    if (isNewNote) {
      optimisticNote = {
        id: `temp-${Date.now()}`,
        page_number: currentPage,
        content: editContent,
        title: editTitle || `Page ${currentPage}`,
        created_at: new Date().toISOString(),
        formatting: formatting || {}
      }
      setNotes(prev => [optimisticNote!, ...prev])
    } else {
      // Optimistic update for existing note
      setNotes(prev => prev.map(n => 
        n.id === editingId 
          ? { ...n, content: editContent, title: editTitle || `Page ${currentPage}`, formatting, updated_at: new Date().toISOString() }
          : n
      ))
    }

    setIsSaving(true)
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr) throw userErr
      if (!user) throw new Error('Not authenticated')

      let savedNote: Note | null = null

      if (editingId) {
        const { data, error } = await supabase.from("notes").update({
          title: editTitle || `Page ${currentPage}`,
          content: editContent,
          formatting: formatting || {},
          updated_at: new Date().toISOString()
        }).eq("id", editingId).select().single()

        if (error) throw error
        savedNote = data
      } else {
        const { data, error } = await supabase.from("notes").insert([
          {
            user_id: user.id,
            book_id: bookId,
            page_number: currentPage,
            title: editTitle || `Page ${currentPage}`,
            content: editContent,
            formatting: formatting || {},
          },
        ]).select().single()

        if (error) throw error
        savedNote = data

        // Replace optimistic note with real one
        if (optimisticNote) {
          setNotes(prev => prev.map(n => n.id === optimisticNote!.id ? savedNote! : n))
        }
      }

      if (showToast) {
        toast({ title: 'Saved', description: 'Your note was saved.' })
      }

      setSavedIndicator(true)
      if (closeAfter) {
        setTimeout(() => {
          setSavedIndicator(false)
          setShowModal(false)
        }, 500)
      } else {
        setTimeout(() => setSavedIndicator(false), 2000)
      }
    } catch (err: any) {
      console.error('Save note error:', err)
      
      // Revert optimistic update
      if (isNewNote && optimisticNote) {
        setNotes(prev => prev.filter(n => n.id !== optimisticNote!.id))
      } else {
        await fetchNotes() // Refresh to get correct state
      }

      toast({ 
        title: 'Error', 
        description: err?.message || 'Failed to save note',
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteNote(noteId: string, title: string) {
    if (!confirm(`Delete note "${title}"?`)) return

    const prevNotes = notes
    
    // Optimistic update
    setNotes(prev => prev.filter(n => n.id !== noteId))

    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId)
      
      if (error) throw error

      toast({ title: 'Note deleted' })
    } catch (err) {
      // Revert on error
      setNotes(prevNotes)
      toast({ 
        title: 'Error', 
        description: 'Failed to delete note',
        variant: "destructive"
      })
    }
  }

  async function handleCompilePDF() {
    if (notes.length === 0) {
      toast({ title: 'No notes', description: 'Add some notes first' })
      return
    }
    setShowCompileConfirm(true)
  }

  async function confirmAndCompile() {
    try {
      const arabicRegex = /[\u0600-\u06FF]/
      const containsArabic = notes.some((n) => arabicRegex.test(n.content || '') || arabicRegex.test(n.title || ''))

      if (containsArabic) {
        let content = `Compiled Notes\nfrom: ${bookTitle}\n\n`
        const sortedNotes = [...notes].sort((a, b) => a.page_number - b.page_number)
        sortedNotes.forEach((note) => {
          content += `${note.title || `Page ${note.page_number}`}\n`
          content += `Date: ${new Date(note.created_at).toLocaleString()}\n\n`
          content += `${note.content}\n\n` + '---\n\n'
        })

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const filename = `${bookTitle}-notes.txt`.replace(/[^a-z0-9\-\.]/gi, '-')
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        setShowCompileConfirm(false)
        toast({ title: 'Downloaded', description: 'Notes exported as UTF-8 text file' })
        return
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      let yOffset = 20

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('Compiled Notes', 20, yOffset)
      yOffset += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(`from: ${bookTitle}`, 20, yOffset)
      yOffset += 12

      const sortedNotes = [...notes].sort((a, b) => a.page_number - b.page_number)
      sortedNotes.forEach((note) => {
        if (yOffset > 250) {
          doc.addPage()
          yOffset = 20
        }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text(`${note.title || `Page ${note.page_number}`}`, 20, yOffset)
        yOffset += 8

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        const date = new Date(note.created_at).toLocaleDateString('en-US')
        doc.text(`Date: ${date}`, 20, yOffset)
        yOffset += 6

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const lines = doc.splitTextToSize(note.content, 170)
        doc.text(lines, 20, yOffset)
        yOffset += lines.length * 5 + 8

        doc.setDrawColor(200, 200, 200)
        doc.line(20, yOffset, 190, yOffset)
        yOffset += 5
      })

      const filename = `${bookTitle}-notes.pdf`.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      doc.save(filename)
      setShowCompileConfirm(false)
      toast({ title: 'PDF Downloaded', description: `${notes.length} notes compiled` })
    } catch (err: any) {
      console.error("Error compiling PDF:", err)
      toast({ 
        title: 'Error', 
        description: err?.message || 'Failed to compile notes',
        variant: "destructive"
      })
    }
  }

  // Virtual scrolling
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return

    const scrollTop = scrollContainerRef.current.scrollTop
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE)
    const end = Math.min(
      notes.length,
      Math.ceil((scrollTop + scrollContainerRef.current.clientHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    )

    setVisibleRange({ start, end })
  }, [notes.length])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-10 bg-muted rounded flex-1 animate-pulse" />
          <div className="h-10 bg-muted rounded flex-1 animate-pulse" />
        </div>
        <div className="space-y-2">
          <NoteSkeleton />
          <NoteSkeleton />
          <NoteSkeleton />
        </div>
      </div>
    )
  }

  const useVirtualScrolling = notes.length > 30
  const visibleNotes = useVirtualScrolling 
    ? notes.slice(visibleRange.start, visibleRange.end)
    : notes
  const totalHeight = useVirtualScrolling ? notes.length * ITEM_HEIGHT : 'auto'
  const offsetY = useVirtualScrolling ? visibleRange.start * ITEM_HEIGHT : 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={openNewNoteModal}
          className="w-full sm:flex-1 bg-primary hover:bg-accent text-primary-foreground gap-2 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          New Note
        </Button>
        <Button 
          onClick={handleCompilePDF}
          variant="outline"
          disabled={notes.length === 0}
          className="w-full sm:flex-1 gap-2 transition-colors duration-200 bg-transparent"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Compile ({notes.length})</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </div>

      <div className="space-y-2">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "New Note" to start</p>
          </div>
        ) : useVirtualScrolling ? (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 300px)' }}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div style={{ transform: `translateY(${offsetY}px)` }}>
                {visibleNotes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onEdit={openEditModal}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onEdit={openEditModal}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        )}
      </div>

      {/* Compile Confirmation Modal */}
      {showCompileConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card rounded-xl shadow-lg max-w-md w-full animate-scale-in">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Compile Notes to PDF?</h3>
              <p className="text-muted-foreground">
                This will download all {notes.length} notes as a PDF file sorted by page number.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCompileConfirm(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmAndCompile} className="bg-primary hover:bg-accent text-primary-foreground">
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{editingId ? 'Edit Note' : 'New Note'}</h3>
                {savedIndicator && (
                  <span className="text-sm text-green-600 font-medium animate-in fade-in">Saved ✓</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={`Page ${currentPage}`}
                  className="bg-muted border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Formatting</label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => { applyFormatting('bold'); setFormatting({ ...formatting, bold: !formatting.bold }) }}
                    className={`px-3 py-1 rounded font-bold text-sm transition-colors ${
                      formatting.bold ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    B
                  </button>
                  <button
                    onClick={() => { applyFormatting('italic'); setFormatting({ ...formatting, italic: !formatting.italic }) }}
                    className={`px-3 py-1 rounded italic text-sm transition-colors ${
                      formatting.italic ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    I
                  </button>
                  <button
                    onClick={() => { applyFormatting('underline'); setFormatting({ ...formatting, underline: !formatting.underline }) }}
                    className={`px-3 py-1 rounded underline text-sm transition-colors ${
                      formatting.underline ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    U
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  ref={textareaRef}
                  placeholder="Write your note..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground placeholder-muted-foreground resize-none"
                  rows={6}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      saveNote()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-saves after 3s • Press Ctrl+Enter to save now
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowModal(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  onClick={() => saveNote()}
                  disabled={isSaving || !editContent.trim()}
                  className="bg-primary hover:bg-accent text-primary-foreground"
                >
                  {isSaving ? "Saving..." : "Save (Ctrl+Enter)"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-in-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-in-out;
        }
      `}</style>
    </div>
  )
}

function NoteItem({ 
  note, 
  onEdit, 
  onDelete 
}: { 
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string, title: string) => void
}) {
  return (
    <div 
      className="bg-muted border border-border rounded-lg p-3 hover:bg-muted/80 transition-colors duration-200 group w-full overflow-hidden"
      style={{ minHeight: ITEM_HEIGHT }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {note.title || `Page ${note.page_number}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(note.created_at).toLocaleDateString()}
            {note.updated_at && note.updated_at !== note.created_at && ' (edited)'}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button 
            onClick={() => onEdit(note)}
            className="p-1 hover:bg-background rounded transition-colors"
            title="Edit note"
          >
            <Edit2 className="w-3 h-3 text-primary" />
          </button>
          <button 
            onClick={() => onDelete(note.id, note.title || `Page ${note.page_number}`)}
            className="p-1 hover:bg-background rounded transition-colors"
            title="Delete note"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </button>
        </div>
      </div>
      <p className="text-sm text-foreground line-clamp-2 break-words whitespace-pre-wrap">
        {note.content}
      </p>
    </div>
  )
}