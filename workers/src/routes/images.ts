// ===========================================================
// 🖼️ UGC Maroc - Images Routes (Avatars, Logos, Thumbnails)
// ===========================================================

import { Hono } from 'hono'
import { ImagesService } from '../services/images.js'

export function createImagesRoutes(app: Hono) {
  
  // Helper pour initialiser ImagesService
  app.use('/api/images/*', async (c, next) => {
    const accountId = c.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = c.env.CLOUDFLARE_API_TOKEN
    
    if (!accountId || !apiToken) {
      return c.json({ 
        success: false, 
        error: 'Images credentials not configured' 
      }, 500)
    }
    
    c.set('imagesService', new ImagesService(accountId, apiToken))
    await next()
  })

  // Uploader une image
  app.post('/api/images/upload', async (c) => {
    const imagesService: ImagesService = c.get('imagesService')
    
    try {
      const formData = await c.req.formData()
      const file = formData.get('file') as File
      const filename = formData.get('filename') as string
      const requireSignedURLs = formData.get('requireSignedURLs') === 'true'
      const metadata = JSON.parse(formData.get('metadata') as string || '{}')

      if (!file) {
        return c.json({ 
          success: false, 
          error: 'File is required' 
        }, 400)
      }

      const upload = await imagesService.uploadImage(await file.arrayBuffer(), {
        filename: filename || file.name,
        requireSignedURLs,
        metadata
      })

      return c.json({
        success: true,
        image: upload
      })

    } catch (error) {
      console.error('Images upload error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to upload image',
        details: error.message 
      }, 500)
    }
  })

  // Récupérer les détails d'une image
  app.get('/api/images/:id', async (c) => {
    const imagesService: ImagesService = c.get('imagesService')
    const id = c.req.param('id')
    
    try {
      const image = await imagesService.getImage(id)
      
      return c.json({
        success: true,
        image
      })

    } catch (error) {
      console.error('Images get error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to get image',
        details: error.message 
      }, 500)
    }
  })

  // Lister les images
  app.get('/api/images', async (c) => {
    const imagesService: ImagesService = c.get('imagesService')
    
    try {
      const page = parseInt(c.req.query('page') || '1')
      const perPage = parseInt(c.req.query('per_page') || '20')
      const sortOrder = c.req.query('sort_order') as 'asc' | 'desc' || 'desc'
      const continuationToken = c.req.query('continuation_token')

      const result = await imagesService.listImages({
        page,
        perPage,
        sortOrder,
        continuationToken
      })

      return c.json({
        success: true,
        images: result.images,
        pagination: {
          page,
          per_page: perPage,
          continuation_token: result.continuationToken
        }
      })

    } catch (error) {
      console.error('Images list error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to list images',
        details: error.message 
      }, 500)
    }
  })

  // Supprimer une image
  app.delete('/api/images/:id', async (c) => {
    const imagesService: ImagesService = c.get('imagesService')
    const id = c.req.param('id')
    
    try {
      const deleted = await imagesService.deleteImage(id)
      
      if (deleted) {
        return c.json({
          success: true,
          message: 'Image deleted successfully'
        })
      } else {
        return c.json({ 
          success: false, 
          error: 'Failed to delete image' 
        }, 500)
      }

    } catch (error) {
      console.error('Images delete error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to delete image',
        details: error.message 
      }, 500)
    }
  })

  // Créer un variant d'image
  app.post('/api/images/variants', async (c) => {
    const imagesService: ImagesService = c.get('imagesService')
    
    try {
      const body = await c.req.json()
      const { 
        id, 
        fit = 'cover', 
        width, 
        height, 
        gravity = 'auto',
        quality = 80,
        format = 'webp',
        metadata = 'keep'
      } = body

      if (!id) {
        return c.json({ 
          success: false, 
          error: 'Image ID is required' 
        }, 400)
      }

      const variant = await imagesService.createVariant({
        id,
        fit,
        width,
        height,
        gravity,
        quality,
        format,
        metadata
      })

      return c.json({
        success: true,
        variant
      })

    } catch (error) {
      console.error('Images create variant error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to create variant',
        details: error.message 
      }, 500)
    }
  })

  // Lister les variants
  app.get('/api/images/variants', async (c) => {
    const imagesService: ImagesService = c.get('imagesService')
    
    try {
      const variants = await imagesService.listVariants()

      return c.json({
        success: true,
        variants
      })

    } catch (error) {
      console.error('Images list variants error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to list variants',
        details: error.message 
      }, 500)
    }
  })

  // Supprimer un variant
  app.delete('/api/images/variants/:id', async (c) => {
    const imagesService: ImagesService = c.get('imagesService')
    const id = c.req.param('id')
    
    try {
      const deleted = await imagesService.deleteVariant(id)
      
      if (deleted) {
        return c.json({
          success: true,
          message: 'Variant deleted successfully'
        })
      } else {
        return c.json({ 
          success: false, 
          error: 'Failed to delete variant' 
        }, 500)
      }

    } catch (error) {
      console.error('Images delete variant error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to delete variant',
        details: error.message 
      }, 500)
    }
  })

  // Obtenir les statistiques
  app.get('/api/images/stats', async (c) => {
    const imagesService: ImagesService = c.get('imagesService')
    
    try {
      const stats = await imagesService.getStats()

      return c.json({
        success: true,
        stats
      })

    } catch (error) {
      console.error('Images stats error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to get stats',
        details: error.message 
      }, 500)
    }
  })

  // Générer une URL d'image optimisée
  app.get('/api/images/:id/url', async (c) => {
    const imagesService: ImagesService = c.get('imagesService')
    const id = c.req.param('id')
    
    try {
      const variant = c.req.query('variant')
      const width = c.req.query('width') ? parseInt(c.req.query('width')!) : undefined
      const height = c.req.query('height') ? parseInt(c.req.query('height')!) : undefined
      const fit = c.req.query('fit') as 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad' || 'cover'
      const quality = c.req.query('quality') ? parseInt(c.req.query('quality')!) : undefined
      const format = c.req.query('format') as 'avif' | 'webp' | 'jpeg' | 'png' || 'webp'
      const gravity = c.req.query('gravity') as 'auto' | 'center' | 'top' | 'bottom' | 'left' | 'right' || 'auto'

      let url: string

      if (variant) {
        url = imagesService.generateImageURL(id, variant)
      } else {
        url = imagesService.generateImageURLWithParams(id, {
          width,
          height,
          fit,
          quality,
          format,
          gravity
        })
      }

      return c.json({
        success: true,
        url
      })

    } catch (error) {
      console.error('Images URL generation error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to generate URL',
        details: error.message 
      }, 500)
    }
  })

  // Variants prédéfinis pour UGC Maroc
  app.post('/api/images/setup-variants', async (c) => {
    const imagesService: ImagesService = c.get('imagesService')
    
    try {
      // Créer les variants standards pour UGC Maroc
      const variants = [
        // Avatar creators (petit, carré)
        { id: 'avatar-sm', fit: 'cover' as const, width: 64, height: 64, quality: 80, format: 'webp' as const },
        { id: 'avatar-md', fit: 'cover' as const, width: 128, height: 128, quality: 85, format: 'webp' as const },
        { id: 'avatar-lg', fit: 'cover' as const, width: 256, height: 256, quality: 90, format: 'webp' as const },
        
        // Logos brands (rectangulaire)
        { id: 'logo-sm', fit: 'contain' as const, width: 100, height: 50, quality: 80, format: 'webp' as const },
        { id: 'logo-md', fit: 'contain' as const, width: 200, height: 100, quality: 85, format: 'webp' as const },
        { id: 'logo-lg', fit: 'contain' as const, width: 400, height: 200, quality: 90, format: 'webp' as const },
        
        // Thumbnails vidéos (16:9)
        { id: 'thumb-sm', fit: 'cover' as const, width: 320, height: 180, quality: 80, format: 'webp' as const },
        { id: 'thumb-md', fit: 'cover' as const, width: 640, height: 360, quality: 85, format: 'webp' as const },
        { id: 'thumb-lg', fit: 'cover' as const, width: 1280, height: 720, quality: 90, format: 'webp' as const },
        
        // Portfolio creators (carré)
        { id: 'portfolio-sm', fit: 'cover' as const, width: 300, height: 300, quality: 80, format: 'webp' as const },
        { id: 'portfolio-md', fit: 'cover' as const, width: 600, height: 600, quality: 85, format: 'webp' as const },
        { id: 'portfolio-lg', fit: 'cover' as const, width: 1200, height: 1200, quality: 90, format: 'webp' as const }
      ]

      const createdVariants = []
      
      for (const variant of variants) {
        try {
          const result = await imagesService.createVariant(variant)
          createdVariants.push(result)
        } catch (error) {
          console.warn(`Failed to create variant ${variant.id}:`, error.message)
        }
      }

      return c.json({
        success: true,
        message: `Created ${createdVariants.length} variants`,
        variants: createdVariants
      })

    } catch (error) {
      console.error('Images setup variants error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to setup variants',
        details: error.message 
      }, 500)
    }
  })
}
