'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Header from '@/components/Header'
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
        
        console.log('Submission data loaded:', {
          submissionId: submissionData.id,
          taskSubmissionsType: typeof submissionData.taskSubmissions,
          isArray: Array.isArray(submissionData.taskSubmissions),
          taskSubmissionsLength: Array.isArray(submissionData.taskSubmissions) 
            ? submissionData.taskSubmissions.length 
            : 'Not an array'
        })
        
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
      <Header showLogout={true} />
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
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm text-gray-500 font-medium mb-2">Monitoring Recordings</h3>
                  
                  {/* Wistia Share Links */}
                  {(submission.webcamShareUrl || submission.screenShareUrl) && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                      <h4 className="text-sm font-semibold text-blue-900 mb-3">📹 Wistia Recording Links</h4>
                      <div className="space-y-2">
                        {submission.webcamShareUrl && (
                          <div>
                            <span className="text-sm font-medium text-blue-800">Webcam:</span>
                            <a 
                              href={submission.webcamShareUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-sm text-primary hover:underline inline-flex items-center"
                            >
                              View on Wistia
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                        {submission.screenShareUrl && (
                          <div>
                            <span className="text-sm font-medium text-blue-800">Screen:</span>
                            <a 
                              href={submission.screenShareUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-sm text-primary hover:underline inline-flex items-center"
                            >
                              View on Wistia
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-blue-700 mt-3">
                        💡 Click links to view, download, or share recordings directly from Wistia
                      </p>
                    </div>
                  )}
                  
                  {/* Debug info */}
                  <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
                    <p><strong>Debug Info:</strong></p>
                    <p>Webcam Recording: {submission.webcamRecording ? 'Available' : 'Not available'}</p>
                    {submission.webcamRecording && (
                      <p className="truncate">Embed URL: {submission.webcamRecording.substring(0, 80)}...</p>
                    )}
                    {submission.webcamShareUrl && (
                      <p className="truncate">Share URL: {submission.webcamShareUrl.substring(0, 80)}...</p>
                    )}
                    <p>Screen Recording: {submission.screenRecording ? 'Available' : 'Not available'}</p>
                    {submission.screenRecording && (
                      <p className="truncate">Embed URL: {submission.screenRecording.substring(0, 80)}...</p>
                    )}
                    {submission.screenShareUrl && (
                      <p className="truncate">Share URL: {submission.screenShareUrl.substring(0, 80)}...</p>
                    )}
                  </div>
                  
                  {submission.webcamRecording ? (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Webcam Recording</h4>
                      <div className="border rounded overflow-hidden">
                        {submission.webcamRecording.includes('wistia.net') ? (
                          // Display Wistia embed
                          <iframe
                            src={submission.webcamRecording}
                            title="Webcam Recording"
                            allowTransparency
                            frameBorder="0"
                            scrolling="no"
                            className="w-full h-80"
                            allowFullScreen
                          />
                        ) : submission.webcamRecording.startsWith('data:image') ? (
                          // Display as image if it's a screenshot
                          <img 
                            src={submission.webcamRecording} 
                            alt="Webcam capture" 
                            className="w-full"
                          />
                        ) : (
                          // Try to display as video if it's not an image
                          <video 
                            controls 
                            className="w-full"
                            src={submission.webcamRecording}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-2">No webcam recording available.</p>
                  )}
                  
                  {submission.screenRecording ? (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Screen Recording</h4>
                      <div className="border rounded overflow-hidden">
                        {submission.screenRecording.includes('wistia.net') ? (
                          // Display Wistia embed
                          <iframe
                            src={submission.screenRecording}
                            title="Screen Recording"
                            allowTransparency
                            frameBorder="0"
                            scrolling="no"
                            className="w-full h-80"
                            allowFullScreen
                          />
                        ) : submission.screenRecording.startsWith('data:image') ? (
                          // Display as image if it's a screenshot
                          <img 
                            src={submission.screenRecording} 
                            alt="Screen capture" 
                            className="w-full"
                          />
                        ) : (
                          // Try to display as video if it's not an image
                          <video 
                            controls 
                            className="w-full"
                            src={submission.screenRecording}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-2">No screen recording available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">Task Submissions</h2>
              
              {test.tasks.map((task, index) => {
                // Ensure taskSubmissions is an array
                const taskSubmissionsArray = Array.isArray(submission.taskSubmissions) 
                  ? submission.taskSubmissions 
                  : [];
                
                const taskSubmission = taskSubmissionsArray.find(
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
