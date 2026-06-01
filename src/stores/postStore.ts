import { create } from 'zustand'

export interface Post {
  id: string
  type: 'supply' | 'demand'
  title: string
  content: string
  ipName: string
  aiTags: string[]
  aiSummary: string
  aiEntities: string[]
  status: 'pending' | 'matched' | 'closed'
  timeStart: string
  timeEnd: string
  contact: string
  createdAt: string
  city: string
  latitude: number
  longitude: number
}

export interface Match {
  id: string
  supplyPost: Post
  demandPost: Post
  score: number
  reason: string
  matchDetails: {
    ipMatch: number
    timeMatch: number
    contentMatch: number
    locationScore: number
  }
  distanceKm: number
  status: 'pending' | 'confirmed' | 'rejected'
}

export interface Stats {
  totalSupply: number
  totalDemand: number
  totalMatched: number
  matchRate: number
  recentPosts: Post[]
  recentMatches: Match[]
}

interface PostFilters {
  type?: string
  status?: string
  tag?: string
  ipName?: string
  city?: string
}

interface PostState {
  posts: Post[]
  matches: Match[]
  stats: Stats | null
  loading: boolean
  error: string | null

  fetchPosts: (params?: PostFilters) => Promise<void>
  fetchPost: (id: string) => Promise<Post | null>
  createPost: (data: Partial<Post>) => Promise<void>
  fetchMatches: () => Promise<void>
  runMatching: (postId?: string) => Promise<void>
  updateMatchStatus: (id: string, status: 'confirmed' | 'rejected') => Promise<void>
  fetchStats: () => Promise<void>
  deletePost: (id: string) => Promise<void>
}

const API_BASE = '/api'

function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return [] }
  }
  return []
}

function mapPost(raw: Record<string, unknown>): Post {
  return {
    id: String(raw.id ?? ''),
    type: (raw.type === 'supply' || raw.type === 'demand' ? raw.type : 'supply') as 'supply' | 'demand',
    title: String(raw.title ?? ''),
    content: String(raw.content ?? ''),
    ipName: String(raw.ip_name ?? raw.ipName ?? ''),
    aiTags: parseJsonArray(raw.ai_tags ?? raw.aiTags),
    aiSummary: String(raw.ai_summary ?? raw.aiSummary ?? ''),
    aiEntities: parseJsonArray(raw.ai_entities ?? raw.aiEntities),
    status: (['pending', 'matched', 'closed'].includes(String(raw.status ?? '')) ? raw.status : 'pending') as Post['status'],
    timeStart: String(raw.time_start ?? raw.timeStart ?? ''),
    timeEnd: String(raw.time_end ?? raw.timeEnd ?? ''),
    contact: String(raw.contact ?? ''),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    city: String(raw.city ?? ''),
    latitude: Number(raw.latitude ?? raw.lat ?? 0),
    longitude: Number(raw.longitude ?? raw.lng ?? 0),
  }
}

function mapMatch(raw: Record<string, unknown>): Match {
  let matchDetails = { ipMatch: 0, timeMatch: 0, contentMatch: 0, locationScore: 0 }
  const rawDetails = raw.match_details ?? raw.matchDetails
  if (typeof rawDetails === 'string') {
    try { matchDetails = JSON.parse(rawDetails) } catch {}
  } else if (typeof rawDetails === 'object' && rawDetails !== null) {
    matchDetails = { ...matchDetails, ...(rawDetails as Record<string, number>) }
  }

  return {
    id: String(raw.id ?? ''),
    supplyPost: mapPost(raw as Record<string, unknown>),
    demandPost: mapPost(raw as Record<string, unknown>),
    score: Number(raw.score ?? 0),
    reason: String(raw.reason ?? ''),
    matchDetails,
    distanceKm: Number(raw.distance_km ?? raw.distanceKm ?? 0),
    status: (['pending', 'confirmed', 'rejected'].includes(String(raw.status ?? '')) ? raw.status : 'pending') as Match['status'],
  }
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  const json = await res.json() as ApiResponse<T>
  return json.data as T
}

