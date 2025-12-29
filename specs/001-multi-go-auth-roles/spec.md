# Feature Specification: Multi-Go Web App with Role-Based Access
# 機能仕様書: ロールベースアクセス権を持つMulti-Goウェブアプリ

**Version / バージョン**: 1.0
**Status / ステータス**: In progress / 開発中
**Author / 作成者**: Gemini
**Created / 作成日**: 2025-12-17
**Last Updated / 最終更新日**: 2025-12-29

## 1. Description / 概要

This document outlines the requirements for a foundational web application designed to configure and manage the "Multi-Go" system. The primary goal of this initial version is to establish a robust framework for user authentication and role-based access control (RBAC).

このドキュメントは、「Multi-Go」システムを設定および管理するために設計された基本的なWebアプリケーションの要件を概説します。この初期バージョンの主な目的は、ユーザー認証とロールベースアクセス制御（RBAC）のための堅牢なフレームワークを確立することです。

The application must be responsive, ensuring a seamless user experience on both standard PC and tablet devices. Based on the authenticated user's assigned role, the application will dynamically adjust the available features and UI elements.

このアプリケーションはレスポンシブでなければならず、標準的なPCとタブレットデバイスの両方でシームレスなユーザーエクスペリエンスを保証する必要があります。認証されたユーザーに割り当てられたロールに基づいて、アプリケーションは利用可能な機能とUI要素を動的に調整します。

## 2. Rationale / 論理的根拠

The "Multi-Go" system requires a centralized and user-friendly interface for management and configuration. Different user personas (e.g., administrators vs. standard users) have distinct needs and levels of authorization. Implementing a role-based system from the start ensures security, scalability, and a tailored user experience. This foundational framework will support the future addition of more complex features.

「Multi-Go」システムには、管理と設定のための一元化された使いやすいインターフェースが必要です。さまざまなユーザーペルソナ（例：管理者と標準ユーザー）は、異なるニーズと認可レベルを持っています。最初からロールベースのシステムを実装することで、セキュリティ、スケーラビリティ、およびカスタマイズされたユーザーエクスペリエンスが保証されます。この基本的なフレームワークは、将来のより複雑な機能の追加をサポートします。

## 3. User Scenarios / ユーザーシナリオ

- **Scenario 1: User Authentication / シナリオ1: ユーザー認証**
  - **Actor / アクター**: Administrator, Nurse, Caregiver / 管理者、看護士、介護士
  - **Pre-conditions / 事前条件**: The user has valid credentials. / ユーザーが有効な資格情報を持っていること。
  - Flow / フロー**:
    1. The user navigates to the web application URL. / ユーザーがWebアプリケーションのURLにアクセスします。
    2. The application presents a login button, initiating the OpenID Connect flow. / アプリケーションがログインボタンを表示し、OpenID Connectフローを開始します。
    3. The user is redirected to the Identity Provider (e.g., Google, Auth0) to authenticate. / ユーザーは認証のためにIdentity Provider（例：Google、Auth0）にリダイレクトされます。
    4. Upon successful authentication by the Identity Provider, the user is redirected back to the application with an ID Token. / Identity Providerによる認証成功後、ユーザーはIDトークンとともにアプリケーションにリダイレクトされます。
    5. The system validates the ID Token, establishes a session, and identifies the user's role. / システムがIDトークンを検証し、セッションを確立し、ユーザーのロールを識別します。
    6. The user is redirected to their role-specific dashboard. / ユーザーが自分のロール専用のダッシュボードにリダイレクトされます。
  - **Post-conditions / 事後条件**: The user is logged in and can see the interface corresponding to their assigned role. / ユーザーがログインし、割り当てられたロールに対応するインターフェースが表示されること。

- **Scenario 2: Role-Specific Feature Access / シナリオ2: ロール固有の機能アクセス**
  - **Actor / アクター**: Administrator, Nurse, Caregiver / 管理者、看護士、介護士
  - **Pre-conditions / 事前条件**: The user is authenticated. / ユーザーが認証済みであること。
  - **Flow / フロー**:
    1. An **Administrator** logs in. The UI displays links to "User Management," "System Settings," and a "Dashboard View." / **管理者**がログインします。UIには「ユーザー管理」「システム設定」「ダッシュボードビュー」へのリンクが表示されます。
    2. A **Nurse** logs in. The UI only displays the "Dashboard View," with no administrative controls visible. / **看護士**がログインします。UIには「ダッシュボードビュー」のみが表示され、管理コントロールは表示されません。
  - **Post-conditions / 事後条件**: Users can only see and interact with the features permitted by their role. / ユーザーは自分のロールで許可された機能のみを表示および操作できること。

