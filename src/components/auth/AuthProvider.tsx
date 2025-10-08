'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, storageService } from '@/lib/storage'

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  // No register function needed for single admin
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => Promise.reject(new Error('AuthContext not initialized')),
  logout: () => Promise.reject(new Error('AuthContext not initialized')),
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      try {
        const currentUser = await storageService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkUser()
  }, [])

  const login = async (email: string, password: string) => {
    const user = await storageService.login(email, password)
    setUser(user)
    return user
  }

  const logout = async () => {
    await storageService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}