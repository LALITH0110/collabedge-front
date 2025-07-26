"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { open, setOpen, toggleSidebar } = useSidebar()
  const [isMounted, setIsMounted] = useState(false)

  // Wait for client-side hydration to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="flex h-screen">
      {isMounted && (
        <>
          <AppSidebar />
          <main className="flex-1 overflow-auto relative">
            {!open && (
              <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50" onClick={toggleSidebar}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
            {children}
          </main>
        </>
      )}
    </div>
  )
}
