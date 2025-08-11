"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AnimatedBackground } from "@/components/animated-background"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/contexts/AuthContext"
import ScrambledText from "@/components/scrambled-text"
import CardSwap, { Card } from "@/components/card-swap"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { AlertCircle, Loader2, Menu, Code, FileText, Presentation, Table, PenTool, Users, Bot, Shield } from "lucide-react"
import { PasswordStrength } from "@/components/ui/password-strength"
import { toast } from "sonner"
import { UserDropdown } from "@/components/user-dropdown"

export function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, user, login, signup, loginWithToken, isLoading, error, clearError } = useAuth()
  const [showSidebar, setShowSidebar] = useState(false)
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginFormError, setLoginFormError] = useState<string | null>(null)
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("")
  const [signupUsername, setSignupUsername] = useState("")
  const [showSignupDialog, setShowSignupDialog] = useState(false)
  const [signupFormError, setSignupFormError] = useState<string | null>(null)

  // Forgot password state
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'code' | 'new-password'>('email')
  const [forgotPasswordData, setForgotPasswordData] = useState({
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isSendingResetCode, setIsSendingResetCode] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null)
  const [showForgotPasswordSignUpOption, setShowForgotPasswordSignUpOption] = useState(false)

  // Email verification state
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false)
  const [emailVerificationEmail, setEmailVerificationEmail] = useState("")
  const [emailVerificationCode, setEmailVerificationCode] = useState("")
  const [isSendingVerificationCode, setIsSendingVerificationCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailVerificationStep, setEmailVerificationStep] = useState<'email' | 'code'>('email')
  const [emailVerificationError, setEmailVerificationError] = useState<string | null>(null)
  const [showVerifyNowOption, setShowVerifyNowOption] = useState(false)
  const [showSignUpOption, setShowSignUpOption] = useState(false)

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const authSuccess = urlParams.get('auth_success')
      const tokenParam = urlParams.get('token')
      const emailParam = urlParams.get('email')
      const errorParam = urlParams.get('error')

      if (errorParam) {
        console.error('OAuth error:', errorParam)
        toast.error(`Google login failed: ${errorParam}`)
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }

      if (authSuccess === 'true' && tokenParam && emailParam) {
        console.log('Processing OAuth success callback...')
        
        // Get additional user data from URL params
        const usernameParam = urlParams.get('username')
        const userIdParam = urlParams.get('userId')
        
        // Create user data object
        const userData = {
          userId: userIdParam,
          username: usernameParam,
          email: emailParam,
          subscriptionPlan: 'free',
          subscriptionStatus: 'active'
        }
        
        // Update auth context with token and user data
        await loginWithToken(tokenParam, userData)
        
        toast.success('Successfully logged in with Google!')
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    handleOAuthCallback()
  }, [loginWithToken])

  const handleJoinRoom = () => {
    router.push("/join")
  }

  const handleCreateRoom = () => {
    router.push("/create")
  }

  const handleLoginClick = () => {
    setShowLoginDialog(true)
    setLoginFormError(null)
    setShowVerifyNowOption(false)
    setShowSignUpOption(false)
    clearError()
  }

  const handleSignupClick = () => {
    setShowSignupDialog(true)
    setSignupFormError(null)
    clearError()
  }

  const handlePricingClick = () => {
    router.push("/pricing")
  }

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?` +
      `client_id=1036438074082-4865jggp12ra6724qesia6n8kmrgeu02.apps.googleusercontent.com&` +
      `redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/google`)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `access_type=offline`;
    
    window.location.href = googleAuthUrl;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginFormError(null)
    
    if (!loginEmail || !loginPassword) {
      setLoginFormError("Please fill in all fields")
      return
    }

    try {
      await login(loginEmail, loginPassword)
      setLoginEmail("")
      setLoginPassword("")
      setShowLoginDialog(false)
      setLoginFormError(null)
      setShowVerifyNowOption(false)
      setShowSignUpOption(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      
      // Check if it's an email verification error
      if (errorMessage.includes('verify your email') || errorMessage.includes('email address before logging in')) {
        setShowVerifyNowOption(true)
        setShowSignUpOption(false)
        setLoginFormError(null)
      } 
      // Check if it's an invalid credentials error - need to check if email exists
      else if (errorMessage.includes('Invalid email or password') || errorMessage.includes('Invalid credentials')) {
        // Check if the email exists in the database
        try {
          const checkEmailResponse = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: loginEmail }),
          })

          const checkEmailData = await checkEmailResponse.json()

          if (checkEmailResponse.ok) {
            if (checkEmailData.exists) {
              // Email exists but password is wrong - don't show sign up option
              setLoginFormError("Invalid email or password")
              setShowVerifyNowOption(false)
              setShowSignUpOption(false)
            } else {
              // Email doesn't exist - show sign up option
              setShowSignUpOption(true)
              setShowVerifyNowOption(false)
              setLoginFormError(null)
            }
          } else {
            // If check email fails, fall back to showing sign up option
            setShowSignUpOption(true)
            setShowVerifyNowOption(false)
            setLoginFormError(null)
          }
        } catch (checkError) {
          // If check email fails, fall back to showing sign up option
          setShowSignUpOption(true)
          setShowVerifyNowOption(false)
          setLoginFormError(null)
        }
      } else {
        setLoginFormError(errorMessage)
        setShowVerifyNowOption(false)
        setShowSignUpOption(false)
      }
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupFormError(null)
    
    if (!signupUsername || !signupEmail || !signupPassword || !signupConfirmPassword) {
      setSignupFormError("Please fill in all fields")
      return
    }

    if (signupPassword.length < 8) {
      setSignupFormError("Password must be at least 8 characters")
      return
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupFormError("Passwords do not match")
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: signupUsername, 
          email: signupEmail, 
          password: signupPassword 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store email and userId for verification page
        localStorage.setItem('pendingVerificationEmail', signupEmail)
        localStorage.setItem('pendingVerificationUserId', data.userId)
        
        // Clear form
        setSignupFormError(null)
        setSignupEmail("")
        setSignupPassword("")
        setSignupConfirmPassword("")
        setSignupUsername("")
        setShowSignupDialog(false)
        
        // Show success toast and redirect to verification page
        toast.success('Account created! Check your email for the verification code.')
        router.push(`/verify-code?email=${encodeURIComponent(signupEmail)}&userId=${data.userId}`)
      } else {
        setSignupFormError(data.error || 'Signup failed')
      }
    } catch (error) {
      setSignupFormError('Network error. Please try again.')
    }
  }

  // Forgot password functions
  const handleForgotPasswordClick = () => {
    setShowForgotPasswordDialog(true)
    setShowLoginDialog(false)
    setForgotPasswordError(null)
    setShowForgotPasswordSignUpOption(false)
    setForgotPasswordStep('email')
    setForgotPasswordEmail("")
    setForgotPasswordData({
      verificationCode: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordError(null)
    setShowForgotPasswordSignUpOption(false)
    
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError("Please enter your email address")
      return
    }

    setIsSendingResetCode(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        // Check if the response indicates the account doesn't exist
        if (data.message && data.message.includes('If an account with this email exists')) {
          // This means the account doesn't exist, show sign up option
          setShowForgotPasswordSignUpOption(true)
          setForgotPasswordError(null)
        } else {
          toast.success('Reset code sent to your email!')
          setForgotPasswordStep('code')
        }
      } else {
        setForgotPasswordError(data.error || 'Failed to send reset code')
      }
    } catch (error) {
      setForgotPasswordError('Network error. Please try again.')
    } finally {
      setIsSendingResetCode(false)
    }
  }

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordError(null)
    
    if (!forgotPasswordData.verificationCode.trim()) {
      setForgotPasswordError("Please enter the verification code")
      return
    }

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: forgotPasswordEmail,
          verificationCode: forgotPasswordData.verificationCode 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setForgotPasswordStep('new-password')
      } else {
        setForgotPasswordError(data.error || 'Invalid verification code')
      }
    } catch (error) {
      setForgotPasswordError('Network error. Please try again.')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordError(null)
    
    if (!forgotPasswordData.newPassword.trim()) {
      setForgotPasswordError("Please enter a new password")
      return
    }

    if (forgotPasswordData.newPassword.length < 8) {
      setForgotPasswordError("Password must be at least 8 characters")
      return
    }

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setForgotPasswordError("Passwords do not match")
      return
    }

    setIsResettingPassword(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: forgotPasswordEmail,
          verificationCode: forgotPasswordData.verificationCode,
          newPassword: forgotPasswordData.newPassword 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Password reset successfully! You can now log in with your new password.')
        setShowForgotPasswordDialog(false)
        setForgotPasswordStep('email')
        setForgotPasswordEmail("")
        setForgotPasswordData({
          verificationCode: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setForgotPasswordError(data.error || 'Failed to reset password')
      }
    } catch (error) {
      setForgotPasswordError('Network error. Please try again.')
    } finally {
      setIsResettingPassword(false)
    }
  }

  // Email verification functions
  const handleVerifyNowClick = (email: string) => {
    setShowEmailVerificationDialog(true)
    setShowLoginDialog(false)
    setEmailVerificationEmail(email)
    setEmailVerificationError(null)
    setEmailVerificationStep('email')
    setEmailVerificationCode("")
  }

  const handleSendEmailVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailVerificationError(null)
    
    if (!emailVerificationEmail.trim()) {
      setEmailVerificationError("Please enter your email address")
      return
    }

    setIsSendingVerificationCode(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailVerificationEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Verification code sent to your email!')
        setEmailVerificationStep('code')
      } else {
        setEmailVerificationError(data.error || 'Failed to send verification code')
      }
    } catch (error) {
      setEmailVerificationError('Network error. Please try again.')
    } finally {
      setIsSendingVerificationCode(false)
    }
  }

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailVerificationError(null)
    
    if (!emailVerificationCode.trim()) {
      setEmailVerificationError("Please enter the verification code")
      return
    }

    setIsVerifyingEmail(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: emailVerificationCode }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Email verified successfully! You can now log in.')
        setShowEmailVerificationDialog(false)
        setEmailVerificationStep('email')
        setEmailVerificationEmail("")
        setEmailVerificationCode("")
        // Close the verification dialog and show login dialog again
        setShowLoginDialog(true)
      } else {
        setEmailVerificationError(data.error || 'Invalid verification code')
      }
    } catch (error) {
      setEmailVerificationError('Network error. Please try again.')
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  return (
    <>
      <div className="h-screen w-screen flex flex-col relative bg-transparent">
        <AppSidebar defaultOpen={showSidebar} />
        <AnimatedBackground />

      {/* Header */}
      <header className="relative z-50 border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSidebar(true)}
              className="w-8 h-8 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span 
              className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/')}
            >
              CollabEdge
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 absolute left-1/2 transform -translate-x-1/2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/about')}>
                About
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/features')}>
                Features
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePricingClick}>
                Pricing
              </Button>
            </div>
            {isAuthenticated ? (
              <UserDropdown onToggleSidebar={() => setShowSidebar(true)} />
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleLoginClick}>
                  Log In
                </Button>
                <Button size="sm" onClick={handleSignupClick}>Sign Up</Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex w-full">
        {/* Hero Content */}
        <div className="relative z-20 w-full flex flex-col md:flex-row items-center justify-between px-6 py-16">
          <div className="max-w-2xl mb-12 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Real-time collaborative workspace</h1>
            <div className="w-full">
              <ScrambledText
                className="text-xl md:text-2xl text-muted-foreground mb-8"
                radius={100}
                duration={1.2}
                speed={0.5}
                scrambleChars=".:"
                style={{ width: '100%' }}
              >
                Create and join rooms to collaborate on code, documents, spreadsheets, presentations, and more in
                real-time with your team.
              </ScrambledText>
            </div>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span>Code Editing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span>Rich Text</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <span>Spreadsheets</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                <span>Presentations</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={handleCreateRoom}>
                Create New Room
              </Button>
              <Button variant="outline" size="lg" onClick={handleJoinRoom}>
                Join Existing Room
              </Button>
            </div>
          </div>

          <div className="w-full max-w-md relative overflow-visible hidden md:block" style={{ marginRight: '100px', marginTop: '-100px' }}>
            <div style={{ height: '700px', position: 'relative', transform: 'scale(1.2)', zIndex: 1 }}>
              <CardSwap
                cardDistance={55}
                verticalDistance={75}
                delay={5000}
                pauseOnHover={true}
                skewAmount={6}
              >
                <Card className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                    <Code className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Code Editor</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Professional code editing with syntax highlighting for 100+ languages
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Real-time collaboration
                  </div>
                </Card>

                <Card className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Word Processor</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Rich text editing with advanced formatting and collaboration tools
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Track changes & comments
                  </div>
                </Card>

                <Card className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-6">
                    <Presentation className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Presentations</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create stunning presentations with real-time slide collaboration
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Live slide editing
                  </div>
                </Card>

                <Card className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
                    <Table className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Spreadsheets</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Powerful spreadsheet with formulas, charts, and data visualization
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Real-time data sync
                  </div>
                </Card>

                <Card className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-6">
                    <PenTool className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Freeform Canvas</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unlimited creative canvas for brainstorming and visual collaboration
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Infinite canvas space
                  </div>
                </Card>

                <Card className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Team Collaboration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Work together seamlessly with live cursors and presence awareness
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Live cursors & chat
                  </div>
                </Card>

                <Card className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">AI Assistant</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI-powered writing, code completion, and content generation
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Smart suggestions
                  </div>
                </Card>

                <Card className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Enterprise Security</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    End-to-end encryption and enterprise-grade security standards
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    GDPR & SOC 2 compliant
                  </div>
                </Card>
              </CardSwap>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Commented out for now */}
      {/* <footer className="relative z-50 border-t border-white/10 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">© 2025 CollabEdge. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Button variant="ghost" size="sm">
                Terms
              </Button>
              <Button variant="ghost" size="sm">
                Privacy
              </Button>
              <Button variant="ghost" size="sm">
                Contact
              </Button>
            </div>
          </div>
        </div>
      </footer> */}

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log In</DialogTitle>
            <DialogDescription>Log in to access your saved rooms and collaborate</DialogDescription>
          </DialogHeader>
          
          {(loginFormError || error) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {loginFormError || error}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Show "Verify Now" option for unverified emails */}
          {showVerifyNowOption && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Please verify your email address before logging in</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleVerifyNowClick(loginEmail)}
                  className="ml-2"
                >
                  Verify Now
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Show "Sign Up" option for non-existent accounts */}
          {showSignUpOption && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Account doesn't exist. Please sign up to create an account.</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowLoginDialog(false)
                    setShowSignUpOption(false)
                    handleSignupClick()
                  }}
                  className="ml-2"
                >
                  Sign Up
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 pt-4">
            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <DialogFooter className="flex items-center justify-between w-full">
                <div className="flex-1 flex justify-start">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={handleForgotPasswordClick}
                  >
                    Forgot Password?
                  </Button>
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log In
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Up</DialogTitle>
            <DialogDescription>Create an account to save your rooms and collaborate</DialogDescription>
          </DialogHeader>
          
          {(signupFormError || error) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {signupFormError || error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 pt-4">
            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="signup-username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="signup-username"
                type="text"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="signup-email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="signup-password"
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
                placeholder="At least 8 characters"
              />
              <PasswordStrength password={signupPassword} />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-confirm-password" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="signup-confirm-password"
                type="password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Retype your password"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </DialogFooter>
          </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === 'email' && "Enter your email to receive a reset code"}
              {forgotPasswordStep === 'code' && "Enter the verification code sent to your email"}
              {forgotPasswordStep === 'new-password' && "Enter your new password"}
            </DialogDescription>
          </DialogHeader>
          
          {forgotPasswordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {forgotPasswordError}
              </AlertDescription>
            </Alert>
          )}

          {/* Show "Sign Up" option for non-existent accounts in forgot password */}
          {showForgotPasswordSignUpOption && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Account doesn't exist. Please sign up to create an account.</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowForgotPasswordDialog(false)
                    setShowForgotPasswordSignUpOption(false)
                    handleSignupClick()
                  }}
                  className="ml-2"
                >
                  Sign Up
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {forgotPasswordStep === 'email' && (
            <form onSubmit={handleSendResetCode} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="forgot-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  disabled={isSendingResetCode}
                  placeholder="Enter your email address"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSendingResetCode}>
                  {isSendingResetCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Code
                </Button>
              </DialogFooter>
            </form>
          )}

          {forgotPasswordStep === 'code' && (
            <form onSubmit={handleVerifyResetCode} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="reset-code" className="text-sm font-medium">
                  Verification Code
                </label>
                <Input
                  id="reset-code"
                  type="text"
                  value={forgotPasswordData.verificationCode}
                  onChange={(e) => setForgotPasswordData(prev => ({ ...prev, verificationCode: e.target.value }))}
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                />
              </div>
              <DialogFooter>
                <Button type="submit">
                  Verify Code
                </Button>
              </DialogFooter>
            </form>
          )}

          {forgotPasswordStep === 'new-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={forgotPasswordData.newPassword}
                  onChange={(e) => setForgotPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  minLength={8}
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-new-password" className="text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={forgotPasswordData.confirmPassword}
                  onChange={(e) => setForgotPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  placeholder="Confirm new password"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isResettingPassword}>
                  {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Verification Dialog */}
      <Dialog open={showEmailVerificationDialog} onOpenChange={setShowEmailVerificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Email Address</DialogTitle>
            <DialogDescription>
              {emailVerificationStep === 'email' && "Enter your email to receive a verification code"}
              {emailVerificationStep === 'code' && "Enter the verification code sent to your email"}
            </DialogDescription>
          </DialogHeader>
          
          {emailVerificationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {emailVerificationError}
              </AlertDescription>
            </Alert>
          )}
          
          {emailVerificationStep === 'email' && (
            <form onSubmit={handleSendEmailVerificationCode} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="verify-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="verify-email"
                  type="email"
                  value={emailVerificationEmail}
                  onChange={(e) => setEmailVerificationEmail(e.target.value)}
                  required
                  disabled={isSendingVerificationCode}
                  placeholder="Enter your email address"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSendingVerificationCode}>
                  {isSendingVerificationCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Verification Code
                </Button>
              </DialogFooter>
            </form>
          )}

          {emailVerificationStep === 'code' && (
            <form onSubmit={handleVerifyEmailCode} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="verify-code" className="text-sm font-medium">
                  Verification Code
                </label>
                <Input
                  id="verify-code"
                  type="text"
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isVerifyingEmail}>
                  {isVerifyingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Email
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </>
  )
}
