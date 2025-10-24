// ===========================================================
// 🎥 UGC Maroc - Cloudflare Stream Service
// ===========================================================

export interface StreamVideo {
  uid: string
  title: string
  status: 'pending' | 'ready' | 'error'
  duration: number
  size: number
  thumbnail: string
  playback: {
    hls: string
    dash: string
  }
  watermark?: {
    uid: string
    name: string
    opacity: number
    size: number
    position: string
  }
  created: string
  modified: string
}

export interface StreamUpload {
  uploadURL: string
  uid: string
  maxDurationSeconds: number
  allowedOrigins: string[]
  requireSignedURLs: boolean
  watermark?: {
    uid: string
    name: string
    opacity: number
    size: number
    position: string
  }
}

export class StreamService {
  private accountId: string
  private apiToken: string

  constructor(accountId: string, apiToken: string) {
    this.accountId = accountId
    this.apiToken = apiToken
  }

  // Créer un upload URL pour une vidéo
  async createUploadURL(options: {
    maxDurationSeconds?: number
    allowedOrigins?: string[]
    requireSignedURLs?: boolean
    watermark?: {
      name: string
      opacity: number
      size: number
      position: string
    }
  } = {}): Promise<StreamUpload> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDurationSeconds: options.maxDurationSeconds || 300, // 5 min par défaut
          allowedOrigins: options.allowedOrigins || ['*'],
          requireSignedURLs: options.requireSignedURLs || false,
          watermark: options.watermark,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Stream upload creation failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }

  // Récupérer les détails d'une vidéo
  async getVideo(uid: string): Promise<StreamVideo> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/${uid}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get video: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }

  // Lister les vidéos avec pagination
  async listVideos(options: {
    page?: number
    perPage?: number
    search?: string
    status?: string
  } = {}): Promise<{ videos: StreamVideo[], total: number }> {
    const params = new URLSearchParams()
    if (options.page) params.append('page', options.page.toString())
    if (options.perPage) params.append('per_page', options.perPage.toString())
    if (options.search) params.append('search', options.search)
    if (options.status) params.append('status', options.status)

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to list videos: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      videos: data.result,
      total: data.result_info.total_count
    }
  }

  // Supprimer une vidéo
  async deleteVideo(uid: string): Promise<boolean> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/${uid}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    return response.ok
  }

  // Créer un watermark
  async createWatermark(options: {
    name: string
    file: ArrayBuffer
    opacity: number
    size: number
    position: string
  }): Promise<{ uid: string }> {
    const formData = new FormData()
    formData.append('file', new Blob([options.file]))
    formData.append('name', options.name)
    formData.append('opacity', options.opacity.toString())
    formData.append('size', options.size.toString())
    formData.append('position', options.position)

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/watermarks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to create watermark: ${response.statusText}`)
    }

    const data = await response.json()
    return { uid: data.result.uid }
  }

  // Obtenir les analytics d'une vidéo
  async getVideoAnalytics(uid: string, options: {
    since?: string
    until?: string
  } = {}): Promise<{
    views: number
    watchTime: number
    countries: Record<string, number>
    devices: Record<string, number>
  }> {
    const params = new URLSearchParams()
    if (options.since) params.append('since', options.since)
    if (options.until) params.append('until', options.until)

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/${uid}/analytics?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get analytics: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }

  // Générer un thumbnail personnalisé
  async generateThumbnail(uid: string, options: {
    time?: number // en secondes
    size?: { width: number, height: number }
  } = {}): Promise<{ thumbnail: string }> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/${uid}/thumbnails`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time: options.time || 0,
          size: options.size || { width: 640, height: 360 },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to generate thumbnail: ${response.statusText}`)
    }

    const data = await response.json()
    return { thumbnail: data.result.thumbnail }
  }
}
