'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { storageService, Test, TestSubmission } from '@/lib/storage'

interface PageProps {
  params: { id: string; submissionId: string }
}

export default function SubmissionView({ params }: PageProps) {
  const [test, setTest] = useState<Test | null>(null)
  const [submission, setSubmission] = useState<TestSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const testId = use(params).id
  const submissionId = use(params).submissionId
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        // Fetch test data
        const testData = await storageService.getTestById(testId)
        
        if (!testData) {
          setError('Test not found')
          setLoading(false)
          return
        }
        
        // Check if the current user is the creator of this test
        if (testData.createdBy !== user.id) {
          setError('You do not have permission to view this test')
          setLoading(false)
          return
        }
        
        setTest(testData)
        
        // Find the specific submission
        const submissionData = testData.submissions.find(s => s.id === submissionId)
        
        if (!submissionData) {
          setError('Submission not found')
          setLoading(false)
          return
        }
        
        setSubmission(submissionData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [testId, submissionId, user])
  
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    )
  }
  
  if (error) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="card max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-danger mb-4">Error</h1>
            <p>{error}</p>
            <Link href="/dashboard" className="btn btn-primary mt-4 inline-block">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }
  
  if (!test || !submission) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="card max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Submission not found</h1>
            <Link href={`/dashboard/tests/${testId}`} className="btn btn-primary mt-4 inline-block">
              Back to Test
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }
  
  // Calculate time spent in a readable format
  const formatTimeSpent = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${secs}s`
  }
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href={`/dashboard/tests/${testId}`} className="text-primary hover:underline mr-4">
            &larr; Back to Test
          </Link>
          <h1 className="text-3xl font-bold">Submission Details</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Candidate Information</h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm text-gray-500">Name</h3>
                  <p className="font-medium">{submission.candidateName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-500">Email</h3>
                  <p>{submission.candidateEmail}</p>
                </div>
                
                {submission.candidatePhone && (
                  <div>
                    <h3 className="text-sm text-gray-500">Phone</h3>
                    <p>{submission.candidatePhone}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm text-gray-500">Experience Level</h3>
                  <p>{submission.yearsOfExperience}</p>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-500">Submitted On</h3>
                  <p>{new Date(submission.submittedAt).toLocaleString()}</p>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-500">Time Spent</h3>
                  <p>{formatTimeSpent(submission.timeSpent)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">Task Submissions</h2>
              
              {test.tasks.map((task, index) => {
                const taskSubmission = submission.taskSubmissions.find(
                  (ts) => ts.taskId === index
                ) || { taskId: index, answer: '' }
                
                return (
                  <div key={index} className="border rounded-lg p-4 mb-4 last:mb-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium">{task.title}</h3>
                      <div className="flex items-center">
                        <span className="bg-light px-2 py-1 text-xs rounded capitalize">
                          {task.type.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t mt-3 pt-3">
                      {task.type === 'coding' && (
                        <>
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Code Submission:</h4>
                            <pre className="bg-dark text-white p-3 rounded overflow-x-auto text-sm">
                              {taskSubmission.codeSubmission || 'No code submitted'}
                            </pre>
                          </div>
                          
                          {taskSubmission.answer && (
                            <div>
                              <h4 className="font-medium mb-2">Explanation:</h4>
                              <p className="text-sm whitespace-pre-wrap">{taskSubmission.answer}</p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {task.type === 'ui-implementation' && (
                        <>
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">HTML Implementation:</h4>
                            <pre className="bg-dark text-white p-3 rounded overflow-x-auto text-sm">
                              {taskSubmission.htmlImplementation || 'No HTML submitted'}
                            </pre>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">CSS Implementation:</h4>
                            <pre className="bg-dark text-white p-3 rounded overflow-x-auto text-sm">
                              {taskSubmission.cssImplementation || 'No CSS submitted'}
                            </pre>
                          </div>
                          
                          {taskSubmission.jsImplementation && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-2">JavaScript Implementation:</h4>
                              <pre className="bg-dark text-white p-3 rounded overflow-x-auto text-sm">
                                {taskSubmission.jsImplementation}
                              </pre>
                            </div>
                          )}
                          
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Preview:</h4>
                            <div className="border rounded p-2">
                              <iframe
                                srcDoc={`
                                  <html>
                                    <head>
                                      <style>${taskSubmission.cssImplementation || ''}</style>
                                    </head>
                                    <body>
                                      ${taskSubmission.htmlImplementation || ''}
                                      <script>${taskSubmission.jsImplementation || ''}</script>
                                    </body>
                                  </html>
                                `}
                                className="w-full h-96 border-0"
                                title="UI Implementation Preview"
                              />
                            </div>
                          </div>
                        </>
                      )}
                      
                      {(task.type === 'debugging' || task.type === 'optimization') && (
                        <>
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Solution:</h4>
                            <pre className="bg-dark text-white p-3 rounded overflow-x-auto text-sm">
                              {taskSubmission.codeSubmission || 'No solution submitted'}
                            </pre>
                          </div>
                          
                          {taskSubmission.answer && (
                            <div>
                              <h4 className="font-medium mb-2">Explanation:</h4>
                              <p className="text-sm whitespace-pre-wrap">{taskSubmission.answer}</p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {task.type === 'thought-process' && (
                        <div>
                          <h4 className="font-medium mb-2">Response:</h4>
                          <div className="text-sm whitespace-pre-wrap bg-light p-4 rounded">
                            {taskSubmission.thoughtProcess || 'No response submitted'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
