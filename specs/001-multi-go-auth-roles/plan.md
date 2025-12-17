# Implementation Plan: Multi-Go Web App with Role-Based Access
# 実装計画: ロールベースアクセス権を持つMulti-Goウェブアプリ

**Branch**: `001-multi-go-auth-roles` | **Date / 日付**: 2025-12-17 | **Spec / 仕様書**: [spec.md](./spec.md)
**Input / 入力**: Feature specification from `specs/001-multi-go-auth-roles/spec.md`

## Summary / 概要

This plan outlines the technical approach for building a foundational web application to manage the "Multi-Go" system. The core of this implementation is to establish a robust framework for user authentication (via OAuth) and role-based access control (RBAC) for `Administrator`, `Nurse`, and `Caregiver` roles. The application will be a Progressive Web App (PWA) to ensure offline usability.

この計画は、「Multi-Go」システムを管理するための基本的なWebアプリケーションを構築するための技術的アプローチを概説します。この実装の中核は、`管理者`、`看護士`、`介護士`のロールに対するユーザー認証（OAuth経由）とロールベースアクセス制御（RBAC）のための堅牢なフレームワークを確立することです。アプリケーションは、オフラインでの使いやすさを確保するためにプログレッシブウェブアプリ（PWA）になります。

## Technical Context / 技術的背景

**Language/Version / 言語/バージョン**: 
- Backend: `Node.js (LTS)`
- Frontend: `TypeScript 5.x`

**Primary Dependencies / 主要な依存関係**: 
- Backend: `Express.js`, `Passport.js` (for OAuth), `pg` (for PostgreSQL)
- Frontend: `React 18`, `MUI (Material-UI)`, `Vite`, `i18next`, `react-i18next`

**Storage / ストレージ**: `PostgreSQL` for user accounts, credentials, and role assignments. / ユーザーアカウント、資格情報、ロール割り当てに `PostgreSQL` を使用。

**Testing / テスト**: `Jest` and `React Testing Library` for the frontend; `Jest` and `Supertest` for the backend. / フロントエンドには `Jest` と `React Testing Library`、バックエンドには `Jest` と `Supertest` を使用。

**Target Platform / 対象プラットフォーム**: Modern Web Browsers (latest stable Chrome, Firefox, Safari) and as a Progressive Web App (PWA) on desktop and tablet. / モダンWebブラウザ（最新の安定版Chrome, Firefox, Safari）およびデスクトップ・タブレット上のプログレッシブウェブアプリ（PWA）。

**Project Type / プロジェクトタイプ**: Web Application (separate frontend and backend). / Webアプリケーション（フロントエンドとバックエンドを分離）。

**Performance Goals / パフォーマンス目標**: Initial page load time for a logged-in user must be under 3 seconds. / ログインしたユーザーの初期ページ読み込み時間は3秒未満でなければならない。

**Constraints / 制約**: The application must be offline-capable, allowing users to perform critical tasks even with a weak or no internet connection. / アプリケーションはオフライン対応でなければならず、インターネット接続が弱い、またはない場合でもユーザーが重要なタスクを実行できるようにする必要がある。

**Scale/Scope / スケール/スコープ**: Initial version supports ~100 users, focusing on the authentication and RBAC framework. / 初期バージョンは〜100ユーザーをサポートし、認証とRBACフレームワークに焦点を当てる。

### Technology Rationale / 技術選定の根拠
- **React 18 vs. 19**: We are choosing **React 18** for its stability and mature ecosystem. React 19 is still very new, and using a battle-tested version mitigates risks associated with library compatibility and potential bugs. An upgrade path to React 19 can be planned for the future. / **React 18 vs 19**: 安定性と成熟したエコシステムを理由に**React 18**を選択します。React 19はまだ新しく、広く使われている安定版を使用することで、ライブラリの互換性や潜在的なバグに関するリスクを軽減します。将来的にReact 19へのアップグレードを計画することは可能です。
- **Node.js/Express**: A mature, high-performance, and widely-adopted stack for building APIs, especially in conjunction with React frontends. / **Node.js/Express**: API、特にReactフロントエンドと連携するAPIを構築するための、成熟し、高性能で、広く採用されているスタックです。
- **PostgreSQL**: A powerful, reliable, and open-source relational database well-suited for handling user and role data with integrity. / **PostgreSQL**: ユーザーおよびロールのデータを整合性を持って処理するのに適した、強力で信頼性の高いオープンソースのリレーショナルデータベースです。

