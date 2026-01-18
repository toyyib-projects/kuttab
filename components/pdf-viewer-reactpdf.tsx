"use client"

interface PdfViewerProps {
  pdfUrl: string
  currentPage?: number
  onPageChange?: (page: number) => void
}

export default function PdfViewerReactPdf({
  pdfUrl,
  currentPage = 1,
  onPageChange,
}: PdfViewerProps) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-2 items-center mb-2 p-2 bg-muted rounded">
        <button 
          onClick={() => onPageChange?.(Math.max(1, (currentPage || 1) - 1))}
          className="px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          Prev
        </button>
        <span className="text-sm font-medium">Page {currentPage}</span>
        <button 
          onClick={() => onPageChange?.((currentPage || 1) + 1)}
          className="px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          Next
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <iframe
          title="pdf-viewer"
          src={`${pdfUrl}#page=${currentPage}`}
          className="w-full h-full"
          style={{ border: "0", width: "100%", height: "100%" }}
        />
      </div>
    </div>
  )
}
