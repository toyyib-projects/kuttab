"use client"

import React, { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // having the pathname as the key forces a remount on route change which
  // triggers the CSS animation defined in globals. This keeps the implementation
  // lightweight and dependency-free (no framer-motion required).
  useEffect(() => {
    // intentionally empty; effect exists to show intent and to run on pathname change
  }, [pathname])

  return (
    <div key={pathname} className="page-animate">
      {children}
    </div>
  )
}
