// Utility functions for generating code diffs

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber?: number
  originalLineNumber?: number
  newLineNumber?: number
}

export function generateCodeDiff(originalCode: string, newCode: string): DiffLine[] {
  const originalLines = originalCode.split('\n')
  const newLines = newCode.split('\n')
  const diff: DiffLine[] = []
  
  // Create a more sophisticated diff using a line-by-line comparison
  const originalSet = new Set(originalLines)
  const newSet = new Set(newLines)
  
  // Find lines that were removed (in original but not in new)
  const removedLines = originalLines.filter(line => !newSet.has(line))
  
  // Find lines that were added (in new but not in original)
  const addedLines = newLines.filter(line => !originalSet.has(line))
  
  // Create a merged view that shows the progression
  let originalIndex = 0
  let newIndex = 0
  
  while (originalIndex < originalLines.length || newIndex < newLines.length) {
    const originalLine = originalLines[originalIndex]
    const newLine = newLines[newIndex]
    
    if (originalLine === newLine) {
      // Lines match - unchanged
      diff.push({
        type: 'unchanged',
        content: originalLine,
        lineNumber: diff.length + 1,
        originalLineNumber: originalIndex + 1,
        newLineNumber: newIndex + 1
      })
      originalIndex++
      newIndex++
    } else if (removedLines.includes(originalLine)) {
      // This line was removed
      diff.push({
        type: 'removed',
        content: originalLine,
        lineNumber: diff.length + 1,
        originalLineNumber: originalIndex + 1
      })
      originalIndex++
    } else if (addedLines.includes(newLine)) {
      // This line was added
      diff.push({
        type: 'added',
        content: newLine,
        lineNumber: diff.length + 1,
        newLineNumber: newIndex + 1
      })
      newIndex++
    } else {
      // Lines are different but not clearly added/removed
      // Treat as removed + added
      if (originalLine) {
        diff.push({
          type: 'removed',
          content: originalLine,
          lineNumber: diff.length + 1,
          originalLineNumber: originalIndex + 1
        })
      }
      if (newLine) {
        diff.push({
          type: 'added',
          content: newLine,
          lineNumber: diff.length + 1,
          newLineNumber: newIndex + 1
        })
      }
      originalIndex++
      newIndex++
    }
  }
  
  return diff
}

export function getDiffSummary(diffLines: DiffLine[]) {
  const additions = diffLines.filter(line => line.type === 'added').length
  const deletions = diffLines.filter(line => line.type === 'removed').length
  const unchanged = diffLines.filter(line => line.type === 'unchanged').length
  
  return {
    additions,
    deletions,
    unchanged,
    totalChanges: additions + deletions,
    hasChanges: additions > 0 || deletions > 0
  }
}

// Function to create a side-by-side diff view
export function createSideBySideDiff(originalCode: string, newCode: string): string {
  const originalLines = originalCode.split('\n')
  const newLines = newCode.split('\n')
  
  // Use the same logic as generateCodeDiff for consistency
  const originalSet = new Set(originalLines)
  const newSet = new Set(newLines)
  
  // Find lines that were removed (in original but not in new)
  const removedLines = originalLines.filter(line => !newSet.has(line))
  
  // Find lines that were added (in new but not in original)
  const addedLines = newLines.filter(line => !originalSet.has(line))
  
  let result = ''
  let originalIndex = 0
  let newIndex = 0
  
  while (originalIndex < originalLines.length || newIndex < newLines.length) {
    const originalLine = originalLines[originalIndex]
    const newLine = newLines[newIndex]
    
    if (originalLine === newLine) {
      // Lines match - unchanged
      result += `  ${originalLine}\n`
      originalIndex++
      newIndex++
    } else if (removedLines.includes(originalLine)) {
      // This line was removed
      result += `- ${originalLine}\n`
      originalIndex++
    } else if (addedLines.includes(newLine)) {
      // This line was added
      result += `+ ${newLine}\n`
      newIndex++
    } else {
      // Lines are different but not clearly added/removed
      // Treat as removed + added
      if (originalLine) {
        result += `- ${originalLine}\n`
      }
      if (newLine) {
        result += `+ ${newLine}\n`
      }
      originalIndex++
      newIndex++
    }
  }
  
  return result.trim()
} 