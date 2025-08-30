import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Collaborative Editor",
  description: "Real-time collaborative editor for various document types",
  generator: 'v0.dev',
  icons: {
    icon: [
      {
        url: '/fav.png',
        type: 'image/png',
      },
      {
        url: '/fav.png',
        sizes: 'any',
      }
    ],
    apple: '/fav.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark h-full w-full" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/fav.png" />
        <link rel="shortcut icon" href="/fav.png" />
      </head>
      <body className={`${inter.className} antialiased dark h-full w-full`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
