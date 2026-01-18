"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from '@/hooks/use-toast'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface BookmarksPanelProps {
  bookId: string
  onBookmarkClick: (page: number) => void
}

export function BookmarksPanel({ bookId, onBookmarkClick }: BookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const { toast } = useToast()
  const [pageToBookmark, setPageToBookmark] = useState("")
  const [tagToAdd, setTagToAdd] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  useEffect(() => {
    async function fetchBookmarks() {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("book_id", bookId)
        .order("page_number", { ascending: true })

      if (!error) {
        setBookmarks(data || [])
      }
    }

    fetchBookmarks()
  }, [bookId, supabase])

  async function handleAddBookmark() {
    if (!pageToBookmark) return
    const pageNum = Number.parseInt(pageToBookmark)
    if (!Number.isFinite(pageNum) || pageNum <= 0) {
      try { toast({ title: 'Error', description: 'Please enter a valid page number' }) } catch {}
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("bookmarks").insert([
        {
          user_id: user.id,
          book_id: bookId,
          page_number: pageNum,
          tags: Array.from(selectedTags),
        },
      ])

      if (!error) {
        setPageToBookmark("")
        setSelectedTags(new Set())
        // Refresh bookmarks
        const { data } = await supabase
          .from("bookmarks")
          .select("*")
          .eq("book_id", bookId)
          .order("page_number", { ascending: true })

        setBookmarks(data || [])
        try { toast({ title: 'Bookmark added' }) } catch {}
        // show a quick inline success by briefly toggling selectedTags to include an empty state
        // (UI already clears tags) — we rely on toast as primary feedback here.
      } else {
        try { toast({ title: 'Error', description: error?.message || 'Failed to add bookmark' }) } catch {}
      }
    } finally {
      setLoading(false)
    }
  }

  function toggleTag(tag: string) {
    const newTags = new Set(selectedTags)
    if (newTags.has(tag)) {
      newTags.delete(tag)
    } else {
      newTags.add(tag)
    }
    setSelectedTags(newTags)
  }

  function addNewTag() {
    if (tagToAdd.trim()) {
      toggleTag(tagToAdd)
      setTagToAdd("")
    }
  }

  // Get all unique tags from bookmarks
  const allTags = Array.from(new Set(bookmarks.flatMap((b) => b.tags || [])))

  async function handleDeleteBookmark(bookmarkId: string) {
    const { error } = await supabase.from("bookmarks").delete().eq("id", bookmarkId)
    if (!error) {
      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId))
      try { toast({ title: 'Bookmark removed' }) } catch {}
    } else {
      try { toast({ title: 'Error', description: 'Failed to remove bookmark' }) } catch {}
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Add Bookmark</label>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <Input
            type="number"
            placeholder="Page number"
            value={pageToBookmark}
            onChange={(e) => setPageToBookmark(e.target.value)}
            className="bg-muted border-border w-full"
          />
          <Button onClick={handleAddBookmark} disabled={loading} className="w-full sm:w-auto bg-primary hover:bg-accent text-primary-foreground gap-2">
            Bookmark
          </Button>
        </div>

        {/* Tag Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">Add Tags (optional)</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g., Important, Review"
              value={tagToAdd}
              onChange={(e) => setTagToAdd(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addNewTag()}
              className="bg-muted border-border text-sm"
            />
            <Button 
              onClick={addNewTag} 
              variant="outline"
              size="sm"
              className="text-xs bg-transparent"
            >
              Add
            </Button>
          </div>
          {selectedTags.size > 0 && (
            <div className="flex gap-1 flex-wrap">
              {Array.from(selectedTags).map((tag) => (
                <span 
                  key={tag}
                  className="bg-primary/20 text-primary text-xs px-2 py-1 rounded cursor-pointer hover:bg-primary/30 transition-colors max-w-full truncate"
                  onClick={() => toggleTag(tag)}
                >
                  {tag} ×
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {bookmarks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No bookmarks yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add one above to mark pages</p>
          </div>
        ) : (
          bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-muted border border-border rounded-lg p-3 hover:bg-muted/80 cursor-pointer transition-colors duration-200 group animate-fade-in w-full overflow-hidden"
              onClick={() => onBookmarkClick(bookmark.page_number)}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                <span className="text-sm font-medium text-foreground truncate">Page {bookmark.page_number}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteBookmark(bookmark.id)
                  }}
                  className="text-xs text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove
                </button>
              </div>
              {bookmark.tags && bookmark.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {bookmark.tags.map((tag: string) => (
                    <span 
                      key={tag}
                      className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded max-w-full truncate"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-in-out;
        }
      `}</style>
    </div>
  )
}
