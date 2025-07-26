"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface SpreadsheetEditorProps {
  content: string
  onChange: (content: string) => void
}

type Cell = {
  value: string
  formula?: string
}

type SpreadsheetData = {
  rows: Cell[][]
}

export function SpreadsheetEditor({ content, onChange }: SpreadsheetEditorProps) {
  const [data, setData] = useState<SpreadsheetData>({
    rows: Array(10)
      .fill(null)
      .map(() =>
        Array(8)
          .fill(null)
          .map(() => ({ value: "" })),
      ),
  })
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null)

  // Parse content if available
  useEffect(() => {
    if (content) {
      try {
        const parsedData = JSON.parse(content) as SpreadsheetData
        setData(parsedData)
      } catch (e) {
        console.error("Failed to parse spreadsheet data:", e)
      }
    }
  }, [content])

  // Update content when data changes
  useEffect(() => {
    onChange(JSON.stringify(data))
  }, [data, onChange])

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = { ...data }
    newData.rows[rowIndex][colIndex] = { value }
    setData(newData)
  }

  const addRow = () => {
    const newData = { ...data }
    newData.rows.push(
      Array(data.rows[0].length)
        .fill(null)
        .map(() => ({ value: "" })),
    )
    setData(newData)
  }

  const addColumn = () => {
    const newData = { ...data }
    newData.rows = newData.rows.map((row) => [...row, { value: "" }])
    setData(newData)
  }

  const deleteRow = (rowIndex: number) => {
    if (data.rows.length <= 1) return
    const newData = { ...data }
    newData.rows.splice(rowIndex, 1)
    setData(newData)
  }

  // Generate column labels (A, B, C, ...)
  const getColumnLabel = (index: number) => {
    return String.fromCharCode(65 + index)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-2 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" /> Add Row
        </Button>
        <Button variant="outline" size="sm" onClick={addColumn}>
          <Plus className="h-4 w-4 mr-1" /> Add Column
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              {data.rows[0].map((_, colIndex) => (
                <TableHead key={colIndex}>{getColumnLabel(colIndex)}</TableHead>
              ))}
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                {row.map((cell, colIndex) => (
                  <TableCell key={colIndex} className="p-0">
                    <Input
                      value={cell.value}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      onFocus={() => setActiveCell({ row: rowIndex, col: colIndex })}
                      className="border-0 h-10 focus:ring-0 focus:ring-offset-0"
                    />
                  </TableCell>
                ))}
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteRow(rowIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
