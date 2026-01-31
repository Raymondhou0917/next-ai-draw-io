export const i18n = {
    defaultLocale: "zh-Hant",
    locales: ["en", "zh", "ja", "zh-Hant"],
} as const

export type Locale = (typeof i18n)["locales"][number]
