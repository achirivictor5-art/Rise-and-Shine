# Rise and Shine — Node MVC + MongoDB Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Supabase backend (Postgres + Auth + RLS) of the Rise and Shine staff portal with a Node MVC backend on MongoDB, keeping the UI identical and preserving the exact permission rules, deployable to Vercel as a single project.

**Architecture:** One Next.js 14 app. A real MVC layer lives under `server/` (models → services → controllers, plus lib + middleware). Thin Next.js route handlers under `app/api/*` delegate to controllers. Business logic and authorization live in services (unit-tested against an in-memory MongoDB); controllers/routes are thin adapters; the React UI calls `fetch('/api/…')` through a small wrapper. Auth is a bcrypt-hashed password + a JWT in an httpOnly cookie.

**Tech Stack:** Next.js 14 (App Router), React 18, Mongoose 8 / MongoDB Atlas, `bcryptjs`, `jsonwebtoken`, Node's built-in test runner (`node --test`) + `mongodb-memory-server`, `dotenv` (seed/tests only).

## Global Constraints

- **Do not change any JSX or CSS in the marketing homepage** (`app/page.js`, `components/SiteNav.js`) — it has no backend.
- **API responses use snake_case DTO fields** the components already read: user `{ id, full_name, email, role, branch_id, must_change_password }`, branch `{ id, name }`, record `{ id, branch_id, pupil_name, class, item, amount, status, added_by, created_at, branches: { name } }`. **API request bodies use camelCase** (`pupilName`, `branchId`, `newPassword`, `tempPassword`, …).
- **Authorization is enforced server-side in services**, mirroring the old RLS exactly: head teacher lists/creates only their own branch (branch forced server-side on create); proprietor lists all and is the only role that can update/delete records or manage staff.
- **Server modules under `server/` and `scripts/` are CommonJS** (`require` / `module.exports`) so plain Node (seed, tests) and Next (via `import x from '...'`) both consume them. **Frontend modules (`lib/api.js`, `app/**`) are ESM.**
- **Every model uses the recompile guard** `module.exports = mongoose.models.X || mongoose.model('X', schema)`.
- **Cookie name:** `rs_session`. **JWT lifetime:** 7 days. **Password minimum:** 6 characters.
- Every API route file sets `export const runtime = 'nodejs'` and `export const dynamic = 'force-dynamic'`.
- Node 20.18.3 is the target runtime.

---

## File Structure

**Create (backend):**
- `server/lib/db.js` — cached Mongoose connection (serverless-safe). Default export `connectDb()`.
- `server/lib/errors.js` — `AppError` + `badRequest/unauthorized/forbidden/notFound/conflict`.
- `server/lib/auth.js` — bcrypt hash/verify, JWT sign/verify, `SESSION_COOKIE`, `cookieOptions()`.
- `server/lib/http.js` — `json(data,status)`, `fail(err)` (maps errors → `NextResponse`).
- `server/lib/session.js` — `getSessionUser(request)` (401 if none), `getOptionalUser(request)`.
- `server/lib/dto.js` — `toUserDTO`, `toBranchDTO`, `toRecordDTO`.
- `server/models/Branch.js`, `server/models/User.js`, `server/models/PaymentRecord.js`.
- `server/services/authService.js`, `branchService.js`, `recordService.js`, `staffService.js`.
- `server/controllers/authController.js`, `branchController.js`, `recordController.js`, `staffController.js`.

**Create (routes):**
- `app/api/auth/login/route.js`, `app/api/auth/logout/route.js`, `app/api/auth/me/route.js`, `app/api/auth/password/route.js`.
- `app/api/branches/route.js`, `app/api/records/route.js`, `app/api/records/[id]/route.js`, `app/api/staff/route.js`.

**Create (frontend + ops + tests):**
- `lib/api.js` — fetch wrapper.
- `scripts/seed.js` — seed branches + first proprietor.
- `.gitignore`, `.env.example`.
- `test/helpers/db-helper.js`, `test/auth.test.js`, `test/services/authService.test.js`, `test/services/recordService.test.js`, `test/services/staffService.test.js`.

**Modify:**
- `package.json` (deps + scripts), `app/portal/login/page.js`, `app/portal/dashboard/page.js`, `components/AuthGate.js`, `README.md`.

**Delete:**
- `lib/supabaseClient.js`, `supabase/schema.sql` (and the `supabase/` folder).

---

## Task 1: Project dependencies, config, and Supabase removal

**Files:**
- Modify: `package.json`
- Create: `.gitignore`, `.env.example`
- Delete: `lib/supabaseClient.js`, `supabase/schema.sql`

**Interfaces:**
- Produces: npm scripts `seed`, `test`; dependencies `mongoose`, `bcryptjs`, `jsonwebtoken`; devDependencies `mongodb-memory-server`, `dotenv`.

- [ ] **Step 1: Replace `package.json`**

```json
{
  "name": "rise-and-shine-portal",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "seed": "node scripts/seed.js",
    "test": "node --test --test-concurrency=1 test/"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.5.0",
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "dotenv": "^16.4.5",
    "mongodb-memory-server": "^10.0.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.next/
out/
.env
.env.local
.env*.local
npm-debug.log*
.DS_Store
.vercel
.mongodb-binaries/
```

- [ ] **Step 3: Create `.env.example`**

```
# MongoDB Atlas connection string (Database > Connect > Drivers)
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/rise-and-shine

# Long random string used to sign session cookies
JWT_SECRET=replace-with-a-long-random-string

# Only used by `npm run seed` to create the first proprietor:
SEED_PROPRIETOR_EMAIL=proprietor@riseandshineschool.com
SEED_PROPRIETOR_PASSWORD=change-me-now
SEED_PROPRIETOR_NAME=Head Proprietor
```

- [ ] **Step 4: Remove the Supabase files**

```bash
git rm lib/supabaseClient.js supabase/schema.sql
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: completes without error; `node_modules/` populated; `package-lock.json` created.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore .env.example
git commit -m "chore: swap Supabase deps for Mongoose/JWT stack + project config"
```

---

## Task 2: Database connection module + test harness

**Files:**
- Create: `server/lib/db.js`
- Create: `test/helpers/db-helper.js`

**Interfaces:**
- Produces: `connectDb()` (default export, returns the Mongoose connection, cached on `global`). Test helper exports `{ connect, clear, close }` used by every service test.

