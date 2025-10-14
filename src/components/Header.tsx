'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  showLogout?: boolean
}

export default function Header({ showLogout = false }: HeaderProps) {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/logo-wide.svg"
              alt="2hatslogic"
              width={220}
              height={50}
              priority
              className="h-12 w-auto"
            />
          </Link>
          {showLogout && (
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

