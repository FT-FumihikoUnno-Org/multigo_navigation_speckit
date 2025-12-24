# webapp README / webapp README（日本語）

📌 This document explains how to run the `webapp` for local development and production, the login URLs used in development, and the main folder layout.

---

## 🔧 Development / 開発 (Recommended)

### Docker Compose (recommended) / Docker Compose（推奨）
- Start (includes dev-only services such as `dummyauth`):

```bash
# Include dev-only services like dummyauth (local OIDC dummy)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

- Main services and default URLs / 主要サービスとデフォルト URL
  - Frontend (via nginx): http://localhost:5173  
    - Login page / ログインページ: http://localhost:5173/login
  - Backend: http://localhost:3000
  - Dummy OIDC (dev-only): http://localhost:3001 (authorize/token/jwks etc.)

### Run services individually / 個別に動かす方法

- Frontend (Vite):
```bash
cd webapp/src/frontend
npm install
npm run dev   # defaults to http://localhost:5173
```

- Backend (dev):
```bash
cd webapp/src/backend
npm install
npm run dev   # defaults to http://localhost:3000
```

- Dummy OIDC server (when needed):
```bash
cd webapp/src/dummyauth
npm install
npm run start
```

---

## 🚀 Production / 本番 (Production)

### Example: Start production with Docker Compose / Docker Compose による本番起動（例）
- We provide a `docker-compose.prod.yml` for production use:

```bash
# Build & start production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

- In production the frontend is typically served by a static server (e.g., Nginx) on 80/443. Set environment variables like `FRONTEND_URL`, `OIDC_REDIRECT_URI`, and `SESSION_SECRET` as needed to match your host/ports.

Example / 例:
```bash
export FRONTEND_URL="https://app.example.com"
export OIDC_REDIRECT_URI="https://app.example.com/auth/openid/callback"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

- Expected login URL (example) / 期待されるログイン URL (例):
  - https://app.example.com/login

**Note / 注意:** `dummyauth` is development-only; do not mix it into production.

---

## 📁 Folder layout / フォルダ構成（主要部分）

```
webapp/
├─ src/
│  ├─ frontend/          # React + Vite application
│  │  ├─ public/
│  │  ├─ src/
│  │  └─ package.json
│  ├─ backend/           # Express + Passport backend
│  │  ├─ src/
│  │  │  ├─ api/
│  │  │  ├─ config/
│  │  │  └─ ...
│  │  └─ package.json
│  └─ dummyauth/         # Local OIDC dummy for development (dev-only)
│     └─ src/
├─ nginx/                # nginx config (dev reverse-proxy)
└─ Dockerfile / docker-compose*.yml
```

---

## ⚠️ Notes / 注意点
- **Same-origin in development / 同一オリジン制御**: For local development we use nginx to make the frontend (5173) and backend (3000) appear same-origin. The frontend calls the backend via relative paths like `/api`.
- **OIDC configuration / OIDC 設定**: For production with an external OIDC provider set `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `OIDC_REDIRECT_URI` via environment variables.
- **dummyauth** is for development/testing only. Do not use it as a production IdP.

---

## Optional improvements / さらに調整したいこと (オプション)
- Add E2E tests (automated login flow) to CI to validate end-to-end behavior.
- Provide a production-ready nginx template and automate TLS (e.g., certbot) for easier deployment.
- Optionally add a `.env.example` describing required environment variables (FRONTEND_URL, DATABASE_URL, SESSION_SECRET, OIDC_*).

---

If you want a sample `docker compose` example for a specific hostname/port layout (production env file), I can add that in the format you prefer — would you like that? / 特定のホスト名／ポート構成向けの `docker compose` サンプルが必要ですか？
