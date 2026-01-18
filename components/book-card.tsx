import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Book {
  id: string
  title: string
  author?: string
  category: string
  cover_image_url?: string
  total_pages?: number
}

export function BookCard({ book }: { book: Book }) {
  return (
  <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card border-border">
      <CardHeader className="pb-3">
        <div className="w-full h-40 bg-gradient-to-br from-amber-200 to-orange-300 rounded-md mb-3 flex items-center justify-center">
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url || "/placeholder.svg"}
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
      </CardContent>
    </Card>
  )
}
