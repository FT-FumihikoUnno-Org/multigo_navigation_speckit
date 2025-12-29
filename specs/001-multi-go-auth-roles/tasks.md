---
description: "Task list for implementing the Multi-Go Web App with Role-Based Access"
---

<!-- Updated tasks and status as of 2025-12-29: added tasks completed during implementation and new follow-ups -->

# Tasks: Multi-Go Web App with Role-Based Access
# タスク: ロールベースアクセス権を持つMulti-Goウェブアプリ

**Input**: Design documents from `/specs/001-multi-go-auth-roles/`
**入力**: `/specs/[###-feature-name]/`からの設計文書

**Prerequisites**: plan.md (required), spec.md (required for user stories)
**前提条件**: plan.md (必須), spec.md (ユーザーストーリーに必須)

**Tests**: Tasks include tests as per the TDD strategy in `plan.md`.
**テスト**: `plan.md`のTDD戦略に基づき、タスクにテストを含みます。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
**構成**: 各ストーリーを独立して実装・テストできるよう、タスクはユーザーストーリーごとにグループ化されています。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies) / 並列実行可能（ファイルが異なり、依存関係がない）
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3) / このタスクが属するユーザーストーリー（例: US1, US2, US3）
- Include exact file paths in descriptions / 説明に正確なファイルパスを含める

## Path Conventions / パス規約

- **Web App**: `webapp/src/backend/`, `webapp/src/frontend/`
- Paths below are adjusted for the `plan.md` structure. / 以下のパスは `plan.md` の構成に合わせて調整されています。

---

## Phase 1: Setup (Shared Infrastructure) / フェーズ1: セットアップ (共通インフラ)

**Purpose**: Project initialization and basic structure for both frontend and backend.
**目的**: フロントエンドとバックエンド両方のプロジェクト初期化と基本構造の構築。

- [X] T001 [P] Initialize Node.js project in `webapp/src/backend/` and add dependencies: express, passport, passport-openidconnect, pg, dotenv.
    - `webapp/src/backend/` でNode.jsプロジェクトを初期化し、依存関係を追加: express, passport, passport-openidconnect, pg, dotenv。
- [X] T002 [P] Initialize Vite + React (TypeScript) project in `webapp/src/frontend/` and add dependencies: react-router-dom, @mui/material, @emotion/react, @emotion/styled, i18next, react-i18next.
    - `webapp/src/frontend/` でVite + React (TypeScript)プロジェクトを初期化し、依存関係を追加: react-router-dom, @mui/material, @emotion/react, @emotion/styled, i18next, react-i18next。
- [X] T003 [P] Configure linting (ESLint) and formatting (Prettier) for both `frontend` and `backend` workspaces.
    - `frontend`と`backend`両方のワークスペースにリンティング(ESLint)とフォーマット(Prettier)を設定。
- [X] T004 [P] Configure TypeScript (`tsconfig.json`) for both `frontend`と`backend`.
    - `frontend`と`backend`両方にTypeScript (`tsconfig.json`)を設定。
- [X] T005 [P] Setup testing frameworks: Jest and Supertest for `webapp/src/backend/`, Jest and React Testing Library for `webapp/src/frontend/`.
    - テストフレームワークをセットアップ: `webapp/src/backend/` にJestとSupertest、`webapp/src/frontend/` にJestとReact Testing Library。
- [X] T006 Configure `docker-compose.yml` to run the backend, frontend (dev server), and a PostgreSQL database service.
    - バックエンド、フロントエンド（開発サーバー）、PostgreSQLデータベースサービスを実行するために`docker-compose.yml`を設定。
- [X] T048 Create a development-only dummy OpenID Connect provider `dummyauth` in `webapp/src/dummyauth/`. Implement `/authorize`, `/authorize-login`, `/token`, `/jwks.json`, and `/health`. Ensure `id_token` is RS256-signed and JWKs exposes the public key `kid`/`alg`. (Dev-only; exclude from production.)
    - `webapp/src/dummyauth/src/` にダミー OIDC サーバーを実装。`/authorize`, `/authorize-login`, `/token`, `/jwks.json`, `/health` を含め、`id_token` は RS256 で署名。ドキュメントとテストを含む。
