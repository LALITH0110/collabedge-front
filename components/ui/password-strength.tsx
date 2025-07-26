"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0)
  const [label, setLabel] = useState("")
  const [color, setColor] = useState("")

  useEffect(() => {
    if (!password) {
      setStrength(0)
      setLabel("")
      setColor("")
      return
    }

    let score = 0
    let feedback = ""

    // Length check
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    // Set strength level
    if (score <= 2) {
      setLabel("Weak")
      setColor("bg-red-500")
    } else if (score <= 4) {
      setLabel("Fair")
      setColor("bg-yellow-500")
    } else if (score <= 6) {
      setLabel("Good")
      setColor("bg-blue-500")
    } else {
      setLabel("Strong")
      setColor("bg-green-500")
    }

    setStrength(Math.min(score, 6))
  }, [password])

  if (!password) return null

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={cn(
          "font-medium",
          color === "bg-red-500" && "text-red-500",
          color === "bg-yellow-500" && "text-yellow-500",
          color === "bg-blue-500" && "text-blue-500",
          color === "bg-green-500" && "text-green-500"
        )}>
          {label}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-200",
              i < strength ? color : "bg-gray-200 dark:bg-gray-700"
            )}
          />
        ))}
      </div>
    </div>
  )
} 