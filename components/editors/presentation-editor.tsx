"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"

interface PresentationEditorProps {
  content: string
  onChange: (content: string) => void
}

type Slide = {
  title: string
  content: string
  background?: string
}

type PresentationData = {
  slides: Slide[]
  theme?: string
}

export function PresentationEditor({ content, onChange }: PresentationEditorProps) {
  const [data, setData] = useState<PresentationData>({
    slides: [
      { title: "Welcome", content: "Start your presentation here" },
      { title: "Slide 2", content: "Add your content" },
    ],
  })
  const [currentSlide, setCurrentSlide] = useState(0)

  // Parse content if available
  useEffect(() => {
    if (content) {
      try {
        const parsedData = JSON.parse(content) as PresentationData
        setData(parsedData)
      } catch (e) {
        console.error("Failed to parse presentation data:", e)
      }
    }
  }, [content])

  // Update content when data changes
  useEffect(() => {
    onChange(JSON.stringify(data))
  }, [data, onChange])

  const handleSlideChange = (index: number, field: keyof Slide, value: string) => {
    const newData = { ...data }
    newData.slides[index] = { ...newData.slides[index], [field]: value }
    setData(newData)
  }

  const addSlide = () => {
    const newData = { ...data }
    newData.slides.push({ title: `Slide ${newData.slides.length + 1}`, content: "" })
    setData(newData)
    setCurrentSlide(newData.slides.length - 1)
  }

  const deleteSlide = (index: number) => {
    if (data.slides.length <= 1) return
    const newData = { ...data }
    newData.slides.splice(index, 1)
    setData(newData)
    if (currentSlide >= newData.slides.length) {
      setCurrentSlide(newData.slides.length - 1)
    }
  }

  const nextSlide = () => {
    if (currentSlide < data.slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addSlide}>
            <Plus className="h-4 w-4 mr-1" /> Add Slide
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteSlide(currentSlide)}
            disabled={data.slides.length <= 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevSlide} disabled={currentSlide === 0}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm">
            {currentSlide + 1} / {data.slides.length}
          </span>
          <Button variant="ghost" size="icon" onClick={nextSlide} disabled={currentSlide === data.slides.length - 1}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex gap-4 h-full">
          {/* Slide thumbnails */}
          <div className="w-32 space-y-2 overflow-auto">
            {data.slides.map((slide, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all ${index === currentSlide ? "ring-2 ring-primary" : ""}`}
                onClick={() => setCurrentSlide(index)}
              >
                <CardContent className="p-2">
                  <div className="text-xs font-medium truncate">{slide.title}</div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {slide.content.substring(0, 30)}
                    {slide.content.length > 30 ? "..." : ""}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Current slide editor */}
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Slide Title</label>
              <Input
                value={data.slides[currentSlide]?.title || ""}
                onChange={(e) => handleSlideChange(currentSlide, "title", e.target.value)}
                placeholder="Slide Title"
              />
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Slide Content</label>
              <Textarea
                value={data.slides[currentSlide]?.content || ""}
                onChange={(e) => handleSlideChange(currentSlide, "content", e.target.value)}
                placeholder="Slide Content"
                className="h-[calc(100%-2rem)] resize-none"
              />
            </div>
          </div>

          {/* Slide preview */}
          <div className="w-96 bg-black rounded-lg overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">{data.slides[currentSlide]?.title}</h2>
              <p className="whitespace-pre-line">{data.slides[currentSlide]?.content}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
