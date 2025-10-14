'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Header from '@/components/Header'
import { storageService, Test, TestSubmission } from '@/lib/storage'

interface PageProps {
  params: { id: string };
}

export default function TestView({ params }: PageProps) {
  const [test, setTest] = useState<Test | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewedSubmissions, setViewedSubmissions] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const router = useRouter()
  const testId = use(params).id
  
  // Load viewed submissions from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedViewedSubmissions = localStorage.getItem(`viewed_submissions_${testId}`);
      if (storedViewedSubmissions) {
        try {
          const parsed = JSON.parse(storedViewedSubmissions);
          setViewedSubmissions(new Set(parsed));
        } catch (e) {
          console.error('Error parsing viewed submissions:', e);
        }
      }
    }
  }, [testId])
  
  useEffect(() => {
    const fetchTest = async () => {
      if (!user) return
      
      try {
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
      } catch (err) {
        console.error('Error fetching test:', err)
        setError('Failed to load test')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTest()
  }, [testId, user])
  
  const copyTestUrl = () => {
    if (!test) return
    
    const testUrl = `${window.location.origin}/test/${test.testUrl}`
    navigator.clipboard.writeText(testUrl)
    alert('Test URL copied to clipboard!')
  }
  
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
  
  if (!test) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="card max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Test not found</h1>
            <Link href="/dashboard" className="btn btn-primary mt-4 inline-block">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }
  
  return (
    <ProtectedRoute>
      <Header showLogout={true} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/dashboard" className="text-primary hover:underline mr-4">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">{test.title}</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Test Details</h2>
              <p className="mb-4">{test.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Experience Level</h3>
                  <p>{test.experienceLevel}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Total Time</h3>
                  <p>{test.totalTime} minutes</p>
                </div>
                
                <div className="col-span-2">
                  <h3 className="font-medium text-gray-700">Tech Stacks</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {test.techStacks.map((tech) => (
                      <span key={tech} className="bg-light px-3 py-1 text-sm rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Tasks</h2>
              
              {test.tasks.map((task, index) => (
                <div key={index} className="border rounded-lg p-4 mb-4 last:mb-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium">{task.title}</h3>
                    <div className="flex items-center">
                      <span className="bg-light px-2 py-1 text-xs rounded capitalize">
                        {task.type.replace('-', ' ')}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {task.timeAllotted} min
                      </span>
                    </div>
                  </div>
                  
                  <p className="mb-4">{task.description}</p>
                  
                  {task.type === 'coding' && task.codeSnippet && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Starting Code:</h4>
                      <pre className="bg-dark text-white p-3 rounded overflow-x-auto text-sm">
                        {task.codeSnippet}
                      </pre>
                    </div>
                  )}
                  
                  {task.type === 'coding' && task.expectedOutput && (
                    <div>
                      <h4 className="font-medium mb-2">Expected Output/Behavior:</h4>
                      <p className="text-sm">{task.expectedOutput}</p>
                    </div>
                  )}
                  
                  {task.type === 'ui-implementation' && task.designImageUrl && (
                    <div>
                      <h4 className="font-medium mb-2">Design Reference:</h4>
                      <img 
                        src={task.designImageUrl} 
                        alt="Design Reference" 
                        className="max-w-full h-auto rounded border"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Test URL</h2>
              <p className="mb-4 text-sm">Share this URL with candidates to take the test:</p>
              
              <div className="flex">
                <input
                  type="text"
                  value={`${window.location.origin}/test/${test.testUrl}`}
                  className="input flex-grow rounded-r-none"
                  readOnly
                />
                <button
                  onClick={copyTestUrl}
                  className="btn btn-primary rounded-l-none"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Submissions</h2>
              
              {test.submissions && test.submissions.length > 0 ? (
                <div className="space-y-3">
                  {test.submissions.map((submission, index) => {
                    const isNew = !viewedSubmissions.has(submission.id);
                    
                    return (
                      <div key={index} className="border p-3 rounded">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <span className="font-medium">{submission.candidateName}</span>
                            {isNew && (
                              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{submission.candidateEmail}</p>
                        <Link
                          href={`/dashboard/tests/${test.id}/submissions/${submission.id}`}
                          className="text-primary hover:underline text-sm mt-2 inline-block"
                          onClick={() => {
                            // Mark as viewed when clicked
                            const newViewedSubmissions = new Set(viewedSubmissions);
                            newViewedSubmissions.add(submission.id);
                            setViewedSubmissions(newViewedSubmissions);
                            
                            // Save to localStorage
                            if (typeof window !== 'undefined') {
                              localStorage.setItem(
                                `viewed_submissions_${test.id}`,
                                JSON.stringify([...newViewedSubmissions])
                              );
                            }
                          }}
                        >
                          View Submission
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No submissions yet.</p>
              )}
            </div>
            
            <div className="flex gap-3">
              <Link
                href={`/dashboard/tests/${test.id}/edit`}
                className="btn btn-secondary flex-1"
              >
                Edit Test
              </Link>
              <button
                onClick={async () => {
                  if (!user) return;
                  
                  try {
                    const confirmed = window.confirm('Do you want to duplicate this test?');
                    if (!confirmed) return;
                    
                    const duplicatedTest = await storageService.duplicateTest(test.id, user.id);
                    router.push(`/dashboard/tests/${duplicatedTest.id}`);
                  } catch (error) {
                    console.error('Error duplicating test:', error);
                    alert('Failed to duplicate test. Please try again.');
                  }
                }}
                className="btn btn-primary flex-1"
              >
                Duplicate Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}