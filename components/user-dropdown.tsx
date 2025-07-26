"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Settings, 
  LogOut, 
  Crown, 
  Sparkles,
  CreditCard,
  Shield
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface UserDropdownProps {
  onToggleSidebar: () => void
}

export function UserDropdown({ onToggleSidebar }: UserDropdownProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getSubscriptionBadge = () => {
    if (!user.subscriptionPlan || user.subscriptionPlan === 'free') {
      return null
    }

    if (user.subscriptionPlan === 'pro') {
      return (
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <Crown className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      )
    }

    if (user.subscriptionPlan === 'pro_ai') {
      return (
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
          <Sparkles className="h-3 w-3 mr-1" />
          Pro + AI
        </Badge>
      )
    }

    return null
  }

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 rounded-full flex items-center gap-3 px-4 hover:bg-white/10"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src="/placeholder-user.jpg" alt={user.username} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium leading-none">
                {user.username}
              </span>
              {user.subscriptionPlan === 'pro' && (
                <div className="p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder-user.jpg" alt={user.username} />
                <AvatarFallback className="text-sm bg-primary/10 text-primary">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.username}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {getSubscriptionBadge() && (
              <div className="pt-1">
                {getSubscriptionBadge()}
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/account')} className="py-3">
          <User className="mr-3 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/account?section=billing')} className="py-3">
          <CreditCard className="mr-3 h-4 w-4" />
          <span>Manage Subscription</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/account?section=settings')} className="py-3">
          <Settings className="mr-3 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/account?section=settings')} className="py-3">
          <Shield className="mr-3 h-4 w-4" />
          <span>Change Password</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="py-3">
          <LogOut className="mr-3 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 