- [ ] **Step 1: Create `server/lib/db.js`**

```js
const mongoose = require('mongoose');

let cached = global.__riseMongoose;
if (!cached) cached = global.__riseMongoose = { conn: null, promise: null };

async function connectDb() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    cached.promise = mongoose.connect(uri).then((m) => m.connection);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDb;
```

- [ ] **Step 2: Create `test/helpers/db-helper.js`**

```js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

async function connect() {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function clear() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

async function close() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

module.exports = { connect, clear, close };
```

- [ ] **Step 3: Verify the harness boots (temporary smoke test)**

Create `test/harness.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const db = require('./helpers/db-helper');

test.before(async () => { await db.connect(); });
test.after(async () => { await db.close(); });

test('in-memory mongo connects', () => {
  assert.equal(mongoose.connection.readyState, 1); // 1 = connected
});
```

- [ ] **Step 4: Run the smoke test**

Run: `npm test`
Expected: PASS (first run downloads a mongod binary — may take a minute).

- [ ] **Step 5: Remove the temporary smoke test and commit**

```bash
rm test/harness.test.js
git add server/lib/db.js test/helpers/db-helper.js
git commit -m "feat: mongoose connection module + in-memory test harness"
```

---

## Task 3: Error types and auth primitives

**Files:**
- Create: `server/lib/errors.js`
- Create: `server/lib/auth.js`
- Test: `test/auth.test.js`

**Interfaces:**
- Produces (`errors.js`): `AppError` (has `.status`), and factories `badRequest(msg)`, `unauthorized(msg?)`, `forbidden(msg?)`, `notFound(msg?)`, `conflict(msg)`.
- Produces (`auth.js`): `SESSION_COOKIE='rs_session'`, `hashPassword(plain)→Promise<string>`, `verifyPassword(plain,hash)→Promise<bool>`, `signToken(payload)→string`, `verifyToken(token)→object|null`, `cookieOptions()→object`.

- [ ] **Step 1: Write the failing test — `test/auth.test.js`**

```js
process.env.JWT_SECRET = 'test-secret';
const test = require('node:test');
const assert = require('node:assert');
const { hashPassword, verifyPassword, signToken, verifyToken } = require('../server/lib/auth');

test('hashPassword produces a verifiable hash', async () => {
  const hash = await hashPassword('abc123');
  assert.notEqual(hash, 'abc123');
  assert.equal(await verifyPassword('abc123', hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
});

test('signToken / verifyToken round-trips the payload', () => {
  const token = signToken({ sub: 'user1', role: 'proprietor' });
  const payload = verifyToken(token);
  assert.equal(payload.sub, 'user1');
  assert.equal(payload.role, 'proprietor');
});

test('verifyToken returns null for a bad token', () => {
  assert.equal(verifyToken('not-a-token'), null);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../server/lib/auth'`.

- [ ] **Step 3: Create `server/lib/errors.js`**

```js
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

module.exports = {
  AppError,
  badRequest: (m) => new AppError(400, m),
  unauthorized: (m) => new AppError(401, m || 'Not authenticated.'),
  forbidden: (m) => new AppError(403, m || 'Not allowed.'),
  notFound: (m) => new AppError(404, m || 'Not found.'),
  conflict: (m) => new AppError(409, m),
};
```

- [ ] **Step 4: Create `server/lib/auth.js`**

```js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SESSION_COOKIE = 'rs_session';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(payload) {
  return jwt.sign(payload, secret(), { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, secret());
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

module.exports = {
  SESSION_COOKIE,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  cookieOptions,
};
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: PASS (3 auth tests).

- [ ] **Step 6: Commit**

```bash
git add server/lib/errors.js server/lib/auth.js test/auth.test.js
git commit -m "feat: error types and auth primitives (bcrypt + JWT)"
```

---

## Task 4: Mongoose models + DTO mappers

**Files:**
- Create: `server/models/Branch.js`, `server/models/User.js`, `server/models/PaymentRecord.js`
- Create: `server/lib/dto.js`

**Interfaces:**
- Consumes: none.
- Produces: models `Branch`, `User`, `PaymentRecord`; DTO functions `toUserDTO(userDoc)`, `toBranchDTO(branchDoc)`, `toRecordDTO(recordDoc)` returning the snake_case shapes from Global Constraints. `toRecordDTO` reads a populated `branchId` (`branchId.name`) for `branches.name`.

- [ ] **Step 1: Create `server/models/Branch.js`**

```js
const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

module.exports = mongoose.models.Branch || mongoose.model('Branch', branchSchema);
```

- [ ] **Step 2: Create `server/models/User.js`**

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['head_teacher', 'proprietor'], default: 'head_teacher' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  mustChangePassword: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
```

- [ ] **Step 3: Create `server/models/PaymentRecord.js`**

```js
const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  pupilName: { type: String, required: true },
  class: { type: String, default: '' },
  item: { type: String, required: true },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['paid', 'partial', 'due'], default: 'due' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.PaymentRecord || mongoose.model('PaymentRecord', paymentRecordSchema);
```

- [ ] **Step 4: Create `server/lib/dto.js`**

```js
function toUserDTO(u) {
  return {
    id: String(u._id),
    full_name: u.fullName,
    email: u.email,
    role: u.role,
    branch_id: u.branchId ? String(u.branchId._id || u.branchId) : null,
    must_change_password: !!u.mustChangePassword,
  };
}

function toBranchDTO(b) {
  return { id: String(b._id), name: b.name };
}

function toRecordDTO(r) {
  const populated = r.branchId && typeof r.branchId === 'object' && r.branchId.name;
  return {
    id: String(r._id),
    branch_id: r.branchId ? String(r.branchId._id || r.branchId) : null,
    pupil_name: r.pupilName,
    class: r.class || '',
    item: r.item,
    amount: r.amount,
    status: r.status,
    added_by: r.addedBy ? String(r.addedBy._id || r.addedBy) : null,
    created_at: r.createdAt,
    branches: { name: populated ? r.branchId.name : null },
  };
}

module.exports = { toUserDTO, toBranchDTO, toRecordDTO };
```

- [ ] **Step 5: Commit**

```bash
git add server/models server/lib/dto.js
git commit -m "feat: Mongoose models and response DTO mappers"
```

