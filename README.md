# 月之週期 · 生理健康追蹤 PWA

## 📁 檔案結構
```
cycle-app/
├── index.html     ← 主畫面 + 所有樣式
├── app.js         ← 應用程式邏輯
├── manifest.json  ← PWA 設定
├── sw.js          ← Service Worker（離線支援）
├── icons/
│   ├── icon-192.png  ← 需要自行產生
│   └── icon-512.png  ← 需要自行產生
└── README.md
```

---

## 🚀 免費發布到 GitHub Pages

### 步驟 1：建立 GitHub 帳號
前往 https://github.com 免費註冊

### 步驟 2：新增 Repository
1. 點右上角「+」→「New repository」
2. 名稱輸入：`cycle-app`
3. 設定為 **Public**
4. 點「Create repository」

### 步驟 3：上傳檔案
**方法 A（網頁直接上傳，最簡單）**：
1. 進入 repository 頁面
2. 點「uploading an existing file」
3. 把 `index.html`、`app.js`、`manifest.json`、`sw.js` 全部拖曳上去
4. 點「Commit changes」

**方法 B（用 Git）**：
```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/你的帳號/cycle-app.git
git push -u origin main
```

### 步驟 4：開啟 GitHub Pages
1. 進入 repository → Settings → Pages
2. Source 選「Deploy from a branch」
3. Branch 選「main」→ 資料夾選「/ (root)」
4. 點「Save」
5. 等 1–2 分鐘，網址會出現：`https://你的帳號.github.io/cycle-app`

---

## 📱 手機安裝（加入主畫面）

### iPhone / iPad (Safari)
1. 用 Safari 打開網址
2. 點下方「分享」按鈕（方塊+箭頭）
3. 選「加入主畫面」
4. 名稱確認後點「新增」

### Android (Chrome)
1. 用 Chrome 打開網址
2. 點右上角「⋮」
3. 選「新增至主畫面」或「安裝應用程式」

---

## 🔒 隱私說明
- 所有資料儲存在**個人手機**的 localStorage
- 不需要伺服器、不需要帳號
- 不會上傳任何個人資料到網路
- 每個人的資料只在自己的手機上

---

## 🖼️ 產生 App Icon（可選）

用免費工具產生 192×192 和 512×512 的 PNG 圖示：
- https://favicon.io/favicon-generator/
- 設計後下載，放入 `icons/` 資料夾

---

## ✨ 功能列表
- 📊 28天週期曲線圖（賀爾蒙、體溫體重、症狀、生育指標）
- 🌙 今日週期狀態總覽（8項身體指標）
- ✏️ 每日記錄（體重、BBT、心情、症狀、備註）
- 👥 多位使用者（家人共用同一個 App）
- 📴 離線使用（Service Worker 快取）
- 🔒 資料完全本地，隱私安全
