"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { getRoomDocuments, getRoomState, getRoomPassword, getAllRoomKeys } from "@/lib/dev-storage"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import {
  BarChart3,
  Settings,
  Puzzle,
  Bot,
  TrendingUp,
  CreditCard,
  FileText,
  Mail,
  Shield,
  Check,
  Edit,
  Monitor,
  Smartphone,
  Globe,
  Plus,
  Users,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react"

const sidebarItems = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "usage", label: "Usage & Analytics", icon: TrendingUp },
  { id: "billing", label: "Billing & Invoices", icon: CreditCard },
  { id: "rooms", label: "My Rooms", icon: FileText },
  { id: "ai", label: "AI Features", icon: Bot },
  { id: "contact", label: "Contact Us", icon: Mail },
]

function AccountPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState("overview")
  const [dataSharing, setDataSharing] = useState(true)
  const [openAI, setOpenAI] = useState(true)
  const [anthropic, setAnthropic] = useState(true)
  const [usageBasedPricing, setUsageBasedPricing] = useState(false)
  
  // Stats state
  const [stats, setStats] = useState({
    activeRooms: 0,
    totalDocuments: 0,
    aiChats: 0
  })

  // User rooms state
  const [userRooms, setUserRooms] = useState<any[]>([])
  const [roomPasswords, setRoomPasswords] = useState<{[roomKey: string]: string}>({})
  const [showPasswords, setShowPasswords] = useState<{[roomKey: string]: boolean}>({})

  // Delete account state
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // Browser detection
  const [currentBrowser, setCurrentBrowser] = useState("")

  // Chat usage state
  const [chatUsage, setChatUsage] = useState<{
    totalChats: number
    remainingChats: number
    subscriptionPlan: string
  } | null>(null)
  
  // Local chat counter from localStorage
  const [localChatCount, setLocalChatCount] = useState(0)

  // Billing and invoice state
  const [billingData, setBillingData] = useState<{
    plan: string
    status: string
    monthlyCost: number
    nextBillingDate: string | null
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    features: {
      roomLimit: string
      aiFeatures: string
      storage: string
    }
  } | null>(null)
  
  const [invoices, setInvoices] = useState<Array<{
    id: string
    amount: number
    currency: string
    status: string
    date: string
    description: string
  }>>([])
  
  const [isLoadingBilling, setIsLoadingBilling] = useState(false)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)

  // Edit profile modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [editProfileData, setEditProfileData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  
  // Password change state
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
    verificationCode: ''
  })
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [verificationStep, setVerificationStep] = useState<'initial' | 'code-sent'>('initial')

  // Handle URL parameters to set active section
  useEffect(() => {
    const section = searchParams.get('section')
    if (section && sidebarItems.some(item => item.id === section)) {
      setActiveSection(section)
    }
  }, [searchParams])

  // Load chat count from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ai_chat_count')
      setLocalChatCount(stored ? parseInt(stored, 10) : 0)
    }
  }, [])

  // Load room passwords from storage
  useEffect(() => {
    const loadRoomPasswords = () => {
      try {
        const passwords: {[key: string]: string} = {}
        
        // Get all room keys that have passwords
        const roomKeys = getAllRoomKeys()
        
        // For each room, get its password
        roomKeys.forEach(roomKey => {
          const password = getRoomPassword(roomKey)
          if (password) {
            // Store by room key for now, we'll map to room ID later
            passwords[roomKey] = password
          }
        })
        
        setRoomPasswords(passwords)
        console.log('Loaded room passwords:', passwords)
      } catch (error) {
        console.error('Error loading room passwords:', error)
      }
    }
    
    loadRoomPasswords()
  }, [])

  // Calculate user statistics
  useEffect(() => {
    const calculateStats = async () => {
      let activeRooms = 0
      let totalDocuments = 0
      let allUserRooms: any[] = []
      
      try {
        if (user) {
          // Fetch user's created rooms from API
          const apiRooms = await authService.getUserRooms()
          console.log('User rooms from API:', apiRooms)
          
          // Also get all rooms from localStorage (rooms user is in)
          const allKeys = Object.keys(localStorage)
          const uniqueRoomIds = new Set<string>()
          const localStorageRooms: any[] = []
          
          allKeys.forEach(key => {
            if (key.startsWith('room_') && key.endsWith('_documents') && !key.includes('backup_') && !key.includes('direct_')) {
              const roomId = key.replace('room_', '').replace('_documents', '')
              uniqueRoomIds.add(roomId)
              
              // Try to get room metadata from localStorage
              try {
                const roomState = getRoomState(roomId)
                if (roomState) {
                  localStorageRooms.push({
                    id: roomId,
                    name: roomState.name || `Room ${roomId}`,
                    roomKey: roomState.roomKey || roomId,
                    documentCount: roomState.documentCount || 0,
                    isPasswordProtected: roomState.isPasswordProtected || false
                  })
                }
              } catch (error) {
                console.error('Error getting room state for:', roomId, error)
              }
            }
          })
          
          // Combine API rooms and localStorage rooms, prioritizing API rooms
          const apiRoomIds = new Set(apiRooms.map(room => room.id))
          allUserRooms = [...apiRooms]
          
          // Add localStorage rooms that aren't in API rooms
          localStorageRooms.forEach(room => {
            if (!apiRoomIds.has(room.id)) {
              allUserRooms.push(room)
            }
          })
          
          activeRooms = allUserRooms.length
          
          // Store all rooms for display
          setUserRooms(allUserRooms)
          
          // Debug: Log room data to see what we're getting
          console.log('=== USER ROOMS DEBUG ===')
          console.log('Total rooms:', allUserRooms.length)
          allUserRooms.forEach(room => {
            console.log(`Room ${room.roomKey} (${room.name}):`, {
              isPasswordProtected: room.isPasswordProtected,
              password: room.password
            })
          })
          console.log('=========================')
          
          // Count documents for all rooms
          allUserRooms.forEach(room => {
            totalDocuments += room.documentCount || 0
            console.log(`Room ${room.name}: ${room.documentCount || 0} documents`)
          })
        }
      } catch (error) {
        console.error('Error fetching user rooms:', error)
        // Fallback to localStorage counting if API fails
        const allKeys = Object.keys(localStorage)
        const uniqueRoomIds = new Set<string>()
        const localStorageRooms: any[] = []
        
        allKeys.forEach(key => {
          if (key.startsWith('room_') && key.endsWith('_documents') && !key.includes('backup_') && !key.includes('direct_')) {
            const roomId = key.replace('room_', '').replace('_documents', '')
            uniqueRoomIds.add(roomId)
            
            // Try to get room metadata from localStorage
            try {
              const roomState = getRoomState(roomId)
              if (roomState) {
                localStorageRooms.push({
                  id: roomId,
                  name: roomState.name || `Room ${roomId}`,
                  roomKey: roomState.roomKey || roomId,
                  documentCount: roomState.documentCount || 0,
                  isPasswordProtected: roomState.isPasswordProtected || false
                })
              }
            } catch (error) {
              console.error('Error getting room state for:', roomId, error)
            }
          }
        })
        
        allUserRooms = localStorageRooms
        activeRooms = allUserRooms.length
        
        // Store rooms for display
        setUserRooms(allUserRooms)
        
        uniqueRoomIds.forEach(roomId => {
          try {
            const documents = getRoomDocuments(roomId)
            if (documents && Array.isArray(documents) && documents.length > 0) {
              totalDocuments += documents.length
            }
          } catch (error) {
            console.error('Error getting documents for room:', roomId, error)
            }
          })
        }
        
        console.log('Final count - Active rooms:', activeRooms, 'Total documents:', totalDocuments)
        
        // Fetch chat usage for Pro+AI users
        let aiChats = 0
        if (user?.subscriptionPlan === 'pro_ai') {
          try {
            const token = localStorage.getItem('auth_token')
            if (token) {
              const chatUsageResponse = await fetch('/api/user/chat-usage', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              })
              
              if (chatUsageResponse.ok) {
                const chatData = await chatUsageResponse.json()
                aiChats = chatData.totalChats || 0
                setChatUsage(chatData)
                console.log('Chat usage data:', chatData)
              } else {
                console.warn('Failed to fetch chat usage, using 0 as fallback')
                aiChats = 0 // Use 0 instead of random number
              }
            }
          } catch (error) {
            console.error('Error fetching chat usage:', error)
            aiChats = 0 // Use 0 instead of random number
          }
        } else {
          aiChats = 0 // Show "-" for other plans
        }
        
        setStats({
          activeRooms,
          totalDocuments,
          aiChats
        })
      }
      
      calculateStats()
    }, [user])

  // Fetch billing and invoice data
  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.id) return
      
      setIsLoadingBilling(true)
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          console.warn('No auth token found for billing data fetch')
          return
        }

        // Fetch billing data
        const billingResponse = await fetch(`/api/user/billing?userId=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (billingResponse.ok) {
          const billingData = await billingResponse.json()
          setBillingData(billingData)
          console.log('Billing data:', billingData)
        } else {
          console.warn('Failed to fetch billing data')
        }

        // Fetch invoices
        const invoicesResponse = await fetch(`/api/user/invoices?userId=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json()
          setInvoices(invoicesData)
          console.log('Invoices data:', invoicesData)
        } else {
          console.warn('Failed to fetch invoices')
        }

      } catch (error) {
        console.error('Error fetching billing data:', error)
      } finally {
        setIsLoadingBilling(false)
      }
    }

    fetchBillingData()
  }, [user?.id])

  // Detect current browser
  useEffect(() => {
    const detectBrowser = () => {
      const userAgent = navigator.userAgent
      let browser = "Unknown"
      
      if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
        browser = "Chrome"
      } else if (userAgent.includes("Firefox")) {
        browser = "Firefox"
      } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
        browser = "Safari"
      } else if (userAgent.includes("Edg")) {
        browser = "Edge"
      } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
        browser = "Opera"
      }
      
      setCurrentBrowser(browser)
    }
    
    detectBrowser()
  }, [])

  // Handle profile update
  const handleProfileUpdate = async () => {
    if (!editProfileData.username.trim()) {
      toast.error('Username is required')
      return
    }

    setIsUpdatingProfile(true)
    try {
      const token = localStorage.getItem('auth_token')
      console.log('Token found:', !!token) // Debug log
      if (!token) {
        toast.error('Authentication required')
        return
      }

      console.log('Sending request to update profile:', {
        username: editProfileData.username,
        hasToken: !!token
      })
      
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: editProfileData.username
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        toast.success('Profile updated successfully!')
        setIsEditProfileOpen(false)
        // Refresh user data if needed
        window.location.reload()
      } else {
        const errorData = await response.json()
        if (response.status === 409) {
          toast.error('Username already exists. Please choose a different username.')
        } else {
          toast.error(errorData.message || 'Failed to update profile')
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Load profile data when modal opens
  const handleEditProfileOpen = () => {
    if (user) {
      setEditProfileData({
        username: user.username || '',
        email: user.email || '',
        password: ''
      })
    }
    setIsEditProfileOpen(true)
  }

  // Send verification code for password change
  const handleSendVerificationCode = async () => {
    setIsSendingCode(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch('/api/user/send-password-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        toast.success('Verification code sent to your email!')
        setVerificationStep('code-sent')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || errorData.message || 'Failed to send verification code')
      }
    } catch (error) {
      console.error('Error sending verification code:', error)
      toast.error('Failed to send verification code. Please try again.')
    } finally {
      setIsSendingCode(false)
    }
  }

  // Verify code and change password
  const handleVerifyAndChangePassword = async () => {
    if (!passwordData.verificationCode.trim()) {
      toast.error('Please enter the verification code')
      return
    }

    if (!passwordData.newPassword.trim()) {
      toast.error('Please enter a new password')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsChangingPassword(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: passwordData.newPassword,
          verificationCode: passwordData.verificationCode
        }),
      })

      if (response.ok) {
        toast.success('Password changed successfully!')
        setIsPasswordChangeOpen(false)
        setVerificationStep('initial')
        setPasswordData({
          newPassword: '',
          confirmPassword: '',
          verificationCode: ''
        })
      } else {
        const errorData = await response.json()
        // Display the specific error message from the backend
        toast.error(errorData.error || errorData.message || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const togglePasswordVisibility = (roomKey: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [roomKey]: !prev[roomKey]
    }))
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm account deletion')
      return
    }

    setIsDeletingAccount(true)
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('Account deleted successfully')
        // Use AuthContext logout to properly clear auth state
        logout()
        // Redirect to home
        router.push('/')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    } finally {
      setIsDeletingAccount(false)
      setIsDeleteAccountOpen(false)
      setDeleteConfirmation("")
    }
  }

  // Helper functions for plan-specific information
  const getPlanDisplayName = (plan?: string) => {
    switch (plan) {
      case 'pro_ai':
        return 'Pro + AI'
      case 'pro':
        return 'Pro'
      default:
        return 'Free'
    }
  }

  const getPlanInfo = () => {
    const plan = user?.subscriptionPlan || 'free'
    
    // Use billing data if available, otherwise fallback to defaults
    const nextBilling = billingData?.nextBillingDate 
      ? new Date(billingData.nextBillingDate).toLocaleDateString()
      : null
    
    switch (plan) {
      case 'pro_ai':
        return {
          name: 'Pro + AI',
          badgeClass: 'bg-gradient-to-r from-purple-500 to-pink-600',
          roomLimit: 'Unlimited',
          aiFeatures: 'Enabled',
          storage: '10 GB',
          nextBilling: nextBilling
        }
      case 'pro':
        return {
          name: 'Pro',
          badgeClass: 'bg-gradient-to-r from-blue-500 to-purple-600',
          roomLimit: 'Unlimited',
          aiFeatures: 'Disabled',
          storage: '5 GB',
          nextBilling: nextBilling
        }
      default:
        return {
          name: 'Free',
          badgeClass: 'bg-gray-500',
          roomLimit: '4 rooms',
          aiFeatures: 'Disabled',
          storage: '1 GB',
          nextBilling: null
        }
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Account Overview</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Plan Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Plan Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <Badge className={
                      user?.subscriptionPlan === 'pro_ai' 
                        ? "bg-gradient-to-r from-purple-500 to-pink-600" 
                        : user?.subscriptionPlan === 'pro'
                        ? "bg-gradient-to-r from-blue-500 to-purple-600"
                        : "bg-gray-500"
                    }>
                      {user?.subscriptionPlan === 'pro_ai' ? 'Pro + AI' : 
                       user?.subscriptionPlan === 'pro' ? 'Pro' : 'Free'}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-4">
                      {user?.subscriptionPlan === 'free' 
                        ? 'No billing required' 
                        : billingData?.nextBillingDate 
                          ? `Next billing date: ${new Date(billingData.nextBillingDate).toLocaleDateString()}`
                          : 'Next billing date: TBD'
                      }
                    </p>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Room Limit</span>
                        <span className="font-medium">
                          {user?.subscriptionPlan === 'free' ? '4 rooms' : 'Unlimited'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">AI Features</span>
                        <Badge variant="secondary">
                          {user?.subscriptionPlan === 'pro_ai' ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Storage</span>
                        <span className="font-medium">
                          {user?.subscriptionPlan === 'free' ? '1 GB' : '10 GB'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Rooms</span>
                      <span className="text-2xl font-bold">{stats.activeRooms}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Documents</span>
                      <span className="text-2xl font-bold">{stats.totalDocuments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Collaborators</span>
                      <span className="text-2xl font-bold">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AI Chats</span>
                      <span className="text-2xl font-bold">
                        {user?.subscriptionPlan === 'pro_ai' ? localChatCount : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Chat Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Chat Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Chats Used This Month</span>
                      <span className="font-bold">
                        {user?.subscriptionPlan === 'pro_ai' 
                          ? `${localChatCount} / 500`
                          : '-'
                        }
                      </span>
                    </div>
                    {user?.subscriptionPlan === 'pro_ai' && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((localChatCount / 500) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((localChatCount / 500) * 100)}% of monthly limit used
                        </p>
                      </>
                    )}
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Code Suggestions</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Document Analysis</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Real-time Assistance</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* This Month Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Rooms Created</span>
                      <span className="font-bold">{stats.activeRooms}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Documents</span>
                      <span className="font-bold">{stats.totalDocuments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Collaborated Hours</span>
                      <span className="font-bold">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>AI Interactions</span>
                      <span className="font-bold">
                        {user?.subscriptionPlan === 'pro_ai' ? localChatCount : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Storage Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Documents</span>
                      <span className="font-bold">0.1 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '3%' }}></div>
                    </div>
                    <p className="text-sm text-muted-foreground">1% of 4 GB used</p>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span>Images</span>
                      <span className="font-bold">0 GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Other Files</span>
                      <span className="font-bold">0.1 GB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Collaboration Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Team Members</span>
                      <span className="font-bold">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Sessions</span>
                      <span className="font-bold">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Real-time Edits</span>
                      <span className="font-bold">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Comments</span>
                      <span className="font-bold">-</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Rooms */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Rooms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userRooms.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No rooms created yet</p>
                    ) : (
                      userRooms.map((room, index) => (
                        <div key={room.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{room.name}</p>
                            <p className="text-sm text-muted-foreground">Room Key: {room.roomKey}</p>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>


            </div>
          </div>
        )
      case "settings":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Privacy Settings</h2>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Share Data</CardTitle>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Data Sharing: Enabled</span>
                    </div>
                    <Switch checked={dataSharing} onCheckedChange={setDataSharing} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>OpenAI: Zero Data Retention</span>
                    </div>
                    <Switch checked={openAI} onCheckedChange={setOpenAI} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Anthropic: Zero Data Retention</span>
                    </div>
                    <Switch checked={anthropic} onCheckedChange={setAnthropic} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Data sharing is <strong>enabled</strong> for improving our services.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Usage-Based Pricing</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span>Enable usage-based pricing</span>
                      <p className="text-sm text-muted-foreground">(only for pro+ai users)</p>
                    </div>
                    {user?.subscriptionPlan === 'pro_ai' ? (
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={usageBasedPricing} 
                          onCheckedChange={() => {
                            if (usageBasedPricing) {
                              setUsageBasedPricing(false)
                            } else {
                              toast.info('Coming soon!', {
                                duration: 3000,
                                position: 'bottom-right'
                              })
                            }
                          }} 
                        />
                        {usageBasedPricing && (
                          <span className="text-xs text-blue-600">Coming soon</span>
                        )}
                      </div>
                    ) : (
                      <Switch checked={false} disabled />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Active Sessions</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Desktop - {currentBrowser}</p>
                          <p className="text-sm text-muted-foreground">Current session</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Advanced Account Settings</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start bg-transparent"
                          onClick={handleEditProfileOpen}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile Information
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Profile Information</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right">
                              Username
                            </Label>
                            <Input
                              id="username"
                              value={editProfileData.username}
                              onChange={(e) => setEditProfileData(prev => ({ ...prev, username: e.target.value }))}
                              className="col-span-3"
                              placeholder="Enter username"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                              Email
                            </Label>
                            <Input
                              id="email"
                              value={editProfileData.email}
                              className="col-span-3"
                              disabled
                              placeholder="Email cannot be changed"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                              Password
                            </Label>
                            <div className="col-span-3">
                              {user?.authMethod === 'google' ? (
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    disabled
                                    className="w-full justify-start opacity-50"
                                  >
                                    Change Password
                                  </Button>
                                  <span className="text-xs text-muted-foreground">
                                    (Google OAuth user)
                                  </span>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={() => setIsPasswordChangeOpen(true)}
                                  className="w-full justify-start"
                                >
                                  Change Password
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditProfileOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleProfileUpdate}
                            disabled={isUpdatingProfile}
                          >
                            {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Password Change Modal */}
                    <Dialog open={isPasswordChangeOpen} onOpenChange={setIsPasswordChangeOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {verificationStep === 'initial' && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                We'll send a verification code to your email address to confirm the password change.
                              </p>
                              <Button
                                onClick={handleSendVerificationCode}
                                disabled={isSendingCode}
                                className="w-full"
                              >
                                {isSendingCode ? 'Sending...' : 'Send Verification Code'}
                              </Button>
                            </div>
                          )}

                          {verificationStep === 'code-sent' && (
                            <div className="space-y-4">
                              {/* Verification Code */}
                              <div>
                                <Label htmlFor="verificationCode" className="text-sm">Verification Code</Label>
                                <Input
                                  id="verificationCode"
                                  type="text"
                                  value={passwordData.verificationCode}
                                  onChange={(e) => setPasswordData(prev => ({ ...prev, verificationCode: e.target.value }))}
                                  placeholder="Enter 6-digit code from email"
                                  maxLength={6}
                                />
                              </div>

                              {/* New Password */}
                              <div>
                                <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                                <Input
                                  id="newPassword"
                                  type="password"
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                  placeholder="Enter new password (min 8 characters)"
                                />
                              </div>

                              {/* Confirm Password */}
                              <div>
                                <Label htmlFor="confirmPassword" className="text-sm">Confirm New Password</Label>
                                <Input
                                  id="confirmPassword"
                                  type="password"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  placeholder="Confirm new password"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsPasswordChangeOpen(false)
                              setVerificationStep('initial')
                              setPasswordData({
                                newPassword: '',
                                confirmPassword: '',
                                verificationCode: ''
                              })
                            }}
                          >
                            Cancel
                          </Button>
                          {verificationStep === 'code-sent' && (
                            <Button 
                              onClick={handleVerifyAndChangePassword}
                              disabled={isChangingPassword || !passwordData.verificationCode.trim() || !passwordData.newPassword.trim() || !passwordData.confirmPassword.trim()}
                            >
                              {isChangingPassword ? 'Changing...' : 'Change Password'}
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-transparent"
                      onClick={() => {
                        toast.info('Coming soon!', {
                          duration: 3000,
                          position: 'bottom-right'
                        })
                      }}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Two-Factor Authentication
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-transparent"
                      onClick={() => {
                        toast.info('Coming soon!', {
                          duration: 3000,
                          position: 'bottom-right'
                        })
                      }}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Language & Region
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Delete Account Section */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-red-500">Danger Zone</h2>
              <Card className="border-red-800 bg-black">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-red-400">Delete Account</h3>
                        <p className="text-sm text-red-300 mt-1">
                          This action cannot be undone. All your data, rooms, and documents will be permanently deleted.
                        </p>
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={() => setIsDeleteAccountOpen(true)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Delete Account Confirmation Dialog */}
            <Dialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-red-600">Delete Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-black border border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-400 mb-3">
                      <strong>Warning:</strong> This action is irreversible. All your data will be permanently deleted including:
                    </p>
                    <ul className="text-sm text-red-300 space-y-1 ml-4">
                      <li>• All your rooms and documents</li>
                      <li>• Your subscription and billing information</li>
                      <li>• Your account settings and preferences</li>
                      <li>• All collaboration data</li>
                    </ul>
                  </div>
                  <div>
                    <Label htmlFor="deleteConfirmation" className="text-sm font-medium">
                      Type "DELETE" to confirm
                    </Label>
                    <Input
                      id="deleteConfirmation"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsDeleteAccountOpen(false)
                      setDeleteConfirmation("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== "DELETE" || isDeletingAccount}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )
      case "billing":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Billing & Invoices</h2>
            
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingBilling ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : billingData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Plan</span>
                      <Badge className={
                        billingData.plan === 'pro_ai' 
                          ? "bg-gradient-to-r from-purple-500 to-pink-600" 
                          : billingData.plan === 'pro'
                          ? "bg-gradient-to-r from-blue-500 to-purple-600"
                          : "bg-gray-500"
                      }>
                        {getPlanDisplayName(billingData.plan)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Monthly Cost</span>
                      <span className="font-medium">
                        {billingData.monthlyCost > 0 ? `$${billingData.monthlyCost.toFixed(2)}` : 'Free'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <Badge variant={billingData.status === 'active' ? 'default' : 'secondary'}>
                        {billingData.status || 'Inactive'}
                      </Badge>
                    </div>
                    {billingData.nextBillingDate && (
                      <div className="flex items-center justify-between">
                        <span>Next Billing Date</span>
                        <span>{new Date(billingData.nextBillingDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <Separator />
                    {billingData?.plan !== 'free' && billingData?.stripeCustomerId && (
                      <Button 
                        className="w-full"
                        onClick={async () => {
                          if (!billingData?.stripeCustomerId) {
                            toast.error('No subscription found to manage')
                            return
                          }
                          
                          setIsOpeningPortal(true)
                          try {
                            const token = localStorage.getItem('auth_token')
                            if (!token) {
                              toast.error('Authentication required')
                              return
                            }

                            const response = await fetch('/api/stripe/create-portal-session', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                customerId: billingData.stripeCustomerId,
                                returnUrl: `${window.location.origin}/account?section=billing`
                              }),
                            })

                            if (response.ok) {
                              const { url } = await response.json()
                              window.location.href = url
                            } else {
                              const errorData = await response.json()
                              toast.error(errorData.error || 'Failed to open subscription management')
                            }
                          } catch (error) {
                            console.error('Error opening subscription management:', error)
                            toast.error('Failed to open subscription management')
                          } finally {
                            setIsOpeningPortal(false)
                          }
                        }}
                        disabled={!billingData?.stripeCustomerId || isOpeningPortal}
                      >
                        {isOpeningPortal ? 'Opening...' : 'Manage Subscription'}
                      </Button>
                    )}
                    {billingData?.plan === 'free' && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Upgrade to Pro or Pro + AI to manage your subscription
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => router.push('/pricing')}
                        >
                          View Plans
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Failed to load billing data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan Features */}
            {billingData?.features && (
              <Card>
                <CardHeader>
                  <CardTitle>Plan Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Room Limit</span>
                      <span className="font-medium">{billingData.features.roomLimit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>AI Features</span>
                      <Badge variant="secondary">
                        {billingData.features.aiFeatures}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Storage</span>
                      <span className="font-medium">{billingData.features.storage}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Coming Soon
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "rooms":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Rooms</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Rooms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userRooms.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No rooms created yet</p>
                    ) : (
                      userRooms.map((room, index) => (
                        <div key={room.id} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{room.name}</p>
                              <p className="text-sm text-muted-foreground">Room Key: {room.roomKey}</p>
                              {/* Password field - commented out for now
                              {(room.isPasswordProtected || room.passwordProtected || room.password) && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Password:</span>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-sm font-mono ${showPasswords[room.roomKey] ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {showPasswords[room.roomKey] ? 
                                          (roomPasswords[room.roomKey] || room.password || 'Password not available') : 
                                          '••••••••'
                                        }
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => togglePasswordVisibility(room.roomKey)}
                                        className="h-6 w-6 p-0"
                                      >
                                        {showPasswords[room.roomKey] ? (
                                          <EyeOff className="h-3 w-3" />
                                        ) : (
                                          <Eye className="h-3 w-3" />
                                        )}
                                      </Button>
                                      {(roomPasswords[room.roomKey] || room.password) && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const password = roomPasswords[room.roomKey] || room.password
                                            if (password) {
                                              navigator.clipboard.writeText(password)
                                              toast.success('Password copied to clipboard!')
                                            }
                                          }}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              */}
                            </div>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Room Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Total Rooms</span>
                      <span className="font-bold">{stats.activeRooms}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Collaborators</span>
                      <span className="font-bold">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Documents Created</span>
                      <span className="font-bold">{stats.totalDocuments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Room
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Join Room
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      case "ai":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">AI Features</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>AI Chat Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Chats Used This Month</span>
                      <span className="font-bold">
                        {user?.subscriptionPlan === 'pro_ai' 
                          ? `${localChatCount} / 500`
                          : '-'
                        }
                      </span>
                    </div>
                    {user?.subscriptionPlan === 'pro_ai' && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((localChatCount / 500) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((localChatCount / 500) * 100)}% of monthly limit used
                        </p>
                      </>
                    )}
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Code Suggestions</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Document Analysis</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Real-time Assistance</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>AI Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Auto-suggestions</span>
                      <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Code completion</span>
                      <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Document summaries</span>
                      <Switch checked={false} />
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure AI Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      case "usage":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Usage & Analytics</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Rooms Created</span>
                      <span className="font-bold">{stats.activeRooms}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Documents</span>
                      <span className="font-bold">{stats.totalDocuments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Collaborated Hours</span>
                      <span className="font-bold">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>AI Interactions</span>
                      <span className="font-bold">
                        {user?.subscriptionPlan === 'pro_ai' ? localChatCount : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Storage Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Documents</span>
                      <span className="font-bold">0.1 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '3%' }}></div>
                    </div>
                    <p className="text-sm text-muted-foreground">1% of 4 GB used</p>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span>Images</span>
                      <span className="font-bold">0 GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Other Files</span>
                      <span className="font-bold">0.1 GB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Collaboration Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Team Members</span>
                      <span className="font-bold">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Sessions</span>
                      <span className="font-bold">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Real-time Edits</span>
                      <span className="font-bold">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Comments</span>
                      <span className="font-bold">-</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      case "contact":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Contact Us</h2>
            <Card>
              <CardHeader>
                <CardTitle>Get Help</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-muted-foreground">no-reply@lalithkothuru.com</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Documentation</p>
                      <p className="text-sm text-muted-foreground">Coming Soon</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Community</p>
                      <p className="text-sm text-muted-foreground">Coming Soon</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold capitalize">{activeSection}</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">This section is under development. More features coming soon!</p>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-6">
          {/* User Profile Section */}
          <div className="flex items-center gap-3 mb-6">
            <Avatar className="h-12 w-12">
              <AvatarImage src="/placeholder.svg" alt={user?.username || 'User'} />
              <AvatarFallback>
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{user?.username || 'Loading...'}</h2>
                <Edit 
                  className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" 
                  onClick={handleEditProfileOpen}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {getPlanDisplayName(user?.subscriptionPlan)} • {user?.email || 'Loading...'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                  activeSection === item.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Go Back Button */}
          <div className="mt-auto pt-6 border-t">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors hover:bg-accent/50 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">{renderContent()}</div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AccountPageContent />
    </Suspense>
  )
} 