- **Scenario 3: Responsive Design / シナリオ3: レスポンシブデザイン**
  - **Actor / アクター**: Any User / すべてのユーザー
  - **Pre-conditions / 事前条件**: The user is accessing the application. / ユーザーがアプリケーションにアクセスしていること。
  - **Flow / フロー**:
    1. A user opens the application on a desktop browser. The layout uses the full screen width. / ユーザーがデスクトップブラウザでアプリケーションを開きます。レイアウトは全画面幅を使用します。
    2. The same user opens the application on a tablet. The layout automatically adjusts, stacking elements vertically and ensuring controls are easily tappable. / 同じユーザーがタブレットでアプリケーションを開きます。レイアウトは自動的に調整され、要素が垂直に積み重ねられ、コントロールがタップしやすくなります。
  - **Post-conditions / 事後条件**: The application is usable and readable on both device types without horizontal scrolling or distorted elements. / アプリケーションが両方のデバイスタイプで、水平スクロールや要素の歪みなしに使用および閲覧可能であること。

## 4. Functional Requirements / 機能要件

| ID | Requirement / 要件 |
|----|-------------|
| FR-1 | The system **must** provide a user authentication mechanism (login and logout). / システムはユーザー認証メカニズム（ログインおよびログアウト）を**提供しなければならない**。 |
| FR-2 | The system **must** support at least three distinct user roles: `Administrator`, `Nurse`, and `Caregiver`. / システムは少なくとも3つの異なるユーザーロール（`管理者`、`看護士`、および`介護士`）を**サポートしなければならない**。 |
| FR-3 | The UI **must** dynamically display or hide features and navigation elements based on the authenticated user's role. / UIは認証されたユーザーのロールに基づいて、機能やナビゲーション要素を動的に表示または非表示に**しなければならない**。 |
| FR-4 | The application layout **must** be responsive and function correctly on screen widths ranging from 768px (tablet portrait) to 1920px (standard HD desktop). / アプリケーションのレイアウトはレスポンシブであり、768px（タブレット縦向き）から1920px（標準HDデスクトップ）までの画面幅で正しく機能**しなければならない**。 |
| FR-5 | The system **must** use OpenID Connect for user authentication. / システムはユーザー認証にOpenID Connectを**使用しなければならない**。 |
| FR-6 | The distinct sets of features for each role (Administrator, Nurse, Caregiver) will be defined in separate, detailed requirements. / 各ロール（管理者、看護士、介護士）ごとの明確な機能セットは、別途詳細な要件で定義されます。 |
| FR-7 | The system **must** implement Progressive Web App (PWA) functionality, including home screen installation and robust offline capabilities to ensure usability even in areas with weak radio signals. / システムは、ホーム画面へのインストールおよび電波の弱い場所でも利用可能にするための堅牢なオフライン機能を含むプログレッシブウェブアプリ（PWA）機能を**実装しなければならない**。 |
| FR-8 | The system **must** provide mechanisms within the web application to manage and assign the application-specific roles (Administrator, Nurse, Caregiver). / システムは、Webアプリケーション内でアプリケーション固有のロール（管理者、看護士、介護士）を管理および割り当てするためのメカニズムを**提供しなければならない**。 |

## 5. Non-Functional Requirements / 非機能要件

| ID | Requirement / 要件 |
|----|-------------|
| NFR-1 | **Usability / 使いやすさ**: The application must be intuitive, allowing a first-time user to log in and navigate their dashboard without requiring documentation. / アプリケーションは直感的でなければならず、初めてのユーザーがドキュメントを必要とせずにログインし、ダッシュボードをナビゲートできること。 |
| NFR-2 | **Performance / パフォーマンス**: The initial page load time for a logged-in user must be under 3 seconds on a standard broadband connection. / ログインしたユーザーの初期ページ読み込み時間は、標準的なブロードバンド接続で3秒未満でなければならない。 |
| NFR-3 | **Compatibility / 互換性**: The application must render correctly on the latest stable versions of Chrome, Firefox, and Safari. / アプリケーションは、Chrome、Firefox、Safariの最新の安定バージョンで正しく表示されなければならない。 |
| NFR-4 | **Localization / ローカライゼーション**: All user-facing text **must** be available in English, Japanese, and Chinese. The application should provide a mechanism for the user to switch between these languages. / 全てのユーザー向けテキストは、英語、日本語、中国語で**利用可能でなければならない**。アプリケーションは、ユーザーがこれらの言語を切り替えるためのメカニズムを提供する必要がある。 |
| NFR-5 | **Accessibility (China) / アクセシビリティ（中国）**: The application **must** be fully functional for users within mainland China. This requires avoiding dependencies on services that are commonly blocked (e.g., Google Fonts, certain Google APIs) and may require specific hosting and compliance considerations (e.g., an ICP license). / アプリケーションは、中国本土内のユーザーに対して完全に機能**しなければならない**。これには、一般的にブロックされているサービス（例: Google Fonts, 特定のGoogle API）への依存を避けること、および特定のホスティングとコンプライアンスの考慮（例: ICPライセンス）が必要になる場合がある。 |

