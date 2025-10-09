'use client'

import { useState, useEffect } from 'react'
import { Tab } from '@headlessui/react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeEditorProps {
  initialCode?: string
  language?: string
  onChange: (code: string) => void
  showPreview?: boolean
  previewType?: 'result' | 'console' | 'both'
  testCases?: Array<{
    input: string
    expectedOutput: string
    description?: string
  }>
  readOnly?: boolean
  theme?: 'light' | 'dark'
}

export default function CodeEditor({
  initialCode = '',
  language = 'javascript',
  onChange,
  showPreview = true,
  previewType = 'both',
  testCases = [],
  readOnly = false,
  theme = 'dark',
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [output, setOutput] = useState<string>('')
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code')
  const [previewTab, setPreviewTab] = useState<'result' | 'console'>(
    previewType === 'both' ? 'result' : previewType
  )
  const [error, setError] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    onChange(newCode)
  }

  const runCode = () => {
    setIsRunning(true)
    setError(null)
    setConsoleOutput([])

    try {
      // Create a sandboxed environment
      const consoleLogs: string[] = []
      const sandboxConsole = {
        log: (...args: unknown[]) => {
          const logMessage = args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
            .join(' ')
          consoleLogs.push(logMessage)
        },
        error: (...args: unknown[]) => {
          const errorMessage = args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
            .join(' ')
          consoleLogs.push(`ERROR: ${errorMessage}`)
        },
        warn: (...args: unknown[]) => {
          const warnMessage = args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
            .join(' ')
          consoleLogs.push(`WARNING: ${warnMessage}`)
        },
      }

      // For JavaScript/TypeScript, execute the code
      if (language === 'javascript' || language === 'typescript') {
        // Execute the code in a function context
        const executeFunction = new Function('console', `
          try {
            ${code}
            // If the code has a main function, try to call it
            if (typeof main === 'function') {
              return main();
            }
            // If the code has a processInput function, try to call it with test case
            if (typeof processInput === 'function' && ${testCases.length > 0}) {
              return processInput(${JSON.stringify(testCases[0]?.input)});
            }
            return undefined;
          } catch (error) {
            console.error(error.message);
            throw error;
          }
        `)

        try {
          const result = executeFunction(sandboxConsole)
          setOutput(result !== undefined ? String(result) : 'No output')
        } catch (error) {
          setError((error as Error).message)
        }
      } else if (language === 'html') {
        // For HTML, just set the preview
        setPreviewKey((prev) => prev + 1)
      }

      setConsoleOutput(consoleLogs)
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setIsRunning(false)
    }
  }

  // For HTML preview
  const getPreviewContent = () => {
    if (language === 'html') {
      return code
    } else if (language === 'javascript' || language === 'typescript') {
      return `
        <html>
          <head>
            <style>
              body {
                font-family: sans-serif;
                padding: 20px;
                ${theme === 'dark' ? 'background-color: #1a1a1a; color: #f0f0f0;' : ''}
              }
              pre {
                background-color: ${theme === 'dark' ? '#2d2d2d' : '#f5f5f5'};
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
              }
              .output {
                margin-top: 20px;
                padding: 10px;
                border: 1px solid ${theme === 'dark' ? '#444' : '#ddd'};
                border-radius: 5px;
              }
              .error {
                color: #e53e3e;
              }
            </style>
          </head>
          <body>
            <div id="output" class="output"></div>
            <script>
              const output = document.getElementById('output');
              
              // Capture console.log
              const originalConsole = console;
              console = {
                ...originalConsole,
                log: function(...args) {
                  originalConsole.log(...args);
                  const logElement = document.createElement('pre');
                  logElement.textContent = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                  ).join(' ');
                  output.appendChild(logElement);
                },
                error: function(...args) {
                  originalConsole.error(...args);
                  const errorElement = document.createElement('pre');
                  errorElement.className = 'error';
                  errorElement.textContent = 'ERROR: ' + args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                  ).join(' ');
                  output.appendChild(errorElement);
                }
              };
              
              try {
                ${code}
                // If the code has a main function, try to call it
                if (typeof main === 'function') {
                  const result = main();
                  if (result !== undefined) {
                    const resultElement = document.createElement('pre');
                    resultElement.textContent = 'Result: ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
                    output.appendChild(resultElement);
                  }
                }
                // If the code has a processInput function, try to call it with test case
                if (typeof processInput === 'function' && ${testCases.length > 0}) {
                  const result = processInput(${JSON.stringify(testCases[0]?.input)});
                  if (result !== undefined) {
                    const resultElement = document.createElement('pre');
                    resultElement.textContent = 'Result: ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
                    output.appendChild(resultElement);
                  }
                }
              } catch (error) {
                const errorElement = document.createElement('pre');
                errorElement.className = 'error';
                errorElement.textContent = 'Error: ' + error.message;
                output.appendChild(errorElement);
              }
            </script>
          </body>
        </html>
      `
    }
    return ''
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex justify-between items-center border-b p-2 bg-gray-50">
        <div className="flex">
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 text-sm rounded-md ${
              activeTab === 'code'
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Editor
          </button>
          {showPreview && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-sm rounded-md ml-2 ${
                activeTab === 'preview'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Preview
            </button>
          )}
        </div>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">
            {language === 'javascript'
              ? 'JavaScript'
              : language === 'typescript'
              ? 'TypeScript'
              : language === 'html'
              ? 'HTML'
              : language}
          </span>
          {(language === 'javascript' || language === 'typescript') && (
            <button
              onClick={runCode}
              disabled={isRunning}
              className={`px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 ${
                isRunning ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isRunning ? 'Running...' : 'Run'}
            </button>
          )}
          {language === 'html' && (
            <button
              onClick={() => setPreviewKey((prev) => prev + 1)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh Preview
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 h-[500px]">
        <div
          className={`${
            activeTab === 'code' || !showPreview ? 'lg:col-span-2' : ''
          } ${activeTab === 'preview' ? 'hidden lg:block' : ''} relative`}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="flex h-full">
              {/* Line numbers */}
              <div className="bg-gray-100 text-gray-500 text-xs text-right py-2 select-none w-10">
                {code.split('\n').map((_, i) => (
                  <div key={i} className="px-2">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code editor */}
              <div className="flex-1 relative">
                <textarea
                  value={code}
                  onChange={handleCodeChange}
                  className="absolute inset-0 font-mono text-sm p-2 resize-none w-full h-full border-none outline-none"
                  style={{ 
                    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                    lineHeight: '1.5',
                    tabSize: 2,
                  }}
                  disabled={readOnly}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  data-gramm="false"
                ></textarea>
                
                {/* Syntax highlighting overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none p-2 overflow-auto"
                  aria-hidden="true"
                >
                  <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: 0,
                      background: 'transparent',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                      }
                    }}
                    showLineNumbers={false}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showPreview && (
          <div
            className={`${
              activeTab === 'preview' ? 'lg:col-span-1' : ''
            } ${activeTab === 'code' ? 'hidden lg:block' : ''} border-l`}
          >
            {previewType === 'both' && (
              <div className="border-b flex">
                <button
                  onClick={() => setPreviewTab('result')}
                  className={`px-4 py-2 text-sm font-medium ${
                    previewTab === 'result'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Result
                </button>
                <button
                  onClick={() => setPreviewTab('console')}
                  className={`px-4 py-2 text-sm font-medium ${
                    previewTab === 'console'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Console
                </button>
              </div>
            )}

            {(previewTab === 'result' || previewType === 'result') && (
              <div className="h-full overflow-auto">
                <iframe
                  key={previewKey}
                  srcDoc={getPreviewContent()}
                  title="Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts"
                />
              </div>
            )}

            {(previewTab === 'console' || previewType === 'console') && (
              <div className="h-full overflow-auto bg-gray-900 text-white p-4 font-mono text-sm">
                {error && <div className="text-red-400 mb-2">Error: {error}</div>}
                {consoleOutput.length === 0 ? (
                  <p className="text-gray-400">No console output yet. Run your code to see results.</p>
                ) : (
                  consoleOutput.map((line, index) => (
                    <div key={index} className="whitespace-pre-wrap mb-1">
                      {line.startsWith('ERROR:') ? (
                        <span className="text-red-400">{line}</span>
                      ) : line.startsWith('WARNING:') ? (
                        <span className="text-yellow-400">{line}</span>
                      ) : (
                        line
                      )}
                    </div>
                  ))
                )}
                {output && !error && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-green-400 font-bold mb-1">Output:</div>
                    <pre className="whitespace-pre-wrap">{output}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
