"use client"

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react"
import { getApiEndpoint } from "@/lib/base-path"
import { STORAGE_KEYS } from "@/lib/storage"

// 每日免費額度限制（與後端同步）
const DAILY_FREE_LIMIT = 20

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

/**
 * 檢查用戶是否有自己的 API Key
 */
function checkHasOwnApiKey(): boolean {
    if (typeof window === "undefined") return false

    const modelConfigs = localStorage.getItem(STORAGE_KEYS.modelConfigs)
    if (modelConfigs) {
        try {
            const configs = JSON.parse(modelConfigs)
            return Object.values(configs).some((config: any) => {
                return config?.apiKey && config.apiKey.trim() !== ""
            })
        } catch {
            return false
        }
    }
    return false
}

interface GlobalQuotaState {
    used: number
    remaining: number
    isExhausted: boolean
    timeUntilReset: string
    resetInMs: number
    hasOwnApiKey: boolean
    isLoading: boolean
}

interface QuotaCheckResult {
    success: boolean
    message?: string
}

interface LocalQuotaContextValue extends GlobalQuotaState {
    checkAndIncrement: () => Promise<QuotaCheckResult>
    refresh: () => Promise<void>
    limit: number
    // 向後相容：count 和 date
    count: number
    date: string
}

const LocalQuotaContext = createContext<LocalQuotaContextValue | null>(null)

/**
 * LocalQuotaProvider - 統一管理全局 Quota 狀態
 *
 * 功能：
 * 1. 每日 20 次**全局共享**免費額度（台北時間午夜重置）
 * 2. 顯示剩餘次數和重置倒數
 * 3. 如果用戶有自己的 API Key，不受限制
 * 4. 所有使用 useLocalQuota 的組件共享同一個狀態
 */
export function LocalQuotaProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<GlobalQuotaState>({
        used: 0,
        remaining: DAILY_FREE_LIMIT,
        isExhausted: false,
        timeUntilReset: "",
        resetInMs: 0,
        hasOwnApiKey: false,
        isLoading: true,
    })

    // 從後端 API 取得全局額度狀態
    const fetchQuotaState = useCallback(async () => {
        try {
            const response = await fetch(getApiEndpoint("/api/global-quota"))
            if (!response.ok) {
                console.warn("Failed to fetch quota state:", response.status)
                return
            }

            const data = await response.json()
            const hasOwnApiKey = checkHasOwnApiKey()

            setState({
                used: data.used,
                remaining: data.remaining,
                isExhausted: !hasOwnApiKey && data.isExhausted,
                timeUntilReset: formatTimeRemaining(data.resetInMs),
                resetInMs: data.resetInMs,
                hasOwnApiKey,
                isLoading: false,
            })
        } catch (error) {
            console.warn("Error fetching quota state:", error)
            setState((prev) => ({ ...prev, isLoading: false }))
        }
    }, [])

    // 初始載入
    useEffect(() => {
        fetchQuotaState()
    }, [fetchQuotaState])

    // 每秒更新倒數計時（使用本地計算）
    useEffect(() => {
        const interval = setInterval(() => {
            setState((prev) => {
                const newResetInMs = Math.max(0, prev.resetInMs - 1000)
                return {
                    ...prev,
                    timeUntilReset: formatTimeRemaining(newResetInMs),
                    resetInMs: newResetInMs,
                }
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    // 每 30 秒輪詢一次後端狀態（因為其他用戶也可能在使用）
    useEffect(() => {
        const interval = setInterval(() => {
            fetchQuotaState()
        }, 30000)

        return () => clearInterval(interval)
    }, [fetchQuotaState])

    // 監聽 hasOwnApiKey 變化（當用戶設定 API Key 時）
    useEffect(() => {
        const handleStorageChange = () => {
            const hasOwnApiKey = checkHasOwnApiKey()
            setState((prev) => ({
                ...prev,
                hasOwnApiKey,
                isExhausted: !hasOwnApiKey && prev.remaining <= 0,
            }))
        }

        window.addEventListener("storage", handleStorageChange)
        return () => window.removeEventListener("storage", handleStorageChange)
    }, [])

    // 檢查並使用一次額度
    const checkAndIncrement =
        useCallback(async (): Promise<QuotaCheckResult> => {
            const hasOwnApiKey = checkHasOwnApiKey()

            // 如果用戶有自己的 API Key，直接允許
            if (hasOwnApiKey) {
                return { success: true }
            }

            try {
                const response = await fetch(
                    getApiEndpoint("/api/global-quota"),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-has-own-api-key": hasOwnApiKey
                                ? "true"
                                : "false",
                        },
                    },
                )

                const data = await response.json()

                if (!response.ok) {
                    // 額度用完
                    setState((prev) => ({
                        ...prev,
                        used: data.used ?? prev.used,
                        remaining: data.remaining ?? 0,
                        isExhausted: true,
                        resetInMs: data.resetInMs ?? prev.resetInMs,
                        timeUntilReset: formatTimeRemaining(
                            data.resetInMs ?? prev.resetInMs,
                        ),
                    }))
                    return {
                        success: false,
                        message: data.message || "Daily quota exhausted",
                    }
                }

                // 成功使用
                setState((prev) => ({
                    ...prev,
                    used: data.used,
                    remaining: data.remaining,
                    isExhausted: data.isExhausted,
                    resetInMs: data.resetInMs,
                    timeUntilReset: formatTimeRemaining(data.resetInMs),
                }))

                return { success: true }
            } catch (error) {
                console.error("Error checking quota:", error)
                // 網路錯誤時，樂觀地允許（避免阻塞用戶）
                return { success: true }
            }
        }, [])

    const value: LocalQuotaContextValue = {
        ...state,
        checkAndIncrement,
        refresh: fetchQuotaState,
        limit: DAILY_FREE_LIMIT,
        // 向後相容
        count: state.used,
        date: "",
    }

    return (
        <LocalQuotaContext.Provider value={value}>
            {children}
        </LocalQuotaContext.Provider>
    )
}

/**
 * useLocalQuota - 使用共享的全局 Quota 狀態
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
