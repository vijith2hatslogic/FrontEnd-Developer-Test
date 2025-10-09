'use client'

import { useState, useEffect } from 'react'
import { Tab } from '@headlessui/react'
import CodeEditor from './CodeEditor'

interface UIImplementationTaskProps {
  designImageUrl?: string
  initialHtml?: string
  initialCss?: string
  initialJs?: string
  onHtmlChange: (html: string) => void
  onCssChange: (css: string) => void
  onJsChange?: (js: string) => void
  showJsEditor?: boolean
  responsivePreview?: boolean
}

export default function UIImplementationTask({
  designImageUrl,
  initialHtml = '',
  initialCss = '',
  initialJs = '',
  onHtmlChange,
  onCssChange,
  onJsChange,
  showJsEditor = false,
  responsivePreview = true,
}: UIImplementationTaskProps) {
  const [html, setHtml] = useState(initialHtml)
  const [css, setCss] = useState(initialCss)
  const [js, setJs] = useState(initialJs)
  const [previewKey, setPreviewKey] = useState(0)
  const [activeTab, setActiveTab] = useState(0)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light')
  const [showDesignOverlay, setShowDesignOverlay] = useState(false)
  
  // We don't need this useEffect as we're already calling the onChange handlers in the handleChange functions
  
  const handleHtmlChange = (code: string) => {
    setHtml(code)
    onHtmlChange(code)
  }
  
  const handleCssChange = (code: string) => {
    setCss(code)
    onCssChange(code)
  }
  
  const handleJsChange = (code: string) => {
    setJs(code)
    if (showJsEditor && onJsChange) {
      onJsChange(code)
    }
  }
  
  const refreshPreview = () => {
    setPreviewKey((prev) => prev + 1)
  }
  
  const combinedCode = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${css}
          ${previewMode === 'dark' ? 'body { background-color: #1a1a1a; color: #f0f0f0; }' : ''}
        </style>
      </head>
      <body>
        ${html}
        ${showJsEditor ? `<script>${js}</script>` : ''}
      </body>
    </html>
  `
  
  const getPreviewWidth = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'w-[375px]'
      case 'tablet':
        return 'w-[768px]'
      case 'desktop':
      default:
        return 'w-full'
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {designImageUrl && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Design Reference</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      checked={showDesignOverlay}
                      onChange={() => setShowDesignOverlay(!showDesignOverlay)}
                      className="h-3 w-3"
                    />
                    Show as overlay
                  </label>
                  <a 
                    href={designImageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Open in new tab
                  </a>
                </div>
              </div>
              <div className="border rounded overflow-hidden">
                <img 
                  src={designImageUrl} 
                  alt="Design Reference" 
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          )}
          
          <Tab.Group onChange={setActiveTab} selectedIndex={activeTab}>
            <Tab.List className="flex rounded-t-lg border-b">
              <Tab className={({ selected }) => 
                `py-2 px-4 text-sm font-medium outline-none ${
                  selected 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }>
                HTML
              </Tab>
              <Tab className={({ selected }) => 
                `py-2 px-4 text-sm font-medium outline-none ${
                  selected 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }>
                CSS
              </Tab>
              {showJsEditor && (
                <Tab className={({ selected }) => 
                  `py-2 px-4 text-sm font-medium outline-none ${
                    selected 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }>
                  JavaScript
                </Tab>
              )}
            </Tab.List>
            <Tab.Panels className="border border-t-0 rounded-b-lg">
              <Tab.Panel className="p-4">
                <CodeEditor
                  initialCode={html}
                  language="html"
                  onChange={handleHtmlChange}
                  showPreview={false}
                  theme={previewMode === 'dark' ? 'dark' : 'light'}
                />
              </Tab.Panel>
              <Tab.Panel className="p-4">
                <CodeEditor
                  initialCode={css}
                  language="css"
                  onChange={handleCssChange}
                  showPreview={false}
                  theme={previewMode === 'dark' ? 'dark' : 'light'}
                />
              </Tab.Panel>
              {showJsEditor && (
                <Tab.Panel className="p-4">
                  <CodeEditor
                    initialCode={js}
                    language="javascript"
                    onChange={handleJsChange}
                    showPreview={false}
                    theme={previewMode === 'dark' ? 'dark' : 'light'}
                  />
                </Tab.Panel>
              )}
            </Tab.Panels>
          </Tab.Group>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Live Preview</h3>
            <div className="flex items-center gap-3">
              {responsivePreview && (
                <div className="flex items-center border rounded p-1">
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                    title="Mobile view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12" y2="18" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-1 rounded ${previewDevice === 'tablet' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                    title="Tablet view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12" y2="18" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                    title="Desktop view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </button>
                </div>
              )}
              <button
                onClick={() => setPreviewMode(prev => prev === 'light' ? 'dark' : 'light')}
                className="p-1 rounded hover:bg-gray-100"
                title={previewMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {previewMode === 'light' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              <button
                onClick={refreshPreview}
                className="text-primary text-sm hover:underline flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                  <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                Refresh
              </button>
            </div>
          </div>
          <div className="border rounded p-4 bg-white min-h-[400px] relative">
            {showDesignOverlay && designImageUrl && (
              <div className="absolute inset-0 pointer-events-none opacity-50 z-10">
                <img 
                  src={designImageUrl} 
                  alt="Design Overlay" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className={`mx-auto ${getPreviewWidth()} h-full transition-all duration-300 relative`}>
              <iframe
                key={previewKey}
                srcDoc={combinedCode}
                title="Preview"
                className="w-full min-h-[400px] border-none"
                sandbox="allow-scripts"
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <span>
              {previewDevice === 'mobile' ? '375px width (Mobile)' : 
               previewDevice === 'tablet' ? '768px width (Tablet)' : 
               'Full width (Desktop)'}
            </span>
            <span>
              {previewMode === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
