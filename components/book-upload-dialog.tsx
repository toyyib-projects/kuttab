"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const CATEGORIES = [
  "Quran",
  "Hadith",
  "Islamic History",
  "Islamic Law",
  "Islamic Philosophy",
  "Biography",
  "Islamic Science",
  "Other",
]

interface BookUploadDialogProps {
  onClose: () => void
}

export function BookUploadDialog({ onClose }: BookUploadDialogProps) {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [category, setCategory] = useState("Quran")
  const [pdfUrl, setPdfUrl] = useState("")
  const [totalPages, setTotalPages] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in")
        return
      }

      const { error: insertError } = await supabase.from("books").insert([
        {
          user_id: user.id,
          title,
          author,
          category,
          pdf_url: pdfUrl,
          total_pages: totalPages ? Number.parseInt(totalPages) : null,
          description,
        },
      ])

      if (insertError) {
        setError(insertError.message)
        return
      }

      onClose()
    } catch (err) {
      setError("An error occurred while adding the book")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
  <Card className="w-full max-w-md bg-card my-auto">
        <CardHeader>
          <CardTitle>Add New Book</CardTitle>
          <CardDescription>Upload or add a link to your Islamic book</CardDescription>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Book Title*</label>
              <Input
                type="text"
                placeholder="Enter book title (English or Arabic)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-muted border-border"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Author</label>
              <Input 
                type="text" 
                placeholder="Author name (English or Arabic)" 
                value={author} 
                onChange={(e) => setAuthor(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category*</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">PDF URL or Link</label>
              <Input
                type="url"
                placeholder="https://example.com/book.pdf"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Total Pages</label>
              <Input
                type="number"
                placeholder="Number of pages"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                placeholder="Brief description of the book"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground"
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm">{error}</div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-accent text-primary-foreground">
                {loading ? "Adding..." : "Add Book"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
