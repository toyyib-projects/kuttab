"use client"

import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// 1. Setup Worker (Standard CDN approach)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// 2. Import required styles
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

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setIsReady(true)
  }, [])

  useEffect(() => {
    setPageNumber(currentPage)
  }, [currentPage])

  if (!isReady) return null;

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Header / Controls */}
      <header className="z-10 flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2">
           <button 
            onClick={() => {
              const prev = Math.max(1, pageNumber - 1);
              setPageNumber(prev);
              onPageChange?.(prev);
            }}
            disabled={pageNumber <= 1}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
           >
             ←
           </button>
           <span className="text-sm font-medium">
             Page {pageNumber} of {numPages || '--'}
           </span>
           <button 
            onClick={() => {
              const next = Math.min(numPages, pageNumber + 1);
              setPageNumber(next);
              onPageChange?.(next);
            }}
            disabled={pageNumber >= numPages}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
           >
             →
           </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="px-3 py-1 bg-gray-100 rounded">-</button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(s + 0.2, 2.0))} className="px-3 py-1 bg-gray-100 rounded">+</button>
        </div>
      </header>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-200 dark:bg-gray-900">
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          className="flex flex-col items-center"
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            className="shadow-2xl"
            loading={<div className="h-[80vh] w-[60vw] bg-white animate-pulse" />}
          />
        </Document>
      </div>
    </div>
  )
}