(Models and DTOs are exercised by the service tests in Tasks 5–7.)

---

## Task 5: authService

**Files:**
- Create: `server/services/authService.js`
- Test: `test/services/authService.test.js`

**Interfaces:**
- Consumes: `User` model, `hashPassword/verifyPassword/signToken/verifyToken` from `server/lib/auth`, error factories.
- Produces:
  - `login({ email, password })` → `{ token, user }` (throws `unauthorized` on bad creds, `badRequest` on missing fields).
  - `resolveUser(token)` → user doc or `null`.
  - `changePassword(userDoc, newPassword)` → void (throws `badRequest` if `< 6` chars); sets `mustChangePassword=false`.

- [ ] **Step 1: Write the failing test — `test/services/authService.test.js`**

```js
const test = require('node:test');
const assert = require('node:assert');
const db = require('../helpers/db-helper');
const User = require('../../server/models/User');
const { hashPassword, verifyPassword } = require('../../server/lib/auth');
const authService = require('../../server/services/authService');

test.before(async () => { await db.connect(); });
test.after(async () => { await db.close(); });
test.beforeEach(async () => { await db.clear(); });

async function makeUser(overrides = {}) {
  return User.create({
    fullName: 'Test',
    email: 'test@x.com',
    passwordHash: await hashPassword('secret123'),
    role: 'proprietor',
    ...overrides,
  });
}

test('login succeeds with correct credentials and returns a token', async () => {
  await makeUser();
  const { token, user } = await authService.login({ email: 'test@x.com', password: 'secret123' });
  assert.ok(token);
  assert.equal(user.email, 'test@x.com');
});

test('login is case-insensitive on email', async () => {
  await makeUser();
  const { token } = await authService.login({ email: 'TEST@X.COM', password: 'secret123' });
  assert.ok(token);
});

test('login rejects a wrong password', async () => {
  await makeUser();
  await assert.rejects(
    () => authService.login({ email: 'test@x.com', password: 'nope' }),
    /invalid/i
  );
});

test('resolveUser returns the user for a valid token and null for garbage', async () => {
  await makeUser();
  const { token } = await authService.login({ email: 'test@x.com', password: 'secret123' });
  const resolved = await authService.resolveUser(token);
  assert.equal(resolved.email, 'test@x.com');
  assert.equal(await authService.resolveUser('garbage'), null);
});

test('changePassword updates the hash and clears mustChangePassword', async () => {
  const user = await makeUser({ mustChangePassword: true });
  await authService.changePassword(user, 'brandnew1');
  const reloaded = await User.findById(user._id);
  assert.equal(reloaded.mustChangePassword, false);
  assert.equal(await verifyPassword('brandnew1', reloaded.passwordHash), true);
});

test('changePassword rejects a short password', async () => {
  const user = await makeUser();
  await assert.rejects(() => authService.changePassword(user, 'x'), /6 characters/i);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../../server/services/authService'`.

- [ ] **Step 3: Create `server/services/authService.js`**

```js
const User = require('../models/User');
const { hashPassword, verifyPassword, signToken, verifyToken } = require('../lib/auth');
const { unauthorized, badRequest } = require('../lib/errors');

async function login({ email, password }) {
  if (!email || !password) throw badRequest('Email and password are required.');
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) throw unauthorized('Invalid email or password.');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw unauthorized('Invalid email or password.');
  const token = signToken({ sub: String(user._id), role: user.role });
  return { token, user };
}

async function resolveUser(token) {
  const payload = verifyToken(token);
  if (!payload || !payload.sub) return null;
  return User.findById(payload.sub);
}

async function changePassword(user, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw badRequest('Password must be at least 6 characters.');
  }
  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();
}

module.exports = { login, resolveUser, changePassword };
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS (all authService tests + earlier auth tests).

- [ ] **Step 5: Commit**

```bash
git add server/services/authService.js test/services/authService.test.js
git commit -m "feat: authService (login, resolveUser, changePassword)"
```

---

## Task 6: branchService + recordService (authorization core)

**Files:**
- Create: `server/services/branchService.js`
- Create: `server/services/recordService.js`
- Test: `test/services/recordService.test.js`

**Interfaces:**
- Consumes: `PaymentRecord`, `Branch` models; error factories.
- Produces:
  - `branchService.list()` → branch docs sorted by name.
  - `recordService.list(user)` → records (populated `branchId`), scoped: proprietor→all, head_teacher→own branch, newest first.
  - `recordService.create(user, input)` → populated record. `input`: `{ pupilName, class, item, amount, status, branchId }`. Head teacher's branch is forced to `user.branchId` (input branch ignored); proprietor must supply a valid `branchId`.
  - `recordService.update(user, id, { amount, status })` → populated record (proprietor only; `forbidden` otherwise; `notFound` if missing).
  - `recordService.remove(user, id)` → void (proprietor only).

- [ ] **Step 1: Write the failing test — `test/services/recordService.test.js`**

```js
const test = require('node:test');
const assert = require('node:assert');
const db = require('../helpers/db-helper');
const Branch = require('../../server/models/Branch');
const User = require('../../server/models/User');
const recordService = require('../../server/services/recordService');

test.before(async () => { await db.connect(); });
test.after(async () => { await db.close(); });
test.beforeEach(async () => { await db.clear(); });

async function fixtures() {
  const b1 = await Branch.create({ name: 'Branch One' });
  const b2 = await Branch.create({ name: 'Branch Two' });
  const ht = await User.create({
    fullName: 'Head', email: 'ht@x.com', passwordHash: 'x',
    role: 'head_teacher', branchId: b1._id,
  });
  const prop = await User.create({
    fullName: 'Prop', email: 'prop@x.com', passwordHash: 'x', role: 'proprietor',
  });
  return { b1, b2, ht, prop };
}

test('head teacher sees only their own branch; proprietor sees all', async () => {
  const { b2, ht, prop } = await fixtures();
  await recordService.create(ht, { pupilName: 'A', item: 'Tuition', amount: 100 });
  await recordService.create(prop, { pupilName: 'B', item: 'Tuition', amount: 200, branchId: String(b2._id) });
  const htList = await recordService.list(ht);
  assert.equal(htList.length, 1);
  assert.equal(htList[0].pupilName, 'A');
  const propList = await recordService.list(prop);
  assert.equal(propList.length, 2);
});

