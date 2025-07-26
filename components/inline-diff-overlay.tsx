"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, ArrowRight } from 'lucide-react'
import { generateCodeDiff, DiffLine, createSideBySideDiff } from '@/lib/diff-utils'

interface InlineDiffOverlayProps {
  originalCode: string
  suggestedCode: string
  onAccept: (newCode: string) => void
  onReject: () => void
  onClose: () => void
  editorRef: any // Monaco editor reference
  onUpdateEditorContent: (content: string) => void
}

export function InlineDiffOverlay({
  originalCode,
  suggestedCode,
  onAccept,
  onReject,
  onClose,
  editorRef,
  onUpdateEditorContent
}: InlineDiffOverlayProps) {
  const [diffLines, setDiffLines] = useState<DiffLine[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [showDiff, setShowDiff] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)
  const decorationIdsRef = useRef<string[]>([])
  const initializedRef = useRef(false)

  useEffect(() => {
    if (editorRef?.current && originalCode && suggestedCode && !initializedRef.current) {
      initializedRef.current = true
      
      const diff = generateCodeDiff(originalCode, suggestedCode)
      setDiffLines(diff)
      setIsVisible(true)
      
      // Show the diff view instead of just the suggested code
      showDiffView(diff, originalCode, suggestedCode)
    }
  }, [originalCode, suggestedCode, editorRef])

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up decorations when component unmounts
      cleanupDecorations()
      initializedRef.current = false
    }
  }, [editorRef])

  // Cleanup effect when component becomes invisible
  useEffect(() => {
    if (!isVisible && decorationIdsRef.current.length > 0) {
      console.log('Component became invisible, cleaning up decorations')
      cleanupDecorations()
    }
  }, [isVisible])

  const showDiffView = (diff: DiffLine[], originalCode: string, suggestedCode: string) => {
    if (!editorRef?.current) return

    // Use the new side-by-side diff function
    const diffContent = createSideBySideDiff(originalCode, suggestedCode)
    
    console.log('Showing diff view with content:', diffContent.substring(0, 100) + '...')
    
    // Update editor content with the diff view
    onUpdateEditorContent(diffContent)
    
    // Add decorations after content is updated with a longer delay to ensure content is set
    setTimeout(() => {
      if (editorRef?.current) {
        const currentContent = editorRef.current.getValue()
        console.log('Current editor content after update:', currentContent.substring(0, 100) + '...')
        addDiffDecorations(diffContent)
      }
    }, 200)
  }

  const addDiffDecorations = (content: string) => {
    if (!editorRef?.current) return

    const editor = editorRef.current
    const decorations: any[] = []
    const lines = content.split('\n')

    // Clean up any existing decorations first
    cleanupDecorations()

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      
      if (line.startsWith('+ ')) {
        // Green background for added lines
        decorations.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: line.length + 1
          },
          options: {
            isWholeLine: true,
            className: 'diff-added-line',
            glyphMarginClassName: 'diff-added-glyph'
          }
        })
      } else if (line.startsWith('- ')) {
        // Red background for removed lines
        decorations.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: line.length + 1
          },
          options: {
            isWholeLine: true,
            className: 'diff-removed-line',
            glyphMarginClassName: 'diff-removed-glyph'
          }
        })
      }
    })

    // Apply decorations
    try {
      const decorationIds = editor.deltaDecorations([], decorations)
      decorationIdsRef.current = decorationIds
      console.log(`Applied ${decorations.length} diff decorations`)
    } catch (error) {
      console.warn('Error applying diff decorations:', error)
      decorationIdsRef.current = []
    }
  }

  const cleanupDecorations = () => {
    if (editorRef?.current && decorationIdsRef.current.length > 0) {
      try {
        console.log(`Cleaning up ${decorationIdsRef.current.length} decorations`)
        editorRef.current.deltaDecorations(decorationIdsRef.current, [])
        decorationIdsRef.current = []
      } catch (error) {
        console.warn('Error cleaning up decorations:', error)
        decorationIdsRef.current = []
      }
    }
    // Also try to clear all decorations as a fallback
    if (editorRef?.current) {
      try {
        editorRef.current.deltaDecorations([], [])
      } catch (error) {
        console.warn('Error clearing all decorations:', error)
      }
    }
  }

  const handleAccept = () => {
    console.log('Accepting diff changes')
    // Clean up decorations first
    cleanupDecorations()
    // Apply the suggested code
    onUpdateEditorContent(suggestedCode)
    initializedRef.current = false
    onAccept(suggestedCode)
    setIsVisible(false)
    onClose()
  }

  const handleReject = () => {
    console.log('Rejecting diff changes')
    // Clean up decorations first
    cleanupDecorations()
    // Revert editor content back to original
    onUpdateEditorContent(originalCode)
    initializedRef.current = false
    onReject()
    setIsVisible(false)
    onClose()
  }

  const toggleDiffView = () => {
    // Clean up existing decorations before switching
    cleanupDecorations()
    
    if (showDiff) {
      // Switch to suggested code view
      onUpdateEditorContent(suggestedCode)
      setShowDiff(false)
    } else {
      // Switch back to diff view
      showDiffView(diffLines, originalCode, suggestedCode)
      setShowDiff(true)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Diff controls */}
      <div className="absolute top-4 right-4 bg-background border border-border rounded-lg shadow-lg p-3 pointer-events-auto max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-sm font-medium">AI Suggestions</span>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <Button
            size="sm"
            onClick={handleAccept}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-3 h-3 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <X className="w-3 h-3 mr-1" />
            Reject
          </Button>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={toggleDiffView}
          className="w-full"
        >
          {showDiff ? 'Show Suggested Code' : 'Show Diff View'}
        </Button>
        
        <div className="mt-2 text-xs text-muted-foreground">
          {diffLines.filter(line => line.type === 'added').length} additions, {diffLines.filter(line => line.type === 'removed').length} deletions
        </div>
        <div className="mt-1 text-xs text-blue-600">
          💡 {showDiff ? 'Red lines (-) = deleted, Green lines (+) = added' : 'Viewing suggested code'}
        </div>
      </div>
    </div>
  )
} 