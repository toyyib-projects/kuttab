"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

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
"Others"]

interface BookEditDialogProps {
  book: any
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

export function BookEditDialog({ book, onClose, onSave }: BookEditDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "Other",
    total_pages: "",
    current_page: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || "",
        author: book.author || "",
        category: book.category || "Other",
        total_pages: book.total_pages?.toString() || "",
        current_page: book.current_page?.toString() || "",
      })
    }
  }, [book])

  const handleSubmit = async () => {
    setError("")

    if (!formData.title.trim()) {
      setError("Title is required")
      return
    }

    setLoading(true)

    try {
      await onSave({
        ...formData,
        total_pages: formData.total_pages ? parseInt(formData.total_pages) : null,
        current_page: formData.current_page ? parseInt(formData.current_page) : null,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to update book")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Edit Book</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Enter book title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Author
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Enter author name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Total Pages
              </label>
              <input
                type="number"
                value={formData.total_pages}
                onChange={(e) => setFormData({ ...formData, total_pages: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Page
              </label>
              <input
                type="number"
                value={formData.current_page}
                onChange={(e) => setFormData({ ...formData, current_page: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="0"
                min="0"
                max={formData.total_pages || undefined}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-border hover:bg-muted"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-primary hover:bg-accent text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}