import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const totalSupply = db
      .prepare("SELECT COUNT(*) AS cnt FROM posts WHERE type = 'supply'")
      .get() as { cnt: number }

    const totalDemand = db
      .prepare("SELECT COUNT(*) AS cnt FROM posts WHERE type = 'demand'")
      .get() as { cnt: number }

    const totalMatched = db
      .prepare("SELECT COUNT(*) AS cnt FROM matches WHERE status = 'confirmed'")
      .get() as { cnt: number }

    const totalPairs = db
      .prepare("SELECT COUNT(*) AS cnt FROM matches")
      .get() as { cnt: number }

    const matchRate =
      totalSupply.cnt + totalDemand.cnt > 0
        ? Math.round((totalPairs.cnt / (totalSupply.cnt + totalDemand.cnt)) * 100)
        : 0

    const recentPosts = db
      .prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 10')
      .all()

    const recentMatches = db
      .prepare(
        `SELECT
          m.*,
          s.title AS supply_title,
          s.ip_name AS supply_ip_name,
          d.title AS demand_title,
          d.ip_name AS demand_ip_name
        FROM matches m
        LEFT JOIN posts s ON m.supply_id = s.id
        LEFT JOIN posts d ON m.demand_id = d.id
        ORDER BY m.created_at DESC
        LIMIT 10`,
      )
      .all()

    res.json({
      success: true,
      data: {
        totalSupply: totalSupply.cnt,
        totalDemand: totalDemand.cnt,
        totalMatched: totalMatched.cnt,
        matchRate: Math.min(100, matchRate),
        recentPosts,
        recentMatches,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
})

export default router