'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { storageService, Test } from '@/lib/storage'

export default function Dashboard() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchTests = async () => {
      if (!user) return

      try {
        const testsData = await storageService.getTests(user.id)
        setTests(testsData)
      } catch (error) {
        console.error('Error fetching tests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTests()
  }, [user])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-4">
            <Link href="/dashboard/create-test" className="btn btn-primary">
              Create New Test
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Your Tests</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>You haven&apos;t created any tests yet.</p>
              <Link href="/dashboard/create-test" className="text-primary hover:underline mt-2 inline-block">
                Create your first test
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Title</th>
                    <th className="text-left py-2 px-4">Experience Level</th>
                    <th className="text-left py-2 px-4">Tech Stacks</th>
                    <th className="text-left py-2 px-4">Created</th>
                    <th className="text-left py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <tr key={test.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{test.title}</td>
                      <td className="py-3 px-4">{test.experienceLevel}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {test.techStacks.map((tech) => (
                            <span key={tech} className="bg-light px-2 py-1 text-xs rounded">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link 
                            href={`/dashboard/tests/${test.id}`}
                            className="text-primary hover:underline text-sm"
                          >
                            View
                          </Link>
                          <Link 
                            href={`/dashboard/tests/${test.id}/edit`}
                            className="text-secondary hover:underline text-sm"
                          >
                            Edit
                          </Link>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/test/${test.testUrl}`
                              )
                              alert('Test URL copied to clipboard!')
                            }}
                            className="text-info hover:underline text-sm"
                          >
                            Copy URL
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}