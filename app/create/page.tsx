"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AnimatedBackground } from "@/components/animated-background"
import { Lock, RefreshCw, Crown } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { storeRoomPassword } from '@/lib/dev-storage'
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/lib/auth-service"

export default function CreateRoomPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [roomName, setRoomName] = useState("")
  const [roomKey, setRoomKey] = useState(() => {
    // Generate a random room key
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  })
  const [username, setUsername] = useState("")
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

  // Set username from authenticated user or localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      setUsername(user.username)
    } else if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username')
      if (storedUsername) {
        setUsername(storedUsername)
      }
    }
  }, [isAuthenticated, user])

  const handleGenerateNewKey = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    setRoomKey(result)
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsCreating(true)
    
    if (!roomKey || !roomName) {
      setError("Room name and key are required")
      setIsCreating(false)
      return
    }
    
    if (!username) {
      setError("Username is required")
      setIsCreating(false)
      return
    }
    
    if (isPasswordProtected && !password) {
      setError("Password is required when password protection is enabled")
      setIsCreating(false)
      return
    }

    if (isPasswordProtected && password.length < 3) {
      setError("Room password must be at least 3 characters")
      setIsCreating(false)
      return
    }

    if (isPasswordProtected && password !== confirmPassword) {
      setError("Room passwords do not match")
      setIsCreating(false)
      return
    }

    try {
      // Store the password immediately in dev storage if password protection is enabled
      // This ensures the password is available even if the backend call fails
      if (isPasswordProtected && password) {
        console.log(`Storing password for new room ${roomKey}: "${password}"`)
        storeRoomPassword(roomKey, password)
      }

      let data;
      
      // Use authenticated API if user is logged in, otherwise use guest API
      if (isAuthenticated) {
        console.log('Creating room with authenticated user')
        data = await authService.createRoom({
          name: roomName,
          roomKey: roomKey,
          passwordProtected: isPasswordProtected,
          password: isPasswordProtected ? password : undefined,
        })
      } else {
        console.log('Creating room as guest user')
        // Fallback to guest room creation
        const response = await fetch('/api/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: roomName,
            roomKey: roomKey,
            username: username,
            passwordProtected: isPasswordProtected,
            password: isPasswordProtected ? password : undefined,
          }),
        })
        
        if (!response.ok) {
          throw new Error(`Failed to create room: ${response.status}`)
        }
        
        data = await response.json()
      }
      
      console.log('Room created successfully:', data)
      
      // Store room info and username in localStorage
      if (!isAuthenticated) {
        localStorage.setItem('username', username)
      }
      localStorage.setItem('currentRoom', JSON.stringify(data))
      
      // Store the password again after successful room creation
      // This ensures we have the password stored for this room key
      if (isPasswordProtected && password) {
        console.log(`Storing password for created room ${data.roomKey}: "${password}"`)
        storeRoomPassword(data.roomKey, password)
        
        // Verify the password was stored correctly (only for guest users)
        if (!isAuthenticated) {
          const testUrl = `/api/test/add-password/${data.roomKey}?password=${encodeURIComponent(password)}`
          const testResponse = await fetch(testUrl)
          if (testResponse.ok) {
            console.log(`Verified password storage for room ${data.roomKey}`)
          }
        }
      }
      
      // Navigate to document selection page
      router.push(`/room/${data.id}/select`)
    } catch (err: any) {
      console.error("Failed to create room:", err)
      
      // Check if it's a room limit error
      if (err.message && (err.message.includes('maximum 4 rooms') || err.message.includes('room limit') || err.message.includes('Free users can only create up to 4 rooms'))) {
        setError('Failed to create room. Upgrade to Pro to create more rooms since free plan limit reached.')
      } else {
        setError(err.message || 'Failed to create room')
      }
      
      setIsCreating(false)
    }
  }

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create a New Room</CardTitle>
            <CardDescription>Set up your collaborative workspace</CardDescription>
            {isAuthenticated && user && user.subscriptionPlan !== 'free' && (
              <div className="text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span>Pro plan: Unlimited rooms</span>
                  <Crown className="h-3 w-3 text-yellow-500" />
                </span>
              </div>
            )}
          </CardHeader>
          <form onSubmit={handleCreateRoom}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="Enter room name"
                  className="h-12 text-base"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Your Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  className="h-12 text-base"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roomKey">Room Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="roomKey"
                    placeholder="Room key"
                    className="h-12 text-base flex-1"
                    value={roomKey}
                    onChange={(e) => setRoomKey(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                  />
                  <Button variant="outline" size="icon" className="h-12 w-12" onClick={handleGenerateNewKey} type="button">
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="passwordProtected"
                  checked={isPasswordProtected}
                  onCheckedChange={setIsPasswordProtected}
                />
                <Label htmlFor="passwordProtected">Password Protection</Label>
              </div>

              {isPasswordProtected && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="Set room password (min 3 characters)"
                        className="pl-10 h-12 text-base"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={isPasswordProtected}
                        minLength={3}
                      />
                      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Retype room password"
                        className="pl-10 h-12 text-base"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={isPasswordProtected}
                      />
                      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="space-y-2">
                  <p className="text-red-500 text-sm">{error}</p>
                  {error.includes('Upgrade to Pro') && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-sm text-blue-500 hover:text-blue-600"
                        onClick={() => router.push('/pricing')}
                      >
                        Upgrade to Pro →
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                type="submit" 
                className="w-full h-12 text-base" 
                disabled={!roomKey || !roomName || !username || (isPasswordProtected && (!password || !confirmPassword)) || isCreating}
              >
                {isCreating ? "Creating..." : "Create Room"}
              </Button>
              <Button variant="ghost" className="w-full h-12 text-base" onClick={() => router.push("/")}>
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
