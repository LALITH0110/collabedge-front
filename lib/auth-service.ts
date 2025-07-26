// Types
export interface Room {
  id: string
  name: string
  roomKey: string
  isPasswordProtected: boolean
  createdAt: string
  documentCount: number
  userCount?: number
  createdById?: string
  createdByUsername?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  type: string
  userId: string
  username: string
  email: string
  expiresAt: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
}

// Auth Service Class
class AuthService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    return response.json()
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Signup failed')
    }

    return response.json()
  }

  async validateToken(): Promise<UserProfile> {
    const response = await fetch('/api/auth/validate-token', {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Token validation failed')
    }

    return response.json()
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      localStorage.removeItem('auth_token')
    }
  }

  async getUserRooms(): Promise<Room[]> {
    const response = await fetch('/api/user/rooms', {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch user rooms')
    }

    const rooms = await response.json()
    
    // Filter out unjoined rooms
    const unjoinedRooms = JSON.parse(localStorage.getItem('unjoined_rooms') || '[]')
    const filteredRooms = rooms.filter((room: any) => !unjoinedRooms.includes(room.id))
    
    return filteredRooms
  }

  async getUserProfile(): Promise<UserProfile> {
    const response = await fetch('/api/user/profile', {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch user profile')
    }

    return response.json()
  }

  // Room operations with authentication
  async createRoom(roomData: {
    name: string
    roomKey?: string
    passwordProtected: boolean
    password?: string
  }): Promise<Room> {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        ...roomData,
        createdById: this.getCurrentUserId(),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create room')
    }

    return response.json()
  }

  async joinRoom(roomKey: string, password?: string): Promise<Room> {
    // First, try to check if the user already has access to this room
    // This bypasses password protection for rooms they created or have permissions for
    try {
      const accessResponse = await fetch(`/api/rooms/access/${roomKey}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (accessResponse.ok) {
        const room = await accessResponse.json()
        console.log(`User has direct access to room ${roomKey}`)
        return room
      } else if (accessResponse.status === 403) {
        console.log(`User does not have direct access to room ${roomKey}, proceeding with join flow`)
      }
    } catch (accessError) {
      console.log(`Error checking room access, proceeding with join flow:`, accessError)
    }

    // If user doesn't have direct access, use the regular join flow (with password if needed)
    const response = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        roomKey,
        password,
        userId: this.getCurrentUserId(),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to join room')
    }

    return response.json()
  }

  async deleteRoom(roomId: string): Promise<void> {
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      
      // If the error is that user can't delete room they didn't create,
      // try to unjoin instead
      if (error.error && error.error.includes('You can only delete rooms you created')) {
        console.log('Cannot delete room, attempting to unjoin instead...')
        await this.unjoinRoom(roomId)
        return
      }
      
      throw new Error(error.error || 'Failed to delete room')
    }
  }

  async unjoinRoom(roomId: string): Promise<void> {
    // For now, we'll track unjoined rooms in localStorage since there's no backend unjoin endpoint
    // This effectively "unjoins" the user from their perspective
    
    // Add room to unjoined list
    const unjoinedRooms = JSON.parse(localStorage.getItem('unjoined_rooms') || '[]')
    if (!unjoinedRooms.includes(roomId)) {
      unjoinedRooms.push(roomId)
      localStorage.setItem('unjoined_rooms', JSON.stringify(unjoinedRooms))
    }
    
    console.log(`Successfully unjoined room ${roomId}`)
  }

  async getRoomUsers(roomId: string): Promise<{ users: string[], userCount: number }> {
    const response = await fetch(`/api/rooms/${roomId}/users`, {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch room users')
    }

    return response.json()
  }

  // Utility methods
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token')
    return !!token
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  getCurrentUserId(): string | null {
    const token = this.getToken()
    if (!token) return null

    try {
      // Decode JWT payload (simple base64 decode)
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub // 'sub' is the user ID in our JWT
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  getCurrentUsername(): string | null {
    const token = this.getToken()
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.username
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token)
  }

  removeToken(): void {
    localStorage.removeItem('auth_token')
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService 