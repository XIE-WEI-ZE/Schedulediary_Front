# Schedulediary Front 🗓️  
**每日任務與行事曆管理系統 - 前端（Angular）**  
_A beautiful and functional To-Do + Calendar frontend powered by Angular._

---

## 📌 專案介紹 | Project Introduction

Schedulediary Front 是一個結合月曆、代辦清單與任務分類的 Angular 前端系統，配合 ASP.NET Core API 使用，可實現個人化行程管理、任務標籤、完成率統計與 JWT 登入驗證，並支援 Google 第三方登入。

Schedulediary Front is an Angular-based frontend application that helps users manage tasks, calendar events, and track daily completion. It connects to a .NET Core backend API and supports JWT authentication with Google login integration.

---

## 🔧 使用技術 | Technologies Used

- Angular 17
- TypeScript
- SCSS + Animations
- JWT Authentication
- Google OAuth2 登入整合
- RESTful API 串接（.NET Core）

---

## 💡 功能特色 | Core Features

- ✅ 使用者登入 / 註冊（含 Google 第三方登入）
- ✅ 每日代辦事項新增 / 編輯 / 刪除 / 完成切換
- ✅ 顯示月曆，標示有事件的日期（紅點 + 標題）
- ✅ 支援標籤、多條件進階搜尋
- ✅ Quill Editor 富文本編輯器整合
- ✅ 側邊選單操作流暢、動畫切換精緻

---

## ▶️ 開發環境與啟動方式 | Run Locally

### 🔹 安裝依賴套件
```bash
npm install


###啟動開發伺服器
ng serve
http://localhost:4200

##🌍 與後端連線設定 | Backend Integration
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api' // 或你部署的網址
};
