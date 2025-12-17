# Implementation Tasks: Multi-Go Web App with Role-Based Access
# 実装タスク: ロールベースアクセス権を持つMulti-Goウェブアプリ

**Spec / 仕様書**: [spec.md](./spec.md)
**Plan / 計画書**: [plan.md](./plan.md)

This document breaks down the work required to implement the feature.
このドキュメントは、機能の実装に必要な作業を分割したものです。

## Phase 1: Project Setup / フェーズ1: プロジェクトのセットアップ

- [ ] Initialize `webapp/src/backend` Node.js project with Express and TypeScript. / `webapp/src/backend`のNode.jsプロジェクトをExpressとTypeScriptで初期化する。
- [ ] Initialize `webapp/src/frontend` React project using Vite with the TypeScript template. / `webapp/src/frontend`のReactプロジェクトをViteのTypeScriptテンプレートを使用して初期化する。
- [ ] Set up a monorepo structure (e.g., using npm workspaces). / モノレポ構造（例: npmワークスペースを使用）をセットアップする。
- [ ] Create a `docker-compose.yml` file to orchestrate the `frontend`, `backend`, and `postgres` services for local development. / ローカル開発用に`frontend`、`backend`、`postgres`サービスを連携させる`docker-compose.yml`ファイルを作成する。
- [ ] Configure `Jest` for both `backend` and `frontend` projects. / `backend`と`frontend`の両プロジェクトに`Jest`を設定する。

## Phase 2: Backend Development / フェーズ2: バックエンド開発

- [ ] **Database / データベース**:
  - [ ] Design the database schema for `users`, `roles`, and a `user_roles` join table. / `users`、`roles`、および`user_roles`結合テーブルのデータベーススキーマを設計する。
  - [ ] Create SQL migration scripts to set up the tables in PostgreSQL. / PostgreSQLにテーブルをセットアップするためのSQLマイグレーションスクリプトを作成する。
- [ ] **API & Services / APIとサービス**:
  - [ ] Implement database models/services to interact with the `users` and `roles` tables. / `users`と`roles`テーブルとやり取りするためのデータベースモデル/サービスを実装する。
  - [ ] Set up `Passport.js` with an OAuth 2.0 strategy. / OAuth 2.0戦略で`Passport.js`をセットアップする。
  - [ ] Create a `/api/auth/login` endpoint that initiates the OAuth flow. / OAuthフローを開始する`/api/auth/login`エンドポイントを作成する。
  - [ ] Create a `/api/auth/callback` endpoint to handle the OAuth redirect. / OAuthリダイレクトを処理する`/api/auth/callback`エンドポイントを作成する。
  - [ ] Create a `/api/auth/logout` endpoint to destroy the session. / セッションを破棄する`/api/auth/logout`エンドポイントを作成する。
  - [ ] Create a `/api/users/me` endpoint to fetch the current authenticated user's data, including their role. / 現在認証されているユーザーのデータ（ロールを含む）を取得する`/api/users/me`エンドポイントを作成する。
- [ ] **Role Management / ロール管理**:
  - [ ] Create secure API endpoints for role management (e.g., `GET /api/users`, `POST /api/users/:id/role`). / ロール管理のためのセキュアなAPIエンドポイントを作成する（例: `GET /api/users`, `POST /api/users/:id/role`）。
  - [ ] Implement middleware to protect these endpoints, ensuring only `Administrator` roles can access them. / これらのエンドポイントを保護するミドルウェアを実装し、`管理者`ロールのみがアクセスできるようにする。
- [ ] **Testing / テスト**:
  - [ ] Write unit tests for the services (e.g., user service, auth service). / サービス（例: ユーザーサービス、認証サービス）の単体テストを作成する。
  - [ ] Write integration tests for all API endpoints. / すべてのAPIエンドポイントの統合テストを作成する。

## Phase 3: Frontend Development / フェーズ3: フロントエンド開発

