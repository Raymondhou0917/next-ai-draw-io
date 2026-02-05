# Changelog

所有重要的功能更新與修正都會記錄在這裡。

## [2026-02-05]

### 新增
- **CJK 文字處理規則**：防止中文/日文字在圖形內重疊溢出
  - 限制圖形標籤為 2-6 個中文字
  - 詳細說明改用 annotation 或箭頭 label
  - 提供 CJK 文字寬度計算建議（35-40px/字）
- **圖表生成狀態指示器**：AI 生成流程圖時，左下角顯示小型狀態提示
  - 不擋住白板，用戶可以看到**實時繪圖過程**
  - 顯示「AI 正在生成...」或「正在渲染...」狀態
- **Annotation 重疊防護**：加入 annotation 位置計算規則
  - 垂直堆疊策略：間隔 60px 以上
  - 每行 CJK 約 20px 高度計算

### 修正
- **Self Reference 錯誤**：修復 AI 使用 `id="0"` 或 `id="1"` 時導致的「Self Reference」錯誤
  - 改進 `wrapWithMxFile()` regex，正確移除帶有子元素的保留 ID cells
  - 在 COMMON MISTAKES 加入明確警告：禁止使用 id="0" 和 id="1"
- **UX 優化**：強制 AI 在同一回應中同時輸出文字和呼叫工具
  - 解決 AI 說「我將使用 display_diagram」後卡住的問題
- **語言遵循**：加強 prompt，確保中文輸入時用中文回覆
- **實時繪圖**：移除全螢幕 overlay，改用角落指示器，讓用戶看到繪圖過程
- **狀態提示**：在聊天區額度上方加入生成狀態提示（更明顯）
- **原始 Prompt 備份**：新增 `docs/ORIGINAL_SYSTEM_PROMPT.md` 供比對參考

---

## [2026-02-02]

### 修正
- **API Key 檢測**：修復 `checkHasOwnApiKey()` 無法正確檢測用戶 API Key 的 bug

---

## [2026-02-01]

### 新增
- **每日免費額度**：實現全局共享額度系統（30 次/天）
- **雷蒙三十品牌識別**：整合 Footer、品牌連結
- **Model Selector**：加入「設定 API Key」按鈕
- **預設設定**：
  - 預設使用淺色模式（更適合畫圖）
  - 預設 sketch 模式並開啟網格背景
  - 根路徑自動重定向到繁體中文 (zh-Hant)

### 修正
- **主題切換保護**：切換畫布樣式/暗色模式前先同步圖表狀態，防止內容丟失
- **額度 UI 同步**：使用 Context 統一管理 quota state
- **Draw.io 語言**：修正繁體中文語言代碼為小寫 (`zh-tw`)

---

## [2026-01-29 ~ 2026-01-30]

### 新增
- **停止生成按鈕**：可以在 AI 生成過程中取消
- **Ollama 支援**：
  - 加入 Ollama 到允許的 client providers
  - 支援 client-provided base URL

### 修正
- **Base Path 處理**：修復 URL 管理和圖片路徑處理
- **i18n**：補充繁體中文翻譯缺失的 key

---

## 維護說明

此 CHANGELOG 從 git commit 歷史整理而來。
查看完整 commit 記錄：`git log --oneline --since="2026-01-01"`