- [X] T049 Add `dummyauth` to `docker-compose.dev.yml` and provide a development nginx reverse-proxy config under `webapp/nginx/` to present frontend and backend as same-origin in dev. Ensure `dummyauth` and the dev nginx config are **only** included in development compose overrides and not in production.
    - `docker-compose.dev.yml` に `dummyauth` と dev nginx を追加し、同一オリジンでのテストを容易にする。開発専用であることを明確にする。
- [X] T050 Update backend Passport configuration to support `DEV_INTERNAL_OIDC_ISSUER` (internal token/userinfo calls) and `DEV_EXTERNAL_OIDC_ISSUER` (browser redirect issuer), and add an in-memory dev state store to avoid session-based state verification failures during testing.
    - `webapp/src/backend/src/config/passport.ts` を更新し、内部/外部発行者のサポートと、開発用のインメモリ state store を実装。
- [X] T051 Add an integration-level E2E smoke test that exercises the login flow against `dummyauth` (using cookie jar and following redirects) to verify session creation and redirect-to-frontend behavior.
    - 統合 E2E テストを追加し、`dummyauth` を使ってフルログインフローを検証する（cookie jar とリダイレクト追跡を使用）。
- [X] T052 Update `webapp/README.md` to document how to start the development stack with `dummyauth` and the dev reverse-proxy, and explicitly state that `dummyauth` is development-only.
    - `webapp/README.md` を更新し、`dummyauth` の起動方法と開発専用であることを明記する。

---

## Phase 2: Foundational (Blocking Prerequisites) / フェーズ2: 基盤 (ブロッキング前提条件)

<!-- Completed after initial implementation -->
- [X] T053 Add `approved` boolean column to `users` table (migration `003_add_user_approved_column.ts`).
- [X] T054 Add local auth columns and optional admin seed (migration `004_add_local_auth_columns_and_seed_admin.ts`).
- [X] T055 Implement local auth helpers (`webapp/src/backend/src/services/localAuth.ts`) using scrypt with bcrypt fallback and tests.
- [X] T056 Implement `/auth/local` and `/auth/local/change-password` endpoints and `forcePasswordChange` middleware in `webapp/src/backend/src/api/auth.ts` and `webapp/src/backend/src/middleware/`.
- [X] T057 Add integration tests for local auth (`webapp/src/backend/tests/integration/localAuth.test.ts`).
- [X] T058 Add global Jest setup for backend (`jest.setup.ts`) to load Passport config and ensure consistent session behavior in tests.
- [X] T059 Ensure frontend test setup (`setupTests.ts`) initializes i18n, global fetch mock, and polyfills for TextEncoder/TextDecoder and is referenced in `jest.config.cjs`.
- [X] T060 Add Playwright E2E tests and Dockerfile.e2e + `e2e` service in docker-compose, with a runner script for CI (`webapp/Dockerfile.e2e`, `scripts/ci/run-e2e.sh`).
- [X] T061 Update CI workflows to run `backend-tests` and `frontend-tests`, publish JUnit reports for both, and only run E2E after unit tests pass (update `.github/workflows/e2e.yml`).
- [X] T062 Add Vite `allowedHosts` configuration to permit the dev nginx host and avoid dev host 403 errors (`webapp/src/frontend/vite.config.ts`).
- [X] T063 Document admin bootstrapping via migration and BOOTSTRAP env vars (migration `004` seed) in README and add example commands to seed an admin user.
- [X] T064 Add pending approval redirect and frontend `PendingApprovalPage` so unapproved users are shown a pending page (`/pending`).
- [X] T065 Ensure Passport dev state store is used in non-production to avoid state verification problems when testing with `dummyauth`.