- [ ] **Setup & Structure / セットアップと構造**:
  - [ ] Set up `React Router` for client-side routing. / クライアントサイドのルーティングのために`React Router`をセットアップする。
  - [ ] Configure `MUI` with a custom theme (colors, fonts). / カスタムテーマ（色、フォント）で`MUI`を設定する。
  - [ ] Create an API service module to communicate with the backend. / バックエンドと通信するためのAPIサービスモジュールを作成する。
- [ ] **Internationalization (i18n) / 国際化対応**:
  - [ ] Set up `i18next` and `react-i18next` in the frontend application. / フロントエンドアプリケーションに`i18next`と`react-i18next`をセットアップする。
  - [ ] Create translation files for English, Japanese, and Chinese. / 英語、日本語、中国語の翻訳ファイルを作成する。
  - [ ] Implement a language switcher component to allow users to change the language. / ユーザーが言語を変更できる言語スイッチャーコンポーネントを実装する。
  - [ ] Refactor existing UI components to use the translation functions. / 既存のUIコンポーネントをリファクタリングして翻訳関数を使用するようにする。
- [ ] **Authentication / 認証**:
  - [ ] Create an `AuthContext` to manage authentication state, user data, and roles throughout the application. / アプリケーション全体で認証状態、ユーザーデータ、ロールを管理するための`AuthContext`を作成する。
  - [ ] Build the `LoginPage` with a button to trigger the OAuth flow. / OAuthフローを開始するボタンを持つ`LoginPage`を構築する。
  - [ ] Implement a `ProtectedRoute` component that checks for authentication and role. / 認証とロールをチェックする`ProtectedRoute`コンポーネントを実装する。
- [ ] **UI & Views / UIとビュー**:
  - [ ] Build a main application layout (e.g., `AppLayout`) with a persistent sidebar and header. / 固定サイドバーとヘッダーを持つメインアプリケーションレイアウト（例: `AppLayout`）を構築する。
  - [ ] Dynamically render navigation links in the sidebar based on the user's role. / ユーザーのロールに基づいてサイドバーのナビゲーションリンクを動的に描画する。
  - [ ] Create a placeholder `DashboardPage`. / プレースホルダーの`DashboardPage`を作成する。
  - [ ] Create a basic `UserManagementPage` (for Administrators) that lists users and allows role changes. / ユーザーを一覧表示し、ロール変更を許可する基本的な`UserManagementPage`（管理者向け）を作成する。
- [ ] **Testing / テスト**:
  - [ ] Write unit tests for key components (e.g., `ProtectedRoute`, `LoginPage`). / 主要コンポーネント（例: `ProtectedRoute`, `LoginPage`）の単体テストを作成する。
  - [ ] Write integration tests for user flows like login and navigating to a role-protected page. / ログインやロール保護されたページへのナビゲーションなどのユーザーフローの統合テストを作成する。

## Phase 4: PWA Implementation / フェーズ4: PWAの実装

- [ ] Add a `manifest.webmanifest` file with application metadata (name, icons, start_url). / アプリケーションのメタデータ（名前、アイコン、開始URL）を持つ`manifest.webmanifest`ファイルを追加する。
- [ ] Create a service worker file (`service-worker.ts`). / サービスワーカーファイル（`service-worker.ts`）を作成する。
- [ ] Register the service worker in the main application entry point. / メインアプリケーションのエントリポイントでサービスワーカーを登録する。
- [ ] Implement a caching strategy for static assets (e.g., JS, CSS, images) using the Cache API. / Cache APIを使用して静的アセット（例: JS, CSS, 画像）のキャッシング戦略を実装する。
- [ ] Implement a network-first or stale-while-revalidate strategy for API calls to ensure basic offline functionality. / 基本的なオフライン機能を確保するために、API呼び出しに対してネットワークファーストまたはstale-while-revalidate戦略を実装する。
