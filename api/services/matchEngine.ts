import { getDb } from '../db.js'
import { matchPosts } from './deepseek.js'

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

interface PostRow {
  id: number
  type: string
  title: string
  content: string
  ip_name: string
  time_start: string
  time_end: string
  ai_tags: string
  ai_summary: string
  ai_entities: string
  status: string
  city: string
  latitude: number
  longitude: number
}

interface PendingMatch {
  supplyId: number
  demandId: number
  score: number
  reason: string
  matchDetails: Record<string, number>
  distanceKm: number
}

export async function runMatching(postId?: number): Promise<{
  processed: number
  matched: number
  errors: string[]
}> {
  const db = getDb()
  const errors: string[] = []
  let processed = 0
  let matched = 0

  let supplyPosts: PostRow[]
  let demandPosts: PostRow[]

  if (postId) {
    const targetPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId) as
      | PostRow
      | undefined
    if (!targetPost) {
      throw new Error(`Post with id ${postId} not found`)
    }

    if (targetPost.type === 'supply') {
      supplyPosts = [targetPost]
      demandPosts = db
        .prepare(
          "SELECT * FROM posts WHERE type = 'demand' AND status IN ('pending', 'matched') AND id != ?",
        )
        .all(postId) as PostRow[]
    } else {
      demandPosts = [targetPost]
      supplyPosts = db
        .prepare(
          "SELECT * FROM posts WHERE type = 'supply' AND status IN ('pending', 'matched') AND id != ?",
        )
        .all(postId) as PostRow[]
    }
  } else {
    supplyPosts = db
      .prepare("SELECT * FROM posts WHERE type = 'supply' AND status IN ('pending', 'matched')")
      .all() as PostRow[]
    demandPosts = db
      .prepare("SELECT * FROM posts WHERE type = 'demand' AND status IN ('pending', 'matched')")
      .all() as PostRow[]
  }

  const existingMatchStmt = db.prepare(
    'SELECT id FROM matches WHERE supply_id = ? AND demand_id = ?',
  )

  const pendingMatches: PendingMatch[] = []

  for (const supply of supplyPosts) {
    for (const demand of demandPosts) {
      processed++

      const existing = existingMatchStmt.get(supply.id, demand.id) as
        | { id: number }
        | undefined
      if (existing) continue

      let distanceKm = 0
      if (supply.latitude && supply.longitude && demand.latitude && demand.longitude) {
        distanceKm = haversineDistance(
          supply.latitude, supply.longitude,
          demand.latitude, demand.longitude,
        )
      }

      if (supply.city && demand.city && supply.city !== demand.city && distanceKm > 500) {
        continue
      }

      try {
        const result = await matchPosts(
          {
            title: supply.title,
            content: supply.content,
            ipName: supply.ip_name,
            timeStart: supply.time_start,
            timeEnd: supply.time_end,
            aiTags: supply.ai_tags,
            aiSummary: supply.ai_summary,
            city: supply.city || '',
            latitude: supply.latitude || 0,
            longitude: supply.longitude || 0,
          },
          {
            title: demand.title,
            content: demand.content,
            ipName: demand.ip_name,
            timeStart: demand.time_start,
            timeEnd: demand.time_end,
            aiTags: demand.ai_tags,
            aiSummary: demand.ai_summary,
            city: demand.city || '',
            latitude: demand.latitude || 0,
            longitude: demand.longitude || 0,
          },
        )

        if (result.score > 30) {
          pendingMatches.push({
            supplyId: supply.id,
            demandId: demand.id,
            score: result.score,
            reason: result.reason,
            matchDetails: result.matchDetails,
            distanceKm,
          })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`Match error (supply=${supply.id}, demand=${demand.id}): ${message}`)
      }
    }
  }

  if (pendingMatches.length > 0) {
    const insertMatch = db.prepare(`
      INSERT INTO matches (supply_id, demand_id, score, reason, match_details, distance_km, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `)

    const insertAll = db.transaction((matches: PendingMatch[]) => {
      for (const m of matches) {
        insertMatch.run(m.supplyId, m.demandId, m.score, m.reason, JSON.stringify(m.matchDetails), m.distanceKm)
        matched++
      }
    })

    insertAll(pendingMatches)
  }

  const updatePostStatus = db.prepare(
    "UPDATE posts SET status = 'matched' WHERE id = ? AND status = 'pending'",
  )
  const checkHasMatches = db.prepare(
    "SELECT COUNT(*) as cnt FROM matches WHERE (supply_id = ? OR demand_id = ?) AND status != 'rejected'",
  )

  const postIds = new Set<number>()
  for (const s of supplyPosts) postIds.add(s.id)
  for (const d of demandPosts) postIds.add(d.id)

  for (const id of postIds) {
    const row = checkHasMatches.get(id, id) as { cnt: number }
    if (row.cnt > 0) {
      updatePostStatus.run(id)
    }
  }

  return { processed, matched, errors }
}