"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

// Types
export interface User {
  id: string
  username: string
  email: string
  createdAt: string
  updatedAt: string
  subscriptionPlan?: 'free' | 'pro' | 'pro_ai'
  subscriptionStatus?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  authMethod?: 'email' | 'google'
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  loginWithToken: (token: string, userData: any) => Promise<void>
  logout: () => void
  clearError: () => void
  refreshUserData: () => Promise<void>
}

// Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
  error: null,
}

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: action.payload,
      }
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    default:
      return state
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token')
      
      if (storedToken) {
        try {
          // Validate token with backend
          const response = await fetch('/api/auth/validate-token', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          })
          
          if (response.ok) {
            const userData = await response.json()
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: userData,
                token: storedToken,
              },
            })
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token')
            dispatch({ type: 'SET_LOADING', payload: false })
          }
        } catch (error) {
          console.error('Error validating token:', error)
          localStorage.removeItem('auth_token')
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' })
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await response.json()
      
      // Store token in localStorage
      localStorage.setItem('auth_token', data.token)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: {
            id: data.userId,
            username: data.username,
            email: data.email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            subscriptionPlan: data.subscriptionPlan || 'free',
            subscriptionStatus: data.subscriptionStatus,
            stripeCustomerId: data.stripeCustomerId,
            stripeSubscriptionId: data.stripeSubscriptionId,
          },
          token: data.token,
        },
      })
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Login failed',
      })
      throw error
    }
  }

  const signup = async (username: string, email: string, password: string) => {
    dispatch({ type: 'AUTH_START' })
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Signup failed')
      }

      const data = await response.json()
      
      // Store token in localStorage
      localStorage.setItem('auth_token', data.token)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: {
            id: data.userId,
            username: data.username,
            email: data.email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: data.token,
        },
      })
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Signup failed',
      })
      throw error
    }
  }

  const loginWithToken = async (token: string, userData: any) => {
    dispatch({ type: 'AUTH_START' })
    
    try {
      // Store token in localStorage
      localStorage.setItem('auth_token', token)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: {
            id: userData.userId,
            username: userData.username,
            email: userData.email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            subscriptionPlan: userData.subscriptionPlan || 'free',
            subscriptionStatus: userData.subscriptionStatus,
            stripeCustomerId: userData.stripeCustomerId,
            stripeSubscriptionId: userData.stripeSubscriptionId,
          },
          token: token,
        },
      })
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'OAuth login failed',
      })
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    dispatch({ type: 'LOGOUT' })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const refreshUserData = async () => {
    if (!state.token) return

    try {
      const response = await fetch('/api/auth/validate-token', {
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      })
      
      if (response.ok) {
        const userData = await response.json()
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: userData,
            token: state.token,
          },
        })
        console.log('User data refreshed successfully:', userData)
      } else {
        console.error('Failed to refresh user data:', response.status)
        // If token is invalid, logout user
        if (response.status === 401) {
          logout()
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    loginWithToken,
    logout,
    clearError,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 