# Service Worker & IndexedDB Cookie-less SSR Auth Sandbox

このプロジェクトは、Next.js (App Router) において **認証用Cookieに依存せず**、**Service Worker (SW)** と **IndexedDB** を連携させることで **SSR (Server-Side Rendering) 時の認証分岐** を実現する技術デモです。

また、同一アドレス（単一の `/` ルート）のまま、認証状態に応じてサーバー側で描画内容を出し分ける「単一URL型」の設計を採用しています。

- Demo

https://next-worker-auth.vercel.app/

---

## 主な特徴

- **Cookieフリー（Cookie-less）設計**:
  認証状態の判定に Cookie を使わず、`Authorization` ヘッダーでサーバーにトークンを渡します。
- **IndexedDBによるトークン永続化**:
  デモ用トークンを IndexedDB に保存します。IndexedDB は JavaScript から読めるため、実運用では短命なアクセストークンやXSS対策が前提になります。
- **Service Workerによる透過的なリクエストインターセプト**:
  Service Worker が制御しているページからのドキュメント遷移、RSCデータフェッチ、APIリクエストをインターセプトし、IndexedDB 内のトークンを `Authorization: Bearer <token>` ヘッダーとして動的に注入して転送します。
- **SSR (Server-Side Rendering)**:
  Next.js サーバーは、渡された Authorization ヘッダーを読み取り、サーバーサイドで直接認証状態を検証して、認証済みデータが揃ったHTMLを返します。

> [!NOTE]
> Service Worker は初回アクセスのドキュメントリクエストをさかのぼって制御できません。このデモではログインボタンを、ページがSWの制御下に入った後で有効化しています。

---

## 認証フローの概要 (シーケンス)

```mermaid
sequenceDiagram
    autonumber
    actor User as ユーザー / ブラウザ
    participant SW as Service Worker
    participant IDB as IndexedDB
    participant Server as Next.js SSR Server (GET /)

    %% 1. 初回アクセス (SW未起動・未ログイン)
    User->>Server: 初回アクセス (GET /)
    Note over Server: ヘッダーにトークンなし
    Server-->>User: ログインフォーム HTML 返却
    Note over User: SW がマウント後にバックグラウンドで起動・アクティブ化

    %% 2. ログイン処理
    User->>Server: ログインAPI実行 (POST /api/auth/login)
    Server-->>User: トークン返却
    User->>IDB: トークンを保存 (setItem)
    User->>User: ページリロード実行 (window.location.reload)

    %% 3. 認証後リロード (SWアクティブ)
    User->>SW: ページリクエスト (GET /)
    SW->>IDB: トークンを取得
    IDB-->>SW: トークン返却
    Note over SW: Authorizationヘッダーを追加
    SW->>Server: GET / (Header: Authorization)
    Note over Server: ヘッダーからトークン確認・検証成功
    Server-->>SW: ダッシュボード HTML 返却
    SW-->>User: ダッシュボード表示
```

---

## クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## デモの動作確認方法

### テストアカウント

- **ユーザー名**: `admin`
- **パスワード**: `password`
  （ログイン画面には最初から自動入力されています。「Authenticate」をクリックするだけでログインできます）

### 開発者ツール (DevTools) を使った検証ポイント

1. **Cookieが空であることの確認**:
   - DevTools を開き、**「Application」タブ ->「Storage」->「Cookies」** を確認します。
   - ログイン後も含め、認証用の Cookie が保存されていないことを確認できます。
2. **IndexedDBのトークン保存**:
   - **「Application」タブ ->「IndexedDB」-> `next-sw-auth-db` -> `auth-store`** を開きます。
   - キー `accessToken` に `mock-session-token-xyz789` というトークンが格納されていることを確認できます。
3. **Service Workerによるヘッダーの注入**:
   - ログイン画面の右上バッジが `SW: ACTIVE` になってからログインします。ログイン後の画面（ダッシュボード）でページをリロードし、**「Network」タブ** でドキュメント（名前が `/` または `localhost` のHTMLリクエスト）を選択します。
   - **「Request Headers (リクエストヘッダー)」** を確認すると、`Authorization: Bearer mock-session-token-xyz789` が Service Worker によって動的に追加されていることが確認できます。
4. **URL of the Page**:
   - ログイン状態のオンオフに関わらず、ブラウザのアドレスバーは常に `http://localhost:3000/` のまま不変です。
5. **HTML出力時点でデータが揃っていること**:
   - ダッシュボードには `HTML Output State` パネルが表示されます。
   - `Rendered at` や `Authenticated Profile` は、クライアント側の追加API取得ではなく、`src/app/page.tsx` の Server Component がHTMLを返す前に解決した値です。

---

## 主要なコード解説

- **[src/utils/db.ts](file:///c:/prog/test/next/next-worker-auth/src/utils/db.ts)**
  ブラウザのメインスレッド側で使う、IndexedDB の非同期読み書きユーティリティ。Service Worker 側も同じDB名・Store名を使ってアクセスします。
- **[public/sw.js](file:///c:/prog/test/next/next-worker-auth/public/sw.js)**
  ページ遷移（`mode: 'navigate'`）、APIへの通信、Next.jsのRSC（React Server Components）フェッチを傍受し、IndexedDBからトークンを取得してヘッダーを注入します。静的アセットやHMR関連の通信は除外します。
- **[src/components/ServiceWorkerRegister.tsx](file:///c:/prog/test/next/next-worker-auth/src/components/ServiceWorkerRegister.tsx)**
  Service Workerの登録と状態監視。マウント直後からそのままサーバー構築HTMLを描画しつつ、右上部分にSWの登録状態をリアルタイムでバッジ表示（`SW: INITIALIZING` / `SW: ACTIVE`）します。ログインフォームにも状態を共有します。
- **[src/app/page.tsx](file:///c:/prog/test/next/next-worker-auth/src/app/page.tsx)**
  サーバーコンポーネント。ヘッダーからトークンを抽出し、モック検証が通れば `<DashboardView />`、通らなければ `<LoginForm />` をサーバーサイド側で切り替えて返却します。
