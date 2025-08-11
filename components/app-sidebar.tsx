"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PasswordStrength } from "@/components/ui/password-strength"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { 
  Home, 
  LogIn, 
  Plus, 
  User, 
  UserPlus, 
  Menu, 
  X, 
  FileText, 
  RefreshCw, 
  Lock,
  AlertCircle,
  Loader2,
  Trash2,
  Crown,
  Users,
  Settings,
  Circle
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { authService, type Room } from "@/lib/auth-service"

type AppSidebarProps = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AppSidebar({ defaultOpen = false, onOpenChange }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const { isAuthenticated, user, login, signup, logout, isLoading, error, clearError } = useAuth()
  
  // Room management
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [roomsError, setRoomsError] = useState<string | null>(null)
  const [roomUsers, setRoomUsers] = useState<Map<string, { users: string[], userCount: number }>>(new Map())
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginFormError, setLoginFormError] = useState<string | null>(null)
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("")
  const [signupUsername, setSignupUsername] = useState("")
  const [showSignupDialog, setShowSignupDialog] = useState(false)
  const [signupFormError, setSignupFormError] = useState<string | null>(null)
  
  // Room deletion confirmation
  const [showDeleteRoomDialog, setShowDeleteRoomDialog] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<{ id: string; name: string } | null>(null)

  // Initialize sidebar state based on defaultOpen prop
  useEffect(() => {
    setIsOpen(defaultOpen)
  }, [defaultOpen])

  const fetchUserRooms = useCallback(async () => {
    if (!isAuthenticated) return
    
    setIsLoadingRooms(true)
    setRoomsError(null)
    
    try {
      const userRooms = await authService.getUserRooms()
      setRooms(userRooms)
      console.log(`Fetched ${userRooms.length} rooms for user ${user?.username}`)
      
      // Fetch user data for each room
      const userDataPromises = userRooms.map(async (room) => {
        try {
          const userData = await authService.getRoomUsers(room.id)
          return { roomId: room.id, userData }
        } catch (error) {
          console.error(`Error fetching users for room ${room.id}:`, error)
          return { roomId: room.id, userData: { users: [], userCount: 0 } }
        }
      })
      
      const userDataResults = await Promise.all(userDataPromises)
      const newRoomUsers = new Map()
      userDataResults.forEach(({ roomId, userData }) => {
        newRoomUsers.set(roomId, userData)
      })
      setRoomUsers(newRoomUsers)
      
    } catch (error) {
      console.error('Error fetching user rooms:', error)
      setRoomsError(error instanceof Error ? error.message : 'Failed to load rooms')
    } finally {
      setIsLoadingRooms(false)
    }
  }, [isAuthenticated, user?.username])

  // Fetch user rooms when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserRooms()
    } else {
      setRooms([])
    }
  }, [isAuthenticated, user, fetchUserRooms])

  // Listen for room list refresh events
  useEffect(() => {
    const handleRefreshRoomList = () => {
      if (isAuthenticated && user) {
        console.log('Refreshing room list due to join event')
        fetchUserRooms()
      }
    }

    window.addEventListener('refreshRoomList', handleRefreshRoomList)
    
    return () => {
      window.removeEventListener('refreshRoomList', handleRefreshRoomList)
    }
    }, [isAuthenticated, user, fetchUserRooms])

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      
      // Check if it's an email verification error
      if (errorMessage.includes('verify your email') || errorMessage.includes('email address before logging in')) {
        setLoginFormError("Please verify your email address before logging in")
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
              // Email exists but password is wrong - show generic error
              setLoginFormError("Invalid email or password")
            } else {
              // Email doesn't exist - suggest sign up
              setLoginFormError("Account doesn't exist. Please sign up to create an account.")
            }
          } else {
            // If check email fails, show generic error
            setLoginFormError("Invalid email or password")
          }
        } catch (checkError) {
          // If check email fails, show generic error
          setLoginFormError("Invalid email or password")
        }
      } else {
        setLoginFormError(errorMessage)
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

  const handleLogout = () => {
    logout()
    setRooms([])
    router.push('/')
  }

  const navigateToRoom = async (roomId: string) => {
    // Find the room data
    const room = rooms.find(r => r.id === roomId)
    if (!room) {
      console.error(`Room ${roomId} not found in user rooms`)
      return
    }
    
    console.log(`Navigating to room:`, room)
    
    try {
      // For authenticated users navigating to their own rooms, we can assume they have access
      // But we still need to check if it's password protected and handle accordingly
      
      if (room.isPasswordProtected) {
        // For password-protected rooms, redirect to join page with room key
        console.log(`Room ${room.name} is password protected, redirecting to join page`)
        router.push(`/join?roomKey=${room.roomKey}`)
        closeSidebar()
        return
      }
      
      // For non-password protected rooms or rooms the user created, 
      // we can join directly via API to ensure proper permissions
      console.log(`Joining room ${room.name} directly...`)
      const joinResult = await authService.joinRoom(room.roomKey)
      
      if (joinResult) {
        // Store the room metadata
        localStorage.setItem('currentRoom', JSON.stringify(joinResult))
        
        // Navigate to the room
        router.push(`/room/${roomId}/select`)
        closeSidebar()
      } else {
        console.error(`Failed to join room ${room.name}`)
        // Fallback to join page
        router.push(`/join?roomKey=${room.roomKey}`)
        closeSidebar()
      }
    } catch (error) {
      console.error(`Error joining room ${room.name}:`, error)
      // Fallback to join page
      router.push(`/join?roomKey=${room.roomKey}`)
      closeSidebar()
    }
  }

  const deleteRoom = async (roomId: string, roomName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Set the room to delete and show confirmation dialog
    setRoomToDelete({ id: roomId, name: roomName })
    setShowDeleteRoomDialog(true)
  }

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return
    
    try {
      await authService.deleteRoom(roomToDelete.id)
      
      // The deleteRoom method handles both deletion and unjoining internally
      // Show a generic success message since we don't need to distinguish
      toast.success(`Room "${roomToDelete.name}" removed successfully`)
      
      // Refresh the rooms list to reflect the change
      fetchUserRooms()
    } catch (error) {
      console.error('Error removing room:', error)
      toast.error('Failed to remove room')
    } finally {
      setShowDeleteRoomDialog(false)
      setRoomToDelete(null)
    }
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
    onOpenChange?.(false)
  }

  const openLoginDialog = () => {
    setShowLoginDialog(true)
    setLoginFormError(null)
    clearError()
  }

  const openSignupDialog = () => {
    setShowSignupDialog(true)
    setSignupFormError(null)
    clearError()
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

  // Show loading state within the sidebar instead of replacing it
  const renderSidebarContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )
    }

    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">CollabEdge</h2>
          <Button variant="ghost" size="icon" onClick={closeSidebar}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="px-2 py-1">
              <span className="text-xs font-medium text-muted-foreground">Navigation</span>
            </div>
            <div className="mt-1 space-y-1">
              <button
                className={`flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left ${
                  pathname === "/" ? "bg-accent" : ""
                }`}
                onClick={() => {
                  router.push("/")
                  closeSidebar()
                }}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </button>
              <button
                className={`flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left ${
                  pathname === "/create" ? "bg-accent" : ""
                }`}
                onClick={() => {
                  router.push("/create")
                  closeSidebar()
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Create Room</span>
              </button>
              <button
                className={`flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left ${
                  pathname === "/join" ? "bg-accent" : ""
                }`}
                onClick={() => {
                  router.push("/join")
                  closeSidebar()
                }}
              >
                <Users className="h-4 w-4" />
                <span>Join Room</span>
              </button>
            </div>
          </div>

          {/* User Rooms Section */}
          {isAuthenticated && user && (
            <div className="p-2 border-t">
              <div className="px-2 py-1 mb-2">
                <span className="text-xs font-medium text-muted-foreground">My Rooms</span>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchUserRooms}
                    disabled={isLoadingRooms}
                    className="h-6 px-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {isLoadingRooms ? 'Loading...' : `${rooms.length} rooms`}
                  </span>
                </div>
              </div>
              
              {roomsError && (
                <div className="px-2 py-1 mb-2">
                  <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                    {roomsError}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {isLoadingRooms ? (
                  <div className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading rooms...</span>
                    </div>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="px-2 py-2">
                    <div className="text-sm text-muted-foreground">No rooms yet</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        router.push("/create")
                        closeSidebar()
                      }}
                      className="mt-2 w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create Room
                    </Button>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      className="group relative px-2 py-1"
                    >
                      <button
                        className="flex items-center justify-between w-full p-2 rounded-md hover:bg-accent text-left"
                        onClick={() => navigateToRoom(room.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-medium truncate">{room.name}</span>
                            {room.isPasswordProtected && (
                              <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {roomUsers.get(room.id)?.userCount || 0} users
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {room.documentCount || 0} docs
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => deleteRoom(room.id, room.name, e)}
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Authentication Section */}
          {!isAuthenticated && (
            <div className="p-2 border-t">
              <div className="px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground">Account</span>
              </div>
              <div className="mt-1 space-y-1">
                <button
                  onClick={openLoginDialog}
                  className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Log In</span>
                </button>
                <button
                  onClick={openSignupDialog}
                  className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </button>
              </div>
            </div>
          )}

          {/* User Profile Section */}
          {isAuthenticated && user && (
            <div className="p-2 border-t">
              <div className="px-2 py-2 mb-2">
                <div className="text-sm font-medium">{user.username}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <button
                onClick={() => {
                  router.push('/account')
                  closeSidebar()
                }}
                className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
              >
                <Settings className="h-4 w-4" />
                <span>Account</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
              >
                <User className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/50 lg:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-[9999] w-64 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ fontSize: '90%' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">CollabEdge</h2>
            <Button variant="ghost" size="icon" onClick={closeSidebar}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <div className="px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground">Navigation</span>
              </div>
              <div className="mt-1 space-y-1">
                <button
                  className={`flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left ${
                    pathname === "/" ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    router.push("/")
                    closeSidebar()
                  }}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </button>
                <button
                  className={`flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left ${
                    pathname === "/create" ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    router.push("/create")
                    closeSidebar()
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Room</span>
                </button>
                <button
                  className={`flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left ${
                    pathname === "/join" ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    router.push("/join")
                    closeSidebar()
                  }}
                >
                  <Users className="h-4 w-4" />
                  <span>Join Room</span>
                </button>
              </div>
            </div>

            {/* User Rooms Section */}
            {isAuthenticated && (
              <div className="p-2 border-t">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-medium text-muted-foreground">Your Rooms</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={fetchUserRooms}
                    disabled={isLoadingRooms}
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                
                {/* Room limits info - hidden but still enforced */}
                <div className="px-2 py-1 mb-2">
                  <div className="text-xs text-muted-foreground">
                    {user?.subscriptionPlan === 'free' ? (
                      <span className="flex items-center gap-1">
                        {rooms.length >= 4 && (
                          <span className="text-orange-500">• Room limit reached</span>
                        )}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span>Pro Plan</span>
                        <Crown className="h-3 w-3 text-yellow-500" />
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-1 space-y-1">
                  {isLoadingRooms ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : roomsError ? (
                    <div className="p-2 text-xs text-red-500">
                      {roomsError}
                    </div>
                  ) : rooms.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground">
                      No rooms yet. Create one to get started!
                    </div>
                  ) : (
                    rooms.map((room) => (
                      <div
                        key={room.id}
                        className="group relative"
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left text-sm"
                                onClick={() => navigateToRoom(room.id)}
                              >
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="truncate">{room.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {room.roomKey} • {room.documentCount} docs
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* User count */}
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    <span>{roomUsers.get(room.id)?.userCount || 0}</span>
                                  </div>
                                  {room.isPasswordProtected && (
                                    <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                                    onClick={(e) => deleteRoom(room.id, room.name, e)}
                                    title="Delete room"
                                  >
                                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                  </button>
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="start" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">Connected Users:</p>
                                {roomUsers.get(room.id)?.users && roomUsers.get(room.id)!.users.length > 0 ? (
                                  <ul className="list-disc pl-4">
                                    {roomUsers.get(room.id)!.users.map((username, index) => (
                                      <li key={index} className="flex items-center gap-2">
                                        <Circle className="h-2 w-2 text-green-500 fill-current" />
                                        <span>{username}</span>
                                        <span className="text-xs text-green-500">online</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No users currently online</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Authentication Section */}
            {!isAuthenticated && (
              <div className="p-2 border-t">
                <div className="px-2 py-1">
                  <span className="text-xs font-medium text-muted-foreground">Account</span>
                </div>
                <div className="mt-1 space-y-1">
                  <button
                    className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                    onClick={openLoginDialog}
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Log In</span>
                  </button>
                  <button
                    className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
                    onClick={openSignupDialog}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User info and logout */}
          {isAuthenticated && user && (
            <div className="p-2 border-t">
              <div className="px-2 py-2 mb-2">
                <div className="text-sm font-medium">{user.username}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <button
                onClick={() => {
                  router.push('/account')
                  closeSidebar()
                }}
                className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
              >
                <Settings className="h-4 w-4" />
                <span>Account</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent text-left"
              >
                <User className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toggle button - show when sidebar is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-51"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

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
              <DialogFooter>
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
          
          <form onSubmit={handleSignup} className="space-y-4 pt-4">
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
        </DialogContent>
      </Dialog>

      {/* Room Deletion Confirmation Dialog */}
      <AlertDialog open={showDeleteRoomDialog} onOpenChange={setShowDeleteRoomDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{roomToDelete?.name}" from your room list? If you created this room, it will be deleted permanently. If you joined this room, you will leave it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRoom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
