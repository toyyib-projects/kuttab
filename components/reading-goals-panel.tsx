"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ReadingGoalsPanelProps {
  bookId: string
  totalPages?: number
}

export function ReadingGoalsPanel({ bookId, totalPages }: ReadingGoalsPanelProps) {
  const [goal, setGoal] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [expectedDays, setExpectedDays] = useState("7")
  const [loading, setLoading] = useState(false)
  const [readingSessions, setReadingSessions] = useState<any[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://qyfiafodyqmewuijigfm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZmlhZm9keXFtZXd1aWppZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2ODEyODksImV4cCI6MjA4NDI1NzI4OX0.EEQgOLSIjeEA1pv3dCD48M_QgN44EgesTe_HLftbsHs",
  )

  useEffect(() => {
    async function fetchGoal() {
      const { data, error } = await supabase.from("reading_goals").select("*").eq("book_id", bookId).limit(1).single()

      if (!error && data) {
        setGoal(data)
      }

      // Fetch reading sessions for actual duration
      const { data: sessions } = await supabase
        .from("reading_sessions")
        .select("*")
        .eq("book_id", bookId)
        .order("created_at", { ascending: true })

      if (sessions) {
        setReadingSessions(sessions)
      }
    }

    fetchGoal()
  }, [bookId, supabase])

  async function handleCreateGoal() {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const completionDate = new Date()
      completionDate.setDate(completionDate.getDate() + Number.parseInt(expectedDays))

      const { error } = await supabase.from("reading_goals").insert([
        {
          user_id: user.id,
          book_id: bookId,
          expected_duration_days: Number.parseInt(expectedDays),
          expected_completion_date: completionDate.toISOString().split("T")[0],
        },
      ])

      if (!error) {
        setExpectedDays("7")
        setShowForm(false)
        // Refresh goal
        const { data } = await supabase.from("reading_goals").select("*").eq("book_id", bookId).limit(1).single()

        if (data) {
          setGoal(data)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteGoal() {
    if (!goal) return

    await supabase.from("reading_goals").delete().eq("id", goal.id)

    setGoal(null)
  }

  async function handleCompleteGoal() {
    if (!goal) return

    const today = new Date().toISOString().split("T")[0]

    const { error } = await supabase.from("reading_goals").update({ actual_completion_date: today }).eq("id", goal.id)

    if (!error) {
      const { data } = await supabase.from("reading_goals").select("*").eq("book_id", bookId).limit(1).single()

      if (data) {
        setGoal(data)
      }
    }
  }

  const calculateTotalMinutes = () => {
    return readingSessions.reduce((total, session) => total + (session.duration_minutes || 0), 0)
  }

  const calculateEstimatedDays = () => {
    if (!goal || !goal.expected_completion_date) return null

    const expected = new Date(goal.expected_completion_date)
    const created = new Date(goal.created_at)
    const today = new Date()

    const daysElapsed = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.floor((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return { daysElapsed, daysRemaining, daysTotal: daysElapsed + daysRemaining }
  }

  const isCompleted = goal?.actual_completion_date

  return (
    <div className="space-y-4">
      {!goal ? (
        !showForm ? (
          <Button onClick={() => setShowForm(true)} className="w-full bg-primary hover:bg-accent text-primary-foreground">
            + Set Reading Goal
          </Button>
        ) : (
          <div className="space-y-3 p-3 bg-muted rounded-lg border border-border">
            <label className="block text-sm font-medium text-foreground">Complete this book in (days)</label>
            <Input
              type="number"
              value={expectedDays}
              onChange={(e) => setExpectedDays(e.target.value)}
              min="1"
              max="365"
              className="bg-background border-border"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1" disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreateGoal} disabled={loading} className="flex-1 bg-primary hover:bg-accent text-primary-foreground">
                {loading ? "Setting..." : "Set Goal"}
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-lg border ${isCompleted ? "bg-accent/10 border-accent" : "bg-primary/5 border-primary/20"}`}
          >
            <h3 className={`font-semibold mb-3 ${isCompleted ? "text-accent" : "text-primary"}`}>
              {isCompleted ? "Completed!" : "Reading Goal"}
            </h3>

            {(() => {
              const timings = calculateEstimatedDays()
              const dailyPages = totalPages && goal.expected_duration_days 
                ? Math.ceil(totalPages / goal.expected_duration_days)
                : 0
              return timings ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Duration:</span>
                    <span className="font-medium text-foreground">{goal.expected_duration_days} days</span>
                  </div>
                  {dailyPages > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pages per day:</span>
                      <span className="font-medium text-accent">{dailyPages} pages</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days Elapsed:</span>
                    <span className="font-medium text-foreground">{timings.daysElapsed} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days Remaining:</span>
                    <span className="font-medium text-foreground">{Math.max(0, timings.daysRemaining)} days</span>
                  </div>
                  {isCompleted && (
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-muted-foreground">Actual Completion:</span>
                      <span className="font-medium text-foreground">{goal.actual_completion_date}</span>
                    </div>
                  )}
                </div>
              ) : null
            })()}

            <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 transition-all duration-500 ${isCompleted ? "bg-accent" : "bg-primary"}`}
                style={{
                  width: `${Math.min(
                    100,
                    ((calculateEstimatedDays()?.daysElapsed || 0) / (goal.expected_duration_days || 1)) * 100,
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="p-3 bg-muted border border-border rounded-lg text-sm">
            <p className="text-foreground font-medium mb-2">Reading Activity</p>
            <p className="text-muted-foreground">Total Reading Time: {calculateTotalMinutes()} minutes</p>
            <p className="text-muted-foreground">Sessions: {readingSessions.length}</p>
          </div>

          <div className="flex gap-2">
            {!isCompleted && (
              <Button onClick={handleCompleteGoal} className="flex-1 bg-accent hover:bg-accent/80 text-accent-foreground">
                Mark as Complete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDeleteGoal}
              className="flex-1 bg-transparent"
            >
              Delete Goal
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
