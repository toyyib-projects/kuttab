"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface GlossaryPanelProps {
  bookId: string
}

export function GlossaryPanel({ bookId }: GlossaryPanelProps) {
  const [glossaryItems, setGlossaryItems] = useState<any[]>([])
  const [newWord, setNewWord] = useState("")
  const [newDefinition, setNewDefinition] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  useEffect(() => {
    async function fetchGlossary() {
      const { data, error } = await supabase
        .from("glossary")
        .select("*")
        .eq("book_id", bookId)
        .order("created_at", { ascending: false })

      if (!error) {
        setGlossaryItems(data || [])
      }
    }

    fetchGlossary()
  }, [bookId, supabase])

  async function handleAddWord() {
    if (!newWord.trim() || !newDefinition.trim()) return

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("glossary").insert([
        {
          user_id: user.id,
          book_id: bookId,
          word: newWord,
          definition: newDefinition,
        },
      ])

      if (!error) {
        setNewWord("")
        setNewDefinition("")
        // Refresh glossary
        const { data } = await supabase
          .from("glossary")
          .select("*")
          .eq("book_id", bookId)
          .order("created_at", { ascending: false })

        setGlossaryItems(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteWord(wordId: string) {
    await supabase.from("glossary").delete().eq("id", wordId)

    setGlossaryItems(glossaryItems.filter((g) => g.id !== wordId))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Add New Word</label>
        <Input placeholder="Word" value={newWord} onChange={(e) => setNewWord(e.target.value)} />
        <textarea
          placeholder="Definition"
          value={newDefinition}
          onChange={(e) => setNewDefinition(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          rows={2}
        />
          <Button
            onClick={handleAddWord}
            disabled={loading}
            className="w-full bg-primary hover:bg-accent text-primary-foreground"
        >
          Add to Glossary
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {glossaryItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No glossary items yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add new words and definitions</p>
          </div>
        ) : (
          glossaryItems.map((item) => (
            <div key={item.id} className="bg-muted border border-border rounded-lg p-3 hover:bg-muted/80 transition-colors duration-200 group animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{item.word}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.definition}</p>
                </div>
                <button 
                  onClick={() => handleDeleteWord(item.id)} 
                  className="text-xs text-destructive hover:text-destructive/80 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>
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
