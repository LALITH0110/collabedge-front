"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, ArrowLeft, RefreshCw } from "lucide-react"
import { AnimatedBackground } from "@/components/animated-background"
import { toast } from "sonner"

function VerifyCodePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")

  useEffect(() => {
    // Get email and userId from URL params or localStorage
    const emailParam = searchParams.get('email')
    const userIdParam = searchParams.get('userId')
    
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Try to get from localStorage (if user came from signup)
      const storedEmail = localStorage.getItem('pendingVerificationEmail')
      if (storedEmail) {
        setEmail(storedEmail)
      }
    }
    
    if (userIdParam) {
      setUserId(userIdParam)
    } else {
      const storedUserId = localStorage.getItem('pendingVerificationUserId')
      if (storedUserId) {
        setUserId(storedUserId)
      }
    }

    // Clear any existing error
    setError("")
  }, [searchParams])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Only allow digits, max 6
    setVerificationCode(value)
    setError("") // Clear error when user types
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit verification code")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Success - user is verified and logged in
        toast.success('Email verified successfully! Welcome to CollabEdge!')
        
        // Store the auth token
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify({
          id: data.userId,
          username: data.username,
          email: data.email
        }))
        
        // Clear pending verification data
        localStorage.removeItem('pendingVerificationEmail')
        localStorage.removeItem('pendingVerificationUserId')
        
        // Redirect to dashboard
        router.push('/')
      } else {
        setError(data.error || 'Verification failed. Please try again.')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      setError("Email address not found. Please try signing up again.")
      return
    }

    setIsResending(true)
    setError("")

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Verification code sent! Check your email.')
        setVerificationCode("") // Clear the old code
      } else {
        setError(data.error || 'Failed to resend verification code.')
      }
    } catch (error) {
      console.error('Resend error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToSignup = () => {
    // Clear any stored verification data
    localStorage.removeItem('pendingVerificationEmail')
    localStorage.removeItem('pendingVerificationUserId')
    router.push('/')
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Verification Required</CardTitle>
              <CardDescription>
                Email address not found. Please sign up again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleBackToSignup} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign Up
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <AnimatedBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-sm bg-background/80 border-background/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a 6-digit verification code to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="verification-code" className="text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={handleCodeChange}
                className="text-center text-lg font-mono tracking-widest"
                maxLength={6}
                disabled={isVerifying}
              />
            </div>

            <Button 
              onClick={handleVerifyCode} 
              className="w-full" 
              disabled={verificationCode.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResendCode}
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToSignup}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we prepare your verification page.</p>
        </div>
      </div>
    }>
      <VerifyCodePageContent />
    </Suspense>
  )
} 