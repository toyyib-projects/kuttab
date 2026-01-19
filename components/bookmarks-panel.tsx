"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from '@/hooks/use-toast'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bookmark, Trash2 } from "lucide-react"

interface BookmarksPanelProps {
  bookId: string
  onBookmarkClick: (page: number) => void
}

interface BookmarkType {
  id: string
  page_number: number
  tags: string[]
  created_at: string
}

// Virtual scrolling configuration
const ITEM_HEIGHT = 88 // Adjusted for tags display
const BUFFER_SIZE = 5

// Loading skeleton
function BookmarkSkeleton() {
  return (
    <div className="bg-muted border border-border rounded-lg p-3 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="h-4 bg-muted-foreground/20 rounded w-20" />
        <div className="h-3 bg-muted-foreground/20 rounded w-12" />
      </div>
      <div className="flex gap-1">
        <div className="h-5 bg-muted-foreground/20 rounded w-16" />
        <div className="h-5 bg-muted-foreground/20 rounded w-20" />
      </div>
    </div>
  )
}

export function BookmarksPanel({ bookId, onBookmarkClick }: BookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([])
  const { toast } = useToast()
  const [pageToBookmark, setPageToBookmark] = useState("")
  const [tagToAdd, setTagToAdd] = useState("")
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs"
  )

  useEffect(() => {
    fetchBookmarks()
  }, [bookId])

  async function fetchBookmarks() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("book_id", bookId)
        .order("page_number", { ascending: true })

      if (!error) {
        setBookmarks(data || [])
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddBookmark() {
    if (!pageToBookmark) return
    const pageNum = Number.parseInt(pageToBookmark)
    if (!Number.isFinite(pageNum) || pageNum <= 0) {
      toast({ 
        title: 'Error', 
        description: 'Please enter a valid page number',
        variant: "destructive"
      })
      return
    }

    // Optimistic update
    const optimisticBookmark: BookmarkType = {
      id: `temp-${Date.now()}`,
      page_number: pageNum,
      tags: Array.from(selectedTags),
      created_at: new Date().toISOString()
    }

    setBookmarks(prev => [...prev, optimisticBookmark].sort((a, b) => a.page_number - b.page_number))
    setPageToBookmark("")
    setSelectedTags(new Set())

    setIsAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase.from("bookmarks").insert([
        {
          user_id: user.id,
          book_id: bookId,
          page_number: pageNum,
          tags: Array.from(selectedTags),
        },
      ]).select().single()

      if (error) throw error

      // Replace optimistic bookmark with real one
      setBookmarks(prev => 
        prev.map(b => b.id === optimisticBookmark.id ? data : b)
      )

      toast({ 
        title: 'Bookmark added',
        description: `Page ${pageNum} bookmarked successfully`
      })
    } catch (err: any) {
      // Revert on error
      setBookmarks(prev => prev.filter(b => b.id !== optimisticBookmark.id))
      setPageToBookmark(pageNum.toString())
      setSelectedTags(new Set(optimisticBookmark.tags))
      
      toast({ 
        title: 'Error', 
        description: err?.message || 'Failed to add bookmark',
        variant: "destructive"
      })
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDeleteBookmark(bookmarkId: string, pageNumber: number) {
    const prevBookmarks = bookmarks
    
    // Optimistic update
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))

    try {
      const { error } = await supabase.from("bookmarks").delete().eq("id", bookmarkId)
      
      if (error) throw error

      toast({ 
        title: 'Bookmark removed',
        description: `Page ${pageNumber} unbookmarked`
      })
    } catch (err) {
      // Revert on error
      setBookmarks(prevBookmarks)
      toast({ 
        title: 'Error', 
        description: 'Failed to remove bookmark',
        variant: "destructive"
      })
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
      toggleTag(tagToAdd.trim())
      setTagToAdd("")
    }
  }

  // Virtual scrolling
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return

    const scrollTop = scrollContainerRef.current.scrollTop
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE)
    const end = Math.min(
      bookmarks.length,
      Math.ceil((scrollTop + scrollContainerRef.current.clientHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    )

    setVisibleRange({ start, end })
  }, [bookmarks.length])

  const allTags = Array.from(new Set(bookmarks.flatMap((b) => b.tags || [])))

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <BookmarkSkeleton />
          <BookmarkSkeleton />
          <BookmarkSkeleton />
        </div>
      </div>
    )
  }

  // Use virtual scrolling only for large lists
  const useVirtualScrolling = bookmarks.length > 50
  const visibleBookmarks = useVirtualScrolling 
    ? bookmarks.slice(visibleRange.start, visibleRange.end)
    : bookmarks
  const totalHeight = useVirtualScrolling ? bookmarks.length * ITEM_HEIGHT : 'auto'
  const offsetY = useVirtualScrolling ? visibleRange.start * ITEM_HEIGHT : 0

  return (
    <div className="space-y-4">
      {/* Add Bookmark Form */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">Add Bookmark</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="number"
            placeholder="Page number"
            value={pageToBookmark}
            onChange={(e) => setPageToBookmark(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddBookmark()}
            className="bg-muted border-border w-full"
          />
          <Button 
            onClick={handleAddBookmark} 
            disabled={isAdding}
            className="w-full sm:w-auto bg-primary hover:bg-accent text-primary-foreground gap-2"
          >
            {isAdding ? "Adding..." : "Bookmark"}
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
          
          {/* Existing tags (quick add) */}
          {allTags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Quick add:</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    selectedTags.has(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Selected tags */}
          {selectedTags.size > 0 && (
            <div className="flex gap-1 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground mr-1">Selected:</span>
              {Array.from(selectedTags).map((tag) => (
                <span 
                  key={tag}
                  className="bg-primary/20 text-primary text-xs px-2 py-1 rounded cursor-pointer hover:bg-primary/30 transition-colors"
                  onClick={() => toggleTag(tag)}
                >
                  {tag} ×
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {bookmarks.length === 0 ? 'No bookmarks' : `${bookmarks.length} bookmark${bookmarks.length !== 1 ? 's' : ''}`}
          </h3>
          {useVirtualScrolling && (
            <span className="text-xs text-muted-foreground">Virtual scrolling enabled</span>
          )}
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-8">
            <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No bookmarks yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add one above to mark pages</p>
          </div>
        ) : useVirtualScrolling ? (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 400px)' }}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div style={{ transform: `translateY(${offsetY}px)` }}>
                {visibleBookmarks.map((bookmark) => (
                  <BookmarkItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    onDelete={handleDeleteBookmark}
                    onClick={onBookmarkClick}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bookmarks.map((bookmark) => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={handleDeleteBookmark}
                onClick={onBookmarkClick}
              />
            ))}
          </div>
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

function BookmarkItem({ 
  bookmark, 
  onDelete, 
  onClick 
}: { 
  bookmark: BookmarkType
  onDelete: (id: string, page: number) => void
  onClick: (page: number) => void
}) {
  return (
    <div
      className="bg-muted border border-border rounded-lg p-3 hover:bg-muted/80 cursor-pointer transition-colors duration-200 group animate-fade-in w-full overflow-hidden"
      style={{ minHeight: ITEM_HEIGHT }}
      onClick={() => onClick(bookmark.page_number)}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
        <span className="text-sm font-medium text-foreground">Page {bookmark.page_number}</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(bookmark.id, bookmark.page_number)
          }}
          className="text-xs text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Remove
        </button>
      </div>
      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {bookmark.tags.map((tag: string) => (
            <span 
              key={tag}
              className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}