<!-- New follow-ups (tracked) -->
- [X] T066 Create an explicit CLI or safe script to bootstrap the first admin (recommended replacement for migration-based optional seed). / **T066: 最初の管理者をブートストラップするための明示的なCLIまたは安全なスクリプトを作成（マイグレーションベースのオプションシードの推奨代替）。**
  - `webapp/src/backend/src/cmd/bootstrap-admin.ts` (CLI entrypoint) — provides `runBootstrapAdmin` to create admin users programmatically. / `webapp/src/backend/src/cmd/bootstrap-admin.ts`（CLI エントリポイント）— `runBootstrapAdmin` を提供し、プログラムから管理者ユーザーを作成できます。
  - `webapp/src/backend/src/cmd/admin.ts` (admin helper CLI with list-pending / approve / revoke / show / set-role commands). / `webapp/src/backend/src/cmd/admin.ts`（管理者用ヘルパーCLI: `list-pending`、`approve`、`revoke`、`show`、`set-role` コマンドを含む）。
  - Unit and integration tests: `webapp/src/backend/tests/unit/bootstrap-admin.test.ts`, `webapp/src/backend/tests/integration/bootstrap-admin.integration.test.ts`. / ユニットおよび統合テスト: `webapp/src/backend/tests/unit/bootstrap-admin.test.ts`, `webapp/src/backend/tests/integration/bootstrap-admin.integration.test.ts`。
  - Note: Migration-based optional seeding (`003`/`004`) remains available; the explicit CLI is the recommended safe mechanism for bootstrapping admins. / 注: マイグレーションベースのオプションシード（`003`/`004`）は引き続き利用可能です。明示的なCLIは、管理者の安全な初期化手段として推奨されます。
  - **UI**: No admin GUI page was implemented as part of this change (per spec). Admin actions are available via CLI/API only. / **UI**: 本変更では管理者向けのページ（GUI）は実装していません（仕様どおり）。管理操作はCLI/API経由で行います。
- [ ] T067 Integrate the `force_password_change` flow into frontend UX (show change-password page/modals when flagged). / T067: `force_password_change` フローをフロントエンドUXに統合（フラグが立っている場合にパスワード変更ページ/モーダルを表示）。
- [ ] T068 Add CI test flakiness monitoring and retry/backoff policy for E2E to improve stability on CI. / T068: CI における E2E の不安定性を軽減するためのフラッキーモニタリングとリトライ/バックオフポリシーを追加。

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.
**目的**: ユーザーストーリーの実装を開始する前に完了しなければならないコアインフラ。

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.
**⚠️ 重要**: このフェーズが完了するまで、ユーザーストーリーの作業は開始できません。

### Backend / バックエンド
- [X] T007 Setup basic Express server in `webapp/src/backend/src/server.ts` with a health check endpoint.
    - `webapp/src/backend/src/server.ts` にヘルスチェックエンドポイントを持つ基本的なExpressサーバーをセットアップ。
- [X] T008 [P] Configure environment variable handling (e.g., using `dotenv`) in `webapp/src/backend/src/config/`.
    - `webapp/src/backend/src/config/` で環境変数処理（例: `dotenv`を使用）を設定。
- [X] T009 Setup PostgreSQL database connection module in `webapp/src/backend/src/config/database.ts`.
    - `webapp/src/backend/src/config/database.ts` にPostgreSQLデータベース接続モジュールをセットアップ。
- [X] T010 Create database migration scripts for `users` and `roles` tables. The `users` table should link to `roles`.
    - `users`と`roles`テーブル用のデータベースマイグレーションスクリプトを作成。`users`テーブルは`roles`にリンクする。
- [X] T011 Implement core Passport.js setup with an OpenID Connect strategy in `webapp/src/backend/src/config/passport.ts`.
    - `webapp/src/backend/src/config/passport.ts` にOpenID Connect戦略でコアPassport.jsセットアップを実装。
- [X] T012 [P] Create base authentication middleware in `webapp/src/backend/src/middleware/auth.ts` to check for authenticated sessions.
    - `webapp/src/backend/src/middleware/auth.ts` に認証済みセッションをチェックするための基本認証ミドルウェアを作成。
