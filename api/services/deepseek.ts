const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1/chat/completions'
const MODEL = 'deepseek-chat'

interface AnalyzePostResult {
  tags: string[]
  summary: string
  entities: string[]
  sentiment: 'supply' | 'demand' | 'neutral'
  timeInfo: string
  city: string
}

interface MatchPostsResult {
  score: number
  reason: string
  matchDetails: {
    ipScore: number
    timeScore: number
    contentScore: number
    locationScore: number
  }
}

interface PostForMatch {
  title: string
  content: string
  ipName: string
  timeStart: string
  timeEnd: string
  aiTags: string
  aiSummary: string
  city: string
  latitude: number
  longitude: number
}

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

function mockAnalyzePost(title: string, content: string): AnalyzePostResult {
  const combined = `${title} ${content}`

  const ipPatterns = [
    /《([^》]+)》/g,
    /"([^"]+)"/g,
    /\u300e([^\u300f]+)\u300f/g,
    /\u300c([^\u300d]+)\u300c/g,
  ]

  const entities: string[] = []
  for (const pattern of ipPatterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(combined)) !== null) {
      const name = match[1].trim()
      if (name.length >= 2 && name.length <= 30 && !entities.includes(name)) {
        entities.push(name)
      }
    }
  }

  if (entities.length === 0) {
    const knownIpPatterns = [
      { pattern: /(?:拥有|持有|代理|授权|提供|寻找|寻求|需要|求购|合作|对接).{0,10}([A-Z\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]{2,15})(?:的|IP|品牌|版权|授权)/, group: 1 },
    ]
    for (const kp of knownIpPatterns) {
      const m = kp.pattern.exec(combined)
      if (m && m[kp.group]) {
        const name = m[kp.group].trim()
        if (!entities.includes(name)) {
          entities.push(name)
        }
      }
    }
  }

  const ipKeywords = ['ip', '品牌', '授权', '动漫', '游戏', '影视', '文学', '音乐', '形象', '角色', '版权', '改编', '联名']
  const extraEntities = ipKeywords.filter((kw) => combined.toLowerCase().includes(kw))
  for (const e of extraEntities) {
    if (!entities.includes(e)) entities.push(e)
  }

  const tagSet = new Set<string>()
  if (combined.includes('授权')) tagSet.add('授权合作')
  if (combined.includes('联名')) tagSet.add('品牌联名')
  if (combined.includes('产品')) tagSet.add('产品开发')
  if (combined.includes('营销')) tagSet.add('营销推广')
  if (combined.includes('渠道') || combined.includes('销售')) tagSet.add('渠道销售')
  if (combined.includes('设计')) tagSet.add('设计服务')
  if (combined.includes('生产') || combined.includes('制造')) tagSet.add('生产制造')
  if (combined.includes('内容')) tagSet.add('内容制作')
  if (combined.includes('活动')) tagSet.add('线下活动')
  if (combined.includes('数字') || combined.includes('线上')) tagSet.add('数字营销')

  if (tagSet.size === 0) {
    tagSet.add('IP合作')
    tagSet.add('商业合作')
    tagSet.add('资源对接')
  }

  const supplyKeywords = ['提供', '供应', '拥有', '持有', '代理', '资源', '可提供', '可供应', '我方可']
  const demandKeywords = ['需求', '寻找', '需要', '求购', '委托', '寻求', '缺乏', '急需', '求助', '找']

  let supplyCount = 0
  let demandCount = 0

  for (const kw of supplyKeywords) {
    if (combined.includes(kw)) supplyCount++
  }
  for (const kw of demandKeywords) {
    if (combined.includes(kw)) demandCount++
  }

  const sentiment: 'supply' | 'demand' | 'neutral' =
    supplyCount > demandCount
      ? 'supply'
      : demandCount > supplyCount
        ? 'demand'
        : 'neutral'

  const cityList = [
    '北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '南京', '重庆', '苏州',
    '西安', '天津', '长沙', '郑州', '青岛', '厦门', '东莞', '宁波', '佛山', '合肥',
    '无锡', '福州', '济南', '大连', '昆明', '沈阳', '温州', '哈尔滨', '长春', '石家庄',
    '泉州', '南宁', '贵阳', '南昌', '太原', '烟台', '嘉兴', '南通', '金华', '珠海',
    '惠州', '徐州', '常州', '中山', '台州', '兰州', '绍兴', '海口', '乌鲁木齐', '扬州',
  ]
  let city = ''
  for (const c of cityList) {
    if (combined.includes(c)) {
      city = c
      break
    }
  }

  return {
    tags: Array.from(tagSet).slice(0, 5),
    summary: title,
    entities: entities.slice(0, 5),
    sentiment,
    timeInfo: '待确认',
    city,
  }
}

