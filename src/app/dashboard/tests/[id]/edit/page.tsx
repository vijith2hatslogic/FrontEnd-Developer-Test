'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { storageService, Task, Test } from '@/lib/storage'
import { generateTasksFromTechStacks } from '@/lib/taskTemplates'

const TECH_STACKS = [
  'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 
  'Svelte', 'Next.js', 'Nuxt.js', 'Node.js', 'Express', 'Tailwind CSS',
  'Bootstrap', 'Material UI', 'SASS/SCSS', 'GraphQL', 'REST API'
]

const EXPERIENCE_LEVELS = [
  'Junior (0-2 years)',
  'Mid-level (2-5 years)',
  'Senior (5+ years)'
]

const taskSchema = z.object({
  type: z.enum(['coding', 'ui-implementation', 'debugging', 'optimization', 'thought-process']),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  timeAllotted: z.number().min(5, 'Time must be at least 5 minutes'),
  codeSnippet: z.string().optional(),
  expectedOutput: z.string().optional(),
  designImageUrl: z.string().optional(),
  requiresJavaScript: z.boolean().optional(),
})

const testSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  techStacks: z.array(z.string()).min(1, 'Select at least one tech stack'),
  totalTime: z.number().min(15, 'Total time must be at least 15 minutes'),
  tasks: z.array(taskSchema).min(1, 'Add at least one task'),
})

type TestFormData = z.infer<typeof testSchema>

interface PageProps {
  params: { id: string }
}