- [X] T013 [P] Create error handling and logging middleware in `webapp/src/backend/src/middleware/`.
    - `webapp/src/backend/src/middleware/` にエラーハンドリングとロギングのミドルウェアを作成。

### Frontend / フロントエンド
- [X] T014 Setup basic application routing using `react-router-dom` in `webapp/src/frontend/src/App.tsx`.
    - `webapp/src/frontend/src/App.tsx` で`react-router-dom`を使用して基本的なアプリケーションルーティングをセットアップ。
- [X] T015 [P] Create a global MUI theme provider in `webapp/src/frontend/src/theme.ts`.
    - `webapp/src/frontend/src/theme.ts` にグローバルMUIテーマプロバイダーを作成。
- [X] T016 **Self-host Roboto font files** in `webapp/src/frontend/public/fonts/` and configure the MUI theme to use them, avoiding Google Fonts APIs for China accessibility.
    - 中国からのアクセシビリティのため、`webapp/src/frontend/public/fonts/` で**Robotoフォントファイルをセルフホスト**し、Google Fonts APIを避けるようにMUIテーマを設定。
- [X] T017 Create a React Context for authentication (`AuthContext`) in `webapp/src/frontend/src/context/AuthContext.tsx` to manage user state, roles, and tokens.
    - `webapp/src/frontend/src/context/AuthContext.tsx` に認証用React Context (`AuthContext`)を作成し、ユーザー状態、ロール、トークンを管理。

---

## Phase 3: User Story 1 - User Authentication (Priority: P1) 🎯 MVP / フェーズ3: ユーザーストーリー1 - ユーザー認証 (優先度: P1) 🎯 MVP

**Goal**: A user can log in via an external OpenID provider, establishing a session and identifying their role.
**目標**: ユーザーが外部OpenIDプロバイダー経由でログインし、セッションを確立して自分のロールを識別できる。
**Independent Test**: After logging in via the IdP, the user is redirected to the dashboard and their username is displayed.
**独立テスト**: IdP経由でログイン後、ユーザーはダッシュボードにリダイレクトされ、ユーザー名が表示される。

### Tests for User Story 1 (TDD) / ユーザーストーリー1のテスト (TDD)
- [X] T018 [P] [US1] Backend: Write integration test for the `/auth/openid/callback` endpoint in `webapp/src/backend/tests/integration/auth.test.ts` to ensure it creates a session.
    - バックエンド: `webapp/src/backend/tests/integration/auth.test.ts` で`/auth/openid/callback`エンドポイントの統合テストを書き、セッションが作成されることを確認。
- [X] T019 [P] [US1] Frontend: Write a test for the login flow in `webapp/src/frontend/src/pages/Login.test.tsx`, mocking the redirect and `AuthContext` update.
    - フロントエンド: `webapp/src/frontend/src/pages/Login.test.tsx` でログインフローのテストを書き、リダイレクトと`AuthContext`の更新をモック。

### Implementation for User Story 1 / ユーザーストーリー1の実装
- [X] T020 [P] [US1] Frontend: Create a `LoginPage.tsx` in `webapp/src/frontend/src/pages/` containing a single "Login" button.
    - フロントエンド: `webapp/src/frontend/src/pages/` に単一の「ログイン」ボタンを含む`LoginPage.tsx`を作成。
- [X] T021 [P] [US1] Frontend: Create a placeholder `DashboardPage.tsx` in `webapp/src/frontend/src/pages/`.
    - フロントエンド: `webapp/src/frontend/src/pages/` にプレースホルダーの`DashboardPage.tsx`を作成。
- [X] T022 [US1] Backend: Implement the `/auth/login` and `/auth/logout` routes in `webapp/src/backend/src/api/auth.ts`.
    - バックエンド: `webapp/src/backend/src/api/auth.ts` に`/auth/login`と`/auth/logout`ルートを実装。
