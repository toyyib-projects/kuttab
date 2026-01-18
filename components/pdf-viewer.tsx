"use client"

import React, { useEffect, useState } from "react"

interface PdfViewerProps {
  pdfUrl: string
  currentPage: number
  onPageChange: (page: number) => void
  totalPages?: number
  readingTimeOnPage?: number
}

export function PdfViewer({ pdfUrl, currentPage, onPageChange, totalPages, readingTimeOnPage }: PdfViewerProps) {
  const [inputPage, setInputPage] = useState(String(currentPage))

  useEffect(() => {
    setInputPage(String(currentPage))
  }, [currentPage])

  const handleInputChange = (value: string) => {
    setInputPage(value)
    const p = Number.parseInt(value)
    if (!isNaN(p) && p >= 1) {
      onPageChange(p)
    }
  }

  const goPrev = () => onPageChange(Math.max(1, currentPage - 1))
  const goNext = () => onPageChange(currentPage + 1)

  const iframeSrc = `${pdfUrl.replace(/#.*$/, "")}#page=${currentPage}`

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col" style={{ height: "80vh" }}>
      <div className="border-b border-border p-2 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} disabled={currentPage <= 1} className="p-2 rounded-md bg-muted hover:bg-muted/90 disabled:opacity-50">◀</button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={inputPage}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-16 px-2 py-1 border rounded text-center"
              min={1}
            />
            {typeof totalPages === "number" && <span className="text-sm text-muted-foreground">/ {totalPages}</span>}
          </div>
        </div>

        <div>
          <button onClick={goNext} className="p-2 rounded-md bg-muted hover:bg-muted/90">▶</button>
        </div>
      </div>

      <div className="flex-1 bg-muted">
        <iframe
          title="pdf-viewer"
          src={iframeSrc}
          className="w-full h-full"
          style={{ border: "0", width: "100%", height: "100%" }}
        />
      </div>
    </div>
  )
}
