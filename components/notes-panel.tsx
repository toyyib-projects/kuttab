"use client"

import { useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from '@/hooks/use-toast'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Download, Plus } from "lucide-react"
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
  formatting?: { bold?: boolean; italic?: boolean; underline?: boolean } | null
}

export function NotesPanel({ bookId, currentPage, bookTitle = "My Book" }: NotesPanelProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [formatting, setFormatting] = useState({ bold: false, italic: false, underline: false })
  const [savedIndicator, setSavedIndicator] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  useEffect(() => {
    fetchNotes()
  }, [bookId, supabase])

  async function fetchNotes() {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false })

    if (!error) {
      setNotes(data || [])
    }
  }

  function openEditModal(note: Note) {
    setEditingId(note.id)
    setEditTitle(note.title || `Page ${note.page_number}`)
    setEditContent(note.content)
    setFormatting({
      bold: !!note.formatting?.bold,
      italic: !!note.formatting?.italic,
      underline: !!note.formatting?.underline,
    })
    setIsSaved(false)
    setShowModal(true)
  }

  function openNewNoteModal() {
    setEditingId(null)
    setEditTitle("")
    setEditContent("")
    setFormatting({ bold: false, italic: false, underline: false })
    setIsSaved(false)
    setShowModal(true)
  }

  // Apply formatting only to the selected text in the textarea.
  function applyFormatting(type: 'bold' | 'italic' | 'underline') {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    if (start === end) return // nothing selected

    const before = editContent.slice(0, start)
    const selected = editContent.slice(start, end)
    const after = editContent.slice(end)

    let wrapped = selected
    if (type === 'bold') wrapped = `**${selected}**`
    if (type === 'italic') wrapped = `_${selected}_`
    if (type === 'underline') wrapped = `<u>${selected}</u>`

    const newContent = before + wrapped + after
    setEditContent(newContent)
    setIsSaved(false)

    // Restore selection around the newly wrapped text
    requestAnimationFrame(() => {
      const offset = wrapped.length
      ta.selectionStart = start
      ta.selectionEnd = start + offset
      ta.focus()
    })
  }

  // Unified save logic used by manual save and autosave
  async function saveNote({ closeAfter = true }: { closeAfter?: boolean } = {}) {
    if (!editContent.trim()) return

    setLoading(true)
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr) throw userErr
      if (!user) throw new Error('Not authenticated')

      let resError: any = null
      if (editingId) {
        // Update existing note: update title, content and formatting
        const { error } = await supabase.from("notes").update({
          title: editTitle || `Page ${currentPage}`,
          content: editContent,
          formatting: formatting || {},
        }).eq("id", editingId)
        resError = error
      } else {
        // Create new note: include user_id, title and formatting
        const { error } = await supabase.from("notes").insert([
          {
            user_id: user.id,
            book_id: bookId,
            page_number: currentPage,
            title: editTitle || `Page ${currentPage}`,
            content: editContent,
            formatting: formatting || {},
          },
        ])
        resError = error
      }

      if (resError) {
        // show server-provided error message if available
        const msg = resError.message || 'Failed to save note'
        try { toast({ title: 'Error', description: msg }) } catch {}
        return
      }

      // show success toast
      try { toast({ title: 'Saved', description: 'Your note was saved.' }) } catch {}
      await fetchNotes()

      // Show inline saved indicator briefly. If closeAfter is requested, show the indicator
      // then close the modal after 500ms so users see the success icon.
      setSavedIndicator(true)
      if (closeAfter) {
        setTimeout(() => {
          setSavedIndicator(false)
          setShowModal(false)
        }, 500)
      } else {
        setTimeout(() => setSavedIndicator(false), 1800)
      }
    } catch (err: any) {
      console.error('Save note error:', err)
      try { toast({ title: 'Error', description: err?.message || 'Failed to save note' }) } catch {}
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (confirm("Delete this note?")) {
      await supabase.from("notes").delete().eq("id", noteId)
      setNotes(notes.filter((n) => n.id !== noteId))
    }
  }

  const [showCompileConfirm, setShowCompileConfirm] = useState(false)

  async function handleCompilePDF() {
    if (notes.length === 0) {
      alert("No notes to compile")
      return
    }

    setShowCompileConfirm(true)
  }

  async function confirmAndCompile() {
    try {
      // Detect Arabic characters. If present, export as UTF-8 text file because
      // jsPDF default fonts don't support Arabic well. This is a safe fallback
      // to preserve the text content correctly.
      const arabicRegex = /[\u0600-\u06FF]/
      const containsArabic = notes.some((n) => arabicRegex.test(n.content || '') || arabicRegex.test(n.title || ''))

      if (containsArabic) {
        // Generate plain UTF-8 text content preserving Arabic and metadata
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
        try { toast({ title: 'Downloaded', description: 'Notes contained Arabic; downloaded as UTF-8 text file' }) } catch {}
        return
      }

      // Fallback: use jsPDF for non-Arabic content
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
    } catch (err: any) {
      console.error("Error compiling PDF:", err)
      try { toast({ title: 'Error', description: err?.message || 'Failed to compile notes' }) } catch {}
    }
  }

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
          <span className="hidden sm:inline">Compile</span>
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "New Note" to start</p>
          </div>
        ) : (
          notes.map((note) => (
            <div 
              key={note.id} 
              className="bg-muted border border-border rounded-lg p-3 hover:bg-muted/80 transition-colors duration-200 group w-full overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{note.title || `Page ${note.page_number}`}</p>
                  <p className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button 
                    onClick={() => openEditModal(note)}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-primary" />
                  </button>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-foreground line-clamp-2 break-words whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
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
                <Button
                  variant="outline"
                  onClick={() => setShowCompileConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmAndCompile}
                  className="bg-primary hover:bg-accent text-primary-foreground"
                >
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
          <div className="bg-card rounded-xl shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto animate-scale-in">
            <div className="p-4 sm:p-6 space-y-4">
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
                  onChange={(e) => { setEditContent(e.target.value); setIsSaved(false) }}
                  ref={textareaRef}
                  placeholder="Write your note..."
                  className={`w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground placeholder-muted-foreground resize-none`}
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-3">
                  {savedIndicator && (
                    <span className="text-sm text-accent font-medium">Saved ✓</span>
                  )}
                  <Button
                    onClick={() => saveNote()}
                    disabled={loading || isSaved}
                    className="bg-primary hover:bg-accent text-primary-foreground"
                  >
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
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
