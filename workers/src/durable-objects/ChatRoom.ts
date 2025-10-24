// Durable Object for real-time chat
export class ChatRoom {
  private state: DurableObjectState
  private sessions: Set<WebSocket> = new Set()
  private messages: Array<{
    id: string
    user_id: string
    conversation_id: string
    content: string
    timestamp: number
    type: 'text' | 'image' | 'file'
  }> = []

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request)
    }
    
    if (url.pathname === '/messages') {
      return this.handleMessages(request)
    }
    
    if (url.pathname === '/send') {
      return this.handleSendMessage(request)
    }

    return new Response('Not found', { status: 404 })
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    server.accept()
    this.sessions.add(server)

    // Send recent messages to new connection
    const recentMessages = this.messages.slice(-50) // Last 50 messages
    server.send(JSON.stringify({
      type: 'history',
      messages: recentMessages
    }))

    server.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data as string)
        this.handleMessage(data, server)
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    })

    server.addEventListener('close', () => {
      this.sessions.delete(server)
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  private async handleMessage(data: any, sender: WebSocket) {
    switch (data.type) {
      case 'join':
        // User joins a conversation
        console.log(`User ${data.user_id} joined conversation ${data.conversation_id}`)
        break
        
      case 'message':
        // New message
        const message = {
          id: crypto.randomUUID(),
          user_id: data.user_id,
          conversation_id: data.conversation_id,
          content: data.content,
          timestamp: Date.now(),
          type: data.message_type || 'text'
        }
        
        this.messages.push(message)
        
        // Broadcast to all connected clients
        this.broadcast({
          type: 'new_message',
          message
        })
        break
        
      case 'typing':
        // User is typing
        this.broadcast({
          type: 'typing',
          user_id: data.user_id,
          conversation_id: data.conversation_id,
          is_typing: data.is_typing
        })
        break
        
      case 'read':
        // Message read receipt
        this.broadcast({
          type: 'read',
          user_id: data.user_id,
          conversation_id: data.conversation_id,
          message_id: data.message_id
        })
        break
    }
  }

  private broadcast(data: any) {
    const message = JSON.stringify(data)
    this.sessions.forEach(ws => {
      try {
        ws.send(message)
      } catch (error) {
        console.error('Broadcast error:', error)
        this.sessions.delete(ws)
      }
    })
  }

  private async handleMessages(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const conversationId = url.searchParams.get('conversation_id')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let filteredMessages = this.messages
    
    if (conversationId) {
      filteredMessages = this.messages.filter(m => m.conversation_id === conversationId)
    }

    const paginatedMessages = filteredMessages
      .slice(offset, offset + limit)
      .sort((a, b) => b.timestamp - a.timestamp)

    return new Response(JSON.stringify({
      success: true,
      messages: paginatedMessages,
      total: filteredMessages.length,
      has_more: offset + limit < filteredMessages.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  private async handleSendMessage(request: Request): Promise<Response> {
    try {
      const data = await request.json()
      
      const message = {
        id: crypto.randomUUID(),
        user_id: data.user_id,
        conversation_id: data.conversation_id,
        content: data.content,
        timestamp: Date.now(),
        type: data.type || 'text'
      }
      
      this.messages.push(message)
      
      // Broadcast to all connected clients
      this.broadcast({
        type: 'new_message',
        message
      })
      
      return new Response(JSON.stringify({
        success: true,
        message
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to send message'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
