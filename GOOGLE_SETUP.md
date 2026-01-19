# Google Cloud Console 設定指南

## 解決 `server_error` 錯誤

請按照以下步驟在 [Google Cloud Console](https://console.cloud.google.com/) 進行設定：

---

## 步驟 1：啟用 Google Sheets API

1. 前往 Google Cloud Console
2. 選擇您的專案（或創建新專案）
3. 點擊左側選單「API 和服務」→「已啟用的 API 和服務」
4. 點擊「+ 啟用 API 和服務」
5. 搜尋 **Google Sheets API**
6. 點擊並啟用它

---

## 步驟 2：設定 OAuth 同意畫面

1. 前往「API 和服務」→「OAuth 同意畫面」
2. 選擇「外部」類型（如果您不是 Google Workspace 用戶）
3. 填寫必要資訊：
   - **應用程式名稱**：inBody 身體數據系統
   - **使用者支援電子郵件**：您的 Gmail
   - **開發人員聯絡資訊**：您的 Gmail
4. 點擊「儲存並繼續」
5. 在「範圍」頁面，點擊「新增或移除範圍」
   - 找到並勾選 `https://www.googleapis.com/auth/spreadsheets`
   - 點擊「更新」然後「儲存並繼續」
6. 在「測試使用者」頁面：
   - ⚠️ **重要**：點擊「+ ADD USERS」
   - 新增您要用來登入的 Gmail 帳號
   - 點擊「儲存並繼續」

---

## 步驟 3：設定 OAuth 客戶端憑證

1. 前往「API 和服務」→「憑證」
2. 點擊您的 OAuth 2.0 客戶端 ID（或創建新的）
3. 在「授權 JavaScript 來源」中新增以下網址：
   ```
   http://localhost:5173
   http://localhost:5174
   http://localhost:5175
   ```
4. 點擊「儲存」

---

## 步驟 4：確認 Client ID

確保 `.env` 檔案中的 `VITE_GOOGLE_CLIENT_ID` 與 Google Cloud Console 中顯示的客戶端 ID 一致。

---

## 常見問題

### Q: 為什麼出現 `server_error`？
A: 最常見原因：
- OAuth 同意畫面未設定
- 測試使用者未添加（在測試模式下必須）
- 授權 JavaScript 來源未設定 localhost

### Q: 為什麼出現 `popup_closed_by_user`？
A: 用戶在登入過程中關閉了彈出視窗

### Q: 為什麼出現 `idpiframe_initialization_failed`？
A: Client ID 可能不正確，或第三方 Cookie 被瀏覽器封鎖

---

## 設定完成後

1. 重新整理網頁（Ctrl + F5）
2. 點擊「使用 Google 登入」
3. 選擇您添加為測試使用者的帳號
4. 授權應用程式存取 Google Sheets
