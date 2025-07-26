"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AnimatedBackground } from "@/components/animated-background"
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

function VerifyEmailPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    const emailParam = searchParams.get('email')
    
    if (emailParam) {
      setEmail(emailParam)
    }

    if (token) {
      verifyEmail(token)
    } else {
      setVerificationStatus('error')
      setMessage('No verification token provided')
    }
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    setIsVerifying(true)
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store the token and update auth state
        localStorage.setItem('auth_token', data.token)
        setVerificationStatus('success')
        setMessage('Email verified successfully! You are now logged in.')
        
        // Show success toast
        toast.success('Email verified successfully!')
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setVerificationStatus('error')
        setMessage(data.error || 'Email verification failed')
      }
    } catch (error) {
      setVerificationStatus('error')
      setMessage('Network error. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (!email) {
      toast.error('Please provide your email address')
      return
    }

    setIsResending(true)
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Verification email sent successfully!')
        setMessage('A new verification email has been sent to your email address.')
      } else {
        toast.error(data.error || 'Failed to resend verification email')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {isVerifying ? (
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            ) : verificationStatus === 'success' ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : verificationStatus === 'error' ? (
              <XCircle className="h-12 w-12 text-red-500" />
            ) : (
              <Mail className="h-12 w-12 text-blue-500" />
            )}
          </div>
          
          <CardTitle>
            {isVerifying ? 'Verifying Email...' : 
             verificationStatus === 'success' ? 'Email Verified!' :
             verificationStatus === 'error' ? 'Verification Failed' :
             'Email Verification'}
          </CardTitle>
          
          <CardDescription>
            {isVerifying ? 'Please wait while we verify your email address' :
             verificationStatus === 'success' ? 'Welcome to CollabEdge! Your account is now active.' :
             'There was an issue verifying your email address'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <Alert variant={verificationStatus === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {verificationStatus === 'error' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
              
              <Button 
                onClick={resendVerificationEmail}
                disabled={isResending || !email}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </Button>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Redirecting you to the dashboard...
              </p>
              <Button onClick={() => router.push('/')} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}

          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we prepare your email verification.</p>
        </div>
      </div>
    }>
      <VerifyEmailPageContent />
    </Suspense>
  )
} 