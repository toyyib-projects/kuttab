"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ResourcesPanelProps {
  bookId: string
}

type ResourceType = "video" | "audio" | "article"

export function ResourcesPanel({ bookId }: ResourcesPanelProps) {
  const [resources, setResources] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [resourceType, setResourceType] = useState<ResourceType>("video")
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  useEffect(() => {
    async function fetchResources() {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("book_id", bookId)
        .order("created_at", { ascending: false })

      if (!error) {
        setResources(data || [])
      }
    }

    fetchResources()
  }, [bookId, supabase])

  async function handleAddResource() {
    if (!title.trim() || !url.trim()) return

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("resources").insert([
        {
          user_id: user.id,
          book_id: bookId,
          type: resourceType,
          title,
          url,
          description,
        },
      ])

      if (!error) {
        setTitle("")
        setUrl("")
        setDescription("")
        setShowForm(false)
        // Refresh resources
        const { data } = await supabase
          .from("resources")
          .select("*")
          .eq("book_id", bookId)
          .order("created_at", { ascending: false })

        setResources(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteResource(resourceId: string) {
    await supabase.from("resources").delete().eq("id", resourceId)

    setResources(resources.filter((r) => r.id !== resourceId))
  }

  const getIcon = (type: ResourceType) => {
    switch (type) {
      case "video":
        return "▶"
      case "audio":
        return "🔊"
      case "article":
        return "📄"
      default:
        return "📎"
    }
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full bg-primary hover:bg-accent text-primary-foreground">
          + Add Resource
        </Button>
      ) : (
        <div className="space-y-3 p-3 bg-muted rounded-lg border border-border">
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value as ResourceType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="article">Article</option>
          </select>

          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} type="url" />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={2}
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddResource} disabled={loading} className="flex-1 bg-primary hover:bg-accent text-primary-foreground">
              {loading ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {resources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No resources yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add videos, audios, or articles</p>
          </div>
        ) : (
          resources.map((resource) => (
            <div key={resource.id} className="bg-muted border border-border rounded-lg p-3 hover:bg-muted/80 transition-colors duration-200 group animate-fade-in">
              <div className="flex items-start gap-3">
                <span className="text-lg">{getIcon(resource.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm line-clamp-2">{resource.title}</p>
                  {resource.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{resource.description}</p>
                  )}
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-accent mt-2 inline-block underline transition-colors"
                  >
                    Open
                  </a>
                </div>
                <button
                  onClick={() => handleDeleteResource(resource.id)}
                  className="text-xs text-destructive hover:text-destructive/80 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove
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
