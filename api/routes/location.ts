import { Router, type Request, type Response } from 'express'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string || req.ip || '').split(',')[0].trim()

    if (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1') {
      res.json({ success: true, data: { city: '', latitude: 0, longitude: 0 } })
      return
    }

    const response = await fetch(`http://ip-api.com/json/${clientIp}?fields=city,lat,lon`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      res.json({ success: true, data: { city: '', latitude: 0, longitude: 0 } })
      return
    }

    const data = await response.json()

    res.json({
      success: true,
      data: {
        city: data.city || '',
        latitude: data.lat || 0,
        longitude: data.lon || 0,
      },
    })
  } catch {
    res.json({ success: true, data: { city: '', latitude: 0, longitude: 0 } })
  }
})

export default router