export default function EditTest({ params }: PageProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [test, setTest] = useState<Test | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const testId = use(params).id
  
  const { register, handleSubmit, control, formState: { errors }, watch, setValue, getValues, reset } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: '',
      description: '',
      experienceLevel: 'Mid-level (2-5 years)',
      techStacks: [],
      totalTime: 180, // 3 hours by default
      tasks: [],
    }
  })
  
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'tasks',
  })
  
  const watchTaskType = watch('tasks')
  
  // Fetch test data
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
          setError('You do not have permission to edit this test')
          setLoading(false)
          return
        }
        
        setTest(testData)
        
        // Set form values
        reset({
          title: testData.title,
          description: testData.description,
          experienceLevel: testData.experienceLevel,
          techStacks: testData.techStacks,
          totalTime: testData.totalTime,
          tasks: testData.tasks,
        })
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching test:', err)
        setError('Failed to load test')
        setLoading(false)
      }
    }
    
    fetchTest()
  }, [testId, user, reset])
  
  const handleGenerateTasks = () => {
    const techStacks = getValues('techStacks')
    const experienceLevel = getValues('experienceLevel')
    const totalTime = getValues('totalTime')
    
    if (techStacks.length > 0) {
      const generatedTasks = generateTasksFromTechStacks(
        techStacks,
        experienceLevel,
        totalTime
      )
      
      if (generatedTasks.length > 0) {
        replace(generatedTasks)
      }
    }
  }
  
  const onSubmit = async (data: TestFormData) => {
    if (!user || !test) return
    
    try {
      setSubmitting(true)
      
      // Update test using storage service
      const updatedTest = await storageService.updateTest(testId, {
        ...data,
      })
      
      router.push(`/dashboard/tests/${updatedTest.id}`)
    } catch (error) {
      console.error('Error updating test:', error)
      alert('Failed to update test. Please try again.')
    } finally {
      setSubmitting(false)
    }
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
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href={`/dashboard/tests/${testId}`} className="text-primary hover:underline mr-4">
            &larr; Back to Test
          </Link>
          <h1 className="text-3xl font-bold">Edit Test</h1>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Test Details</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Test Title
                </label>
                <input
                  id="title"
                  type="text"
                  className="input w-full"
                  placeholder="e.g., Front-end Developer Assessment"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-danger text-sm mt-1">{errors.title.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Test Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="input w-full"
                  placeholder="Describe the purpose and scope of this test..."
                  {...register('description')}
                ></textarea>
                {errors.description && (
                  <p className="text-danger text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-medium mb-1">
                  Experience Level
                </label>
                <select
                  id="experienceLevel"
                  className="input w-full"
                  {...register('experienceLevel')}
                >
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                {errors.experienceLevel && (
                  <p className="text-danger text-sm mt-1">{errors.experienceLevel.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tech Stacks
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {TECH_STACKS.map((tech) => (
                    <div key={tech} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`tech-${tech}`}
                        value={tech}
                        className="mr-2"
                        {...register('techStacks')}
                      />
                      <label htmlFor={`tech-${tech}`}>{tech}</label>
                    </div>
                  ))}
                </div>
                {errors.techStacks && (
                  <p className="text-danger text-sm mt-1">{errors.techStacks.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="totalTime" className="block text-sm font-medium mb-1">
                  Total Time (minutes)
                </label>
                <input
                  id="totalTime"
                  type="number"
                  className="input w-full"
                  min={15}
                  {...register('totalTime', { valueAsNumber: true })}
                />
                {errors.totalTime && (
                  <p className="text-danger text-sm mt-1">{errors.totalTime.message}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tasks</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGenerateTasks}
                  className="btn btn-primary text-sm"
                >
                  Regenerate Tasks
                </button>
                <button
                  type="button"
                  onClick={() => append({
                    type: 'coding',
                    title: '',
                    description: '',
                    timeAllotted: 60,
                    codeSnippet: '',
                    expectedOutput: '',
                  })}
                  className="btn btn-secondary text-sm"
                >
                  Add Custom Task
                </button>
              </div>
            </div>
            
            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks added yet. Select tech stacks above to generate tasks automatically.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 relative">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 text-danger hover:text-danger-600"
                      aria-label="Remove task"
                    >
                      ✕
                    </button>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`tasks.${index}.type`} className="block text-sm font-medium mb-1">
                          Task Type
                        </label>
                        <select
                          id={`tasks.${index}.type`}
                          className="input w-full"
                          {...register(`tasks.${index}.type`)}
                        >
                          <option value="coding">Coding Challenge</option>
                          <option value="ui-implementation">UI Implementation</option>
                          <option value="debugging">Debugging Task</option>
                          <option value="optimization">Optimization Task</option>
                          <option value="thought-process">Thought Process Evaluation</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor={`tasks.${index}.title`} className="block text-sm font-medium mb-1">
                          Task Title
                        </label>
                        <input
                          id={`tasks.${index}.title`}
                          type="text"
                          className="input w-full"
                          placeholder="e.g., Create a Responsive Navigation"
                          {...register(`tasks.${index}.title`)}
                        />
                        {errors.tasks?.[index]?.title && (
                          <p className="text-danger text-sm mt-1">{errors.tasks[index]?.title?.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor={`tasks.${index}.description`} className="block text-sm font-medium mb-1">
                          Task Description
                        </label>
                        <textarea
                          id={`tasks.${index}.description`}
                          rows={3}
                          className="input w-full"
                          placeholder="Describe the task requirements and expectations..."
                          {...register(`tasks.${index}.description`)}
                        ></textarea>
                        {errors.tasks?.[index]?.description && (
                          <p className="text-danger text-sm mt-1">{errors.tasks[index]?.description?.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor={`tasks.${index}.timeAllotted`} className="block text-sm font-medium mb-1">
                          Time Allotted (minutes)
                        </label>
                        <input
                          id={`tasks.${index}.timeAllotted`}
                          type="number"
                          className="input w-full"
                          min={5}
                          {...register(`tasks.${index}.timeAllotted`, { valueAsNumber: true })}
                        />
                        {errors.tasks?.[index]?.timeAllotted && (
                          <p className="text-danger text-sm mt-1">{errors.tasks[index]?.timeAllotted?.message}</p>
                        )}
                      </div>
                      
                      {watchTaskType[index]?.type === 'coding' && (
                        <>
                          <div>
                            <label htmlFor={`tasks.${index}.codeSnippet`} className="block text-sm font-medium mb-1">
                              Starting Code Snippet (optional)
                            </label>
                            <textarea
                              id={`tasks.${index}.codeSnippet`}
                              rows={5}
                              className="input w-full font-mono text-sm"
                              placeholder="Provide any starter code for the candidate..."
                              {...register(`tasks.${index}.codeSnippet`)}
                            ></textarea>
                          </div>
                          
                          <div>
                            <label htmlFor={`tasks.${index}.expectedOutput`} className="block text-sm font-medium mb-1">
                              Expected Output/Behavior (optional)
                            </label>
                            <textarea
                              id={`tasks.${index}.expectedOutput`}
                              rows={3}
                              className="input w-full"
                              placeholder="Describe what the solution should accomplish..."
                              {...register(`tasks.${index}.expectedOutput`)}
                            ></textarea>
                          </div>
                        </>
                      )}
                      
                      {watchTaskType[index]?.type === 'ui-implementation' && (
                        <>
                          <div>
                            <label htmlFor={`tasks.${index}.designImageUrl`} className="block text-sm font-medium mb-1">
                              Design Image URL (optional)
                            </label>
                            <input
                              id={`tasks.${index}.designImageUrl`}
                              type="text"
                              className="input w-full"
                              placeholder="https://example.com/design-image.jpg"
                              {...register(`tasks.${index}.designImageUrl`)}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Provide a URL to the design image that candidates should implement
                            </p>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`tasks.${index}.requiresJavaScript`}
                              className="mr-2"
                              {...register(`tasks.${index}.requiresJavaScript`)}
                            />
                            <label htmlFor={`tasks.${index}.requiresJavaScript`}>
                              Requires JavaScript
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {errors.tasks && !Array.isArray(errors.tasks) && (
              <p className="text-danger text-sm mt-4">{errors.tasks.message}</p>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Link href={`/dashboard/tests/${testId}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}
