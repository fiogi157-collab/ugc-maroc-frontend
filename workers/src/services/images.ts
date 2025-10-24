// ===========================================================
// 🖼️ UGC Maroc - Cloudflare Images Service
// ===========================================================

export interface ImageUpload {
  id: string
  filename: string
  uploaded: string
  requireSignedURLs: boolean
  variants: string[]
}

export interface ImageVariant {
  id: string
  fit: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  width?: number
  height?: number
  gravity?: 'auto' | 'center' | 'top' | 'bottom' | 'left' | 'right'
  quality?: number
  format?: 'avif' | 'webp' | 'jpeg' | 'png'
  metadata?: 'keep' | 'copyright' | 'none'
}

export interface ImageStats {
  count: {
    current: number
    allowed: number
  }
  quota: {
    current: number
    allowed: number
  }
}

export class ImagesService {
  private accountId: string
  private apiToken: string

  constructor(accountId: string, apiToken: string) {
    this.accountId = accountId
    this.apiToken = apiToken
  }

  // Uploader une image
  async uploadImage(file: ArrayBuffer, options: {
    filename?: string
    requireSignedURLs?: boolean
    metadata?: Record<string, string>
  } = {}): Promise<ImageUpload> {
    const formData = new FormData()
    formData.append('file', new Blob([file]))
    
    if (options.filename) {
      formData.append('filename', options.filename)
    }
    if (options.requireSignedURLs !== undefined) {
      formData.append('requireSignedURLs', options.requireSignedURLs.toString())
    }
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        formData.append(`metadata[${key}]`, value)
      })
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }

  // Récupérer les détails d'une image
  async getImage(id: string): Promise<ImageUpload> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get image: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }

  // Lister les images
  async listImages(options: {
    page?: number
    perPage?: number
    sortOrder?: 'asc' | 'desc'
    continuationToken?: string
  } = {}): Promise<{ images: ImageUpload[], continuationToken?: string }> {
    const params = new URLSearchParams()
    if (options.page) params.append('page', options.page.toString())
    if (options.perPage) params.append('per_page', options.perPage.toString())
    if (options.sortOrder) params.append('sort_order', options.sortOrder)
    if (options.continuationToken) params.append('continuation_token', options.continuationToken)

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v2?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to list images: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      images: data.result.images,
      continuationToken: data.result.continuation_token
    }
  }

  // Supprimer une image
  async deleteImage(id: string): Promise<boolean> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    return response.ok
  }

  // Créer un variant d'image
  async createVariant(options: {
    id: string
    fit: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
    width?: number
    height?: number
    gravity?: 'auto' | 'center' | 'top' | 'bottom' | 'left' | 'right'
    quality?: number
    format?: 'avif' | 'webp' | 'jpeg' | 'png'
    metadata?: 'keep' | 'copyright' | 'none'
  }): Promise<ImageVariant> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/variants`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to create variant: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }

  // Lister les variants
  async listVariants(): Promise<ImageVariant[]> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/variants`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to list variants: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }

  // Supprimer un variant
  async deleteVariant(id: string): Promise<boolean> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/variants/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    return response.ok
  }

  // Obtenir les statistiques
  async getStats(): Promise<ImageStats> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/stats`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get stats: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }

  // Générer une URL d'image optimisée
  generateImageURL(imageId: string, variant?: string): string {
    const baseUrl = `https://imagedelivery.net/${this.accountId}/${imageId}`
    return variant ? `${baseUrl}/${variant}` : baseUrl
  }

  // Générer une URL d'image avec paramètres
  generateImageURLWithParams(imageId: string, params: {
    width?: number
    height?: number
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
    quality?: number
    format?: 'avif' | 'webp' | 'jpeg' | 'png'
    gravity?: 'auto' | 'center' | 'top' | 'bottom' | 'left' | 'right'
  } = {}): string {
    const baseUrl = `https://imagedelivery.net/${this.accountId}/${imageId}`
    const urlParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        urlParams.append(key, value.toString())
      }
    })

    return urlParams.toString() ? `${baseUrl}?${urlParams}` : baseUrl
  }
}