- [X] T023 [US1] Backend: Implement the `/auth/openid/callback` route. It must validate the OIDC token, find or create a user in the database, establish a session, and redirect to the frontend dashboard.
    - バックエンド: `/auth/openid/callback`ルートを実装。OIDCトークンを検証し、データベースでユーザーを検索または作成し、セッションを確立してフロントエンドのダッシュボードにリダイレクトする必要がある。
- [X] T024 [US1] Backend: Create an endpoint `GET /api/me` that returns the logged-in user's data (e.g., name, email, role) from the session.
    - バックエンド: セッションからログイン中ユーザーのデータ（名前、メール、ロールなど）を返す`GET /api/me`エンドポイントを作成。
- [X] T025 [US1] Frontend: In `AuthContext`, implement the logic to fetch user data from the `/api/me` endpoint upon application load to check for an existing session.
    - フロントエンド: `AuthContext`で、アプリケーション読み込み時に`/api/me`エンドポイントからユーザーデータを取得し、既存セッションをチェックするロジックを実装。
- [X] T026 [US1] Frontend: Implement a `ProtectedRoute` component that redirects unauthenticated users from the dashboard to the login page.
    - フロントエンド: 未認証ユーザーをダッシュボードからログインページにリダイレクトする`ProtectedRoute`コンポーネントを実装。

**Checkpoint**: User Story 1 should be fully functional. A user can log in and out.
**チェックポイント**: ユーザーストーリー1が完全に機能するはず。ユーザーはログイン・ログアウトできる。

---

## Phase 4: User Story 2 - Role-Specific Feature Access (Priority: P2) / フェーズ4: ユーザーストーリー2 - ロール固有の機能アクセス (優先度: P2)

**Goal**: The UI dynamically changes based on the authenticated user's role (`Administrator`, `Nurse`, `Caregiver`).
**目標**: 認証されたユーザーのロール（`管理者`、`看護士`、`介護士`）に基づいてUIが動的に変化する。
**Independent Test**: Log in as an Administrator and see the "User Management" link. Log in as a Nurse and confirm the link is not visible.
**独立テスト**: 管理者としてログインし、「ユーザー管理」リンクが表示されることを確認。看護士としてログインし、リンクが表示されないことを確認。

### Tests for User Story 2 (TDD) / ユーザーストーリー2のテスト (TDD)
- [X] T027 [P] [US2] Backend: Write an integration test in `webapp/src/backend/tests/integration/admin.test.ts` to verify that a non-admin user gets a 403 Forbidden error from an admin-only endpoint.
    - バックエンド: `webapp/src/backend/tests/integration/admin.test.ts`で統合テストを書き、非管理者ユーザーが管理者専用エンドポイントから403 Forbiddenエラーを受け取ることを確認。
- [X] T028 [P] [US2] Frontend: Write a component test for the `Navbar.tsx` that asserts the "User Management" link is rendered only if the `AuthContext` provides an `Administrator` role.
    - フロントエンド: `Navbar.tsx`のコンポーネントテストを書き、`AuthContext`が`Administrator`ロールを提供する場合にのみ「ユーザー管理」リンクがレンダリングされることを表明。

### Implementation for User Story 2 / ユーザーストーリー2の実装
- [X] T029 [US2] Backend: Create a role-checking middleware `requireRole('Administrator')` in `webapp/src/backend/src/middleware/roles.ts`.
    - バックエンド: `webapp/src/backend/src/middleware/roles.ts`にロールチェックミドルウェア`requireRole('Administrator')`を作成。
- [X] T030 [P] [US2] Frontend: Create a `Navbar.tsx` component in `webapp/src/frontend/src/components/`.
    - フロントエンド: `webapp/src/frontend/src/components/`に`Navbar.tsx`コンポーネントを作成。
- [X] T031 [US2] Frontend: In `Navbar.tsx`, consume the `AuthContext` and conditionally render navigation links (e.g., "User Management" link for `Administrator` only).
    - フロントエンド: `Navbar.tsx`で`AuthContext`を使用し、ナビゲーションリンクを条件付きでレンダリング（例: 「ユーザー管理」リンクは`Administrator`のみ）。
