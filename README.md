# Rise and Shine — Staff Portal

A private, password-protected system where head teachers record what each
pupil has paid for, and only the proprietor can see and edit everything
across all three branches. No coding knowledge needed to set this up —
just follow the steps below in order. It takes about 20–30 minutes and
everything used is free.

---

## Step 1 — Create your database (Supabase)

1. Go to **supabase.com** → **Start your project** → sign up (free).
2. Click **New Project**. Give it a name like `rise-and-shine`, set a
   database password (save it somewhere safe), choose the region closest
   to you, and click **Create new project**. Wait ~2 minutes.
3. In the left sidebar, click **SQL Editor** → **New query**.
4. Open the file `supabase/schema.sql` from this project, copy **all** of
   it, paste it into the query box, and click **Run**.
   - This creates your three branches and all the tables and security
     rules automatically.
5. In the left sidebar, click **Project Settings → API**.
   - Copy the **Project URL** — you'll need it in Step 3.
   - Copy the **anon public** key — you'll need it in Step 3.

## Step 2 — Put the proprietor and head teachers online

1. In Supabase, go to **Authentication → Users → Add user → Invite user**.
2. Enter **your own email** first (the proprietor). Click Invite.
   - You'll get an email with a link to set your password.
3. Go to **Table Editor → profiles**. You'll see a new row appear for you.
   Click it and edit:
   - `role` → change to `proprietor`
   - `full_name` → your name
   - Leave `branch_id` empty (the proprietor sees all branches).
4. Repeat step 1 for each **head teacher** (invite their email).
5. For each head teacher's row in **profiles**, set:
   - `role` → leave as `head_teacher`
   - `full_name` → their name
   - `branch_id` → open the **branches** table in another tab, copy the
     `id` of the branch they manage, and paste it into their `branch_id`.

That's it for accounts — no one else can sign up on their own; only the
proprietor can invite new staff, by repeating this step.

## Step 3 — Put the code online (GitHub)

1. Go to **github.com** and sign up (free) if you don't have an account.
2. Click **New repository**, name it `rise-and-shine-portal`, keep it
   **Private**, and click **Create repository**.
3. On the new repo page, click **uploading an existing file**.
4. Drag in every file and folder from this project (keep the folder
   structure — `app/`, `lib/`, `supabase/`, plus `package.json`,
   `next.config.js`, `.gitignore`). Do **not** upload `.env.local` (there
   isn't one yet — that's expected).
5. Click **Commit changes**.

## Step 4 — Put it on the internet (Vercel)

1. Go to **vercel.com** and sign up (free) using your GitHub account.
2. Click **Add New → Project**, and import the `rise-and-shine-portal`
   repo you just created.
3. Before clicking Deploy, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` → paste the Project URL from Step 1.5
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → paste the anon public key from Step 1.5
4. Click **Deploy**. Wait ~1–2 minutes.
5. Vercel gives you a live web address, e.g.
   `https://rise-and-shine-portal.vercel.app` — this is your portal.
   Bookmark it and share it with your head teachers.

## Step 5 — Try it

1. Open the link Vercel gave you.
2. Sign in with the proprietor email you invited (after setting your
   password from the invite email).
3. Add a test payment record, then sign out and sign in as a head teacher
   to confirm they only see their own branch and can't edit records.

---

## Step 6 — Connect your Namecheap domain

Once your site is live on Vercel (the `.vercel.app` link works), you can make
your own domain point to it:

1. In Vercel, open your project → **Settings → Domains**.
2. Type your domain (e.g. `riseandshineschool.com`) and click **Add**.
3. Vercel will show you one or two DNS records to add — usually:
   - An **A record** pointing `@` to an IP address, and/or
   - A **CNAME record** pointing `www` to `cname.vercel-dns.com`
   Keep this screen open.
4. Open a new tab, go to **namecheap.com**, sign in, and go to
   **Domain List → Manage** (next to your domain) → **Advanced DNS**.
5. Add the records exactly as Vercel showed you:
   - Click **Add New Record**, choose **A Record**, host `@`, value = the
     IP Vercel gave you, TTL: Automatic.
   - Click **Add New Record** again, choose **CNAME Record**, host `www`,
     value = `cname.vercel-dns.com`, TTL: Automatic.
6. Remove any old "Parking Page" records Namecheap added by default for
   `@` or `www`, so they don't conflict.
7. Save. Go back to Vercel — it will show "Valid Configuration" once the
   change is detected (can take a few minutes up to a few hours).

Your school's real domain will now show this website, and
`yourdomain.com/portal/login` will be the staff sign-in page.

## Adding a fourth branch later
Go to Supabase → **Table Editor → branches → Insert row**, type the name,
save. It will appear automatically in the portal — no code changes needed.

## Changing someone's role or branch
Go to Supabase → **Table Editor → profiles**, click their row, edit
`role` or `branch_id`, save.

## Security notes
- Head teachers can only **add** records for their own branch — they
  cannot see or touch other branches' data, and cannot edit or delete a
  record once it's saved. This is enforced by the database itself
  (Row Level Security in `supabase/schema.sql`), not just hidden in the
  page — so it holds even if someone tries to tamper with the app.
- Only the proprietor can edit or delete any record, or reassign staff
  roles/branches.
- There is no public sign-up page — staff accounts are only created by
  the proprietor inviting them in Supabase.
- This portal has no payment processing — it only records what has been
  paid, as reported by staff. It is not a payment gateway.