test('create populates the branch name for the DTO layer', async () => {
  const { ht } = await fixtures();
  const rec = await recordService.create(ht, { pupilName: 'A', item: 'Tuition', amount: 100 });
  assert.equal(rec.branchId.name, 'Branch One');
});

test('head teacher branch is forced server-side even if a foreign branch is sent', async () => {
  const { b1, b2, ht } = await fixtures();
  const rec = await recordService.create(ht, { pupilName: 'A', item: 'Tuition', branchId: String(b2._id) });
  assert.equal(String(rec.branchId._id), String(b1._id));
});

test('create rejects when required fields are missing', async () => {
  const { ht } = await fixtures();
  await assert.rejects(() => recordService.create(ht, { item: 'Tuition' }), /required/i);
});

test('proprietor create requires a branch', async () => {
  const { prop } = await fixtures();
  await assert.rejects(() => recordService.create(prop, { pupilName: 'A', item: 'Tuition' }), /branch/i);
});

test('head teacher cannot update or delete', async () => {
  const { ht } = await fixtures();
  const rec = await recordService.create(ht, { pupilName: 'A', item: 'Tuition', amount: 100 });
  await assert.rejects(() => recordService.update(ht, rec._id, { amount: 500 }), /proprietor/i);
  await assert.rejects(() => recordService.remove(ht, rec._id), /proprietor/i);
});

test('proprietor can update amount/status and delete', async () => {
  const { b1, prop } = await fixtures();
  const rec = await recordService.create(prop, { pupilName: 'A', item: 'Tuition', amount: 100, branchId: String(b1._id) });
  const updated = await recordService.update(prop, rec._id, { amount: 500, status: 'paid' });
  assert.equal(updated.amount, 500);
  assert.equal(updated.status, 'paid');
  await recordService.remove(prop, rec._id);
  assert.equal((await recordService.list(prop)).length, 0);
});