- [X] T032 [US2] Frontend: Create a `RoleBasedGuard.tsx` component that takes a role and hides its children or redirects if the current user does not have the required role.
    - フロントエンド: ロールを受け取り、現在のユーザーが必要なロールを持たない場合に子要素を隠すかリダイレクトする`RoleBasedGuard.tsx`コンポーネントを作成。
- [X] T033 [US2] Frontend: Protect the route to the (not-yet-created) admin page using the `RoleBasedGuard`.
    - フロントエンド: `RoleBasedGuard`を使用して（まだ作成されていない）管理ページへのルートを保護。

**Checkpoint**: User Story 2 should be functional. The UI should now differ for admins vs. other roles.
**チェックポイント**: ユーザーストーリー2が機能するはず。UIが管理者と他のロールで異なるようになる。

---

## Phase 5: User Story 3 - Admin Role Management (Priority: P3) / フェーズ5: ユーザーストーリー3 - 管理者によるロール管理 (優先度: P3)

**Goal**: An administrator can view a list of users and assign/change their application-specific roles.
**目標**: 管理者がユーザーリストを表示し、アプリケーション固有のロールを割り当て/変更できる。
**Independent Test**: As an admin, navigate to the User Management page, change a user's role from "Nurse" to "Caregiver", and verify the change is saved and reflected.
**独立テスト**: 管理者としてユーザー管理ページに移動し、ユーザーのロールを「看護士」から「介護士」に変更し、変更が保存・反映されることを確認。

### Tests for User Story 3 (TDD) / ユーザーストーリー3のテスト (TDD)
- [X] T034 [P] [US3] Backend: Write integration tests for `GET /api/users` and `PUT /api/users/:id/role` endpoints in `webapp/src/backend/tests/integration/users.test.ts`.
    - バックエンド: `webapp/src/backend/tests/integration/users.test.ts`で`GET /api/users`と`PUT /api/users/:id/role`エンドポイントの統合テストを作成。
- [X] T035 [P] [US3] Frontend: Write a test for the `UserManagementPage.tsx` to ensure it correctly lists users and that selecting a new role triggers the update API call.
    - フロントエンド: `UserManagementPage.tsx`のテストを作成し、ユーザーが正しくリストされ、新しいロールを選択すると更新API呼び出しがトリガーされることを確認。

### Implementation for User Story 3 / ユーザーストーリー3の実装
- [X] T036 [US3] Backend: Implement `UserService` in `webapp/src/backend/src/services/userService.ts` for listing users and updating roles.
    - バックエンド: `webapp/src/backend/src/services/userService.ts`にユーザーリストとロール更新のための`UserService`を実装。
- [X] T037 [US3] Backend: Create API endpoints `GET /api/users` and `PUT /api/users/:id/role` in `webapp/src/backend/src/api/users.ts`. Protect both with the `requireRole('Administrator')` middleware.
    - バックエンド: `webapp/src/backend/src/api/users.ts`に`GET /api/users`と`PUT /api/users/:id/role`APIエンドポイントを作成。両方を`requireRole('Administrator')`ミドルウェアで保護。
- [X] T038 [P] [US3] Frontend: Create `UserManagementPage.tsx` in `webapp/src/frontend/src/pages/admin/`.
    - フロントエンド: `webapp/src/frontend/src/pages/admin/`に`UserManagementPage.tsx`を作成。
- [X] T039 [US3] Frontend: On this page, fetch and display a list of users from the `GET /api/users` endpoint.
    - フロントエンド: このページで、`GET /api/users`エンドポイントからユーザーリストを取得して表示。
- [X] T040 [US3] Frontend: For each user in the list, display their current role and provide a dropdown (MUI `<Select>`) to change it. On change, call the `PUT /api/users/:id/role` endpoint.
    - フロントエンド: リスト内の各ユーザーについて、現在のロールを表示し、それを変更するためのドロップダウン（MUI `<Select>`）を提供。変更時に`PUT /api/users/:id/role`エンドポイントを呼び出す。

