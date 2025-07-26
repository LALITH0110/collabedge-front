import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { roomId: string; documentId: string } }
) {
  try {
    const { roomId, documentId } = params
    
    // Get the form data from the request
    const formData = await request.formData()
    
    // Forward the request to the backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'
    const backendResponse = await fetch(
      `${backendUrl}/api/rooms/${roomId}/documents/${documentId}/upload-image`,
      {
        method: 'PUT',
        body: formData,
      }
    )

    if (!backendResponse.ok) {
      console.error('Backend upload failed:', backendResponse.status, backendResponse.statusText)
      return NextResponse.json(
        { error: 'Failed to upload image to backend' },
        { status: backendResponse.status }
      )
    }

    const result = await backendResponse.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 