test('update rejects an invalid status', async () => {
  const { b1, prop } = await fixtures();
  const rec = await recordService.create(prop, { pupilName: 'A', item: 'Tuition', branchId: String(b1._id) });
  await assert.rejects(() => recordService.update(prop, rec._id, { status: 'nonsense' }), /status/i);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../../server/services/recordService'`.

- [ ] **Step 3: Create `server/services/branchService.js`**

```js
const Branch = require('../models/Branch');

async function list() {
  return Branch.find().sort({ name: 1 });
}

module.exports = { list };
```

- [ ] **Step 4: Create `server/services/recordService.js`**

```js
const PaymentRecord = require('../models/PaymentRecord');
const Branch = require('../models/Branch');
const { badRequest, forbidden, notFound } = require('../lib/errors');

const VALID_STATUS = ['paid', 'partial', 'due'];

async function list(user) {
  const filter = user.role === 'proprietor' ? {} : { branchId: user.branchId };
  return PaymentRecord.find(filter).sort({ createdAt: -1 }).populate('branchId', 'name');
}

async function create(user, input) {
  if (!input.pupilName || !input.item) {
    throw badRequest('Pupil name and item are required.');
  }
  const status = VALID_STATUS.includes(input.status) ? input.status : 'due';

  let branchId;
  if (user.role === 'head_teacher') {
    if (!user.branchId) throw badRequest('Your account has no branch assigned.');
    branchId = user.branchId;
  } else {
    if (!input.branchId) throw badRequest('Please choose a branch.');
    const exists = await Branch.exists({ _id: input.branchId });
    if (!exists) throw badRequest('Unknown branch.');
    branchId = input.branchId;
  }

  const created = await PaymentRecord.create({
    branchId,
    pupilName: input.pupilName,
    class: input.class || '',
    item: input.item,
    amount: Number(input.amount) || 0,
    status,
    addedBy: user._id,
  });
  return PaymentRecord.findById(created._id).populate('branchId', 'name');
}

async function update(user, id, patch) {
  if (user.role !== 'proprietor') throw forbidden('Only the proprietor can edit records.');
  const rec = await PaymentRecord.findById(id);
  if (!rec) throw notFound('Record not found.');
  if (patch.amount !== undefined) rec.amount = Number(patch.amount) || 0;
  if (patch.status !== undefined) {
    if (!VALID_STATUS.includes(patch.status)) throw badRequest('Invalid status.');
    rec.status = patch.status;
  }
  await rec.save();
  return PaymentRecord.findById(rec._id).populate('branchId', 'name');
}

async function remove(user, id) {
  if (user.role !== 'proprietor') throw forbidden('Only the proprietor can delete records.');
  const rec = await PaymentRecord.findByIdAndDelete(id);
  if (!rec) throw notFound('Record not found.');
}

module.exports = { list, create, update, remove };
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: PASS (all recordService tests).

- [ ] **Step 6: Commit**

```bash
git add server/services/branchService.js server/services/recordService.js test/services/recordService.test.js
git commit -m "feat: branch + record services with server-side authorization"
```

---

## Task 7: staffService

**Files:**
- Create: `server/services/staffService.js`
- Test: `test/services/staffService.test.js`

**Interfaces:**
- Consumes: `User`, `Branch` models; `hashPassword`; error factories.
- Produces:
  - `staffService.list(user)` → all user docs sorted by `createdAt` asc (proprietor only; `forbidden` otherwise).
  - `staffService.create(user, { fullName, email, branchId, tempPassword })` → new user doc, `role='head_teacher'`, `mustChangePassword=true` (proprietor only; `badRequest` on missing/short password/unknown branch; `conflict` on duplicate email).

- [ ] **Step 1: Write the failing test — `test/services/staffService.test.js`**

```js
const test = require('node:test');
const assert = require('node:assert');
const db = require('../helpers/db-helper');
const Branch = require('../../server/models/Branch');
const User = require('../../server/models/User');
const { verifyPassword } = require('../../server/lib/auth');
const staffService = require('../../server/services/staffService');

test.before(async () => { await db.connect(); });
test.after(async () => { await db.close(); });
test.beforeEach(async () => { await db.clear(); });

async function proprietor() {
  return User.create({ fullName: 'P', email: 'p@x.com', passwordHash: 'x', role: 'proprietor' });
}

test('proprietor creates a head teacher with mustChangePassword and a hashed password', async () => {
  const prop = await proprietor();
  const branch = await Branch.create({ name: 'Branch One' });
  const created = await staffService.create(prop, {
    fullName: 'Jane', email: 'Jane@X.com', branchId: String(branch._id), tempPassword: 'temp123',
  });
  assert.equal(created.role, 'head_teacher');
  assert.equal(created.mustChangePassword, true);
  assert.equal(created.email, 'jane@x.com');
  assert.notEqual(created.passwordHash, 'temp123');
  assert.equal(await verifyPassword('temp123', created.passwordHash), true);
});

test('duplicate email is rejected', async () => {
  const prop = await proprietor();
  const branch = await Branch.create({ name: 'Branch One' });
  const args = { fullName: 'Jane', email: 'jane@x.com', branchId: String(branch._id), tempPassword: 'temp123' };
  await staffService.create(prop, args);
  await assert.rejects(() => staffService.create(prop, args), /already exists/i);
});

test('short temporary password is rejected', async () => {
  const prop = await proprietor();
  const branch = await Branch.create({ name: 'Branch One' });
  await assert.rejects(
    () => staffService.create(prop, { fullName: 'J', email: 'j@x.com', branchId: String(branch._id), tempPassword: 'x' }),
    /6 characters/i
  );
});

test('a head teacher cannot create staff or list them', async () => {
  const branch = await Branch.create({ name: 'Branch One' });
  const ht = await User.create({ fullName: 'H', email: 'h@x.com', passwordHash: 'x', role: 'head_teacher', branchId: branch._id });
  await assert.rejects(
    () => staffService.create(ht, { fullName: 'J', email: 'j@x.com', branchId: String(branch._id), tempPassword: 'temp123' }),
    /proprietor/i
  );
  await assert.rejects(() => staffService.list(ht), /proprietor/i);
});

test('proprietor can list staff', async () => {
  const prop = await proprietor();
  const branch = await Branch.create({ name: 'Branch One' });
  await staffService.create(prop, { fullName: 'Jane', email: 'jane@x.com', branchId: String(branch._id), tempPassword: 'temp123' });
  const list = await staffService.list(prop);
  assert.equal(list.length, 2); // proprietor + created head teacher
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../../server/services/staffService'`.

- [ ] **Step 3: Create `server/services/staffService.js`**

```js
const User = require('../models/User');
const Branch = require('../models/Branch');
const { hashPassword } = require('../lib/auth');
const { badRequest, forbidden, conflict } = require('../lib/errors');

function assertProprietor(user) {
  if (user.role !== 'proprietor') throw forbidden('Only the proprietor can manage staff.');
}

async function list(user) {
  assertProprietor(user);
  return User.find().sort({ createdAt: 1 });
}

async function create(user, input) {
  assertProprietor(user);
  const { fullName, email, branchId, tempPassword } = input;
  if (!fullName || !email || !branchId || !tempPassword) {
    throw badRequest('Name, email, branch and temporary password are all required.');
  }
  if (tempPassword.length < 6) {
    throw badRequest('Temporary password must be at least 6 characters.');
  }
  const branchExists = await Branch.exists({ _id: branchId });
  if (!branchExists) throw badRequest('Unknown branch.');

  const normEmail = String(email).toLowerCase().trim();
  const dup = await User.exists({ email: normEmail });
  if (dup) throw conflict('A staff member with that email already exists.');

  const passwordHash = await hashPassword(tempPassword);
  return User.create({
    fullName,
    email: normEmail,
    passwordHash,
    role: 'head_teacher',
    branchId,
    mustChangePassword: true,
  });
}

module.exports = { list, create };
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS (all staffService tests).

- [ ] **Step 5: Commit**

```bash
git add server/services/staffService.js test/services/staffService.test.js
git commit -m "feat: staffService (proprietor-only account creation)"
```

---

## Task 8: HTTP helpers, session resolver, and controllers

**Files:**
- Create: `server/lib/http.js`, `server/lib/session.js`
- Create: `server/controllers/authController.js`, `branchController.js`, `recordController.js`, `staffController.js`

**Interfaces:**
- Consumes: `connectDb`, services, DTOs, `SESSION_COOKIE`, `cookieOptions`, `NextResponse`.
- Produces:
  - `http.json(data, status=200)` → `NextResponse`; `http.fail(err)` → `NextResponse` (`AppError`→its status/message; else 500 generic).
  - `session.getSessionUser(request)` → user doc (throws `unauthorized` if no/invalid cookie); `session.getOptionalUser(request)` → user doc or `null`.
  - Controllers exported as objects: `authController.{login,logout,me,changePassword}`, `branchController.{list}`, `recordController.{list,create,update,remove}`, `staffController.{list,create}`. Each returns a `NextResponse`. `update/remove` take `(request, id)`.

- [ ] **Step 1: Create `server/lib/http.js`**

```js
const { NextResponse } = require('next/server');
const { AppError } = require('./errors');

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function fail(err) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
}

module.exports = { json, fail };
```

- [ ] **Step 2: Create `server/lib/session.js`**

```js
const { SESSION_COOKIE } = require('./auth');
const authService = require('../services/authService');
const { unauthorized } = require('./errors');

async function getOptionalUser(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return token ? authService.resolveUser(token) : null;
}

async function getSessionUser(request) {
  const user = await getOptionalUser(request);
  if (!user) throw unauthorized();
  return user;
}

module.exports = { getSessionUser, getOptionalUser };
```

- [ ] **Step 3: Create `server/controllers/authController.js`**

```js
const connectDb = require('../lib/db');
const { json, fail } = require('../lib/http');
const { getSessionUser } = require('../lib/session');
const { SESSION_COOKIE, cookieOptions } = require('../lib/auth');
const { toUserDTO } = require('../lib/dto');
const authService = require('../services/authService');

async function login(request) {
  try {
    await connectDb();
    const { email, password } = await request.json();
    const { token, user } = await authService.login({ email, password });
    const res = json(toUserDTO(user));
    res.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return res;
  } catch (err) {
    return fail(err);
  }
}

async function logout() {
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  return res;
}

async function me(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    return json(toUserDTO(user));
  } catch (err) {
    return fail(err);
  }
}

async function changePassword(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const { newPassword } = await request.json();
    await authService.changePassword(user, newPassword);
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}

module.exports = { login, logout, me, changePassword };
```

- [ ] **Step 4: Create `server/controllers/branchController.js`**

```js
const connectDb = require('../lib/db');
const { json, fail } = require('../lib/http');
const { getSessionUser } = require('../lib/session');
const { toBranchDTO } = require('../lib/dto');
const branchService = require('../services/branchService');

async function list(request) {
  try {
    await connectDb();
    await getSessionUser(request);
    const branches = await branchService.list();
    return json(branches.map(toBranchDTO));
  } catch (err) {
    return fail(err);
  }
}

module.exports = { list };
```

- [ ] **Step 5: Create `server/controllers/recordController.js`**

```js
const connectDb = require('../lib/db');
const { json, fail } = require('../lib/http');
const { getSessionUser } = require('../lib/session');
const { toRecordDTO } = require('../lib/dto');
const recordService = require('../services/recordService');

async function list(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const records = await recordService.list(user);
    return json(records.map(toRecordDTO));
  } catch (err) {
    return fail(err);
  }
}

async function create(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const body = await request.json();
    const rec = await recordService.create(user, body);
    return json(toRecordDTO(rec), 201);
  } catch (err) {
    return fail(err);
  }
}

