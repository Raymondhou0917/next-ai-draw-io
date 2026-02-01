"use client"

import { Disc, Github, LayoutGrid, Pilcrow, Timer, Video } from "lucide-react"
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
            className={`flex flex-col items-center gap-2.5 py-3 border-t border-border/30 bg-card/30 ${className ?? ""}`}
        >
            {/* 主要按鈕區 */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* 所有工具 - 橘色醒目按鈕 */}
                <a
                    href="https://tool.lifehacker.tw"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 hover:scale-105"
                    style={{ backgroundColor: "#e77e47" }}
                >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    {dict.brand?.allTools ?? "所有工具"}
                </a>

                {/* 原專案連結 */}
                <a
                    href="https://github.com/DayuanJiang/next-ai-draw-io"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                    <Github className="w-3.5 h-3.5" />
                    {dict.brand?.originalProject ?? "原專案"}
                </a>
            </div>

            {/* 其他工具快速連結 */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="text-muted-foreground/50">其他工具：</span>
                <a
                    href="https://tool.lifehacker.tw/lottery"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                    <Disc className="w-3 h-3" />
                    抽獎
                </a>
                <a
                    href="https://tool.lifehacker.tw/space-converter"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                    <Pilcrow className="w-3 h-3" />
                    換行轉換
                </a>
                <a
                    href="https://tool.lifehacker.tw/video-tools"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                    <Video className="w-3 h-3" />
                    影音助手
                </a>
                <a
                    href="https://tool.lifehacker.tw/timer/index.html"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                    <Timer className="w-3 h-3" />
                    計時器
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
