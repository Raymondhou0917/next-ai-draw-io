"use client"

import { Clock, Key, Sparkles } from "lucide-react"
import { useLocalQuota } from "@/contexts/local-quota-context"
import { useDictionary } from "@/hooks/use-dictionary"
import { formatMessage } from "@/lib/i18n/utils"
import { cn } from "@/lib/utils"

interface QuotaBadgeProps {
    onConfigModel?: () => void
    className?: string
}

/**
 * 顯示免費額度狀態的 Badge
 * - 有剩餘額度：顯示「剩餘 X 次」
 * - 額度用完：顯示重置倒數
 * - 有自己的 API Key：不顯示
 */
export function QuotaBadge({ onConfigModel, className }: QuotaBadgeProps) {
    const dict = useDictionary()
    const { remaining, isExhausted, timeUntilReset, hasOwnApiKey, limit } =
        useLocalQuota()

    // 如果用戶有自己的 API Key，不顯示
    if (hasOwnApiKey) {
        return null
    }

    // 額度用完的狀態
    if (isExhausted) {
        return (
            <div
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20",
                    className,
                )}
            >
                <Clock className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs font-medium text-destructive">
                    {dict.quota.reset} {timeUntilReset}
                </span>
                {onConfigModel && (
                    <button
                        onClick={onConfigModel}
                        className="ml-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                        <Key className="w-3 h-3" />
                        {dict.quota.configModel}
                    </button>
                )}
            </div>
        )
    }

    // 有剩餘額度的狀態
    return (
        <div
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10",
                className,
            )}
        >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
                {dict.quota.freeQuota}:{" "}
                <span className="text-foreground">
                    {formatMessage(dict.quota.remaining, {
                        remaining: remaining.toString(),
                    })}
                </span>
                <span className="text-muted-foreground/60">/{limit}</span>
            </span>
        </div>
    )
}