## 6. Success Criteria / 成功基準

- 100% of authenticated users are prevented from accessing UI elements and API endpoints not permitted by their assigned role. / 認証されたユーザーの100%が、割り当てられたロールで許可されていないUI要素やAPIエンドポイントへのアクセスを妨げられること。
- The application layout passes automated and manual visual inspection on screen widths of 768px, 1024px, 1366px, and 1920px. / アプリケーションのレイアウトが、768px, 1024px, 1366px, 1920pxの画面幅での自動および手動の視覚的検査に合格すること。
- New user roles can be added to the system in the future without requiring a full rewrite of the access control logic. / 将来的に、アクセス制御ロジックを完全に書き直すことなく、新しいユーザーロールをシステムに追加できること。
- A user survey indicates that at least 80% of test users find the login process "easy" or "very easy." / ユーザー調査で、テストユーザーの少なくとも80%がログインプロセスを「簡単」または「非常に簡単」だと感じること。

## 7. Assumptions / 前提条件

- A backend service or database exists (or will be created) to manage user accounts, credentials, and roles. / ユーザーアカウント、資格情報、およびロールを管理するためのバックエンドサービスまたはデータベースが存在する（または作成される）。
- The initial scope is limited to the authentication and UI framework. The actual functionality behind the role-based features (e.g., the "User Management" page itself) will be implemented separately. / 初期スコープは認証とUIフレームワークに限定される。ロールベースの機能の背後にある実際の機能（例：「ユーザー管理」ページ自体）は別途実装される。

## 8. Out of Scope / 範囲外

- User self-registration and "forgot password" workflows. / ユーザーの自己登録および「パスワードを忘れました」ワークフロー。
- The full implementation of features accessible to any role (e.g., the content of the "Dashboard View"). / いずれのロールでもアクセス可能な機能（例：「ダッシュボードビュー」のコンテンツ）の完全な実装。
- Support for mobile phone screen sizes (below 768px). / 携帯電話の画面サイズ（768px未満）のサポート。
- Two-factor authentication (2FA). / 二要素認証（2FA）。

## 9. Development & Testing (Dev-only) / 開発とテスト（開発専用）

To enable reliable local development and automated CI tests for the full OpenID Connect flow, we provide a lightweight, development-only OIDC provider referred to as **dummyauth**. This service is explicitly for development and test usage and **must not** be used in production.

Status / 現状（2025-12-29）
- **Implemented**: `dummyauth` service, dev nginx reverse-proxy, CI-friendly E2E runner (Dockerfile.e2e), Playwright E2E tests, and related docs have been implemented and verified locally. See the `webapp` README and CI workflow for run instructions.
- **Testing**: Backend and frontend unit tests are wired to a global Jest setup to ensure Passport and test polyfills are consistently initialized. JUnit reports for both unit tests and Playwright E2E are generated and published by CI.

Purpose / 目的
- Simulate an external Identity Provider (IdP) so developers and CI can exercise the entire authorization-code OIDC flow (authorization → code → token exchange → id_token validation → session creation).
- Allow deterministic, reproducible end-to-end tests without depending on external third-party IdPs.

Requirements / 要件
- Endpoints: The service must expose at least `/authorize` (login form), `/authorize-login` (form POST to generate an authorization code), `/token` (authorization_code exchange), `/jwks.json` (public keys/JWKS), `/userinfo` (optional), and `/health`.
- Token semantics: `id_token` MUST be signed with RS256 and include standard claims: `iss`, `sub`, `aud`, `exp`, `iat`, and (if provided) `nonce`. The JWKS endpoint must expose the public key with a `kid` and `alg`.
- Dev-only: The implementation must be included only in development (e.g., `docker-compose.dev.yml`) and explicitly excluded from production deployments. It must be clearly annotated in documentation that it is for testing and **not** for production use.
- Internal vs External addresses: When running under Docker compose, the backend service should call token/userinfo endpoints using an internal service host (e.g., `http://dummyauth:3001`), while browser redirects for authorization use an external address (e.g., `http://localhost:3001`). Configuration variables such as `DEV_INTERNAL_OIDC_ISSUER` and `DEV_EXTERNAL_OIDC_ISSUER` should be supported to allow flexible addressing in dev vs prod.
- Test coverage: Include an integration-level E2E smoke test that exercises the complete login flow against `dummyauth` (using a cookie jar) to verify session creation, id_token validation, and correct redirect to the frontend dashboard.

Documentation / ドキュメント
- Document how to start the development stack with `dummyauth` in `webapp/README.md`, including the dev-only nature, URLs (authorize/token/jwks), and a short troubleshooting note. The README has been updated to include E2E and dummyauth run instructions.

**Note:** Any differences in behavior between `dummyauth` and a production IdP (e.g., simplified user store, deterministic signing keys) must be documented and kept minimal so that tests remain meaningful.