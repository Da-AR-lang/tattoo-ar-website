# 刺青 AR 網站

全端刺青 AR 試穿平台，含圖庫、刺青師介紹、AR 虛擬試穿體驗，以及管理後台。

---

## 更新紀錄

| 日期 | 說明 |
|------|------|
| 2026-04-20 | 修復刺青師頁面 Server Component 錯誤；修復中文風格名稱 slug 重複衝突 |
| 2026-04-20 | 初版 README 建立 |

---

## 技術棧

| 類別 | 工具 |
|------|------|
| 框架 | Next.js (App Router) + TypeScript |
| 樣式 | Tailwind CSS 4（背景 `#0a0a0a`、金色 `#c9a84c`）|
| 資料庫 / 認證 | Supabase（PostgreSQL + Auth）|
| 圖片 CDN | Cloudinary |
| AR / ML | TensorFlow.js、MediaPipe Hands、MediaPipe Pose |
| 圖表 | Recharts |
| 圖示 | Lucide React |
| 瀑布流 | react-masonry-css |

---

## 環境變數

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

---

## 資料庫結構

```typescript
Artist {
  id: string
  name: string
  bio: string
  avatar_url: string | null
  instagram: string | null
  created_at: string
}

Style {
  id: string
  name: string
  slug: string        // 自動產生，中文名稱使用時間戳，重複時加後綴 -2/-3
  is_hidden: boolean
}

Tattoo {
  id: string
  artist_id: string
  image_url: string
  title: string
  style: string
  tags: string[]     // 關鍵字標籤，用於搜尋與顯示
  view_count: number
  created_at: string
  artist?: Artist    // JOIN 時附帶
}

// views 表：紀錄每日觀看數 (tattoo_id, viewed_at)
```

---

## 檔案結構說明

