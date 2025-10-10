'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { nanoid } from 'nanoid'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendCompletionEmail } from '@/lib/email/sendNotification'
import UIImplementationTask from '@/components/tasks/UIImplementationTask'
import ThoughtProcessTask from '@/components/tasks/ThoughtProcessTask'
import CodeExecutionEnvironment from '@/components/tasks/CodeExecutionEnvironment'
import dynamic from 'next/dynamic'

// Import the recording manager with no SSR
const BasicRecordingManager = dynamic(
  () => import('@/components/tasks/BasicRecordingManager'),
  { ssr: false }
)
import { storageService, Test, TaskSubmission } from '@/lib/storage'

const candidateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  yearsOfExperience: z.string().optional(),
})

type CandidateFormData = z.infer<typeof candidateSchema>

export default function TestPage({ params }: { params: { testUrl: string } }) {
  const [test, setTest] = useState<Test | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0) // 0: candidate info, 1: test, 2: submission
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [webcamRecordingData, setWebcamRecordingData] = useState<string>('')
  const [screenRecordingData, setScreenRecordingData] = useState<string>('')
  const [recordingStarted, setRecordingStarted] = useState(false)
  const router = useRouter()
  const testUrl = use(params).testUrl
  
  const { register, handleSubmit, formState: { errors } } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
  })
  
  useEffect(() => {
    const fetchTest = async () => {
      try {
        if (!testUrl) {
          setError('Invalid test URL')
          setLoading(false)
          return
        }
        
        // Check if the test URL is expired
        const isExpired = await storageService.isTestExpired(testUrl)
        if (isExpired) {
          setError('This test URL has expired or has already been submitted')
          setLoading(false)
          return
        }
        
        const testData = await storageService.getTestByUrl(testUrl)
        
        if (!testData) {
          setError('Test not found')
          setLoading(false)
          return
        }
        
        setTest(testData)
        setTimeRemaining(testData.totalTime * 60) // Convert to seconds
        
        // Initialize task submissions
        const initialSubmissions = testData.tasks.map((_, index) => ({
          taskId: index,
          answer: '',
          codeSubmission: '',
          htmlImplementation: '',
          cssImplementation: '',
          thoughtProcess: '',
        }))
        
        setTaskSubmissions(initialSubmissions)
      } catch (err) {
        console.error('Error fetching test:', err)
        setError('Failed to load test')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTest()
  }, [testUrl])
  
  // Timer effect
  useEffect(() => {
    if (step !== 1 || timeRemaining <= 0) return
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Auto-submit when time is up
          handleSubmitTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [step, timeRemaining])
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const handleCandidateSubmit = (data: CandidateFormData) => {
    // Store candidate info and start the test
    localStorage.setItem('candidateInfo', JSON.stringify(data))
    setStep(1)
  }
  
  const updateTaskSubmission = (
    taskId: number,
    field: keyof TaskSubmission,
    value: string
  ) => {
    setTaskSubmissions((prev) =>
      prev.map((submission) =>
        submission.taskId === taskId
          ? { ...submission, [field]: value }
          : submission
      )
    )
  }
  
  const handleSubmitTest = async () => {
    if (!test) return
    
    try {
      setSubmitting(true)
      
      // Get candidate info from localStorage
      const candidateInfoStr = localStorage.getItem('candidateInfo')
      if (!candidateInfoStr) {
        setError('Candidate information not found')
        setSubmitting(false)
        return
      }
      
      let candidateInfo: CandidateFormData
      try {
        candidateInfo = JSON.parse(candidateInfoStr) as CandidateFormData
      } catch (parseError) {
        console.error('Error parsing candidate info:', parseError)
        setError('Invalid candidate information format')
        setSubmitting(false)
        return
      }
      
      // Get recording data from our recording service
      let webcamRecording = webcamRecordingData
      let screenRecording = screenRecordingData
      
      console.log('Preparing submission with recordings:', {
        webcamRecordingAvailable: Boolean(webcamRecording),
        screenRecordingAvailable: Boolean(screenRecording),
        webcamRecordingSize: webcamRecording ? webcamRecording.length : 0,
        screenRecordingSize: screenRecording ? screenRecording.length : 0
      })
      
      // Prepare submission data including recordings
      const submissionData = {
        candidateName: candidateInfo.name,
        candidateEmail: candidateInfo.email,
        candidatePhone: candidateInfo.phone || '',
        yearsOfExperience: candidateInfo.yearsOfExperience || 'Not specified',
        taskSubmissions,
        timeSpent: test.totalTime * 60 - timeRemaining, // in seconds
        webcamRecording,
        screenRecording
      }
      
      // Add submission to test
      try {
        await storageService.addSubmission(test.id, submissionData)
      } catch (submissionError) {
        console.error('Error in storageService.addSubmission:', submissionError)
        throw submissionError
      }
      
      // Send email notification
      try {
        console.log('Sending email notification...')
        const emailResult = await sendCompletionEmail({
          candidateName: candidateInfo.name,
          candidateEmail: candidateInfo.email,
          testTitle: test.title,
          testUrl: `${window.location.origin}/dashboard/tests/${test.id}`,
          submissionTime: new Date().toLocaleString(),
        })
        console.log('Email notification result:', emailResult)
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError)
        // Continue with the submission process even if email fails
      }
      
      // Move to completion step
      setStep(2)
    } catch (err) {
      console.error('Error submitting test:', err)
      if (err instanceof Error) {
        setError(`Failed to submit test: ${err.message}. Please try again.`)
      } else {
        setError('Failed to submit test. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-danger mb-4">Error</h1>
          <p>{error}</p>
          <Link href="/" className="btn btn-primary mt-4 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }
  
  if (!test) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Test not found</h1>
          <Link href="/" className="btn btn-primary mt-4 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }
  
  // Candidate Information Form
  if (step === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">{test.title}</h1>
          <p className="mb-6 text-gray-600">{test.description}</p>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Test Details</h2>
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
          
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Candidate Information</h2>
            
            <form onSubmit={handleSubmit(handleCandidateSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="input w-full"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-danger text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="input w-full"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-danger text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Phone Number (optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="input w-full"
                  {...register('phone')}
                />
              </div>
              
              
              <div className="pt-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <h3 className="font-medium text-yellow-800 mb-2">Important Notice</h3>
                  <p className="text-sm text-yellow-700">
                    This test requires webcam and screen recording for monitoring purposes. 
                    Your webcam feed and screen will be recorded during the test session.
                    The recordings will be available only to the test administrator.
                  </p>
                </div>
                
                <button type="submit" className="btn btn-primary w-full">
                  Start Test
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  By starting the test, you agree to complete it within the allocated time,
                  and consent to webcam and screen recording during the test session.
                  The timer will start immediately.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }
  
  // Test Taking Interface
  if (step === 1) {
    const currentTask = test.tasks[currentTaskIndex]
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <div className="flex items-center">
            <div className="bg-primary text-white px-4 py-2 rounded-lg font-mono">
              Time Remaining: {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
        
        <div className="card mb-6">
          <BasicRecordingManager 
            onWebcamRecordingComplete={(data) => {
              setWebcamRecordingData(data)
              setRecordingStarted(true)
            }}
            onScreenRecordingComplete={setScreenRecordingData}
          />
        </div>
        
        {recordingStarted ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="card sticky top-4">
                <h2 className="text-lg font-semibold mb-4">Tasks</h2>
                <div className="space-y-2">
                  {test.tasks.map((task, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTaskIndex(index)}
                      className={`w-full text-left p-3 rounded-lg ${
                        currentTaskIndex === index
                          ? 'bg-primary text-white'
                          : 'hover:bg-light'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium truncate">{task.title}</span>
                        <span className="text-xs">
                          {task.timeAllotted} min
                        </span>
                      </div>
                      <div className="text-xs mt-1 capitalize">
                        {task.type.replace('-', ' ')}
                      </div>
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={handleSubmitTest}
                  className="btn btn-primary w-full mt-6"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Test'}
                </button>
              </div>
            </div>
            
            <div className="lg:col-span-3">
              <div className="card mb-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">{currentTask.title}</h2>
                  <span className="bg-light px-3 py-1 text-sm rounded">
                    {currentTask.timeAllotted} minutes
                  </span>
                </div>
                
                <p className="mb-6">{currentTask.description}</p>
                
                {currentTask.type === 'coding' && currentTask.codeSnippet && (
                  <div className="mb-6">
                    <h3 className="font-medium mb-2">Starting Code:</h3>
                    <pre className="bg-dark text-white p-4 rounded overflow-x-auto text-sm">
                      {currentTask.codeSnippet}
                    </pre>
                  </div>
                )}
                
                {currentTask.type === 'ui-implementation' && currentTask.designImageUrl && (
                  <div className="mb-6">
                    <h3 className="font-medium mb-2">Design Reference:</h3>
                    <img 
                      src={currentTask.designImageUrl} 
                      alt="Design Reference" 
                      className="max-w-full h-auto rounded border"
                    />
                  </div>
                )}
              </div>
              
              <div className="card">
                <h3 className="font-medium mb-4">Your Solution</h3>
                
                {currentTask.type === 'coding' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Code Submission
                      </label>
                      <textarea
                        rows={10}
                        className="input w-full font-mono text-sm"
                        placeholder="Write your code here..."
                        value={taskSubmissions[currentTaskIndex]?.codeSubmission || ''}
                        onChange={(e) => 
                          updateTaskSubmission(
                            currentTaskIndex,
                            'codeSubmission',
                            e.target.value
                          )
                        }
                      ></textarea>
                    </div>
                    
                    {currentTask.testCases && currentTask.testCases.length > 0 && (
                      <CodeExecutionEnvironment 
                        code={taskSubmissions[currentTaskIndex]?.codeSubmission || ''}
                        testCases={currentTask.testCases}
                        onResultsChange={(results) => {
                          const updatedSubmission = { ...taskSubmissions[currentTaskIndex] };
                          updatedSubmission.testResults = results;
                          setTaskSubmissions(prev => 
                            prev.map((submission, idx) => 
                              idx === currentTaskIndex ? updatedSubmission : submission
                            )
                          );
                        }}
                      />
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Explanation (optional)
                      </label>
                      <textarea
                        rows={4}
                        className="input w-full"
                        placeholder="Explain your approach and solution..."
                        value={taskSubmissions[currentTaskIndex]?.answer || ''}
                        onChange={(e) => 
                          updateTaskSubmission(
                            currentTaskIndex,
                            'answer',
                            e.target.value
                          )
                        }
                      ></textarea>
                    </div>
                  </div>
                )}
                
                {currentTask.type === 'ui-implementation' && (
                  <UIImplementationTask
                    designImageUrl={currentTask.designImageUrl}
                    initialHtml={taskSubmissions[currentTaskIndex]?.htmlImplementation || ''}
                    initialCss={taskSubmissions[currentTaskIndex]?.cssImplementation || ''}
                    initialJs={taskSubmissions[currentTaskIndex]?.jsImplementation || ''}
                    showJsEditor={currentTask.requiresJavaScript}
                    responsivePreview={true}
                    onHtmlChange={(value) => 
                      updateTaskSubmission(
                        currentTaskIndex,
                        'htmlImplementation',
                        value
                      )
                    }
                    onCssChange={(value) => 
                      updateTaskSubmission(
                        currentTaskIndex,
                        'cssImplementation',
                        value
                      )
                    }
                    onJsChange={(value) => 
                      updateTaskSubmission(
                        currentTaskIndex,
                        'jsImplementation',
                        value
                      )
                    }
                  />
                )}
                
                {(currentTask.type === 'debugging' || currentTask.type === 'optimization') && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Solution
                      </label>
                      <textarea
                        rows={10}
                        className="input w-full font-mono text-sm"
                        placeholder="Write your solution here..."
                        value={taskSubmissions[currentTaskIndex]?.codeSubmission || ''}
                        onChange={(e) => 
                          updateTaskSubmission(
                            currentTaskIndex,
                            'codeSubmission',
                            e.target.value
                          )
                        }
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Explanation
                      </label>
                      <textarea
                        rows={4}
                        className="input w-full"
                        placeholder="Explain what issues you found and how you fixed them..."
                        value={taskSubmissions[currentTaskIndex]?.answer || ''}
                        onChange={(e) => 
                          updateTaskSubmission(
                            currentTaskIndex,
                            'answer',
                            e.target.value
                          )
                        }
                      ></textarea>
                    </div>
                  </div>
                )}
                
                {currentTask.type === 'thought-process' && (
                  <ThoughtProcessTask
                    initialValue={taskSubmissions[currentTaskIndex]?.thoughtProcess || ''}
                    taskTitle={currentTask.title}
                    taskDescription={currentTask.description}
                    onChange={(value) => 
                      updateTaskSubmission(
                        currentTaskIndex,
                        'thoughtProcess',
                        value
                      )
                    }
                  />
                )}
                
                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setCurrentTaskIndex(Math.max(0, currentTaskIndex - 1))}
                    disabled={currentTaskIndex === 0}
                    className="btn btn-secondary"
                  >
                    Previous Task
                  </button>
                  
                  {currentTaskIndex === test.tasks.length - 1 ? (
                    <button
                      onClick={handleSubmitTest}
                      className="btn btn-success"
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Test'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentTaskIndex(currentTaskIndex + 1)}
                      className="btn btn-primary"
                    >
                      Next Task
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <div className="text-xl font-medium mb-4">Enable Webcam and Screen Sharing to Continue</div>
            <p className="mb-6 text-gray-600">
              You must enable both webcam and screen sharing, and click "Start Recording" to access the test content.
              This is required for test monitoring purposes.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700">
                <strong>Instructions:</strong> Click the "Enable Webcam" and "Share Screen" buttons above, 
                then click "Start Recording" to begin the test.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // Test Submission Confirmation
  if (step === 2) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card max-w-2xl mx-auto text-center">
          <div className="text-success text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-4">Test Submitted Successfully!</h1>
          <p className="mb-6">
            Thank you for completing the test. Your submission has been recorded.
          </p>
          <p className="mb-6">
            The recruiter will review your submission and get back to you soon.
          </p>
          <Link href="/" className="btn btn-primary inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }
  
  return null
}