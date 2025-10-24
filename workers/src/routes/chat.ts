import { Hono } from 'hono'

export function createChatRoutes(app: Hono) {
  // Get chat room durable object
  function getChatRoom(c: any, conversationId: string) {
    const id = c.env.CHAT_ROOM.idFromName(conversationId)
    return c.env.CHAT_ROOM.get(id)
  }

  // WebSocket endpoint for real-time chat
  app.get('/api/chat/:conversation_id/ws', async (c) => {
    const conversationId = c.req.param('conversation_id')
    const chatRoom = getChatRoom(c, conversationId)
    
    return chatRoom.fetch(new Request(`${c.req.url}/websocket`, {
      method: c.req.method,
      headers: c.req.headers
    }))
  })

  // Get messages for a conversation
  app.get('/api/chat/:conversation_id/messages', async (c) => {
    const conversationId = c.req.param('conversation_id')
    const limit = c.req.query('limit') || '50'
    const offset = c.req.query('offset') || '0'
    
    const chatRoom = getChatRoom(c, conversationId)
    
    const url = new URL(c.req.url)
    url.pathname = '/messages'
    url.searchParams.set('conversation_id', conversationId)
    url.searchParams.set('limit', limit)
    url.searchParams.set('offset', offset)
    
    return chatRoom.fetch(new Request(url.toString()))
  })

  // Send a message
  app.post('/api/chat/:conversation_id/send', async (c) => {
    try {
      const conversationId = c.req.param('conversation_id')
      const body = await c.req.json()
      
      if (!body.user_id || !body.content) {
        return c.json({
          success: false,
          error: 'user_id and content are required'
        }, 400)
      }

      const chatRoom = getChatRoom(c, conversationId)
      
      const url = new URL(c.req.url)
      url.pathname = '/send'
      
      return chatRoom.fetch(new Request(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          conversation_id: conversationId
        })
      }))
      
    } catch (error) {
      console.error('Send message error:', error)
      return c.json({
        success: false,
        error: 'Failed to send message'
      }, 500)
    }
  })

  // Create a new conversation
  app.post('/api/chat/conversations', async (c) => {
    try {
      const { participants, type = 'direct', title } = await c.req.json()
      
      if (!participants || participants.length < 2) {
        return c.json({
          success: false,
          error: 'At least 2 participants required'
        }, 400)
      }

      const conversationId = crypto.randomUUID()
      
      // Create conversation in D1 database
      const db = c.env.DB
      await db.prepare(`
        INSERT INTO conversations (id, type, title, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        conversationId,
        type,
        title || null,
        Date.now(),
        Date.now()
      ).run()

      // Add participants
      for (const participantId of participants) {
        await db.prepare(`
          INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
          VALUES (?, ?, ?)
        `).bind(conversationId, participantId, Date.now()).run()
      }

      return c.json({
        success: true,
        conversation: {
          id: conversationId,
          type,
          title,
          participants,
          created_at: Date.now()
        }
      })
      
    } catch (error) {
      console.error('Create conversation error:', error)
      return c.json({
        success: false,
        error: 'Failed to create conversation'
      }, 500)
    }
  })

  // Get user conversations
  app.get('/api/chat/conversations', async (c) => {
    try {
      const userId = c.req.query('user_id')
      
      if (!userId) {
        return c.json({
          success: false,
          error: 'user_id is required'
        }, 400)
      }

      const db = c.env.DB
      const conversations = await db.prepare(`
        SELECT c.*, 
               GROUP_CONCAT(cp.user_id) as participants,
               m.content as last_message,
               m.created_at as last_message_at
        FROM conversations c
        LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE cp.user_id = ?
        GROUP BY c.id
        ORDER BY COALESCE(m.created_at, c.created_at) DESC
      `).bind(userId).all()

      return c.json({
        success: true,
        conversations: conversations.results
      })
      
    } catch (error) {
      console.error('Get conversations error:', error)
      return c.json({
        success: false,
        error: 'Failed to get conversations'
      }, 500)
    }
  })

  // Mark messages as read
  app.post('/api/chat/:conversation_id/read', async (c) => {
    try {
      const conversationId = c.req.param('conversation_id')
      const { user_id, message_id } = await c.req.json()
      
      if (!user_id) {
        return c.json({
          success: false,
          error: 'user_id is required'
        }, 400)
      }

      const db = c.env.DB
      
      if (message_id) {
        // Mark specific message as read
        await db.prepare(`
          INSERT OR REPLACE INTO message_reads (message_id, user_id, read_at)
          VALUES (?, ?, ?)
        `).bind(message_id, user_id, Date.now()).run()
      } else {
        // Mark all messages in conversation as read
        await db.prepare(`
          INSERT OR REPLACE INTO message_reads (message_id, user_id, read_at)
          SELECT m.id, ?, ?
          FROM messages m
          WHERE m.conversation_id = ? AND m.user_id != ?
        `).bind(user_id, Date.now(), conversationId, user_id).run()
      }

      return c.json({
        success: true,
        message: 'Messages marked as read'
      })
      
    } catch (error) {
      console.error('Mark read error:', error)
      return c.json({
        success: false,
        error: 'Failed to mark messages as read'
      }, 500)
    }
  })

  // Get unread message count
  app.get('/api/chat/unread-count', async (c) => {
    try {
      const userId = c.req.query('user_id')
      
      if (!userId) {
        return c.json({
          success: false,
          error: 'user_id is required'
        }, 400)
      }

      const db = c.env.DB
      const result = await db.prepare(`
        SELECT COUNT(*) as unread_count
        FROM messages m
        LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
        WHERE m.user_id != ? AND mr.id IS NULL
      `).bind(userId, userId).first()

      return c.json({
        success: true,
        unread_count: result?.unread_count || 0
      })
      
    } catch (error) {
      console.error('Unread count error:', error)
      return c.json({
        success: false,
        error: 'Failed to get unread count'
      }, 500)
    }
  })
}
