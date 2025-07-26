"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function AuthSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const userId = searchParams.get('userId')
    const username = searchParams.get('username')
    const email = searchParams.get('email')

    if (token && userId && username && email) {
      // Store the token in localStorage
      localStorage.setItem('auth_token', token)
      
      // Update auth context
      login(email, '') // We don't need password for OAuth users
      
      toast.success('Successfully logged in with Google!')
      
      // Redirect to home page
      router.push('/')
    } else {
      toast.error('Authentication failed')
      router.push('/login')
    }
  }, [searchParams, router, login])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing login...</h1>
        <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
      </div>
    </div>
  )
} 