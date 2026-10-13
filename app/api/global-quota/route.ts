import { type NextRequest, NextResponse } from "next/server"
import {
    getClientId,
    peekUsage,
    type UsageSnapshot,
} from "@/lib/daily-usage-limit"

/**
 * 每日免費額度（台北時間午夜重置）。
 *
 * 真正的計數與阻擋在 /api/chat（lib/daily-usage-limit.ts），這裡只回報狀態：
 * 每個 IP 每天 10 次、全站每天 20 次，剩餘次數取兩者較小值。
 * 直接打 /api/chat 一樣會被擋，前端檢查只是提早提示。
 */

function body(usage: UsageSnapshot) {
    return {
        used: usage.turnsUsed,
        limit: usage.turnsLimit,
        remaining: usage.remaining,
        isExhausted: usage.remaining <= 0,
        resetInMs: usage.resetInMs,
        date: usage.date,
        globalUsed: usage.globalTurnsUsed,
        globalLimit: usage.globalTurnsLimit,
    }
}

/** GET /api/global-quota：取得目前這位使用者可用的額度 */
export async function GET(request: NextRequest) {
    return NextResponse.json(body(peekUsage(getClientId(request))))
}

/**
 * POST /api/global-quota：送出前確認還有額度（不扣次數，扣次數在 /api/chat）。
 */
export async function POST(request: NextRequest) {
    if (request.headers.get("x-has-own-api-key") === "true") {
        return NextResponse.json({
            success: true,
            bypassed: true,
            message: "Using own API key, quota not consumed",
        })
    }

    const usage = peekUsage(getClientId(request))
    if (usage.remaining <= 0) {
        return NextResponse.json(
            {
                success: false,
                ...body(usage),
                message:
                    usage.globalTurnsUsed >= usage.globalTurnsLimit
                        ? "Daily global quota exhausted"
                        : "Daily quota exhausted for this connection",
            },
            { status: 429 },
        )
    }
    return NextResponse.json({ success: true, ...body(usage) })
}
