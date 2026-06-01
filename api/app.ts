/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'
import matchRoutes from './routes/matches.js'
import statsRoutes from './routes/stats.js'
import locationRoutes from './routes/location.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/matches', matchRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/location', locationRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * Production static file serving
 */
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
}

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler & SPA fallback
 */
app.use((req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api/')) {
    const distPath = path.join(__dirname, '..', 'dist')
    res.sendFile(path.join(distPath, 'index.html'))
  } else {
    res.status(404).json({
      success: false,
      error: 'API not found',
    })
  }
})

export default app
