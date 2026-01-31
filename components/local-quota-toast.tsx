"use client"

import { Clock, Key, Sparkles, X } from "lucide-react"
import type React from "react"
import { useLocalQuota } from "@/contexts/local-quota-context"
import { useDictionary } from "@/hooks/use-dictionary"

interface LocalQuotaToastProps {
    onDismiss: () => void
    onConfigModel?: () => void
}

/**
 * 本地 Quota 用完時的提示 Toast
 * 顯示：
 * 1. 今日額度已用完的訊息
 * 2. 重置倒數時間
 * 3. 設定 API Key 的按鈕
 */
export function LocalQuotaToast({
    onDismiss,
    onConfigModel,
}: LocalQuotaToastProps) {
    const dict = useDictionary()
    const { timeUntilReset, limit } = useLocalQuota()

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault()
            onDismiss()
        }
    }

    return (
        <div
            role="alert"
            aria-live="polite"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="relative w-[400px] overflow-hidden rounded-xl border border-border/50 bg-card p-5 shadow-soft animate-message-in"
        >
            {/* Close button */}
            <button
                onClick={onDismiss}
                className="absolute right-3 top-3 p-1.5 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Title row with icon */}
            <div className="flex items-center gap-2.5 mb-3 pr-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles
                        className="w-4 h-4 text-primary"
                        strokeWidth={2}
                    />
                </div>
                <h3 className="font-semibold text-foreground text-sm">
                    {dict.quota.dailyLimit}
                </h3>
                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                    0/{limit}
                </span>
            </div>

            {/* Message */}
            <div className="text-sm text-muted-foreground leading-relaxed mb-4 space-y-2">
                <p>{dict.quota.messageApi}</p>
                <p>{dict.quota.tip}</p>
            </div>

            {/* Reset countdown */}
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/50">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                    {dict.quota.reset}
                </span>
                <span className="text-sm font-mono font-semibold text-foreground">
                    {timeUntilReset}
                </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                {onConfigModel && (
                    <button
                        type="button"
                        onClick={() => {
                            onConfigModel()
                            onDismiss()
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Key className="w-4 h-4" />
                        {dict.quota.configModel}
                    </button>
                )}
                <button
                    type="button"
                    onClick={onDismiss}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                >
                    {dict.common.close}
                </button>
            </div>

            {/* Powered by */}
            <div className="mt-4 pt-3 border-t border-border/50 text-center">
                <span className="text-xs text-muted-foreground">
                    {dict.quota.poweredBy}
                </span>
            </div>
        </div>
    )
}
