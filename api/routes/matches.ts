import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { runMatching } from '../services/matchEngine.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status } = req.query

    let sql = `
      SELECT
        m.*,
        s.title AS supply_title,
        s.ip_name AS supply_ip_name,
        s.ai_summary AS supply_summary,
        d.title AS demand_title,
        d.ip_name AS demand_ip_name,
        d.ai_summary AS demand_summary
      FROM matches m
      LEFT JOIN posts s ON m.supply_id = s.id
      LEFT JOIN posts d ON m.demand_id = d.id
      WHERE 1=1
    `
    const params: string[] = []

    if (status && ['pending', 'confirmed', 'rejected'].includes(status as string)) {
      sql += ' AND m.status = ?'
      params.push(status as string)
    }

    sql += ' ORDER BY m.created_at DESC'

    const matches = db.prepare(sql).all(...params)

    res.json({ success: true, data: matches })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
})

router.post('/run', async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.body

    const result = await runMatching(postId || undefined)

    res.json({
      success: true,
      data: result,
      message: `匹配完成：处理 ${result.processed} 对，新增 ${result.matched} 条匹配记录`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params
    const { status } = req.body

    if (!status || !['confirmed', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: 'status 必须为 confirmed 或 rejected' })
      return
    }

    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(id)
    if (!match) {
      res.status(404).json({ success: false, error: '匹配记录不存在' })
      return
    }

    db.prepare('UPDATE matches SET status = ? WHERE id = ?').run(status, id)

    const updated = db.prepare('SELECT * FROM matches WHERE id = ?').get(id)

    res.json({ success: true, data: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params

    const match = db
      .prepare(
        `SELECT
          m.*,
          s.title AS supply_title,
          s.content AS supply_content,
          s.ip_name AS supply_ip_name,
          s.ai_tags AS supply_ai_tags,
          s.ai_summary AS supply_summary,
          s.ai_entities AS supply_ai_entities,
          s.time_start AS supply_time_start,
          s.time_end AS supply_time_end,
          s.contact AS supply_contact,
          d.title AS demand_title,
          d.content AS demand_content,
          d.ip_name AS demand_ip_name,
          d.ai_tags AS demand_ai_tags,
          d.ai_summary AS demand_summary,
          d.ai_entities AS demand_ai_entities,
          d.time_start AS demand_time_start,
          d.time_end AS demand_time_end,
          d.contact AS demand_contact
        FROM matches m
        LEFT JOIN posts s ON m.supply_id = s.id
        LEFT JOIN posts d ON m.demand_id = d.id
        WHERE m.id = ?`,
      )
      .get(id)

    if (!match) {
      res.status(404).json({ success: false, error: '匹配记录不存在' })
      return
    }

    res.json({ success: true, data: match })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
})

export default router