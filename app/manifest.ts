import type { MetadataRoute } from "next"
import { getAssetUrl } from "@/lib/base-path"
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "AI 流程圖 - 雷蒙三十小工具",
        short_name: "AI流程圖",
        description:
            "使用 AI 建立 AWS 架構圖、流程圖和技術圖表。免費線上工具整合 draw.io 與 AI 輔助，輕鬆建立專業圖表。",
        start_url: getAssetUrl("/"),
        display: "standalone",
        background_color: "#f9fafb",
        theme_color: "#e77e47",
        icons: [
            {
                src: "https://image.lifehacker.tw/lifehacker-pic/logo-raymond-30.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "https://image.lifehacker.tw/lifehacker-pic/logo-raymond-30.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
        ],
    }
}