function mockMatchPosts(
  supply: PostForMatch,
  demand: PostForMatch,
): MatchPostsResult {
  const sTags = safeParseJSON<string[]>(supply.aiTags, [])
  const dTags = safeParseJSON<string[]>(demand.aiTags, [])

  const commonTags = sTags.filter((t: string) => dTags.includes(t))
  const tagOverlap = sTags.length + dTags.length > 0
    ? (commonTags.length * 2) / (sTags.length + dTags.length)
    : 0.3

  const contentScore = Math.min(100, Math.round(tagOverlap * 100))

  const ipMatch = supply.ipName && demand.ipName && supply.ipName === demand.ipName
  const ipScore = ipMatch ? 90 : Math.min(80, Math.round(Math.random() * 50 + 20))

  const timeScore = Math.min(80, Math.round(Math.random() * 40 + 30))

  const cityMatch = supply.city && demand.city && supply.city === demand.city
  const hasBothLatLng = supply.latitude && demand.latitude && supply.longitude && demand.longitude
  let locationScore = 50
  if (cityMatch) {
    locationScore = 100
  } else if (hasBothLatLng) {
    const dist = haversineDistance(supply.latitude, supply.longitude, demand.latitude, demand.longitude)
    if (dist <= 100) {
      locationScore = 85
    } else if (dist <= 200) {
      locationScore = 75
    } else if (dist <= 300) {
      locationScore = 65
    } else if (dist <= 500) {
      locationScore = 50
    } else if (dist <= 1000) {
      locationScore = 20
    } else {
      locationScore = 5
    }
  }

  const score = Math.round((contentScore * 0.35 + ipScore * 0.30 + timeScore * 0.15 + locationScore * 0.20))

  let reason = ''
  if (commonTags.length > 0) {
    reason = `双方在标签上有较高重叠：${commonTags.join('、')}。`
  } else {
    reason = '双方可能存在潜在合作机会，建议进一步沟通确认。'
  }

  if (ipMatch) {
    reason += ' IP名称完全匹配，合作可能性极高。'
  }

  if (cityMatch) {
    reason += ` 双方均位于${supply.city}，同城匹配优势显著。`
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reason,
    matchDetails: {
      ipScore,
      timeScore,
      contentScore,
      locationScore,
    },
  }
}

function safeParseJSON<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

async function callDeepSeek(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not set')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(DEEPSEEK_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } finally {
    clearTimeout(timeout)
  }
}

function cleanJsonString(str: string): string {
  let cleaned = str.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  return cleaned.trim()
}

