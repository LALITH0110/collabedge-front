import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  console.log('=== AI CHAT API ROUTE CALLED ===')
  try {
    const { message, documents, roomId, documentType, currentDocument } = await request.json()
    console.log('Received message:', message)

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Check chat usage before proceeding
    console.log('Checking chat usage for token:', token.substring(0, 20) + '...')
    
    let chatUsage;
    try {
      const chatUsageResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/user/chat-usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Chat usage response status:', chatUsageResponse.status)

      if (!chatUsageResponse.ok) {
        const errorText = await chatUsageResponse.text()
        console.error('Chat usage check failed:', errorText)
        console.error('Full error response:', errorText)
        
        // If backend is not available, allow the request to proceed with a fallback
        if (chatUsageResponse.status === 404 || chatUsageResponse.status === 500) {
          console.log('Backend not available, proceeding with fallback chat usage')
          chatUsage = {
            canUseAIChat: true,
            remainingChats: 999,
            totalChats: 0,
            subscriptionPlan: 'pro_ai'
          }
        } else {
          return NextResponse.json({ 
            error: 'Failed to check chat usage', 
            details: errorText 
          }, { status: chatUsageResponse.status })
        }
      } else {
        chatUsage = await chatUsageResponse.json()
        console.log('Chat usage data:', chatUsage)
      }
    } catch (error) {
      console.error('Error checking chat usage:', error)
      // If we can't connect to backend, allow the request to proceed
      console.log('Backend connection failed, proceeding with fallback chat usage')
      chatUsage = {
        canUseAIChat: true,
        remainingChats: 999,
        totalChats: 0,
        subscriptionPlan: 'pro_ai'
      }
    }
    
    if (!chatUsage.canUseAIChat) {
      return NextResponse.json({ 
        error: 'Chat limit reached', 
        details: {
          subscriptionPlan: chatUsage.subscriptionPlan,
          totalChats: chatUsage.totalChats,
          remainingChats: chatUsage.remainingChats
        }
      }, { status: 429 })
    }

    // Note: Chat counter is now handled locally in the frontend
    // It increments immediately when the user clicks send

    // Build context from documents
    let documentsContext = ''
    if (documents && documents.length > 0) {
      documentsContext = '\n\n=== ALL DOCUMENTS IN THIS ROOM ===\n'
      documents.forEach((doc: any, index: number) => {
        documentsContext += `\n--- DOCUMENT ${index + 1}: ${doc.name} (${doc.type}) ---\n`
        if (doc.content) {
          documentsContext += doc.content
        } else {
          documentsContext += 'Empty document'
        }
        documentsContext += '\n'
      })
      documentsContext += '\n=== END OF DOCUMENTS ===\n'
    }

    // Build the system prompt based on the request
    let systemPrompt = `You are Claude, an AI assistant integrated into a real-time collaborative editor called CollabEdge. 

You have FULL ACCESS to ALL documents in the current room and can help users with various tasks including:
- Code editing and generation
- Text summarization and generation
- Document analysis
- Programming assistance
- Content creation

IMPORTANT RULES:
1. You can edit ANY document in the room, regardless of which document the user is currently viewing
2. When the user asks to edit a specific document, provide the COMPLETE updated content for that document
3. Always specify which document you're editing in your response
4. When editing code, provide the COMPLETE updated code file, not just the changes
5. Do not use placeholders like "..." or "// rest of the code" - provide the full, working code

${documentsContext}

Current document being viewed: ${currentDocument ? `${currentDocument.name} (${currentDocument.type})` : 'None'}

Remember: You can edit ANY document in the room, not just the currently viewed document!`

    console.log('Calling Anthropic API with message:', message.substring(0, 100) + '...')
    
    let response;
    try {
      response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
      
      console.log('Anthropic API response received')
    } catch (error) {
      console.error('Anthropic API error:', error)
      return NextResponse.json({ 
        error: 'Failed to get AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }



    return NextResponse.json({
      response: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: response.usage,
      chatUsage: {
        remainingChats: chatUsage.remainingChats,
        totalChats: chatUsage.totalChats,
        subscriptionPlan: chatUsage.subscriptionPlan
      }
    })

  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    )
  }
} 