'use client'

import { useState, useEffect } from 'react'

interface ThoughtProcessTaskProps {
  initialValue?: string
  onChange: (value: string) => void
  promptQuestions?: string[]
  taskTitle?: string
  taskDescription?: string
}

interface AiPrompt {
  title: string
  prompt: string
}

export default function ThoughtProcessTask({
  initialValue = '',
  onChange,
  promptQuestions = [
    'What was your approach to solving this problem?',
    'What alternatives did you consider?',
    'What challenges did you face and how did you overcome them?',
    'How would you improve your solution given more time?',
    'What trade-offs did you make in your implementation?',
  ],
  taskTitle,
  taskDescription,
}: ThoughtProcessTaskProps) {
  const [value, setValue] = useState(initialValue)
  const [showAiPrompts, setShowAiPrompts] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<AiPrompt | null>(null)
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)
  const [responseProgress, setResponseProgress] = useState(0)
  
  useEffect(() => {
    onChange(value)
  }, [value, onChange])
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isGeneratingResponse) {
      interval = setInterval(() => {
        setResponseProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval as NodeJS.Timeout)
            setIsGeneratingResponse(false)
            return 100
          }
          return prev + 5
        })
      }, 100)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isGeneratingResponse])
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
  }
  
  const aiPrompts: AiPrompt[] = [
    {
      title: 'System Design Explanation',
      prompt: 'Explain the architecture and system design decisions you made, including components, data flow, and how they interact. Discuss scalability considerations and potential bottlenecks.'
    },
    {
      title: 'Performance Analysis',
      prompt: 'Analyze the performance implications of your solution. Identify potential bottlenecks and optimization opportunities. Discuss time and space complexity where applicable.'
    },
    {
      title: 'Accessibility Considerations',
      prompt: 'Describe how your solution addresses accessibility requirements. What WCAG guidelines did you follow? How would you test for accessibility compliance?'
    },
    {
      title: 'Security Analysis',
      prompt: 'Identify potential security vulnerabilities in your solution and how you addressed them. Discuss authentication, authorization, data protection, and other security considerations.'
    },
    {
      title: 'Testing Strategy',
      prompt: 'Outline a comprehensive testing strategy for your solution. Include unit tests, integration tests, end-to-end tests, and any specialized testing needed.'
    },
    {
      title: 'Code Quality & Maintainability',
      prompt: 'Evaluate the maintainability of your code. Discuss code organization, naming conventions, documentation, and how you ensured code quality.'
    }
  ]
  
  const handleApplyPrompt = () => {
    if (!selectedPrompt) return
    
    setIsGeneratingResponse(true)
    setResponseProgress(0)
    
    // Simulate AI response generation
    setTimeout(() => {
      // In a real implementation, this would call an AI service
      const aiResponse = generateMockAiResponse(selectedPrompt.prompt, taskTitle, taskDescription)
      setValue(prev => prev ? `${prev}\n\n## ${selectedPrompt.title}\n${aiResponse}` : `## ${selectedPrompt.title}\n${aiResponse}`)
      setIsGeneratingResponse(false)
      setResponseProgress(100)
      setSelectedPrompt(null)
    }, 2000)
  }
  
  const generateMockAiResponse = (prompt: string, title?: string, description?: string): string => {
    // This is a mock function that would be replaced with a real AI service call
    // For now, we'll return a template response based on the prompt type
    
    if (prompt.includes('system design')) {
      return `For this ${title || 'task'}, I designed the architecture with modularity and scalability in mind. 

The core components include:
- A data access layer to handle API interactions
- A state management system for consistent data flow
- UI components with clear separation of concerns

The data flows unidirectionally from the API through the state management system to the UI components. This approach prevents race conditions and makes the application more predictable.

If I were to scale this solution, I would implement:
- Caching strategies to reduce API calls
- Code splitting to improve initial load time
- Server-side rendering for critical paths`;
    }
    
    if (prompt.includes('performance')) {
      return `I identified several performance considerations in my solution:

1. **Data Fetching**: Implemented request batching and caching to reduce network overhead
2. **Rendering Optimization**: Used memoization to prevent unnecessary re-renders
3. **Asset Loading**: Implemented lazy loading for non-critical resources

The main bottleneck is likely in the data processing logic, which has O(n²) complexity in the worst case. With more time, I would refactor this to use a more efficient algorithm with O(n log n) complexity.

For large datasets, I would implement virtualization to render only visible items.`;
    }
    
    // Default response
    return `For the ${title || 'task'}, I approached the solution methodically by first understanding the requirements thoroughly. 

My implementation focused on balancing functionality with maintainability. I structured the code to be modular and reusable, with clear separation of concerns.

The main challenges I encountered were:
1. Ensuring responsive behavior across different screen sizes
2. Maintaining performance with complex data transformations
3. Handling edge cases in user input

With more time, I would enhance the solution by adding comprehensive unit tests, optimizing performance further, and implementing additional features like offline support.`;
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">Document Your Thought Process</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please explain your thought process, approach, and reasoning. Consider addressing the following points:
        </p>
        
        <ul className="list-disc pl-5 mb-4 space-y-2 text-sm text-gray-600">
          {promptQuestions.map((question, index) => (
            <li key={index}>{question}</li>
          ))}
        </ul>
        
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAiPrompts(!showAiPrompts)}
            className="text-sm text-primary flex items-center gap-1 hover:underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            {showAiPrompts ? 'Hide AI Prompts' : 'Get AI Prompts'}
          </button>
        </div>
        
        {showAiPrompts && (
          <div className="mb-4 border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-2 text-sm">AI-Assisted Prompts</h4>
            <p className="text-xs text-gray-600 mb-3">
              Select a prompt to help structure your response. The AI will generate a starting point that you can edit.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {aiPrompts.map((prompt, index) => (
                <div 
                  key={index}
                  className={`border rounded p-2 cursor-pointer hover:border-primary transition-colors ${
                    selectedPrompt === prompt ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  <h5 className="font-medium text-sm">{prompt.title}</h5>
                  <p className="text-xs text-gray-600 truncate">{prompt.prompt}</p>
                </div>
              ))}
            </div>
            
            {selectedPrompt && (
              <div className="flex flex-col space-y-2">
                <h5 className="font-medium text-sm">{selectedPrompt.title}</h5>
                <p className="text-xs text-gray-600">{selectedPrompt.prompt}</p>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    className="text-xs text-gray-600 hover:underline"
                    onClick={() => setSelectedPrompt(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm btn-primary ${isGeneratingResponse ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleApplyPrompt}
                    disabled={isGeneratingResponse}
                  >
                    {isGeneratingResponse ? 'Generating...' : 'Apply Prompt'}
                  </button>
                </div>
                
                {isGeneratingResponse && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${responseProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <textarea
        className="input w-full"
        rows={15}
        value={value}
        onChange={handleChange}
        placeholder="Describe your thought process here..."
      ></textarea>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>Be detailed and specific</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  )
}