async function update(request, id) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const body = await request.json();
    const rec = await recordService.update(user, id, body);
    return json(toRecordDTO(rec));
  } catch (err) {
    return fail(err);
  }
}

async function remove(request, id) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    await recordService.remove(user, id);
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}

module.exports = { list, create, update, remove };
```

- [ ] **Step 6: Create `server/controllers/staffController.js`**

```js
const connectDb = require('../lib/db');
const { json, fail } = require('../lib/http');
const { getSessionUser } = require('../lib/session');
const { toUserDTO } = require('../lib/dto');
const staffService = require('../services/staffService');

async function list(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const staff = await staffService.list(user);
    return json(staff.map(toUserDTO));
  } catch (err) {
    return fail(err);
  }
}

async function create(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const body = await request.json();
    const created = await staffService.create(user, body);
    return json(toUserDTO(created), 201);
  } catch (err) {
    return fail(err);
  }
}

module.exports = { list, create };
```

- [ ] **Step 7: Commit**

```bash
git add server/lib/http.js server/lib/session.js server/controllers
git commit -m "feat: http/session helpers and MVC controllers"
```

(Controllers are exercised end-to-end by the build + smoke test in Task 15.)

---

## Task 9: API route handlers

**Files:**
- Create: `app/api/auth/login/route.js`, `app/api/auth/logout/route.js`, `app/api/auth/me/route.js`, `app/api/auth/password/route.js`
- Create: `app/api/branches/route.js`, `app/api/records/route.js`, `app/api/records/[id]/route.js`, `app/api/staff/route.js`

**Interfaces:**
- Consumes: controllers from Task 8 (default-imported as an object).
- Produces: HTTP endpoints per the spec's endpoint table.

- [ ] **Step 1: Create `app/api/auth/login/route.js`**

```js
import authController from '../../../../server/controllers/authController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = (request) => authController.login(request);
```

- [ ] **Step 2: Create `app/api/auth/logout/route.js`**

```js
import authController from '../../../../server/controllers/authController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = () => authController.logout();
```

- [ ] **Step 3: Create `app/api/auth/me/route.js`**

```js
import authController from '../../../../server/controllers/authController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = (request) => authController.me(request);
```

- [ ] **Step 4: Create `app/api/auth/password/route.js`**

```js
import authController from '../../../../server/controllers/authController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = (request) => authController.changePassword(request);
```

- [ ] **Step 5: Create `app/api/branches/route.js`**

```js
import branchController from '../../../server/controllers/branchController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = (request) => branchController.list(request);
```

- [ ] **Step 6: Create `app/api/records/route.js`**

```js
import recordController from '../../../server/controllers/recordController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = (request) => recordController.list(request);
export const POST = (request) => recordController.create(request);
```

- [ ] **Step 7: Create `app/api/records/[id]/route.js`**

```js
import recordController from '../../../../server/controllers/recordController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = (request, { params }) => recordController.update(request, params.id);
export const DELETE = (request, { params }) => recordController.remove(request, params.id);
```

- [ ] **Step 8: Create `app/api/staff/route.js`**

```js
import staffController from '../../../server/controllers/staffController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = (request) => staffController.list(request);
export const POST = (request) => staffController.create(request);
```

- [ ] **Step 9: Verify the app compiles**

Run: `npm run build`
Expected: build succeeds. (Warnings about dynamic routes are expected because of `force-dynamic`.)

- [ ] **Step 10: Commit**

```bash
git add app/api
git commit -m "feat: Next.js API route handlers wired to controllers"
```

---

## Task 10: Seed script

**Files:**
- Create: `scripts/seed.js`

**Interfaces:**
- Consumes: `Branch`, `User` models; `hashPassword`; env `MONGODB_URI`, `SEED_PROPRIETOR_EMAIL/PASSWORD/NAME`.
- Produces: idempotent creation of the three branches and (if env supplied) the first proprietor.

- [ ] **Step 1: Create `scripts/seed.js`**

```js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const Branch = require('../server/models/Branch');
const User = require('../server/models/User');
const { hashPassword } = require('../server/lib/auth');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);

  for (const name of ['Branch One', 'Branch Two', 'Branch Three']) {
    await Branch.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }
  console.log('Branches ready.');

  const email = (process.env.SEED_PROPRIETOR_EMAIL || '').toLowerCase().trim();
  const password = process.env.SEED_PROPRIETOR_PASSWORD;
  const fullName = process.env.SEED_PROPRIETOR_NAME || 'Proprietor';

  if (email && password) {
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Proprietor already exists:', email);
    } else {
      await User.create({
        fullName,
        email,
        passwordHash: await hashPassword(password),
        role: 'proprietor',
        branchId: null,
        mustChangePassword: false,
      });
      console.log('Proprietor created:', email);
    }
  } else {
    console.log('Skipped proprietor (set SEED_PROPRIETOR_EMAIL and SEED_PROPRIETOR_PASSWORD).');
  }

  await mongoose.disconnect();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit** (running it needs a real `MONGODB_URI`; verified in Task 15)

```bash
git add scripts/seed.js
git commit -m "feat: seed script for branches and first proprietor"
```

---

## Task 11: Frontend API wrapper

