# Service Worker & IndexedDB Cookie-less SSR Auth Sandbox

このプロジェクトは、Next.js (App Router) において **Cookie を一切使用せず**に、**Service Worker (SW)** と **IndexedDB** を連携させることで安全な **SSR (Server-Side Rendering) 認証** を実現する技術デモです。

また、同一アドレス（単一の `/` ルート）のまま、認証状態に応じてサーバー側で描画内容を出し分ける「単一URL型」の設計を採用しています。

---

## 主な特徴

- **Cookieフリー（Cookie-less）設計**:
  ブラウザの Cookie 保存域や Cookie ヘッダーを一切使用しないため、CSRF（クロスサイトリクエストフォージェリ）攻撃の根本的な対策になります。
- **IndexedDBによるトークン永続化**:
  トークン（JWT等）はブラウザのセキュアなストレージである IndexedDB で安全に管理されます。
- **Service Workerによる透過的なリクエストインターセプト**:
  Service Worker がページ遷移（RSCデータフェッチ含む）や API リクエストをインターセプトし、IndexedDB 内のトークンを `Authorization: Bearer <token>` ヘッダーとして動的に注入して転送します。
- **SSR (Server-Side Rendering)**:
  Next.js サーバーは、渡された Authorization ヘッダーを読み取り、サーバーサイドで直接認証状態を検証して、HTMLを動的に構築します。
- **単一アドレス (/) による画面制御**:
  URLは常に `http://localhost:3000/` のまま遷移しません。認証されていれば `<DashboardView />`、未認証なら `<LoginForm />` をサーバー側で出し分けて返却します。
- **プレミアム・サイバーグリーンテーマ**:
  グラスモーフィズムや滑らかなアニメーションを取り入れた、視覚的に優れたダーク/グリーンのモダンUIです。

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
   - ログイン後も含め、認証用の Cookie が一切送信・保存されていないことを確認できます。
2. **IndexedDBのトークン保存**:
   - **「Application」タブ ->「IndexedDB」-> `next-sw-auth-db` -> `auth-store`** を開きます。
   - キー `accessToken` に `mock-session-token-xyz789` というトークンが格納されていることを確認できます。
3. **Service Workerによるヘッダーの注入**:
   - ログイン完了後の画面（ダッシュボード）でページをリロードし、**「Network」タブ** でドキュメント（名前が `/` または `localhost` のHTMLリクエスト）を選択します。
   - **「Request Headers (リクエストヘッダー)」** を確認すると、`Authorization: Bearer mock-session-token-xyz789` が Service Worker によって動的に追加されていることが確認できます。
4. **URL of the Page**:
   - ログイン状態のオンオフに関わらず、ブラウザのアドレスバーは常に `http://localhost:3000/` のまま不変です。

---

## 主要なコード解説

- **[src/utils/db.ts](file:///c:/prog/test/next/next-worker-auth/src/utils/db.ts)**
  ブラウザのメインスレッド and Service Worker の両環境で動作する、IndexedDB の非同期読み書きユーティリティ。
- **[public/sw.js](file:///c:/prog/test/next/next-worker-auth/public/sw.js)**
  ページ遷移（`mode: 'navigate'`）、APIへの通信、Next.jsのRSC（React Server Components）フェッチを傍受し、IndexedDBからトークンを取得してヘッダーを注入する。
- **[src/components/ServiceWorkerRegister.tsx](file:///c:/prog/test/next/next-worker-auth/src/components/ServiceWorkerRegister.tsx)**
  Service Workerの登録と状態監視。マウント直後からそのままサーバー構築HTMLを描画しつつ、右上部分にSWの登録状態をリアルタイムでバッジ表示（`SW: INITIALIZING` / `SW: ACTIVE`）します。
- **[src/app/page.tsx](file:///c:/prog/test/next/next-worker-auth/src/app/page.tsx)**
  サーバーコンポーネント。ヘッダーからトークンを抽出し、モック検証が通れば `<DashboardView />`、通らなければ `<LoginForm />` をサーバーサイド側で切り替えて返却します。
