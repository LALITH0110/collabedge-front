"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Bot, 
  User, 
  X, 
  Sparkles, 
  Loader2,
  MessageSquare,
  Code,
  FileText,
  Brain,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  targetDocument?: any // Document that the AI wants to edit
  extractedCodeBlock?: { language: string; code: string } // For code extracted from text
  inlineDiffActive?: boolean // Track if inline diff is currently active for this message
}

interface AIChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  documents: any[]
  currentDocument: any
  roomId: string
  onApplySuggestion?: (suggestion: string, targetDocument?: any) => void
  onShowInlineDiff?: (originalCode: string, suggestedCode: string, targetDocument?: any) => void
}

export function AIChatSidebar({
  isOpen,
  onClose,
  documents,
  currentDocument,
  roomId,
  onApplySuggestion,
  onShowInlineDiff
}: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatUsage, setChatUsage] = useState<{
    remainingChats: number
    totalChats: number
    subscriptionPlan: string
  } | null>(null)
  const [isUpdatingChatUsage, setIsUpdatingChatUsage] = useState(false)
  
  // Local chat counter - increments every time user clicks send
  // Stored in localStorage permanently (survives browser restarts, sessions, etc.)
  const [localChatCount, setLocalChatCount] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ai_chat_count')
      return stored ? parseInt(stored, 10) : 0
    }
    return 0
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { token, user } = useAuth()

  // Function to fetch latest chat usage
  const fetchChatUsage = async () => {
    if (!token || user?.subscriptionPlan !== 'pro_ai') return
    
    setIsUpdatingChatUsage(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/user/chat-usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setChatUsage(data)
        console.log('Fetched latest chat usage:', data)
      }
    } catch (error) {
      console.error('Failed to fetch chat usage:', error)
    } finally {
      setIsUpdatingChatUsage(false)
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when sidebar opens and fetch chat usage for Pro+AI users
  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) {
      inputRef.current.focus()
      }
      // Fetch latest chat usage for Pro+AI users
      if (user?.subscriptionPlan === 'pro_ai') {
        fetchChatUsage()
      }
    }
  }, [isOpen, user?.subscriptionPlan])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Increment local chat counter immediately when send is clicked
    if (user?.subscriptionPlan === 'pro_ai') {
      const newCount = localChatCount + 1
      setLocalChatCount(newCount)
      localStorage.setItem('ai_chat_count', newCount.toString())
      console.log('Local chat count incremented to:', newCount)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      console.log('Sending AI chat request with token:', token ? 'Token present' : 'No token')
      console.log('Token value:', token ? token.substring(0, 20) + '...' : 'No token')
      console.log('User subscription plan:', user?.subscriptionPlan)
      console.log('Message:', inputMessage)
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-skip-next-api-route': 'true',
        },
        body: JSON.stringify({
          message: inputMessage,
          documents,
          roomId,
          currentDocument
        }),
      })
      
      console.log('AI chat response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        
        if (response.status === 429) {
          // Chat limit reached
          toast.error(`Chat limit reached! You've used all ${errorData.details.totalChats} chats.`)
          
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Sorry, you've reached your chat limit of 50 messages. Please upgrade your plan or wait until your next billing cycle to continue using AI features.`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, errorMessage])
          return
        }
        
        throw new Error(errorData.error || 'Failed to get AI response')
      }

      const data = await response.json()
      
      // Update chat usage
      if (data.chatUsage) {
        setChatUsage(data.chatUsage)
        console.log('Updated chat usage:', data.chatUsage)
      }
      
      // Show a subtle notification that chat count was incremented
      if (user?.subscriptionPlan === 'pro_ai') {
        toast.success('Chat count updated', {
          duration: 2000,
          position: 'bottom-right'
        })
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Check if the AI response contains code blocks and try to detect which document it's editing
      const codeBlocks = extractCodeBlocks(data.response)
      
      // Try to detect which document the AI is editing from the response
      const targetDocument = detectTargetDocument(data.response, documents)
      
      if (targetDocument) {
        console.log(`AI wants to edit document: ${targetDocument.name}`)
        // Store the target document info for the Apply button
        assistantMessage.targetDocument = targetDocument
        
        // If no code blocks were found but we detected a target document, 
        // try to extract code from the response
        if (codeBlocks.length === 0) {
          const extractedCode = extractCodeFromText(data.response, targetDocument)
          if (extractedCode) {
            // Create a code block from the extracted code
            const newCodeBlock = {
              language: getLanguageFromExtension(targetDocument.name),
              code: extractedCode
            }
            // Add the code block to the message
            assistantMessage.extractedCodeBlock = newCodeBlock
          }
        }
      }
    } catch (error) {
      console.error('AI Chat error:', error)
      toast.error('Failed to get AI response. Please try again.')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getSuggestedPrompts = () => {
    const basePrompts = [
      "Summarize all documents in this room",
      "Help me improve the code in any document",
      "Generate documentation for the code",
      "Find potential bugs in any code file",
      "Suggest improvements for any document"
    ]

    if (documents.length > 1) {
      return [
        "Edit the Python file to add error handling",
        "Update the SQL file with better queries",
        "Improve the code in any file",
        "Add comments to the code files",
        "Refactor any code for better readability"
      ]
    } else if (currentDocument?.type === 'code') {
      return [
        "Add error handling to this code",
        "Optimize this function for better performance",
        "Refactor this code to be more readable",
        "Add input validation",
        "Convert this to use async/await",
        "Add JSDoc comments",
        "Fix any potential bugs",
        "Make this code more maintainable"
      ]
    } else if (currentDocument?.type === 'word') {
      return [
        "Improve the writing style",
        "Check for grammar errors",
        "Make this more concise",
        "Expand on this topic",
        "Generate a summary"
      ]
    }

    return basePrompts
  }

  const handlePromptClick = (prompt: string) => {
    setInputMessage(prompt)
  }

  const toggleInlineDiff = (message: Message, codeBlock: { language: string; code: string }) => {
    const targetDoc = message.targetDocument || documents.find(doc => doc.type === 'code')
    
    if (!targetDoc || targetDoc.type !== 'code') return

    if (message.inlineDiffActive) {
      // If inline diff is active, close it
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, inlineDiffActive: false } : msg
      ))
      // Call the close function to hide the diff
      if (onShowInlineDiff) {
        // Pass empty strings to indicate closing
        onShowInlineDiff('', '', targetDoc)
      }
    } else {
      // If inline diff is not active, show it
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, inlineDiffActive: true } : msg
      ))
      // Call the show function to display the diff
      if (onShowInlineDiff) {
        onShowInlineDiff(targetDoc.content || '', codeBlock.code, targetDoc)
      }
    }
  }

  const detectTargetDocument = (aiResponse: string, documents: any[]) => {
    // Look for document names in the AI response
    for (const doc of documents) {
      const docNamePattern = new RegExp(`\\b${doc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (docNamePattern.test(aiResponse)) {
        return doc
      }
    }
    
    // Look for file extensions in the AI response
    const fileExtensions = documents.map(doc => {
      const extension = doc.name.split('.').pop()?.toLowerCase()
      return { doc, extension }
    }).filter(item => item.extension)
    
    for (const { doc, extension } of fileExtensions) {
      const extensionPattern = new RegExp(`\\.${extension}\\b`, 'i')
      if (extensionPattern.test(aiResponse)) {
        return doc
      }
    }
    
    // Look for programming language mentions
    const languageMap: { [key: string]: string[] } = {
      'python': ['.py', '.pyw'],
      'javascript': ['.js', '.jsx', '.ts', '.tsx'],
      'java': ['.java'],
      'cpp': ['.cpp', '.cc', '.cxx', '.h', '.hpp'],
      'c': ['.c', '.h'],
      'html': ['.html', '.htm'],
      'css': ['.css', '.scss', '.sass'],
      'php': ['.php'],
      'ruby': ['.rb'],
      'go': ['.go'],
      'rust': ['.rs'],
      'swift': ['.swift'],
      'kotlin': ['.kt'],
      'scala': ['.scala'],
      'r': ['.r'],
      'matlab': ['.m'],
      'sql': ['.sql'],
      'bash': ['.sh', '.bash'],
      'powershell': ['.ps1'],
      'yaml': ['.yml', '.yaml'],
      'json': ['.json'],
      'xml': ['.xml'],
      'markdown': ['.md', '.markdown']
    }
    
    for (const [language, extensions] of Object.entries(languageMap)) {
      const languagePattern = new RegExp(`\\b${language}\\b`, 'i')
      if (languagePattern.test(aiResponse)) {
        // Find a document with matching extension
        const matchingDoc = documents.find(doc => {
          const docExtension = doc.name.split('.').pop()?.toLowerCase()
          return extensions.includes(`.${docExtension}`)
        })
        if (matchingDoc) {
          return matchingDoc
        }
      }
    }
    
    // If no specific document is mentioned, return null (will use first code file)
    return null
  }

  const extractCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const blocks: { language: string; code: string }[] = []
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      })
    }

    return blocks
  }

  const getLanguageFromExtension = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase()
    const languageMap: { [key: string]: string } = {
      'py': 'python',
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'java': 'java',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'h': 'cpp',
      'hpp': 'cpp',
      'c': 'c',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'r': 'r',
      'm': 'matlab',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'ps1': 'powershell',
      'yml': 'yaml',
      'yaml': 'yaml',
      'json': 'json',
      'xml': 'xml',
      'md': 'markdown',
      'markdown': 'markdown'
    }
    return languageMap[extension || ''] || 'text'
  }

  const extractCodeFromText = (text: string, targetDocument: any): string | null => {
    // Look for code patterns in the text
    const lines = text.split('\n')
    const codeLines: string[] = []
    let inCodeSection = false
    
    for (const line of lines) {
      // Check if we're entering a code section
      if (line.includes('```') || line.includes('code:') || line.includes('Code:') || 
          line.includes('Here is the') || line.includes('Here\'s the') ||
          line.includes('Updated code:') || line.includes('Modified code:')) {
        inCodeSection = true
        continue
      }
      
      // Check if we're exiting a code section
      if (line.includes('```') && inCodeSection) {
        inCodeSection = false
        break
      }
      
      // If we're in a code section, collect the lines
      if (inCodeSection && line.trim()) {
        codeLines.push(line)
      }
    }
    
    // If we found code lines, return them
    if (codeLines.length > 0) {
      return codeLines.join('\n')
    }
    
    // If no code section was found, try to extract code-like content
    const codePattern = /(def\s+\w+|function\s+\w+|class\s+\w+|import\s+|from\s+|const\s+|let\s+|var\s+|if\s*\(|for\s*\(|while\s*\()/i
    const potentialCodeLines = lines.filter(line => 
      codePattern.test(line.trim()) || 
      line.trim().includes('=') || 
      line.trim().includes('(') && line.trim().includes(')') ||
      line.trim().startsWith('def ') ||
      line.trim().startsWith('function ') ||
      line.trim().startsWith('class ') ||
      line.trim().startsWith('import ') ||
      line.trim().startsWith('from ')
    )
    
    if (potentialCodeLines.length > 0) {
      return potentialCodeLines.join('\n')
    }
    
    return null
  }

  const renderMessage = (message: Message) => {
    const codeBlocks = extractCodeBlocks(message.content)
    let content = message.content

    // Replace code blocks with placeholders
    codeBlocks.forEach((block, index) => {
      content = content.replace(
        /```(\w+)?\n([\s\S]*?)```/,
        `__CODE_BLOCK_${index}__`
      )
    })

    // Add extracted code block if it exists
    const allCodeBlocks = [...codeBlocks]
    if (message.extractedCodeBlock) {
      allCodeBlocks.push(message.extractedCodeBlock)
      content += `\n\n__CODE_BLOCK_${allCodeBlocks.length - 1}__`
    }

    return (
      <div key={message.id} className="mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            message.role === 'user' 
              ? 'bg-blue-500 text-white' 
              : 'bg-purple-500 text-white'
          }`}>
            {message.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium mb-1">
              {message.role === 'user' ? 'You' : 'Claude'}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              {message.timestamp.toLocaleTimeString()}
            </div>
            <div className="prose prose-xs max-w-none [&>*]:!text-left">
              {content.split('__CODE_BLOCK_').map((part, index) => {
                if (index === 0) {
                  return <p key={index} className="whitespace-pre-wrap text-xs">{part}</p>
                }
                
                const [blockIndex, ...rest] = part.split('__')
                const codeBlock = allCodeBlocks[parseInt(blockIndex)]
                const remainingText = rest.join('__')
                
                return (
                  <div key={index} className="not-prose">
                    <div className="bg-[#1e1e1e] text-[#d4d4d4] p-3 rounded-md my-2 font-mono text-xs border border-[#3c3c3c]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-[#858585]">{codeBlock.language}</span>
                        {onShowInlineDiff && (() => {
                          // Check if we have a target document or if any document in the room is a code file
                          const targetDoc = message.targetDocument || documents.find(doc => doc.type === 'code')
                          
                          if (targetDoc && targetDoc.type === 'code') {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className={`h-5 px-2 text-xs border-[#3c3c3c] ${
                                  message.inlineDiffActive 
                                    ? 'bg-[#3c3c3c] text-[#ffffff] hover:bg-[#4c4c4c]' 
                                    : 'bg-[#2d2d30] text-[#cccccc] hover:bg-[#3c3c3c]'
                                }`}
                                onClick={() => toggleInlineDiff(message, codeBlock)}
                              >
                                {message.inlineDiffActive ? 'Hide Diff' : `Inline Diff ${targetDoc.id !== currentDocument?.id ? `(${targetDoc.name})` : ''}`}
                              </Button>
                            )
                          }
                          return null
                        })()}
                        {onApplySuggestion && (() => {
                          // Check if we have a target document or if any document in the room is a code file
                          const targetDoc = message.targetDocument || documents.find(doc => doc.type === 'code')
                          
                          if (targetDoc && targetDoc.type === 'code') {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-5 px-2 text-xs bg-[#2d2d30] text-[#cccccc] hover:bg-[#3c3c3c] border-[#3c3c3c]"
                                onClick={() => {
                                  onApplySuggestion(codeBlock.code, targetDoc)
                                }}
                              >
                                Apply to {targetDoc.name}
                              </Button>
                            )
                          }
                          return null
                        })()}
                      </div>
                      <div style={{ 
                        overflowX: 'auto', 
                        overflowY: 'hidden',
                        width: '100%',
                        maxWidth: '100%',
                        border: '1px solid #3c3c3c',
                        borderRadius: '4px',
                        padding: '8px',
                        backgroundColor: '#1e1e1e'
                      }}>
                        <pre style={{ 
                          margin: 0,
                          padding: 0,
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre',
                          minWidth: 'max-content',
                          display: 'block',
                          color: '#d4d4d4'
                        }}>{codeBlock.code}</pre>
                      </div>
                    </div>
                    {remainingText && <p className="whitespace-pre-wrap text-xs">{remainingText}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-[450px] bg-background border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Powered by Claude Haiku</p>
            {user?.subscriptionPlan === 'pro_ai' && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  {localChatCount} chats used
              </p>
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggested Prompts */}
      {messages.length === 0 && (
        <div className="p-4 border-b">
          <h4 className="text-xs font-medium mb-3">Suggested Prompts</h4>
          <div className="space-y-2">
            {getSuggestedPrompts().map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto p-2 text-xs"
                onClick={() => handlePromptClick(prompt)}
              >
                <MessageSquare className="w-3 h-3 mr-2" />
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Brain className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <p className="text-xs">Start a conversation with Claude</p>
            <p className="text-xs">I can help with code, writing, and analysis</p>
          </div>
        ) : (
          <div>
            {messages.map(renderMessage)}
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs text-muted-foreground">Claude is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Claude anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>


    </div>
  )
} 