# Rise and Shine — Refactor to Node MVC + MongoDB (Vercel-native)

**Date:** 2026-07-14
**Branch:** `refactor/node-mvc-mongodb`

## Goal

Replace the Supabase backend (Postgres + Supabase Auth + Row-Level Security) of the
Rise and Shine staff portal with a **Node MVC backend on MongoDB**, while keeping the
existing UI pixel-for-pixel and preserving the exact permission rules. The result must
deploy to Vercel as a **single project** with minimal setup.

## Non-goals

- No visual redesign. The marketing homepage, login, and dashboard look and behave as today.
- No email service. The Supabase email-invite flow is intentionally dropped.
- No payment processing (the portal only *records* payments, same as today).
- The presentational contact form on the homepage stays non-functional (out of scope).

## Current state (what we are replacing)

- **Frontend:** Next.js 14 App Router. Surfaces: public homepage (`app/page.js` + `SiteNav`),
  staff login (`app/portal/login`), role-based dashboard (`app/portal/dashboard`),
  and `AuthGate` (invite/recovery password-set card). One `app/globals.css`.
- **Backend:** Supabase only — Postgres tables `branches`, `profiles`, `payment_records`;
  Supabase Auth (email invite → set password → sign in); **all authorization via Postgres RLS**.

## Target architecture

Single Next.js app. Supabase fully removed. A real MVC layer lives under `server/`;
thin Next.js route handlers under `app/api/*` delegate to controllers. One Vercel
project, one deploy, no CORS.

```
app/
  page.js, layout.js, portal/…      UI — visually unchanged
  api/
    auth/login/route.js             -> authController.login
    auth/logout/route.js            -> authController.logout
    auth/me/route.js                -> authController.me
    auth/password/route.js          -> authController.changePassword
    branches/route.js               -> branchController.list
    records/route.js                -> recordController.list / create
    records/[id]/route.js           -> recordController.update / remove
    staff/route.js                  -> staffController.list / create
server/
  lib/db.js          cached Mongoose connection (serverless-safe)
  lib/auth.js        bcrypt hash/verify, JWT sign/verify, cookie helpers
  models/            User.js, Branch.js, PaymentRecord.js  (Mongoose)
  controllers/       authController, branchController, recordController, staffController
  services/          recordService, authService, staffService (business logic)
  middleware/        requireAuth, requireRole('proprietor')
scripts/seed.js      seed 3 branches + first proprietor from env
lib/api.js           frontend fetch wrapper (credentials: 'include')
```

**Layer responsibilities**
- **Route handlers (`app/api/*`)** — parse the request, call a controller, return its JSON.
  No business logic.
- **Controllers** — orchestrate: run auth/authorization middleware, validate input, call
  services, shape the response DTO. Own the HTTP status codes.
- **Services** — business logic and data access via models. Reusable, HTTP-agnostic.
- **Models** — Mongoose schemas.
- **Middleware** — `requireAuth` (verify cookie → attach user), `requireRole` (enforce role).

## Data model (MongoDB / Mongoose)

- **Branch** — `{ name: String }`. Seeded: `Branch One`, `Branch Two`, `Branch Three`.
- **User** (replaces Supabase `auth.users` + `profiles`) —
  `{ fullName, email (unique, lowercased), passwordHash, role: 'head_teacher'|'proprietor',
     branchId (ObjectId ref Branch, null for proprietor), mustChangePassword: Boolean, createdAt }`.
- **PaymentRecord** —
  `{ branchId (ref Branch), pupilName, class, item, amount: Number,
     status: 'paid'|'partial'|'due', addedBy (ref User), createdAt }`.

### UI-preservation contract (API response shapes)

To avoid touching JSX, the API returns the exact field names the components already read.
Mongoose `_id` is serialized to `id` (string). Response DTOs:

- **User / profile:** `{ id, full_name, role, branch_id, must_change_password }`
- **Branch:** `{ id, name }`
- **PaymentRecord:** `{ id, branch_id, pupil_name, class, item, amount, status, added_by,
  created_at, branches: { name } }`  (`branches.name` mirrors the old Supabase join)

## Auth & authorization (replaces Supabase Auth + RLS)

### Authentication
- Passwords hashed with `bcryptjs`.
- On login, issue a signed **JWT** (payload: `{ sub: userId, role }`, signed with `JWT_SECRET`)
  stored in an **httpOnly, Secure, SameSite=Lax cookie** named `rs_session`.
- `bcryptjs`, `jsonwebtoken`, `mongoose` all run on Vercel's **Node.js runtime**
  (route handlers set `export const runtime = 'nodejs'` where needed).

### Endpoints
| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/api/auth/login` | public | Verify email+password, set cookie, return profile DTO. |
| POST | `/api/auth/logout` | public | Clear cookie. |
| GET  | `/api/auth/me` | cookie | Return current profile DTO (or 401). Replaces `getSession()`. |
| PUT  | `/api/auth/password` | requireAuth | Change own password, clear `mustChangePassword`. |
| GET  | `/api/branches` | requireAuth | List branches. |
| GET  | `/api/records` | requireAuth | List records, **scoped by role** (see below). |
| POST | `/api/records` | requireAuth | Create record, **branch forced for head teacher**. |
| PATCH | `/api/records/:id` | requireRole('proprietor') | Update amount/status. |
| DELETE | `/api/records/:id` | requireRole('proprietor') | Delete record. |
| GET  | `/api/staff` | requireRole('proprietor') | List staff. |
| POST | `/api/staff` | requireRole('proprietor') | Create head teacher (name, email, branch, temp password). |

### Authorization rules (mirror the old RLS policies exactly, enforced server-side)
- **List records:** head teacher → only `branchId === user.branchId`; proprietor → all.
- **Create record:** head teacher → `branchId` is taken from the user's own branch
  server-side; any client-supplied branch is ignored. Proprietor → `branchId` required
  from body.
- **Update / delete record:** proprietor only.
- **Branches list:** any authenticated user.
- **Staff list / create:** proprietor only.
- **Change own password:** any authenticated user.

The client is never trusted for authorization; every rule is enforced in the controller/
middleware, exactly as RLS enforced it in the database before.

### Account creation (no email service)
- The **first proprietor** is created by `npm run seed` from `SEED_PROPRIETOR_EMAIL`,
  `SEED_PROPRIETOR_PASSWORD`, `SEED_PROPRIETOR_NAME` (also seeds the 3 branches, idempotently).
- The proprietor creates each head teacher from a **proprietor-only Staff panel** on the
  dashboard: name, email, branch, temporary password. New staff are created with
  `mustChangePassword: true`.
- On first sign-in, `AuthGate` detects `must_change_password` (via `/api/auth/me`) and shows
  the **existing "Create your password" card**, submitting to `PUT /api/auth/password`.

## Frontend changes (UI maintained)

- **Delete** `lib/supabaseClient.js`. **Add** `lib/api.js` — thin `fetch` wrapper
  (`credentials: 'include'`, JSON helpers, throws on non-2xx with the server `error` message).
- **`login/page.js`** — replace `supabase.auth.signInWithPassword` → `POST /api/auth/login`;
  replace `getSession()` → `GET /api/auth/me`. JSX/CSS unchanged; errors still render in
  `.error-msg`.
- **`dashboard/page.js`** — replace Supabase queries with `GET /api/branches`, `GET /api/records`;
  insert → `POST /api/records`; edit → `PATCH /api/records/:id`. Add a proprietor-only
  **Staff panel** built from the existing CSS classes (`.panel`, `.panel-head`, `.add-form`,
  `.add-btn`, `.field`, table) so it matches the current look. Existing records UI unchanged.
- **`AuthGate.js`** — repurpose the "Create your password" card for the `mustChangePassword`
  flow (poll `/api/auth/me`, submit to `/api/auth/password`). Same markup/styles.
- **`page.js` (homepage) + `SiteNav.js`** — untouched.

## Error handling
- Controllers return JSON `{ error: <message> }` with status codes: `400` (bad input),
  `401` (not authenticated), `403` (wrong role), `404` (not found), `409` (duplicate email),
  `500` (unexpected). The DB connection failing surfaces as `500`.
- The frontend surfaces `error` strings in the existing `.error-msg` UI on login, dashboard,
  and the password card — no new error UI is introduced.

## Serverless / Vercel specifics
- `server/lib/db.js` caches the Mongoose connection on a `global` to survive warm serverless
  invocations (standard Next-on-Vercel pattern), preventing connection storms.
- Route handlers that use Mongoose/bcrypt/jwt run on the Node.js runtime, not edge.

## Dependencies & config
- **Add:** `mongoose`, `bcryptjs`, `jsonwebtoken`.
- **Remove:** `@supabase/supabase-js`.
- **Scripts:** add `"seed": "node scripts/seed.js"`.
- **Env vars:** `MONGODB_URI` (Atlas), `JWT_SECRET`; seed-only `SEED_PROPRIETOR_EMAIL`,
  `SEED_PROPRIETOR_PASSWORD`, `SEED_PROPRIETOR_NAME`.
- `.gitignore` covers `.env.local`; `.env.example` documents the variables.
- Delete `supabase/schema.sql` and the `supabase/` folder.

## Verification strategy
1. `npm run build` compiles cleanly.
2. Local smoke test against a real Atlas or local MongoDB (`npm run seed` first):
   - Proprietor logs in; creates a head teacher for Branch One.
   - Head teacher logs in with temp password → forced to set a new password → lands on dashboard.
   - Head teacher sees only Branch One records; can add a record; Edit button is locked.
   - A record added by the head teacher is forced to Branch One even if the request is tampered.
   - Proprietor sees all branches; can edit and delete any record; can filter by branch.
3. Confirm `/api/auth/me` returns 401 when logged out and the dashboard redirects to login.

## Delivery
- Design doc committed first on `refactor/node-mvc-mongodb`, then implementation commits.
- Rewrite `README.md`: MongoDB Atlas + Vercel env steps replace the Supabase steps.
- Open a PR at the end. If the GitHub account lacks push access to
  `achirivictor5-art/Rise-and-Shine`, push to a fork and open the PR from there.

## Risks / open considerations
- **Auth model change is user-visible:** staff no longer get invite emails; the proprietor
  hands out temp passwords. Accepted and chosen deliberately.
- **First-proprietor bootstrap** depends on running the seed script once; documented in README.
- **Push access** to the upstream repo is unconfirmed; handled at PR time via fork fallback.
