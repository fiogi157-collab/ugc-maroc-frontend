// ===========================================================
// 🎥 UGC Maroc - Stream Routes (Vidéos UGC)
// ===========================================================

import { Hono } from 'hono'
import { StreamService } from '../services/stream.js'

export function createStreamRoutes(app: Hono) {
  
  // Helper pour initialiser StreamService
  app.use('/api/stream/*', async (c, next) => {
    // Récupérer les credentials depuis les secrets
    const accountId = c.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = c.env.CLOUDFLARE_API_TOKEN
    
    if (!accountId || !apiToken) {
      return c.json({ 
        success: false, 
        error: 'Stream credentials not configured' 
      }, 500)
    }
    
    c.set('streamService', new StreamService(accountId, apiToken))
    await next()
  })

  // Créer un upload URL pour une vidéo
  app.post('/api/stream/upload-url', async (c) => {
    const streamService: StreamService = c.get('streamService')
    
    try {
      const body = await c.req.json()
      const { 
        maxDurationSeconds = 300,
        allowedOrigins = ['*'],
        requireSignedURLs = false,
        watermark
      } = body

      const upload = await streamService.createUploadURL({
        maxDurationSeconds,
        allowedOrigins,
        requireSignedURLs,
        watermark
      })

      return c.json({
        success: true,
        upload
      })

    } catch (error) {
      console.error('Stream upload URL error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to create upload URL',
        details: error.message 
      }, 500)
    }
  })

  // Récupérer les détails d'une vidéo
  app.get('/api/stream/video/:uid', async (c) => {
    const streamService: StreamService = c.get('streamService')
    const uid = c.req.param('uid')
    
    try {
      const video = await streamService.getVideo(uid)
      
      return c.json({
        success: true,
        video
      })

    } catch (error) {
      console.error('Stream get video error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to get video',
        details: error.message 
      }, 500)
    }
  })

  // Lister les vidéos
  app.get('/api/stream/videos', async (c) => {
    const streamService: StreamService = c.get('streamService')
    
    try {
      const page = parseInt(c.req.query('page') || '1')
      const perPage = parseInt(c.req.query('per_page') || '20')
      const search = c.req.query('search')
      const status = c.req.query('status')

      const result = await streamService.listVideos({
        page,
        perPage,
        search,
        status
      })

      return c.json({
        success: true,
        videos: result.videos,
        pagination: {
          page,
          per_page: perPage,
          total: result.total,
          total_pages: Math.ceil(result.total / perPage)
        }
      })

    } catch (error) {
      console.error('Stream list videos error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to list videos',
        details: error.message 
      }, 500)
    }
  })

  // Supprimer une vidéo
  app.delete('/api/stream/video/:uid', async (c) => {
    const streamService: StreamService = c.get('streamService')
    const uid = c.req.param('uid')
    
    try {
      const deleted = await streamService.deleteVideo(uid)
      
      if (deleted) {
        return c.json({
          success: true,
          message: 'Video deleted successfully'
        })
      } else {
        return c.json({ 
          success: false, 
          error: 'Failed to delete video' 
        }, 500)
      }

    } catch (error) {
      console.error('Stream delete video error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to delete video',
        details: error.message 
      }, 500)
    }
  })

  // Créer un watermark
  app.post('/api/stream/watermark', async (c) => {
    const streamService: StreamService = c.get('streamService')
    
    try {
      const formData = await c.req.formData()
      const file = formData.get('file') as File
      const name = formData.get('name') as string
      const opacity = parseFloat(formData.get('opacity') as string)
      const size = parseFloat(formData.get('size') as string)
      const position = formData.get('position') as string

      if (!file || !name) {
        return c.json({ 
          success: false, 
          error: 'File and name are required' 
        }, 400)
      }

      const watermark = await streamService.createWatermark({
        name,
        file: await file.arrayBuffer(),
        opacity,
        size,
        position
      })

      return c.json({
        success: true,
        watermark
      })

    } catch (error) {
      console.error('Stream create watermark error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to create watermark',
        details: error.message 
      }, 500)
    }
  })

  // Obtenir les analytics d'une vidéo
  app.get('/api/stream/video/:uid/analytics', async (c) => {
    const streamService: StreamService = c.get('streamService')
    const uid = c.req.param('uid')
    
    try {
      const since = c.req.query('since')
      const until = c.req.query('until')

      const analytics = await streamService.getVideoAnalytics(uid, {
        since,
        until
      })

      return c.json({
        success: true,
        analytics
      })

    } catch (error) {
      console.error('Stream analytics error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to get analytics',
        details: error.message 
      }, 500)
    }
  })

  // Générer un thumbnail personnalisé
  app.post('/api/stream/video/:uid/thumbnail', async (c) => {
    const streamService: StreamService = c.get('streamService')
    const uid = c.req.param('uid')
    
    try {
      const body = await c.req.json()
      const { time = 0, size = { width: 640, height: 360 } } = body

      const result = await streamService.generateThumbnail(uid, {
        time,
        size
      })

      return c.json({
        success: true,
        thumbnail: result.thumbnail
      })

    } catch (error) {
      console.error('Stream thumbnail error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to generate thumbnail',
        details: error.message 
      }, 500)
    }
  })

  // Webhook pour les événements Stream
  app.post('/api/stream/webhook', async (c) => {
    try {
      const body = await c.req.json()
      
      // Traiter les événements Stream
      switch (body.type) {
        case 'video.ready':
          console.log('Video ready:', body.data.uid)
          // Mettre à jour le statut en base
          // Notifier l'utilisateur
          break
          
        case 'video.error':
          console.log('Video error:', body.data.uid, body.data.error)
          // Gérer l'erreur
          break
          
        case 'video.view':
          console.log('Video viewed:', body.data.uid)
          // Enregistrer la vue
          break
      }

      return c.json({ success: true })

    } catch (error) {
      console.error('Stream webhook error:', error)
      return c.json({ 
        success: false, 
        error: 'Webhook processing failed' 
      }, 500)
    }
  })
}