---

## Phase 6: Polish & Cross-Cutting Concerns / フェーズ6: 仕上げ & 横断的関心事

**Purpose**: Improvements that affect multiple user stories and fulfill non-functional requirements.
**目的**: 複数のユーザーストーリーに影響し、非機能要件を満たす改善。

- [X] T041 [P] **PWA**: Configure Vite's PWA plugin, create a `manifest.webmanifest`, and a basic offline-caching `service-worker.ts` in `webapp/src/frontend/public/`.
    - **PWA**: `webapp/src/frontend/public/`にViteのPWAプラグインを設定し、`manifest.webmanifest`と基本的なオフラインキャッシュ用`service-worker.ts`を作成。
- [X] T042 [P] **Responsiveness**: Review all created pages (`Login`, `Dashboard`, `UserManagement`) and ensure the layout is functional and readable on screens from 768px to 1920px wide using MUI Grid/Stack.
    - **レスポンシブ対応**: 作成したすべてのページ（`Login`, `Dashboard`, `UserManagement`）を確認し、MUI Grid/Stackを使用して768pxから1920px幅の画面でレイアウトが機能的かつ可読であることを確認。
- [X] T043 **Localization**: Configure `i18next` in `webapp/src/frontend/src/i18n.ts`.
    - **ローカライゼーション**: `webapp/src/frontend/src/i18n.ts`で`i18next`を設定。
- [X] T044 [P] **Localization**: Create initial translation files (`en.json`, `ja.json`, `zh.json`) in `webapp/src/frontend/public/locales/`.
    - **ローカライゼーション**: `webapp/src/frontend/public/locales/`に初期翻訳ファイル（`en.json`, `ja.json`, `zh.json`）を作成。
- [X] T045 **Localization**: Refactor all user-facing strings in the React components to use the `useTranslation` hook.
    - **ローカライゼーション**: Reactコンポーネント内のすべてのユーザー向け文字列を`useTranslation`フックを使用するようにリファクタリング。
- [X] T046 [P] **Localization**: Add a language switcher component to the `Navbar`.
    - **ローカライゼーション**: `Navbar`に言語切り替えコンポーネントを追加。
- [X] T047 **Documentation**: Update the root `README.md` with detailed instructions on how to set up the environment, run the `docker-compose` stack, and log in with test credentials.
    - **ドキュメンテーション**: ルートの`README.md`を更新し、環境設定、`docker-compose`スタックの実行、テスト資格情報でのログインに関する詳細な手順を記載。

---

## Dependencies & Execution Order / 依存関係と実行順序

- **Setup (Phase 1)** -> **Foundational (Phase 2)** -> **User Stories (Phase 3-5)** -> **Polish (Phase 6)**
- All user stories depend on Phase 2 completion. Once Phase 2 is done, user stories can theoretically be developed in parallel. / 全てのユーザーストーリーはフェーズ2の完了に依存。フェーズ2が完了すれば、ユーザーストーリーは理論的に並行して開発可能。
- MVP is the completion of Phase 3 (User Story 1). / MVPはフェーズ3（ユーザーストーリー1）の完了です。

## Implementation Strategy / 実装戦略

1.  **MVP First**: Complete Phases 1, 2, and 3. At this point, you have a testable, deployable application that handles login/logout.
    - **MVP優先**: フェーズ1、2、3を完了。この時点で、ログイン/ログアウトを処理するテスト可能でデプロイ可能なアプリケーションが完成。
2.  **Incremental Delivery**: Add Phase 4 (Role-Specific UI), then Phase 5 (Admin Management).
    - **インクリメンタル配信**: フェーズ4（ロール固有UI）、次にフェーズ5（管理者権限）を追加。
3.  **Final Polish**: Complete Phase 6 to meet all non-functional requirements.
    - **最終仕上げ**: フェーズ6を完了し、すべての非機能要件を満たす。