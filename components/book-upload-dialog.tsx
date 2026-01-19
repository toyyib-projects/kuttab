"use client"

import type React from "react"
import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

// 5. Categories matched with Dashboard
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

interface BookUploadDialogProps {
  onClose: () => void
}

export function BookUploadDialog({ onClose }: BookUploadDialogProps) {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [category, setCategory] = useState("Qur'an")
  const [customCategory, setCustomCategory] = useState("") // 6. State for custom input
  const [pdfUrl, setPdfUrl] = useState("")
  const [totalPages, setTotalPages] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs"
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 6. Logic to use custom category if 'Others' is selected
    const finalCategory = category === "Others" ? customCategory : category

    if (category === "Others" && !customCategory.trim()) {
      setError("Please specify the category name")
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in")
        return
      }

      const { error: insertError } = await supabase.from("books").insert([
        {
          user_id: user.id,
          title,
          author,
          category: finalCategory,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      {/* 4. Popup layout: responsive max-width and height */}
      <Card className="w-full max-w-md bg-card shadow-2xl relative border-border flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Add New Book</CardTitle>
          <CardDescription>Upload or add a link to your Islamic book</CardDescription>
        </CardHeader>

        <CardContent className="overflow-y-auto px-6">
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Book Title*</label>
              <Input
                type="text"
                placeholder="e.g. Sahih al-Bukhari"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 bg-muted/50 border-border focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Author</label>
              <Input 
                type="text" 
                placeholder="e.g. Imam al-Bukhari" 
                value={author} 
                onChange={(e) => setAuthor(e.target.value)}
                className="h-11 bg-muted/50 border-border"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Category*</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 border border-border rounded-md text-sm bg-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* 6. Others input: appears only when Others is selected */}
              {category === "Others" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Specify Category*</label>
                  <Input 
                    type="text" 
                    placeholder="Enter custom category" 
                    value={customCategory} 
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="h-11 bg-muted/50 border-primary"
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Total Pages</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                  className="h-11 bg-muted/50 border-border"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">PDF Link</label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  className="h-11 bg-muted/50 border-border"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Description</label>
              <textarea
                placeholder="Brief summary..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-muted/50 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                rows={2}
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs font-medium animate-shake">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11" disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 h-11 bg-primary hover:bg-primary/90 font-bold shadow-lg">
                {loading ? "Adding..." : "Add Book"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}