# Rise and Shine — Staff Portal

A private, password-protected system where head teachers record what each pupil has
paid for, and only the proprietor can see and edit everything across all three
branches. Built with Next.js (UI + API routes, MVC backend) and MongoDB. Deploys to
Vercel as a single project.

## What you need (all free)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (database).
- A [GitHub](https://github.com) account (code).
- A [Vercel](https://vercel.com) account (hosting).

## Step 1 — Create your database (MongoDB Atlas)
1. Sign up at **mongodb.com/atlas**, create a **free (M0) cluster**.
2. **Database Access → Add New Database User**: create a username + password (save them).
3. **Network Access → Add IP Address → Allow access from anywhere** (`0.0.0.0/0`).
4. **Database → Connect → Drivers**: copy the connection string. It looks like
   `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/`. Add a database name at the end,
   e.g. `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/rise-and-shine`.

## Step 2 — Run it locally and create the first proprietor
1. Install [Node.js 20+](https://nodejs.org).
2. In this project folder: `npm install`.
3. Copy `.env.example` to `.env.local` and fill in:
   - `MONGODB_URI` — the string from Step 1.4
   - `JWT_SECRET` — any long random string
   - `SEED_PROPRIETOR_EMAIL`, `SEED_PROPRIETOR_PASSWORD`, `SEED_PROPRIETOR_NAME` — your account
4. Run `npm run seed`. This creates the three branches and your proprietor account.
5. Run `npm run dev` and open `http://localhost:3000/portal/login`. Sign in with the
   proprietor email/password from Step 2.3.

## Step 3 — Add your head teachers
1. Signed in as the proprietor, open the dashboard.
2. In the **Staff Accounts** panel, click **+ Add Head Teacher**, enter their name,
   email, branch, and a temporary password. Click **Create Account**.
3. Give each head teacher their email + temporary password. On first sign-in they are
   asked to choose a new password.

## Step 4 — Put the code online (GitHub)
1. Create a **private** repository on GitHub.
2. Push this project to it (do **not** commit `.env.local`).

## Step 5 — Deploy (Vercel)
1. Sign in to **vercel.com** with GitHub, **Add New → Project**, import the repo.
2. Under **Environment Variables**, add `MONGODB_URI` and `JWT_SECRET` (same values as
   `.env.local`). The `SEED_*` variables are only needed for the one-time seed.
3. Click **Deploy**. Vercel gives you a live URL, e.g.
   `https://rise-and-shine-portal.vercel.app`.

> The seed (Step 2.4) is run once, locally, against the same `MONGODB_URI` your Vercel
> deployment uses — so your proprietor account already exists in the cloud database.

## Step 6 — Connect a custom domain (optional)
In Vercel: **Project → Settings → Domains → Add**, then add the DNS records Vercel shows
at your registrar. `yourdomain.com/portal/login` becomes the staff sign-in page.

## How access control works
- Head teachers see and add records **only for their own branch**, and cannot edit or
  delete a record once saved.
- Only the proprietor can view all branches, edit/delete any record, and create staff.
- These rules are enforced **server-side** in the API (`server/services/*`), not just in
  the UI.
- There is no public sign-up; only the proprietor creates staff accounts.
- This portal has no payment processing — it only records what has been paid.

## Project structure
- `app/` — Next.js pages (marketing site, login, dashboard) and `app/api/*` route handlers.
- `server/` — MVC backend: `models/` (Mongoose), `services/` (business logic + authorization),
  `controllers/`, and `lib/` (db, auth, http, dto, session).
- `scripts/seed.js` — seeds branches + first proprietor.
- `test/` — service tests (`npm test`, uses an in-memory MongoDB).

## Commands
- `npm run dev` — local development
- `npm run build` / `npm start` — production build / serve
- `npm run seed` — seed branches + proprietor (reads `.env.local`)
- `npm test` — run the backend service tests