**Files:**
- Create: `lib/api.js`

**Interfaces:**
- Produces (ESM): `export const api` with `get(path)`, `post(path, body)`, `put(path, body)`, `patch(path, body)`, `del(path)`. All send/receive JSON with `credentials: 'include'`; on a non-2xx response they throw `new Error(serverErrorMessage)`.

- [ ] **Step 1: Create `lib/api.js`**

```js
async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error((data && data.error) || 'Request failed.');
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body || {}) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body || {}) }),
  del: (path) => request(path, { method: 'DELETE' }),
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/api.js
git commit -m "feat: frontend fetch wrapper"
```

---

## Task 12: Rewire the login page

**Files:**
- Modify: `app/portal/login/page.js`

**Interfaces:**
- Consumes: `api` from `lib/api.js`; endpoints `GET /api/auth/me`, `POST /api/auth/login`.
- Produces: same rendered login UI, backed by the new API.

- [ ] **Step 1: Replace the top of `app/portal/login/page.js` (imports + session check + submit)**

Replace lines 1–30 (from `'use client';` through the end of `handleSubmit`) with:

```js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then(() => router.replace('/portal/dashboard'))
      .catch(() => {});
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/login', { email, password });
      router.push('/portal/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
```

Leave everything from `return (` onward (the JSX) unchanged.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds (no reference to `supabase` remains in this file).

- [ ] **Step 3: Commit**

```bash
git add app/portal/login/page.js
git commit -m "refactor: login page uses /api/auth instead of Supabase"
```

---

## Task 13: Rewire the dashboard + add the Staff panel

**Files:**
- Modify: `app/portal/dashboard/page.js`

**Interfaces:**
- Consumes: `api`; endpoints `GET /api/auth/me`, `GET /api/branches`, `GET /api/records`, `POST /api/records`, `PATCH /api/records/:id`, `GET /api/staff`, `POST /api/staff`, `POST /api/auth/logout`.
- Produces: the existing dashboard UI (unchanged records UI) plus a proprietor-only Staff panel built from existing CSS classes.

- [ ] **Step 1: Replace the imports and data functions (lines 1–109)**

Replace from `'use client';` through the end of `handleEdit` (the closing `}` before `if (loading)`) with:

```js
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

const statusLabel = { paid: 'Fully paid', partial: 'Partial', due: 'Outstanding' };

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [branches, setBranches] = useState([]);
  const [records, setRecords] = useState([]);
  const [branchFilter, setBranchFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ pupil_name: '', class: '', item: '', amount: '', status: 'due', branch_id: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  // Staff panel (proprietor only)
  const [staff, setStaff] = useState([]);
  const [staffOpen, setStaffOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ fullName: '', email: '', branchId: '', tempPassword: '' });
  const [savingStaff, setSavingStaff] = useState(false);
  const [staffNotice, setStaffNotice] = useState('');

  const refreshRecords = useCallback(async () => {
    const data = await api.get('/api/records');
    setRecords(data || []);
  }, []);

  const refreshStaff = useCallback(async () => {
    const data = await api.get('/api/staff');
    setStaff(data || []);
  }, []);

  const loadEverything = useCallback(async () => {
    let profileRow;
    try {
      profileRow = await api.get('/api/auth/me');
    } catch {
      router.replace('/portal/login');
      return;
    }
    setProfile(profileRow);

    const branchRows = await api.get('/api/branches');
    setBranches(branchRows || []);

    if (profileRow.role === 'head_teacher' && profileRow.branch_id) {
      setForm((f) => ({ ...f, branch_id: profileRow.branch_id }));
    }

    await refreshRecords();
    if (profileRow.role === 'proprietor') {
      await refreshStaff();
    }
    setLoading(false);
  }, [router, refreshRecords, refreshStaff]);

  useEffect(() => {
    loadEverything();
  }, [loadEverything]);

  async function handleLogout() {
    await api.post('/api/auth/logout');
    router.replace('/portal/login');
  }

  async function handleAddRecord(e) {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      await api.post('/api/records', {
        pupilName: form.pupil_name,
        class: form.class,
        item: form.item,
        amount: Number(form.amount) || 0,
        status: form.status,
        branchId: profile.role === 'head_teacher' ? profile.branch_id : form.branch_id,
      });
      setForm({ pupil_name: '', class: '', item: '', amount: '', status: 'due', branch_id: profile.role === 'head_teacher' ? profile.branch_id : '' });
      setFormOpen(false);
      await refreshRecords();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(record) {
    if (profile.role !== 'proprietor') return;
    const newAmount = window.prompt(`New amount for ${record.pupil_name} (${record.item})`, record.amount);
    if (newAmount === null) return;
    const newStatus = window.prompt('Status: paid / partial / due', record.status);
    if (newStatus === null) return;
    try {
      await api.patch(`/api/records/${record.id}`, { amount: Number(newAmount) || 0, status: newStatus });
      await refreshRecords();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddStaff(e) {
    e.preventDefault();
    setSavingStaff(true);
    setStaffNotice('');
    try {
      await api.post('/api/staff', {
        fullName: staffForm.fullName,
        email: staffForm.email,
        branchId: staffForm.branchId,
        tempPassword: staffForm.tempPassword,
      });
      setStaffForm({ fullName: '', email: '', branchId: '', tempPassword: '' });
      setStaffOpen(false);
      await refreshStaff();
    } catch (err) {
      setStaffNotice(err.message);
    } finally {
      setSavingStaff(false);
    }
  }
```

- [ ] **Step 2: Insert the Staff panel JSX**

In the same file, find the closing `</div>` of the records `panel` (the line `        </div>` immediately before `{!isProprietor && (`). Insert this block **between** the records panel's closing `</div>` and the `{!isProprietor && (` block:

```jsx
        {isProprietor && (
          <div className="panel">
            <div className="panel-head">
              <h3>Staff Accounts</h3>
              <button className="add-btn" onClick={() => setStaffOpen((v) => !v)}>
                {staffOpen ? 'Close form' : '+ Add Head Teacher'}
              </button>
            </div>

            {staffOpen && (
              <form className="add-form" onSubmit={handleAddStaff}>
                <div className="field">
                  <label>Full name</label>
                  <input required value={staffForm.fullName} onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input required type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
                </div>
                <div className="field">
                  <label>Branch</label>
                  <select required value={staffForm.branchId} onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}>
                    <option value="">Choose branch</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Temporary password</label>
                  <input required value={staffForm.tempPassword} onChange={(e) => setStaffForm({ ...staffForm, tempPassword: e.target.value })} placeholder="min 6 characters" />
                </div>
                <button type="submit" disabled={savingStaff}>{savingStaff ? 'Saving…' : 'Create Account'}</button>
              </form>
            )}
            {staffNotice && <div className="error-msg" style={{ margin: '0 22px 16px' }}>{staffNotice}</div>}

            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Branch</th><th>Role</th></tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td className="pupil-name">{s.full_name}</td>
                    <td>{s.email}</td>
                    <td><span className="branch-tag">{branches.find((b) => b.id === s.branch_id)?.name || '—'}</span></td>
                    <td>{s.role === 'proprietor' ? 'Proprietor' : 'Head Teacher'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds; no `supabase` reference remains in this file.

- [ ] **Step 4: Commit**

```bash
git add app/portal/dashboard/page.js
git commit -m "refactor: dashboard uses REST API + proprietor staff panel"
```

---

## Task 14: Rewire AuthGate for the forced-password-change flow

**Files:**
- Modify: `components/AuthGate.js`

**Interfaces:**
- Consumes: `api`; endpoints `GET /api/auth/me`, `PUT /api/auth/password`.
- Produces: the same "Create your password" card, now shown when the logged-in user's `must_change_password` is true. Only checks the session on `/portal` routes (avoids a DB hit for anonymous homepage visitors).

- [ ] **Step 1: Replace the top of `components/AuthGate.js` (lines 1–46: imports through `handleSetPassword`)**

```js
'use client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function AuthGate({ children }) {
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!window.location.pathname.startsWith('/portal')) return;
    api
      .get('/api/auth/me')
      .then((me) => {
        if (me.must_change_password) setNeedsPassword(true);
      })
      .catch(() => {});
  }, []);

  async function handleSetPassword(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/api/auth/password', { newPassword: password });
      setDone(true);
      setTimeout(() => {
        window.location.href = '/portal/dashboard';
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
```

Leave everything from `if (needsPassword) {` onward (the JSX card and `return children;`) unchanged.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds; no `supabase` reference remains in this file.

- [ ] **Step 3: Confirm no Supabase references remain anywhere**

Run: `grep -rn "supabase" app components lib || echo "clean"`
Expected: `clean`.

- [ ] **Step 4: Commit**

```bash
git add components/AuthGate.js
git commit -m "refactor: AuthGate forced-password-change via REST API"
```

---

## Task 15: README rewrite, full verification, and PR

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: setup docs for MongoDB Atlas + Vercel; verified running app; a pull request.

- [ ] **Step 1: Replace `README.md`**

```markdown
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
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 3: Seed and run against a real database, then smoke-test**

Prerequisite: `.env.local` filled in with a real `MONGODB_URI` (a local `mongod` or an Atlas cluster) and `SEED_*` values.

```bash
npm run seed
npm run dev
```

Then verify manually in the browser (`http://localhost:3000`):
- [ ] Homepage renders unchanged; `/portal/login` renders unchanged.
- [ ] Proprietor signs in → dashboard shows KPIs, records panel, and **Staff Accounts** panel.
- [ ] Proprietor adds a head teacher for Branch One (temp password ≥ 6 chars).
- [ ] Sign out; sign in as the head teacher with the temp password → forced to set a new
      password → lands on dashboard.
- [ ] Head teacher sees only Branch One; can add a record; the Edit button is locked; no
      Staff panel is shown.
- [ ] Sign back in as proprietor → sees all branches, can filter, can Edit a record
      (amount/status), and the branch filter works.
- [ ] Log out and hit `/portal/dashboard` directly → redirected to `/portal/login`.

- [ ] **Step 4: Commit the README**

```bash
git add README.md
git commit -m "docs: rewrite setup for MongoDB Atlas + Vercel"
```

- [ ] **Step 5: Push the branch and open the PR**

```bash
git push -u origin refactor/node-mvc-mongodb
gh pr create --title "Refactor backend to Node MVC + MongoDB (Vercel-native)" \
  --body "Replaces Supabase (Postgres + Auth + RLS) with a Node MVC backend on MongoDB while keeping the UI identical. Auth via bcrypt + JWT cookie; authorization enforced server-side in services; single Vercel deploy. See docs/superpowers/specs/2026-07-14-node-mvc-mongodb-design.md."
```

If `git push`/`gh pr create` fails on permissions (no write access to
`achirivictor5-art/Rise-and-Shine`): `gh repo fork --remote`, push the branch to the fork,
then `gh pr create --head <your-user>:refactor/node-mvc-mongodb`.

---

## Self-Review

**1. Spec coverage:**
- Architecture (Next + `server/` MVC + `app/api`) → Tasks 8–9, file structure. ✓
- Data model (Branch/User/PaymentRecord) → Task 4. ✓
- UI-preservation DTO contract → Task 4 (`dto.js`); consumed unchanged by Tasks 12–14. ✓
- Auth (bcrypt + JWT cookie, endpoints) → Tasks 3, 5, 8, 9. ✓
- Authorization rules (scoping, forced branch, proprietor-only edit/delete/staff) → Tasks 6, 7 with tests. ✓
- Account creation (seed proprietor + staff panel + forced change) → Tasks 10, 13, 14. ✓
- Frontend rewiring, UI untouched → Tasks 11–14. ✓
- Serverless/Vercel (cached connection, nodejs runtime) → Tasks 2, 9. ✓
- Deps/config/env, Supabase removal → Task 1. ✓
- Error handling (`{error}` → `.error-msg`) → `http.fail` (Task 8) + frontend catch (Tasks 12–14). ✓
- Verification + README + PR → Task 15. ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N" — every code step contains full code. ✓

**3. Type consistency:** `connectDb` (default export) used consistently; `getSessionUser(request)` signature matches controllers; `recordService.update/remove(user, id, ...)` matches controller and route `params.id`; DTO field names (`branch_id`, `pupil_name`, `must_change_password`, `branches.name`) match what login/dashboard/AuthGate read; request bodies use camelCase (`pupilName`, `branchId`, `newPassword`, `tempPassword`) matching service inputs. ✓
