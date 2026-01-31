"use client"

import { Github, LayoutGrid } from "lucide-react"
import { useDictionary } from "@/hooks/use-dictionary"

interface BrandFooterProps {
    className?: string
}

/**
 * 顯示「Powered by 雷蒙三十」品牌標識
 * 用於維持與 Toolbox (tool.lifehacker.tw) 的品牌一致性
 */
export function BrandFooter({ className }: BrandFooterProps) {
    const dict = useDictionary()

    return (
        <div
            className={`flex flex-col items-center gap-2 py-3 border-t border-border/30 bg-card/30 ${className ?? ""}`}
        >
            {/* 連結區 */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <a
                    href="https://tool.lifehacker.tw"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    {dict.brand?.allTools ?? "All Tools"}
                </a>
                <span className="text-muted-foreground/30">|</span>
                <a
                    href="https://github.com/DayuanJiang/next-ai-draw-io"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                    <Github className="w-3.5 h-3.5" />
                    {dict.brand?.originalProject ?? "Original Project"}
                </a>
            </div>

            {/* Powered by 標識 */}
            <a
                href="https://raymondhouch.com/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
                <img
                    src="https://image.lifehacker.tw/lifehacker-pic/power by lifehacker.png"
                    alt="Power by Lifehacker"
                    className="h-4 opacity-60"
                />
                <span>© {dict.brand?.raymond ?? "雷蒙三十"}</span>
            </a>
        </div>
    )
}
