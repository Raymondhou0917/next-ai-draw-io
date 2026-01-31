"use client"

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react"
import { STORAGE_KEYS } from "@/lib/storage"

// 每日免費額度限制
const DAILY_FREE_LIMIT = 20

// 時區：台北時間 (UTC+8)
const TIMEZONE = "Asia/Taipei"

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
    // 取得台北時間的今日日期
    const taipeiDate = getTodayInTaipei()
    // 建立明天午夜的時間（台北時間）
    const [year, month, day] = taipeiDate.split("-").map(Number)
    const tomorrowMidnight = new Date(
        Date.UTC(year, month - 1, day + 1, 0, 0, 0) - 8 * 60 * 60 * 1000, // UTC+8 轉換
    )
    return Math.max(0, tomorrowMidnight.getTime() - now.getTime())
}

/**
 * 格式化剩餘時間為 HH:MM:SS
 */
function formatTimeRemaining(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

interface LocalQuotaState {
    count: number
    date: string
    remaining: number
    isExhausted: boolean
    timeUntilReset: string
    hasOwnApiKey: boolean
}

interface LocalQuotaContextValue extends LocalQuotaState {
    checkAndIncrement: () => boolean
    refresh: () => void
    limit: number
}

const LocalQuotaContext = createContext<LocalQuotaContextValue | null>(null)

/**
 * LocalQuotaProvider - 統一管理客戶端 Quota 狀態
 *
 * 功能：
 * 1. 每日 20 次免費額度（台北時間午夜重置）
 * 2. 顯示剩餘次數和重置倒數
 * 3. 如果用戶有自己的 API Key，不受限制
 * 4. 所有使用 useLocalQuota 的組件共享同一個狀態
 */
export function LocalQuotaProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<LocalQuotaState>({
        count: 0,
        date: "",
        remaining: DAILY_FREE_LIMIT,
        isExhausted: false,
        timeUntilReset: "",
        hasOwnApiKey: false,
    })

    // 從 localStorage 讀取狀態
    const loadState = useCallback(() => {
        if (typeof window === "undefined") return

        const today = getTodayInTaipei()
        const storedDate = localStorage.getItem(STORAGE_KEYS.requestDate)
        const storedCount = localStorage.getItem(STORAGE_KEYS.requestCount)

        // 如果日期不同，重置計數
        let count = 0
        if (storedDate === today && storedCount) {
            count = parseInt(storedCount, 10) || 0
        } else {
            // 新的一天，重置計數
            localStorage.setItem(STORAGE_KEYS.requestDate, today)
            localStorage.setItem(STORAGE_KEYS.requestCount, "0")
        }

        // 檢查用戶是否有自己的 API Key
        const modelConfigs = localStorage.getItem(STORAGE_KEYS.modelConfigs)
        let hasOwnApiKey = false
        if (modelConfigs) {
            try {
                const configs = JSON.parse(modelConfigs)
                // 檢查是否有任何非空的 API Key
                hasOwnApiKey = Object.values(configs).some((config: any) => {
                    return config?.apiKey && config.apiKey.trim() !== ""
                })
            } catch {
                // JSON 解析失敗，忽略
            }
        }

        const remaining = Math.max(0, DAILY_FREE_LIMIT - count)
        const isExhausted = !hasOwnApiKey && remaining <= 0
        const timeUntilReset = formatTimeRemaining(
            getMillisecondsUntilMidnight(),
        )

        setState({
            count,
            date: today,
            remaining,
            isExhausted,
            timeUntilReset,
            hasOwnApiKey,
        })
    }, [])

    // 初始載入
    useEffect(() => {
        loadState()
    }, [loadState])

    // 每秒更新倒數計時
    useEffect(() => {
        const interval = setInterval(() => {
            setState((prev) => ({
                ...prev,
                timeUntilReset: formatTimeRemaining(
                    getMillisecondsUntilMidnight(),
                ),
            }))
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    // 每分鐘重新檢查日期（處理跨日情況）
    useEffect(() => {
        const interval = setInterval(() => {
            const today = getTodayInTaipei()
            if (state.date !== today) {
                loadState()
            }
        }, 60000)

        return () => clearInterval(interval)
    }, [state.date, loadState])

    // 檢查並增加計數（如果允許使用）
    const checkAndIncrement = useCallback((): boolean => {
        if (typeof window === "undefined") return false

        // 如果用戶有自己的 API Key，永遠允許
        const modelConfigs = localStorage.getItem(STORAGE_KEYS.modelConfigs)
        if (modelConfigs) {
            try {
                const configs = JSON.parse(modelConfigs)
                const hasOwnKey = Object.values(configs).some((config: any) => {
                    return config?.apiKey && config.apiKey.trim() !== ""
                })
                if (hasOwnKey) {
                    return true
                }
            } catch {
                // 忽略
            }
        }

        // 檢查日期，可能需要重置
        const today = getTodayInTaipei()
        const storedDate = localStorage.getItem(STORAGE_KEYS.requestDate)
        let currentCount = 0

        if (storedDate === today) {
            currentCount = parseInt(
                localStorage.getItem(STORAGE_KEYS.requestCount) || "0",
                10,
            )
        } else {
            // 新的一天，重置
            localStorage.setItem(STORAGE_KEYS.requestDate, today)
            localStorage.setItem(STORAGE_KEYS.requestCount, "0")
        }

        // 檢查是否超出限制
        if (currentCount >= DAILY_FREE_LIMIT) {
            loadState()
            return false
        }

        // 增加計數
        const newCount = currentCount + 1
        localStorage.setItem(STORAGE_KEYS.requestCount, newCount.toString())
        loadState() // 更新共享狀態
        return true
    }, [loadState])

    const value: LocalQuotaContextValue = {
        ...state,
        checkAndIncrement,
        refresh: loadState,
        limit: DAILY_FREE_LIMIT,
    }

    return (
        <LocalQuotaContext.Provider value={value}>
            {children}
        </LocalQuotaContext.Provider>
    )
}

/**
 * useLocalQuota - 使用共享的 Quota 狀態
 *
 * 必須在 LocalQuotaProvider 內使用
 */
export function useLocalQuota(): LocalQuotaContextValue {
    const context = useContext(LocalQuotaContext)
    if (!context) {
        throw new Error(
            "useLocalQuota must be used within a LocalQuotaProvider",
        )
    }
    return context
}
