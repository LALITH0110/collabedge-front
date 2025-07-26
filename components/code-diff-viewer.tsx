"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, FileText, Code } from 'lucide-react'
import { generateCodeDiff, getDiffSummary, type DiffLine } from '@/lib/diff-utils'

interface CodeDiffViewerProps {
  originalCode: string
  suggestedCode: string
  fileName: string
  onAccept: (newCode: string) => void
  onReject: () => void
  onClose: () => void
}

export function CodeDiffViewer({
  originalCode,
  suggestedCode,
  fileName,
  onAccept,
  onReject,
  onClose
}: CodeDiffViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const diffLines = generateCodeDiff(originalCode, suggestedCode)
  const { additions, deletions, hasChanges } = getDiffSummary(diffLines)

  const getLineClassName = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-500/20 border-l-4 border-green-500 text-green-900 dark:text-green-100'
      case 'removed':
        return 'bg-red-500/20 border-l-4 border-red-500 text-red-900 dark:text-red-100'
      default:
        return 'text-gray-700 dark:text-gray-300'
    }
  }

  const getLineIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      case 'removed':
        return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <X className="w-2 h-2 text-white" />
        </div>
      default:
        return <div className="w-4 h-4"></div>
    }
  }

  const getLinePrefix = (type: string) => {
    switch (type) {
      case 'added':
        return '+'
      case 'removed':
        return '-'
      default:
        return ' '
    }
  }

  if (!hasChanges) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            No Changes Suggested
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The suggested code is identical to the current code.</p>
          <Button onClick={onClose} className="mt-4">
            Close
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Code Changes for {fileName}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>{additions} additions</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>{deletions} deletions</span>
            </div>
          </div>

          {/* Diff View */}
          <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b">
              <span className="text-sm font-medium">Diff View</span>
            </div>
            <div className={`font-mono text-sm ${isExpanded ? 'max-h-96' : 'max-h-64'} overflow-y-auto`}>
              {diffLines.map((line, index) => (
                <div
                  key={index}
                  className={`px-4 py-1 flex items-start gap-3 ${getLineClassName(line.type)}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getLineIcon(line.type)}
                    <span className="text-xs text-gray-500 min-w-[3rem]">
                      {line.lineNumber}
                    </span>
                    <span className="text-xs text-gray-400 min-w-[1rem]">
                      {getLinePrefix(line.type)}
                    </span>
                  </div>
                  <div className="flex-1 break-all">
                    {line.content || ' '}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onReject}>
              <X className="w-4 h-4 mr-2" />
              Reject Changes
            </Button>
            <Button onClick={() => onAccept(suggestedCode)}>
              <Check className="w-4 h-4 mr-2" />
              Accept Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 