```
src/
├── app/
│   ├── layout.tsx                         # 根 layout，含 Navbar 與 FittingRoomProvider
│   ├── page.tsx                           # 首頁（Hero + 功能介紹）
│   ├── globals.css                        # 全域 Tailwind 樣式
│   │
│   ├── gallery/
│   │   ├── page.tsx                       # 圖庫頁（Server，抓 Supabase 資料）
│   │   ├── GalleryClient.tsx              # 圖庫互動（搜尋、風格/刺青師篩選、Modal）
│   │   ├── loading.tsx                    # 圖庫 Skeleton
│   │   └── [id]/
│   │       ├── page.tsx                   # 作品詳情頁（SSR，含瀏覽數累計）
│   │       ├── ARButton.tsx               # 「AR 試穿」按鈕（Client Component）
│   │       └── ShareButton.tsx            # 分享按鈕（原生 Share API 或複製連結）
│   │
│   ├── artists/
│   │   ├── page.tsx                       # 刺青師列表（Server Component）
│   │   ├── ArtistCard.tsx                 # 刺青師卡片（Client Component，含 onClick）
│   │   ├── loading.tsx                    # Skeleton
│   │   └── [id]/
│   │       └── page.tsx                   # 刺青師個人頁（含作品集）
│   │
│   ├── ar/
│   │   ├── page.tsx                       # AR 頁面 wrapper
│   │   └── ARClient.tsx                   # AR 主體（~1120 行）
│   │                                      # 偵測模式：hand / wrist / forearm /
│   │                                      #   upper_arm / chest / shoulder /
│   │                                      #   waist / ankle / manual / marker
│   │                                      # 透視校正貼圖（仿射變換）
│   │                                      # 縮放、旋轉、透明度、拍照下載
│   │
│   ├── fitting-room/
│   │   └── page.tsx                       # 試衣間（已選刺青列表，localStorage 儲存）
│   │
│   ├── admin/
│   │   ├── login/page.tsx                 # 管理員登入頁
│   │   ├── unauthorized/page.tsx          # 無權限提示頁
│   │   └── (protected)/                   # 需登入才能進入
│   │       ├── layout.tsx                 # Admin layout（session 驗證 + 側邊欄）
│   │       ├── AdminSidebar.tsx           # 側邊導覽（桌機 + 手機）
│   │       ├── page.tsx                   # Dashboard（作品數、刺青師、7日瀏覽統計）
│   │       ├── artists/
│   │       │   ├── page.tsx              # 刺青師管理頁（Server）
│   │       │   └── ArtistsAdmin.tsx      # 刺青師 CRUD（含頭像上傳）
│   │       ├── tattoos/
│   │       │   ├── page.tsx              # 作品管理頁
│   │       │   └── TattoosAdmin.tsx      # 作品 CRUD
│   │       ├── styles/
│   │       │   ├── page.tsx              # 風格管理頁
│   │       │   └── StylesAdmin.tsx       # 風格 CRUD（slug 自動產生）
│   │       ├── upload/
│   │       │   └── page.tsx              # 上傳作品（Cloudinary + 建立 Tattoo 記錄）
│   │       └── analytics/
│   │           ├── page.tsx              # 分析頁（Server）
│   │           └── AnalyticsClient.tsx   # 瀏覽趨勢折線圖（Recharts）
│   │
│   ├── api/
│   │   └── upload/
│   │       └── route.ts                   # POST /api/upload（Cloudinary 簽名上傳，需登入）
│   │
│   └── auth/
│       └── signout/
│           └── route.ts                   # POST /auth/signout（登出並跳轉 /admin/login）
│
├── components/
│   ├── Navbar.tsx                         # 頂部導覽列（含手機抽屜選單）
│   ├── TattooGrid.tsx                     # 瀑布流格線（react-masonry-css）
│   ├── TattooModal.tsx                    # 作品 Modal（詳情、標籤、刺青師）
│   └── ScrollToTop.tsx                    # 浮動「回頂部」按鈕
│
├── context/
│   └── FittingRoomContext.tsx             # 試衣間 React Context（全域狀態）
│
├── hooks/
│   └── useFittingRoom.ts                  # 試衣間 Hook（localStorage 持久化）
│
└── lib/
    ├── types.ts                           # TypeScript 型別定義（Artist, Tattoo, Style）
    ├── utils.ts                           # 工具函式（cn：classname 合併）
    ├── proxy.ts                           # Admin 路由認證中介層
    └── supabase/
        ├── server.ts                      # Server-side Supabase client（含 cookie）
        └── client.ts                      # Browser-side Supabase client
```

---

## 核心功能說明

### 圖庫（/gallery）
- 搜尋：比對作品標題與 `tags` 欄位
- 篩選：依風格（Style）、依刺青師
- Modal 點擊後自動累計 `view_count`
- 瀑布流（Masonry）排版

### AR 試穿（/ar）
- 相機即時偵測身體部位，貼圖使用仿射透視校正貼合皮膚
- Marker 模式：在皮膚上貼黑色方塊 + X 標記作為錨點
- 可調整大小、旋轉、透明度、鏡像翻轉，支援拍照下載

### 試衣間（/fitting-room）
- 相當於購物車，從圖庫加入喜歡的刺青
- 資料儲存在 `localStorage`，不需登入

### 標籤（tags）
- 儲存在 `Tattoo.tags: string[]`
- 圖庫搜尋時會比對標籤內容
- 作品詳情頁與 Modal 顯示為標籤徽章

### 風格 slug 規則
- 英文：自動轉小寫並以 `-` 連接
- 中文：slug 為空時改用 `Date.now()` 時間戳
- 重複時自動加後綴 `-2`、`-3`...

---

## 管理員操作流程

1. 前往 `/admin/login` 以 Supabase 帳號登入
2. **上傳作品**：`/admin/upload` → 上傳圖片 → 填寫標題、風格、標籤、刺青師
3. **管理刺青師**：`/admin/artists` → 新增 / 編輯 / 上傳頭像
4. **管理風格**：`/admin/styles` → 新增 / 隱藏 / 刪除
5. **查看分析**：`/admin/analytics` → 折線圖查看瀏覽趨勢

---

## 本地開發

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)
