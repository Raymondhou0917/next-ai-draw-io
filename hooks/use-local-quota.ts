// Re-export from context for backward compatibility
// 舊的獨立 hook 已遷移至 Context，確保所有組件共享同一個 quota state
export { useLocalQuota } from "@/contexts/local-quota-context"