export async function analyzePost(title: string, content: string): Promise<AnalyzePostResult> {
  if (!DEEPSEEK_API_KEY) {
    return mockAnalyzePost(title, content)
  }

  const systemPrompt = `你是一个专业的IP供需匹配分析助手。你需要分析给定的供需帖子内容，提取关键信息并返回结构化JSON。

请严格按照以下JSON格式返回，不要添加任何其他内容：
{
  "tags": ["标签1", "标签2", ...],
  "summary": "简要概述，不超过100字",
  "entities": ["实体/IP名称1", "实体/IP名称2", ...],
  "sentiment": "supply" | "demand" | "neutral",
  "timeInfo": "合作时间窗口描述",
  "city": "城市名称"
}

分析要求：
1. tags: 提取3-8个关键词标签，包括合作类型（如授权合作、品牌联名、产品开发等）、IP类型（如动漫、游戏、影视等）、业务类型（如营销推广、渠道销售等）
2. summary: 用一句话（不超过100字）概括该帖子的核心诉求
3. entities: 【重要】这是IP定位的关键字段。请从帖子中提取所有可识别的IP名称，包括但不限于：
   - 书名号《》中的作品名称（如《三体》《原神》）
   - 具体的IP品牌名称（如故宫文创、泡泡玛特）
   - 角色名称、商标名称、版权方名称
   - 类型关键词（如影视、动漫、游戏等）也需要提取作为辅助定位
   - 如果帖子中没有明确IP名称，则提取最核心的关键词作为IP定位
   - entities的第一个元素将被用作该帖子的IP定位标签
4. sentiment: 判断该帖子是供应方（supply）、需求方（demand）还是中性（neutral）
5. timeInfo: 提取或推断合作的时间窗口，如"2024年Q3-Q4"、"长期合作"等
6. city: 【重要】从帖子内容中提取城市名称，如北京、上海、广州、深圳等。如果帖子中没有明确提到城市，则返回空字符串""`

  const userPrompt = `帖子标题：${title}\n\n帖子内容：${content}`

  const result = await callDeepSeek(systemPrompt, userPrompt)
  const cleaned = cleanJsonString(result)

  try {
    const parsed = JSON.parse(cleaned)
    return {
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : title,
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      sentiment: ['supply', 'demand', 'neutral'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
      timeInfo: typeof parsed.timeInfo === 'string' ? parsed.timeInfo : '待确认',
      city: typeof parsed.city === 'string' ? parsed.city : '',
    }
  } catch {
    return mockAnalyzePost(title, content)
  }
}

export async function matchPosts(
  supply: PostForMatch,
  demand: PostForMatch,
): Promise<MatchPostsResult> {
  if (!DEEPSEEK_API_KEY) {
    return mockMatchPosts(supply, demand)
  }

  const systemPrompt = `你是一个专业的IP供需匹配评分助手。你需要评估一条供应帖和一条需求帖之间的匹配程度，并返回结构化JSON。

请严格按照以下JSON格式返回：
{
  "score": 75,
  "reason": "详细的匹配理由说明",
  "matchDetails": {
    "ipScore": 80,
    "timeScore": 70,
    "contentScore": 75,
    "locationScore": 80
  }
}

评分维度说明：
1. ipScore (0-100): IP名称实体的匹配程度，完全匹配得高分，相关IP得中等分，不相关得低分
2. timeScore (0-100): 时间窗口的匹配程度，时间完全吻合得高分，部分重叠得中等分
3. contentScore (0-100): 帖子内容的匹配程度，包括标签重叠度、需求契合度、业务协同性等
4. locationScore (0-100): 【重要】地理位置匹配程度。同城得100分；同省得70-85分；不同省但<500km得40-60分；500-1000km得10-30分；>1000km得0-10分

综合分数 score 按照以下权重计算：contentScore(35%) + ipScore(30%) + timeScore(15%) + locationScore(20%)
最终 score 取整，范围0-100。

reason 应该用中文给出详细的匹配理由，包括：
- 双方在IP领域的匹配分析
- 时间窗口的匹配情况
- 内容/业务层面的匹配分析
- 综合建议`

  const userPrompt = `【供应帖】
标题：${supply.title}
内容：${supply.content}
IP名称：${supply.ipName}
时间：${supply.timeStart} ~ ${supply.timeEnd}
城市：${supply.city}
纬度：${supply.latitude}
经度：${supply.longitude}
AI标签：${supply.aiTags}
AI摘要：${supply.aiSummary}

【需求帖】
标题：${demand.title}
内容：${demand.content}
IP名称：${demand.ipName}
时间：${demand.timeStart} ~ ${demand.timeEnd}
城市：${demand.city}
纬度：${demand.latitude}
经度：${demand.longitude}
AI标签：${demand.aiTags}
AI摘要：${demand.aiSummary}`

  const result = await callDeepSeek(systemPrompt, userPrompt)
  const cleaned = cleanJsonString(result)

  try {
    const parsed = JSON.parse(cleaned)
    const score = Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0)))
    const ipScore = Math.min(100, Math.max(0, Math.round(Number(parsed.matchDetails?.ipScore) || 0)))
    const timeScore = Math.min(100, Math.max(0, Math.round(Number(parsed.matchDetails?.timeScore) || 0)))
    const contentScore = Math.min(100, Math.max(0, Math.round(Number(parsed.matchDetails?.contentScore) || 0)))
    const locationScore = Math.min(100, Math.max(0, Math.round(Number(parsed.matchDetails?.locationScore) || 0)))

    return {
      score,
      reason: typeof parsed.reason === 'string' ? parsed.reason : '匹配分析完成',
      matchDetails: { ipScore, timeScore, contentScore, locationScore },
    }
  } catch {
    return mockMatchPosts(supply, demand)
  }
}