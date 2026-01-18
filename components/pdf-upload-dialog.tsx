"use client"

import React, { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react"

interface PdfUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (pdfUrl: string, fileName: string) => void
  bookId?: string
}

export function PdfUploadDialog({ isOpen, onClose, onUploadSuccess, bookId }: PdfUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fileName, setFileName] = useState<string>("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      setError("Please select a PDF file")
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB")
      return
    }

    setFileName(file.name)
    setIsUploading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to upload PDFs")
        setIsUploading(false)
        return
      }

      // Create a unique file name
      const timestamp = Date.now()
      const uniqueFileName = `${user.id}/${timestamp}-${file.name}`

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("pdfs")
        .upload(uniqueFileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`)
        setIsUploading(false)
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("pdfs").getPublicUrl(uniqueFileName)

      setSuccess(true)
      setTimeout(() => {
        onUploadSuccess(publicUrl, file.name)
        setSuccess(false)
        setFileName("")
        onClose()
      }, 1500)
    } catch (err) {
      console.error("Upload error:", err)
      setError("An error occurred during upload. Please try again.")
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-lg max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Upload PDF</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>PDF uploaded successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Select PDF File</label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                className="sr-only"
                id="pdf-input"
              />
              <label
                htmlFor="pdf-input"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload PDF</p>
                  <p className="text-xs text-muted-foreground">or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 50MB</p>
                </div>
              </label>
            </div>
          </div>

          {fileName && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
              {isUploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
            </div>
          )}

          <button
            onClick={onClose}
            disabled={isUploading}
            className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-in-out;
        }
      `}</style>
    </div>
  )
}
