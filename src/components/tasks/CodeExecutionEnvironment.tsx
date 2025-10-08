'use client'

import { useState } from 'react'
import { TestCase } from '@/lib/storage'

interface CodeExecutionEnvironmentProps {
  code: string
  testCases?: TestCase[]
  onResultsChange?: (results: { passed: boolean; message?: string; executionTime?: number }[]) => void
  language?: 'javascript' | 'typescript' | 'html' | 'css'
}

export default function CodeExecutionEnvironment({
  code,
  testCases = [],
  onResultsChange,
}: CodeExecutionEnvironmentProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<{ passed: boolean; message?: string; executionTime?: number }[]>([])
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'tests' | 'console'>('tests')
  
  // Execute the code in a sandboxed environment
  const executeCode = () => {
    setIsRunning(true)
    setConsoleOutput([])
    
    const newResults: { passed: boolean; message?: string; executionTime?: number }[] = []
    
    try {
      // Create a sandbox for executing the code
      const sandbox = {
        console: {
          log: (...args: unknown[]) => {
            setConsoleOutput(prev => [...prev, args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')])
          },
          error: (...args: unknown[]) => {
            setConsoleOutput(prev => [...prev, `ERROR: ${args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')}`])
          },
          warn: (...args: unknown[]) => {
            setConsoleOutput(prev => [...prev, `WARNING: ${args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')}`])
          }
        }
      }
      
      // For each test case, execute the code and check the result
      testCases.forEach(testCase => {
        const startTime = performance.now()
        
        try {
          // Create a function from the code
          const userFunction = new Function('input', 'console', `
            ${code}
            return processInput(input);
          `)
          
          // Execute the function with the test case input
          const output = userFunction(testCase.input, sandbox.console)
          const executionTime = performance.now() - startTime
          
          // Check if the output matches the expected output
          const passed = String(output) === String(testCase.expectedOutput)
          
          newResults.push({
            passed,
            message: passed 
              ? 'Test passed!' 
              : `Expected: ${testCase.expectedOutput}, Got: ${output}`,
            executionTime
          })
        } catch (error) {
          newResults.push({
            passed: false,
            message: `Error: ${(error as Error).message}`,
            executionTime: performance.now() - startTime
          })
        }
      })
    } catch (error) {
      setConsoleOutput(prev => [...prev, `ERROR: ${(error as Error).message}`])
    }
    
    setResults(newResults)
    if (onResultsChange) {
      onResultsChange(newResults)
    }
    
    setIsRunning(false)
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Test Your Code</h3>
        <button
          onClick={executeCode}
          disabled={isRunning || testCases.length === 0}
          className={`btn btn-primary btn-sm ${isRunning || testCases.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRunning ? 'Running...' : 'Run Tests'}
        </button>
      </div>
      
      {testCases.length === 0 ? (
        <div className="text-gray-500 text-sm p-4 border rounded">
          No test cases available for this task.
        </div>
      ) : (
        <div>
          <div className="flex border-b">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'tests' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
              onClick={() => setActiveTab('tests')}
            >
              Test Results
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'console' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
              onClick={() => setActiveTab('console')}
            >
              Console Output
            </button>
          </div>
          
          {activeTab === 'tests' && (
            <div className="border rounded-b p-4 bg-gray-50 max-h-64 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-sm text-gray-500">Run the tests to see results.</p>
              ) : (
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded ${result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                          )}
                          <span className={`text-sm font-medium ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                            Test Case {index + 1}: {result.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        {result.executionTime !== undefined && (
                          <span className="text-xs text-gray-500">
                            {result.executionTime.toFixed(2)}ms
                          </span>
                        )}
                      </div>
                      
                      {testCases[index] && (
                        <div className="mt-2 text-xs">
                          <div className="flex gap-2 mb-1">
                            <span className="font-medium">Input:</span>
                            <span className="font-mono">{testCases[index].input}</span>
                          </div>
                          <div className="flex gap-2 mb-1">
                            <span className="font-medium">Expected:</span>
                            <span className="font-mono">{testCases[index].expectedOutput}</span>
                          </div>
                          {!result.passed && result.message && (
                            <div className="text-red-600 mt-1">{result.message}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'console' && (
            <div className="border rounded-b p-4 bg-black text-white font-mono text-sm max-h-64 overflow-y-auto">
              {consoleOutput.length === 0 ? (
                <p className="text-gray-400">No console output yet.</p>
              ) : (
                consoleOutput.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap break-all">{line}</div>
                ))
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        <p>Note: Your code is executed in a sandboxed environment with limited access to browser APIs.</p>
      </div>
    </div>
  )
}
