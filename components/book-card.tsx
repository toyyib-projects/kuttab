"use client"

import { useState } from "react"
import { Pencil, Trash2, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Book {
  id: string
  title: string
  author?: string
  category: string
  cover_image_url?: string
  total_pages?: number
  current_page?: number
}

interface BookCardProps {
  book: Book
  onEdit: (book: Book) => void
  onDelete: (bookId: string) => void
}

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(true)
    setShowMenu(false)
  }

  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(book.id)
    setShowDeleteConfirm(false)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit(book)
    setShowMenu(false)
  }

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card border-border group relative">
        {/* Action Menu Button */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={toggleMenu}
            className="p-2 bg-card/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent shadow-md"
            aria-label="Book actions"
          >
            <MoreVertical className="w-4 h-4 text-foreground" />
          </button>
          
          {showMenu && (
            <>
              {/* Overlay to close menu */}
              <div 
                className="fixed inset-0 z-20" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowMenu(false)
                }}
              />
              
              {/* Menu */}
              <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden min-w-[120px] z-30">
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="w-full h-40 bg-gradient-to-br from-amber-200 to-orange-300 rounded-md mb-3 flex items-center justify-center">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <span className="text-4xl text-primary">📖</span>
            )}
          </div>
          <CardTitle className="text-lg line-clamp-2 text-foreground">{book.title}</CardTitle>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">{book.author || "Unknown Author"}</p>
          <p className="text-xs text-muted-foreground font-medium">{book.category}</p>
          {book.total_pages && <p className="text-xs text-gray-500 mt-2">{book.total_pages} pages</p>}
          
          {/* Progress Bar */}
          {book.current_page && book.total_pages && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round((book.current_page / book.total_pages) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(book.current_page / book.total_pages) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowDeleteConfirm(false)
          }}
        >
          <div
            className="bg-card border border-border rounded-lg p-6 max-w-md mx-4 shadow-xl"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <h3 className="text-lg font-bold text-foreground mb-2">Delete Book?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete "{book.title}"? This action cannot be undone and will also delete all notes and reading sessions associated with this book.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowDeleteConfirm(false)
                }}
                variant="outline"
                className="border-border hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}