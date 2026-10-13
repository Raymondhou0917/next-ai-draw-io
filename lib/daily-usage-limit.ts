/**
 * 伺服器端每日用量上限（台北時間午夜歸零，存在記憶體，服務重啟也會歸零）。
 *
 * 只管「用站方金鑰」的請求；使用者自己帶 API key 不計。
 * - 對話回合：使用者送出一則訊息算一次。每個 IP 每天 10 次、全站每天 20 次。
 * - API 呼叫：包含工具錯誤重試、續寫等自動請求。上限是回合數的 3 倍，
 *   避免有人送「最後一則是 assistant」的請求繞過回合上限。
 *
 * 上限可用環境變數調整：DAILY_PER_IP_REQUEST_LIMIT、DAILY_GLOBAL_REQUEST_LIMIT。
 */

const TIMEZONE = "Asia/Taipei"
const CALLS_PER_TURN = 3

interface Usage {
    turns: number
    calls: number
}

interface DailyState {
    date: string
    global: Usage
    clients: Map<string, Usage>
}

export interface UsageSnapshot {
    turnsUsed: number
    turnsLimit: number
    globalTurnsUsed: number
    globalTurnsLimit: number
    remaining: number
    resetInMs: number
    date: string
}

export interface ConsumeResult extends UsageSnapshot {
    allowed: boolean
    reason?: "client" | "global"
}

function positiveInt(value: string | undefined, fallback: number): number {
    const n = Number(value)
    return Number.isInteger(n) && n > 0 ? n : fallback
}

export function getLimits() {
    const perClient = positiveInt(process.env.DAILY_PER_IP_REQUEST_LIMIT, 10)
    const global = positiveInt(process.env.DAILY_GLOBAL_REQUEST_LIMIT, 20)
    return {
        perClientTurns: perClient,
        perClientCalls: perClient * CALLS_PER_TURN,
        globalTurns: global,
        globalCalls: global * CALLS_PER_TURN,
    }
}

function todayInTaipei(now = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(now)
}

function msUntilTaipeiMidnight(now = new Date()): number {
    const [y, m, d] = todayInTaipei(now).split("-").map(Number)
    const nextMidnightUtc =
        Date.UTC(y, m - 1, d + 1, 0, 0, 0) - 8 * 60 * 60 * 1000
    return Math.max(0, nextMidnightUtc - now.getTime())
}

const globalForUsage = globalThis as unknown as {
    __drawDailyUsage?: DailyState
}

function state(): DailyState {
    const today = todayInTaipei()
    const current = globalForUsage.__drawDailyUsage
    if (!current || current.date !== today) {
        globalForUsage.__drawDailyUsage = {
            date: today,
            global: { turns: 0, calls: 0 },
            clients: new Map(),
        }
    }
    return globalForUsage.__drawDailyUsage as DailyState
}

/** 用 Cloudflare 帶的真實 IP 辨識使用者（draw.lifehacker.tw 走橘雲代理）。 */
export function getClientId(req: Request): string {
    const cf = req.headers.get("cf-connecting-ip")
    if (cf) return cf.trim()
    const real = req.headers.get("x-real-ip")
    if (real) return real.trim()
    const forwarded = req.headers.get("x-forwarded-for")
    if (forwarded) return forwarded.split(",")[0].trim()
    return "unknown"
}

function snapshot(clientId: string): UsageSnapshot {
    const s = state()
    const limits = getLimits()
    const client = s.clients.get(clientId) ?? { turns: 0, calls: 0 }
    const remaining = Math.max(
        0,
        Math.min(
            limits.perClientTurns - client.turns,
            limits.globalTurns - s.global.turns,
        ),
    )
    return {
        turnsUsed: client.turns,
        turnsLimit: limits.perClientTurns,
        globalTurnsUsed: s.global.turns,
        globalTurnsLimit: limits.globalTurns,
        remaining,
        resetInMs: msUntilTaipeiMidnight(),
        date: s.date,
    }
}

export function peekUsage(clientId: string): UsageSnapshot {
    return snapshot(clientId)
}

/**
 * 檢查並記一次用量。isNewTurn=true 代表使用者剛送出新訊息。
 * 不允許時不記帳。
 */
export function consumeUsage(
    clientId: string,
    isNewTurn: boolean,
): ConsumeResult {
    const s = state()
    const limits = getLimits()
    const client = s.clients.get(clientId) ?? { turns: 0, calls: 0 }

    const clientBlocked =
        client.calls >= limits.perClientCalls ||
        (isNewTurn && client.turns >= limits.perClientTurns)
    const globalBlocked =
        s.global.calls >= limits.globalCalls ||
        (isNewTurn && s.global.turns >= limits.globalTurns)

    if (clientBlocked || globalBlocked) {
        return {
            ...snapshot(clientId),
            allowed: false,
            reason: clientBlocked ? "client" : "global",
        }
    }

    client.calls += 1
    s.global.calls += 1
    if (isNewTurn) {
        client.turns += 1
        s.global.turns += 1
    }
    s.clients.set(clientId, client)
    return { ...snapshot(clientId), allowed: true }
}

/** 測試用：清空狀態。 */
export function resetUsageForTest(): void {
    globalForUsage.__drawDailyUsage = undefined
}
