"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Save } from "lucide-react"

interface CustomEditorProps {
  content: string
  onChange: (content: string) => void
}

type CustomEditorData = {
  markdown: string
  preview: boolean
}

export function CustomEditor({ content, onChange }: CustomEditorProps) {
  const [data, setData] = useState<CustomEditorData>({
    markdown:
      "# Custom Editor\n\nThis is a custom editor where you can define your own format.\n\n- Item 1\n- Item 2\n- Item 3\n\n```js\nconsole.log('Hello, world!');\n```",
    preview: false,
  })
  const [activeTab, setActiveTab] = useState<string>("edit")

  // Parse content if available
  useEffect(() => {
    if (content) {
      try {
        const parsedData = JSON.parse(content) as CustomEditorData
        setData(parsedData)
      } catch (e) {
        console.error("Failed to parse custom editor data:", e)
      }
    }
  }, [content])

  // Update content when data changes
  useEffect(() => {
    onChange(JSON.stringify(data))
  }, [data, onChange])

  const handleMarkdownChange = (markdown: string) => {
    setData((prev) => ({ ...prev, markdown }))
  }

  const togglePreview = () => {
    setData((prev) => ({ ...prev, preview: !prev.preview }))
  }

  // Simple markdown renderer (in a real app, use a proper markdown library)
  const renderMarkdown = (markdown: string) => {
    return markdown.split("\n").map((line, i) => {
      if (line.startsWith("# ")) {
        return (
          <h1 key={i} className="text-2xl font-bold mb-4">
            {line.substring(2)}
          </h1>
        )
      } else if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="text-xl font-bold mb-3">
            {line.substring(3)}
          </h2>
        )
      } else if (line.startsWith("- ")) {
        return (
          <li key={i} className="ml-6 list-disc">
            {line.substring(2)}
          </li>
        )
      } else if (line.trim() === "") {
        return <br key={i} />
      } else if (line.startsWith("```")) {
        return (
          <pre key={i} className="bg-muted p-2 rounded my-2 font-mono text-sm">
            {line}
          </pre>
        )
      } else {
        return (
          <p key={i} className="mb-2">
            {line}
          </p>
        )
      }
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-2 flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" className="gap-1">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <TabsContent value="edit" className="h-full mt-0">
          <Textarea
            value={data.markdown}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            className="h-full min-h-[calc(100vh-10rem)] resize-none font-mono"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <Card>
            <CardContent className="p-6">{renderMarkdown(data.markdown)}</CardContent>
          </Card>
        </TabsContent>
      </div>
    </div>
  )
}