async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  const json = await res.json() as ApiResponse<T>
  return json.data as T
}

async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  const json = await res.json() as ApiResponse<T>
  return json.data as T
}

async function apiDelete(url: string): Promise<void> {
  const res = await fetch(`${API_BASE}${url}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  matches: [],
  stats: null,
  loading: false,
  error: null,

  fetchPosts: async (params) => {
    set({ loading: true, error: null })
    try {
      const query = new URLSearchParams()
      if (params?.type) query.set('type', params.type)
      if (params?.status) query.set('status', params.status)
      if (params?.tag) query.set('tag', params.tag)
      if (params?.ipName) query.set('ipName', params.ipName)
      if (params?.city) query.set('city', params.city)
      const qs = query.toString()
      const rawList = await apiGet<Record<string, unknown>[]>(`/posts${qs ? `?${qs}` : ''}`)
      const list = (rawList || []).map(mapPost)
      set({ posts: list, loading: false })
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  fetchPost: async (id) => {
    set({ loading: true, error: null })
    try {
      const raw = await apiGet<Record<string, unknown>>(`/posts/${id}`)
      const post = mapPost(raw)
      set({ loading: false })
      return post
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false })
      return null
    }
  },

  createPost: async (data) => {
    set({ loading: true, error: null })
    try {
      await apiPost('/posts', data)
      set({ loading: false })
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false })
      throw e
    }
  },

  fetchMatches: async () => {
    set({ loading: true, error: null })
    try {
      const rawList = await apiGet<Record<string, unknown>[] | Record<string, unknown>>('/matches')
      const list = Array.isArray(rawList)
        ? rawList.map((m: Record<string, unknown>) => {
            const rawSupply = (m.supply_title ? {
              id: m.supply_id,
              type: 'supply',
              title: m.supply_title,
              ip_name: m.supply_ip_name,
              ai_summary: m.supply_summary,
            } : {}) as Record<string, unknown>
            const rawDemand = (m.demand_title ? {
              id: m.demand_id,
              type: 'demand',
              title: m.demand_title,
              ip_name: m.demand_ip_name,
              ai_summary: m.demand_summary,
            } : {}) as Record<string, unknown>
            return {
              ...m,
              supplyPost: mapPost({ ...rawSupply, ...(m as Record<string, unknown>) }),
              demandPost: mapPost({ ...rawDemand, ...(m as Record<string, unknown>) }),
            } as Match
          })
        : []
      set({ matches: list, loading: false })
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  runMatching: async (postId) => {
    set({ loading: true, error: null })
    try {
      await apiPost('/matches/run', postId ? { postId } : {})
      set({ loading: false })
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false })
      throw e
    }
  },

  updateMatchStatus: async (id, status) => {
    set({ error: null })
    try {
      await apiPatch(`/matches/${id}`, { status })
      const matches = get().matches.map((m) =>
        m.id === id ? { ...m, status } : m
      )
      set({ matches })
    } catch (e: unknown) {
      set({ error: (e as Error).message })
    }
  },

  fetchStats: async () => {
    set({ error: null })
    try {
      const raw = await apiGet<Record<string, unknown>>('/stats')
      const stats: Stats = {
        totalSupply: Number(raw.totalSupply ?? 0),
        totalDemand: Number(raw.totalDemand ?? 0),
        totalMatched: Number(raw.totalMatched ?? 0),
        matchRate: Number(raw.matchRate ?? 0),
        recentPosts: ((raw.recentPosts as Record<string, unknown>[]) || []).map(mapPost),
        recentMatches: ((raw.recentMatches as Record<string, unknown>[]) || []).map(mapMatch),
      }
      set({ stats })
    } catch (e: unknown) {
      set({ error: (e as Error).message })
    }
  },

  deletePost: async (id) => {
    set({ error: null })
    try {
      await apiDelete(`/posts/${id}`)
      const posts = get().posts.filter((p) => p.id !== id)
      set({ posts })
    } catch (e: unknown) {
      set({ error: (e as Error).message })
    }
  },
}))