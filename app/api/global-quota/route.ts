import { type NextRequest, NextResponse } from "next/server"

// 全局每日額度限制
const GLOBAL_DAILY_LIMIT = 20

// 時區：台北時間 (UTC+8)
const TIMEZONE = "Asia/Taipei"

// 伺服器內存中的全局額度狀態
// 注意：這會在伺服器重啟時重置，適合小流量場景
// 如果需要持久化，可以改用 Redis (Upstash) 或資料庫
interface GlobalQuotaState {
    count: number
    date: string // YYYY-MM-DD 格式的台北時間日期
}

let globalQuotaState: GlobalQuotaState = {
    count: 0,
    date: getTodayInTaipei(),
}

/**
 * 取得台北時間的今日日期字串 (YYYY-MM-DD)
 */
function getTodayInTaipei(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TIMEZONE,
    }).format(new Date())
}

/**
 * 計算距離台北時間午夜的剩餘毫秒數
 */
function getMillisecondsUntilMidnight(): number {
    const now = new Date()
    const taipeiDate = getTodayInTaipei()
    const [year, month, day] = taipeiDate.split("-").map(Number)
    const tomorrowMidnight = new Date(
        Date.UTC(year, month - 1, day + 1, 0, 0, 0) - 8 * 60 * 60 * 1000,
    )
    return Math.max(0, tomorrowMidnight.getTime() - now.getTime())
}

/**
 * 檢查並重置日期（如果跨日了）
 */
function checkAndResetIfNewDay(): void {
    const today = getTodayInTaipei()
    if (globalQuotaState.date !== today) {
        globalQuotaState = {
            count: 0,
            date: today,
        }
    }
}

/**
 * GET /api/global-quota
 * 取得當前全局額度狀態
 */
export async function GET() {
    checkAndResetIfNewDay()

    const remaining = Math.max(0, GLOBAL_DAILY_LIMIT - globalQuotaState.count)
    const isExhausted = remaining <= 0
    const resetInMs = getMillisecondsUntilMidnight()

    return NextResponse.json({
        used: globalQuotaState.count,
        limit: GLOBAL_DAILY_LIMIT,
        remaining,
        isExhausted,
        resetInMs,
        date: globalQuotaState.date,
    })
}

/**
 * POST /api/global-quota
 * 使用一次額度
 * 返回 { success: boolean, ... } 表示是否成功使用
 */
export async function POST(request: NextRequest) {
    checkAndResetIfNewDay()

    // 檢查是否有自己的 API Key（從 header 傳來）
    const hasOwnApiKey = request.headers.get("x-has-own-api-key") === "true"
    if (hasOwnApiKey) {
        // 有自己的 API Key，不扣額度
        return NextResponse.json({
            success: true,
            bypassed: true,
            message: "Using own API key, quota not consumed",
        })
    }

    // 檢查是否還有額度
    if (globalQuotaState.count >= GLOBAL_DAILY_LIMIT) {
        const remaining = 0
        const resetInMs = getMillisecondsUntilMidnight()
        return NextResponse.json(
            {
                success: false,
                used: globalQuotaState.count,
                limit: GLOBAL_DAILY_LIMIT,
                remaining,
                isExhausted: true,
                resetInMs,
                message: "Daily global quota exhausted",
            },
            { status: 429 },
        )
    }

    // 增加使用量
    globalQuotaState.count += 1

    const remaining = Math.max(0, GLOBAL_DAILY_LIMIT - globalQuotaState.count)
    const isExhausted = remaining <= 0
    const resetInMs = getMillisecondsUntilMidnight()

    return NextResponse.json({
        success: true,
        used: globalQuotaState.count,
        limit: GLOBAL_DAILY_LIMIT,
        remaining,
        isExhausted,
        resetInMs,
    })
}
