"use client"

import { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Setup Worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

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
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(currentPage)
  const [scale, setScale] = useState<number>(1.0)
  const [isReady, setIsReady] = useState(false)
  
  // Local state for the text input field
  const [pageInput, setPageInput] = useState<string>(currentPage.toString())

  useEffect(() => {
    setIsReady(true)
  }, [])

  // Sync input field if the page is changed via external props or arrows
  useEffect(() => {
    setPageNumber(currentPage)
    setPageInput(currentPage.toString())
  }, [currentPage])

  // Handle jump to page logic
  const jumpToPage = () => {
    const newPage = parseInt(pageInput, 10)
    if (!isNaN(newPage) && newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage)
      onPageChange?.(newPage)
    } else {
      // Reset input to current valid page if entry is invalid
      setPageInput(pageNumber.toString())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      jumpToPage()
      ;(e.target as HTMLInputElement).blur()
    }
  }

  if (!isReady) return null;

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 overflow-hidden font-sans">
      {/* Header / Controls */}
      <header className="z-10 flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
            <button 
              onClick={() => {
                const prev = Math.max(1, pageNumber - 1)
                setPageNumber(prev)
                setPageInput(prev.toString())
                onPageChange?.(prev)
              }}
              disabled={pageNumber <= 1}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 border-r border-gray-300 dark:border-gray-600 transition-colors"
            >
              ←
            </button>

            <div className="flex items-center px-2 bg-gray-50 dark:bg-gray-700">
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={jumpToPage}
                onKeyDown={handleKeyDown}
                className="w-10 text-center bg-transparent font-medium text-sm focus:outline-none"
              />
              <span className="text-gray-400 text-xs px-1">/ {numPages || '--'}</span>
            </div>

            <button 
              onClick={() => {
                const next = Math.min(numPages, pageNumber + 1)
                setPageNumber(next)
                setPageInput(next.toString())
                onPageChange?.(next)
              }}
              disabled={pageNumber >= numPages}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 border-l border-gray-300 dark:border-gray-600 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200"
          >
            -
          </button>
          <span className="text-xs font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
          <button 
            onClick={() => setScale(s => Math.min(s + 0.2, 2.0))} 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200"
          >
            +
          </button>
        </div>
      </header>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-200 dark:bg-gray-900 scrollbar-thin">
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages)
          }}
          className="flex flex-col items-center"
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            className="shadow-2xl"
            loading={<div className="h-[80vh] w-[60vw] bg-white animate-pulse rounded-lg" />}
          />
        </Document>
      </div>
    </div>
  )
}