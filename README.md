# Phase 1 Setup — Auth & User Roles

This is the local dev setup for Phase 1 (Next.js + Prisma + PostgreSQL + NextAuth).
Use this alongside `codex-build-prompt-v1.md` and `build-tracker.md`.

## 1. Install Node.js (if `node`/`npm` aren't on PATH)

**Recommended: use nvm** (works on Mac/Linux/WSL; avoids permission issues)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# restart your terminal, then:
nvm install --lts
nvm use --lts
node -v   # should print v18.x or v20.x
npm -v
```

**Windows (no WSL):** install from https://nodejs.org (LTS) or via:
```powershell
winget install OpenJS.NodeJS.LTS
```

**Cloud sandbox / container / CI runner (e.g. Codex's execution environment):**
Check for a setup script or devcontainer config where you can install Node before running the app, e.g.:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```
If the sandbox lets you pick a base image/runtime up front, choose Node.js 18+ instead of patching it in after the fact.

## 2. Install PostgreSQL (if not already available)
- Local: https://www.postgresql.org/download/ or `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`
- Hosted (easier for this project): Railway, Supabase, or Neon — all give you a `DATABASE_URL` instantly.

## 3. Project setup
```bash
# from the project root
cp .env.example .env
# edit .env: set DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET

npm install
npx prisma migrate dev --name init
npm run dev
```
Open http://localhost:3000

## 4. Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```
Paste the output into `.env` as `NEXTAUTH_SECRET`.

## 5. Google OAuth credentials (for Phase 1 login)
1. https://console.cloud.google.com/apis/credentials
2. Create OAuth Client ID → Web application
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID/Secret into `.env`

## 6. Verify everything is wired up
```bash
npx prisma studio        # opens a DB browser at localhost:5555 — confirm User table exists
npm run dev               # confirm app boots with no errors
```
Then test: sign up with email, sign in with Google, confirm a row appears in the `users` table via Prisma Studio.

## Troubleshooting
| Symptom | Likely cause |
|---|---|
| `node: command not found` | Node not installed / not on PATH — see step 1 |
| `P1001: Can't reach database server` | `DATABASE_URL` wrong, or Postgres not running |
| Google login redirects to error page | Redirect URI mismatch in Google Console |
| `next-auth` session is always null | `NEXTAUTH_SECRET` missing or `.env` not loaded (restart `npm run dev` after editing `.env`) |
