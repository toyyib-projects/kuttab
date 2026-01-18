"use client"

import React, { useEffect, useState, useCallback } from "react"

interface PdfViewerProps {
  pdfUrl: string
  currentPage: number
  onPageChange: (page: number) => void
  totalPages?: number
  readingTimeOnPage?: number
}

export function PdfViewer({ 
  pdfUrl, 
  currentPage, 
  onPageChange, 
  totalPages, 
  readingTimeOnPage 
}: PdfViewerProps) {
  const [inputPage, setInputPage] = useState(String(currentPage))
  const [isInputFocused, setIsInputFocused] = useState(false)

  useEffect(() => {
    if (!isInputFocused) {
      setInputPage(String(currentPage))
    }
  }, [currentPage, isInputFocused])

  const handleInputChange = (value: string) => {
    setInputPage(value)
  }

  const handleInputBlur = () => {
    setIsInputFocused(false)
    const p = Number.parseInt(inputPage)
    if (!isNaN(p) && p >= 1) {
      const validPage = totalPages ? Math.min(p, totalPages) : p
      onPageChange(validPage)
      setInputPage(String(validPage))
    } else {
      setInputPage(String(currentPage))
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  const goPrev = useCallback(() => {
    onPageChange(Math.max(1, currentPage - 1))
  }, [currentPage, onPageChange])

  const goNext = useCallback(() => {
    const maxPage = totalPages || currentPage + 1
    onPageChange(Math.min(maxPage, currentPage + 1))
  }, [currentPage, totalPages, onPageChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isInputFocused) return
      
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        goNext()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [goPrev, goNext, isInputFocused])

  const iframeSrc = `${pdfUrl.replace(/#.*$/, "")}#page=${currentPage}&view=FitH`
  const isAtStart = currentPage <= 1
  const isAtEnd = totalPages ? currentPage >= totalPages : false

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col" style={{ height: "80vh" }}>
      <div className="border-b border-gray-200 p-2 sm:p-4 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <button 
            onClick={goPrev} 
            disabled={isAtStart} 
            className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            ◀
          </button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={inputPage}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
              max={totalPages}
              aria-label="Current page"
            />
            {typeof totalPages === "number" && (
              <span className="text-sm text-gray-600">of {totalPages}</span>
            )}
          </div>

          {typeof readingTimeOnPage === "number" && readingTimeOnPage > 0 && (
            <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
              {Math.floor(readingTimeOnPage / 60)}:{String(readingTimeOnPage % 60).padStart(2, '0')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={goNext} 
            disabled={isAtEnd}
            className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-100 relative">
        <iframe
          title="PDF Viewer"
          src={iframeSrc}
          className="w-full h-full"
          style={{ border: "0" }}
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  )
}