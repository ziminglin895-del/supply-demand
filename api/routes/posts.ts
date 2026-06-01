import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { analyzePost } from '../services/deepseek.js'
import { runMatching } from '../services/matchEngine.js'

const router = Router()

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, title, content, timeStart, timeEnd, contact, city, latitude, longitude } = req.body

    if (!type || !['supply', 'demand'].includes(type)) {
      res.status(400).json({ success: false, error: 'type 必须为 supply 或 demand' })
      return
    }
    if (!title || !title.trim()) {
      res.status(400).json({ success: false, error: 'title 不能为空' })
      return
    }
    if (!content || !content.trim()) {
      res.status(400).json({ success: false, error: 'content 不能为空' })
      return
    }

    const db = getDb()

    const result = db
      .prepare(
        `INSERT INTO posts (type, title, content, ip_name, time_start, time_end, contact, city, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        type,
        title.trim(),
        content.trim(),
        '',
        timeStart || '',
        timeEnd || '',
        contact || '',
        city || '',
        latitude || 0,
        longitude || 0,
      )

    const postId = result.lastInsertRowid as number

    try {
      const analysis = await analyzePost(title, content)

      const primaryIp = Array.isArray(analysis.entities) && analysis.entities.length > 0
        ? analysis.entities[0]
        : ''

      const cityFromAI = analysis.city || ''

      db.prepare(
        `UPDATE posts SET ai_tags = ?, ai_summary = ?, ai_entities = ?, ip_name = ?, city = CASE WHEN city = '' AND ? != '' THEN ? ELSE city END WHERE id = ?`,
      ).run(
        JSON.stringify(analysis.tags),
        analysis.summary,
        JSON.stringify(analysis.entities),
        primaryIp,
        cityFromAI,
        cityFromAI,
        postId,
      )
    } catch {
    }

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId)

    runMatching(postId).catch(() => {})

    res.status(201).json({ success: true, data: post })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
})

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { type, status, ipName } = req.query

    let sql = 'SELECT * FROM posts WHERE 1=1'
    const params: (string | number)[] = []

    if (type && ['supply', 'demand'].includes(type as string)) {
      sql += ' AND type = ?'
      params.push(type as string)
    }
    if (status && ['pending', 'matched', 'closed'].includes(status as string)) {
      sql += ' AND status = ?'
      params.push(status as string)
    }
    if (ipName && typeof ipName === 'string' && ipName.trim()) {
      sql += ' AND ip_name LIKE ?'
      params.push(`%${ipName.trim()}%`)
    }

    sql += ' ORDER BY created_at DESC'

    const posts = db.prepare(sql).all(...params)

    res.json({ success: true, data: posts })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    const matches = db
      .prepare('SELECT * FROM matches WHERE supply_id = ? OR demand_id = ? ORDER BY score DESC')
      .all(id, id)

    res.json({ success: true, data: { ...(post as object), matches } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    db.prepare('DELETE FROM matches WHERE supply_id = ? OR demand_id = ?').run(id, id)
    db.prepare('DELETE FROM posts WHERE id = ?').run(id)

    res.json({ success: true, message: '删除成功' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: message })
  }
})

export default router