## Constitution Check / 憲法チェック

*Note: The constitution appears to be ROS2-specific. This plan adapts the principles to a web application context.*
*注意: この憲法はROS2に特化しているようです。この計画では、その原則をWebアプリケーションの文脈に適合させます。*

- [ ] **I. ROS2-Native Development**: N/A. This is a web application, not a ROS2 node. / **I. ROS2ネイティブ開発**: 該当なし。これはROS2ノードではなくWebアプリケーションです。
- [x] **II. Clear Separation of Concerns**: Yes. The structure is modular, separating the `frontend` and `backend` concerns. / **II. 関心の明確な分離**: はい。構造はモジュール化されており、`frontend`と`backend`の関心を分離しています。
- [ ] **III. Configuration-Driven Behavior**: N/A for ROS parameters. However, backend will use environment variables for configuration (e.g., database connection, OAuth secrets). / **III. 設定駆動の動作**: ROSパラメータには該当なし。ただし、バックエンドは設定に環境変数を使用します（例: データベース接続、OAuthシークレット）。
- [ ] **IV. Composition via Launch Files**: N/A. `docker-compose` will be used to run the application stack locally. / **IV. 起動ファイルによる構成**: 該当なし。ローカルでアプリケーションスタックを実行するために`docker-compose`を使用します。
- [x] **V. Test-Driven Development (TDD)**: Yes. The plan includes tasks for writing tests. / **V. テスト駆動開発(TDD)**: はい。計画にはテスト作成のタスクが含まれています。
- [x] **VI. Multilingual Documentation (English, Japanese, Chinese)**: Yes. All user-facing strings and documentation will be multilingual. / **VI. 多言語文書(英語, 日本語, 中国語)**: はい。すべてのユーザー向け文字列とドキュメントは多言語対応になります。

## Project Structure / プロジェクト構成

### Documentation (this feature) / ドキュメント（この機能）

```text
specs/001-multi-go-auth-roles/
├── spec.md              # The feature specification / 機能仕様書
├── plan.md              # This file / このファイル
└── tasks.md             # To be created for implementation tasks / 実装タスクのために作成
```

### Source Code (repository root) / ソースコード（リポジトリルート）

The project will follow a standard frontend/backend monorepo structure within the `webapp/src` directory.
プロジェクトは`webapp/src`ディレクトリ内に、標準的なフロントエンド/バックエンドのモノレポ構造に従います。

```text
webapp/src/
├── backend/
│   ├── src/
│   │   ├── api/         # Express routes and controllers / Expressのルートとコントローラー
│   │   ├── services/    # Business logic (auth, user management) / ビジネスロジック（認証、ユーザー管理）
│   │   ├── models/      # Database models (e.g., User, Role) / データベースモデル（例: User, Role）
│   │   └── config/      # Passport, database config / Passport、データベース設定
│   └── tests/
│       ├── integration/ # Integration tests / 統合テスト
│       └── unit/        # Unit tests / 単体テスト
└── frontend/
    ├── src/
    │   ├── components/  # Reusable React components / 再利用可能なReactコンポーネント
    │   ├── pages/       # Top-level page components (Login, Dashboard) / トップレベルのページコンポーネント（ログイン、ダッシュボード）
    │   ├── services/    # API client, PWA service worker / APIクライアント、PWAサービスワーカー
    │   ├── context/     # React context for auth/user state / 認証/ユーザー状態のためのReactコンテキスト
    │   └── assets/      # Static assets / 静的アセット
    └── tests/
```

**Structure Decision**: The selected structure provides a clean separation between the presentation layer (frontend) and the business/data logic (backend), which is ideal for this type of web application.
**構成決定**: 選択された構造は、プレゼンテーション層（フロントエンド）とビジネス/データロジック（バックエンド）をきれいに分離しており、このタイプのWebアプリケーションに最適です。

## Complexity Tracking / 複雑性の追跡

N/A
