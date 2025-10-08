import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css' // Global styles including UnoCSS reset
import { AuthProvider } from '@/components/auth/AuthProvider'
import SeedData from '@/components/SeedData'
// Import UnoCSS loader
import loadUnoCSS from '@/lib/unocss'

// Ensure UnoCSS is loaded
loadUnoCSS()

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Front-end Developer Test Platform',
  description: 'Create and share customized front-end developer tests',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <AuthProvider>
            <SeedData />
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  )
}