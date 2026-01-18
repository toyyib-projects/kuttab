"use client"

import { useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from '@/hooks/use-toast'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MemoizationPanelProps {
  bookId: string
}

export function MemoizationPanel({ bookId }: MemoizationPanelProps) {
  const [recordings, setRecordings] = useState<any[]>([])
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTitle, setRecordingTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  useEffect(() => {
    async function fetchRecordings() {
      const { data, error } = await supabase
        .from("voice_recordings")
        .select("*")
        .eq("book_id", bookId)
        .order("created_at", { ascending: false })

      if (!error) {
        setRecordings(data || [])
      }
    }

    fetchRecordings()
  }, [bookId, supabase])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      try { toast({ title: 'Microphone error', description: 'Unable to access microphone. Please check permissions.' }) } catch {}
    }
  }

  async function stopRecording() {
    if (!mediaRecorderRef.current) return

    return new Promise<Blob>((resolve) => {
      mediaRecorderRef.current!.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/mp3" })
        resolve(blob)
      }

      mediaRecorderRef.current!.stop()
      setIsRecording(false)
    })
  }

  async function handleSaveRecording() {
    if (!recordingTitle.trim()) {
      alert("Please enter a title for the recording")
      return
    }

    setLoading(true)
    try {
      const audioBlob = await stopRecording()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // For demo purposes, we'll store the recording as base64
      // In production, you'd upload to cloud storage
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)

      reader.onloadend = async () => {
        const base64Audio = reader.result as string

        const { error } = await supabase.from("voice_recordings").insert([
          {
            user_id: user.id,
            book_id: bookId,
            title: recordingTitle,
            audio_url: base64Audio,
            duration_seconds: Math.round(audioBlob.size / 16000), // Rough estimate
          },
        ])

        if (!error) {
          setRecordingTitle("")
          // Refresh recordings
          const { data } = await supabase
            .from("voice_recordings")
            .select("*")
            .eq("book_id", bookId)
            .order("created_at", { ascending: false })

          setRecordings(data || [])
          try { toast({ title: 'Saved', description: 'Recording saved.' }) } catch {}
        } else {
          try { toast({ title: 'Error', description: 'Failed to save recording' }) } catch {}
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteRecording(recordingId: string) {
    await supabase.from("voice_recordings").delete().eq("id", recordingId)

    setRecordings(recordings.filter((r) => r.id !== recordingId))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Record Memorization Practice</label>

        {!isRecording ? (
          <Button onClick={startRecording} className="w-full bg-primary hover:bg-accent text-primary-foreground">
            Start Recording
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 p-4 bg-red-50 rounded-lg">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-700 font-medium">Recording...</span>
            </div>

            <Input
              placeholder="Title for this recording"
              value={recordingTitle}
              onChange={(e) => setRecordingTitle(e.target.value)}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await stopRecording()
                  setIsRecording(false)
                  setRecordingTitle("")
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRecording}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-accent text-primary-foreground"
              >
                {loading ? "Saving..." : "Save Recording"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Your Recordings</h3>
        {recordings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No recordings yet</p>
            <p className="text-xs text-muted-foreground mt-1">Record yourself reciting to track progress</p>
          </div>
        ) : (
          recordings.map((recording) => (
            <div key={recording.id} className="bg-muted border border-border rounded-lg p-3 hover:bg-muted/80 transition-colors duration-200 group animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground text-sm">{recording.title}</h4>
                <button
                  onClick={() => handleDeleteRecording(recording.id)}
                  className="text-xs text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{new Date(recording.created_at).toLocaleDateString()}</span>
                {recording.duration_seconds && <span>{Math.round(recording.duration_seconds / 60)}m audio</span>}
              </div>

              {recording.audio_url && (
                <div className="mt-2">
                  <audio
                    src={recording.audio_url}
                    controls
                    className="w-full h-8"
                    onPlay={() => setPlayingId(recording.id)}
                    onPause={() => setPlayingId(null)}
                  />
                </div>
              )}
            </div>
          ))
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
