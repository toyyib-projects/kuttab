"use client"

import { Edit2, Trash2, Book as BookIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BookCardProps {
  book: any
  onEdit: (book: any) => void
  onDelete: (id: string) => void
}

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-all group">
      {/* 1. Fixed Aspect Ratio for Image (Enforces identical height) */}
      <div className="aspect-[3/4] bg-muted relative overflow-hidden border-b border-border">
        {book.cover_url ? (
          <img 
            src={book.cover_url} 
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-2">
            <BookIcon className="w-10 h-10 stroke-[1.5]" />
            <span className="text-[9px] font-bold uppercase tracking-widest">No Cover</span>
          </div>
        )}
        
        {/* Quick Action Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <Button 
            size="icon" 
            variant="secondary" 
            className="h-8 w-8 rounded-full shadow-xl"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(book); }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            variant="destructive" 
            className="h-8 w-8 rounded-full shadow-xl"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(book.id); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 2. Locked Content Area (Prevents uneven card lengths) */}
      <div className="p-3 flex flex-col justify-between h-[90px] bg-card">
        <div className="space-y-0.5">
          <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-2 min-h-[2.5rem]">
            {book.title}
          </h3>
          <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tight font-medium">
            {book.author || "Unknown Author"}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black px-1.5 py-0.5 bg-primary/10 text-primary rounded uppercase tracking-tighter truncate max-w-full">
            {book.category}
          </span>
        </div>
      </div>
    </div>
  )
}