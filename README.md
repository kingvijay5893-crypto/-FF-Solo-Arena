# FF Solo Arena

An independent, community-run **solo tournament management** web app.

> **Not affiliated with Garena or Free Fire.** "FF Solo Arena" is a fan-made
> community tool. It uses no official Free Fire/Garena logos, artwork, or
> branding, and does not claim any affiliation with Garena. Rename the app
> before any public/commercial launch if you want to be extra safe.

Tokens awarded in this app are **virtual, non-cash points**. There is no
deposit, betting, wagering, or cash withdrawal anywhere in this codebase.

---

## 1. What's in this project

```
ff-solo-arena/
├── frontend/     React + TypeScript + Tailwind PWA (player + admin UI)
├── backend/      Node.js + Express API (all writes to tournaments/tokens
│                 go through here — the frontend never writes those directly)
├── firestore.rules
└── firestore.indexes.json
```

**Why a backend at all, when this uses Firebase?** Firestore security rules
alone cannot safely implement "only an admin verifies a result and credits
tokens" logic that also needs to update multiple documents atomically and
keep an audit trail. So:

- Firestore rules lock down **direct client writes** to sensitive fields
  (nobody can write their own `tokenBalance`, nobody can flip their own role
  to `admin`, nobody can create a `transactions` document directly).
- The **Express backend**, running with the **Firebase Admin SDK**
  (server-side, never shipped to the browser), is the only thing that can
  credit tokens, publish room details, and verify results. It authenticates
  every request using the player's Firebase ID token and, for admin
  endpoints, checks a custom claim / Firestore role field server-side.

---

## 2. Prerequisites

- Node.js 18+ and npm
- A free [Firebase](https://console.firebase.google.com) project
- Firebase CLI: `npm install -g firebase-tools`

---

## 3. Firebase project setup

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project**.
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → Create database → start in **production mode**.
4. **Storage is NOT needed** (it requires a billing account). Result screenshots are compressed on the phone and stored in Firestore instead.
5. Project settings → **General** → under "Your apps", add a **Web app**.
   Copy the config object — you'll need it for `frontend/.env`.
6. Project settings → **Service accounts** → **Generate new private key**.
   This downloads a JSON file — you'll need three values from it for
   `backend/.env` (`project_id`, `client_email`, `private_key`).
7. Deploy the security rules and indexes from the repo root:
   ```bash
   firebase login
   firebase init firestore    # point at this repo, reuse existing rules files
   firebase deploy --only firestore:rules,firestore:indexes
   ```

### Making the first admin user

There is intentionally **no UI to self-promote to admin**. After a user
registers normally, grant them admin from a trusted machine using the
Firebase Admin SDK (a tiny one-off script, or the Firebase console):

```bash
cd backend
npm run make-admin -- <user-uid>
```

This sets a custom claim `role: "admin"` on that Firebase Auth user **and**
`role: "admin"` on their Firestore `users/{uid}` doc. Both the frontend
route guard and every backend admin-route check read this field, so both
must agree — the script sets both in one transaction.

---

## 4. Environment variables

### `backend/.env` (copy from `backend/.env.example`)

| Variable | Required | What it is |
|---|---|---|
| `FIREBASE_PROJECT_ID` | ✅ | From the service account JSON |
| `FIREBASE_CLIENT_EMAIL` | ✅ | From the service account JSON |
| `FIREBASE_PRIVATE_KEY` | ✅ | From the service account JSON (keep the `\n` escapes, wrap in quotes) |
| `PORT` | optional | defaults to `4000` |
| `CORS_ORIGIN` | ✅ | your frontend URL, e.g. `http://localhost:5173` |

⚠️ **Never commit `backend/.env` or the service account JSON.** They are
already in `.gitignore`. Never put these values in any frontend file.

### `frontend/.env` (copy from `frontend/.env.example`)

| Variable | Required | What it is |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ | Public web config (safe to ship to browser) |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | " |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | " |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | " |
| `VITE_FIREBASE_APP_ID` | ✅ | " |
| `VITE_API_BASE_URL` | ✅ | backend URL, e.g. `http://localhost:4000/api` |

The Firebase **web** config (`VITE_FIREBASE_*`) is safe in the frontend —
it identifies your project, it isn't a secret. The **service account**
values (`backend/.env`) are the actual secret and must stay server-side.

---

## 5. Local development

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env      # then fill in real values
npm run dev                # http://localhost:4000

# Terminal 2 — frontend
cd frontend
npm install
cp .env.example .env      # then fill in real values
npm run dev                # http://localhost:5173
```

Seed the sample tournament ("FF Solo Night") once the backend is running
and you have an admin user:

```bash
cd backend
npm run seed
```

---

## 6. Production build

```bash
cd frontend && npm run build     # outputs frontend/dist (deploy to Firebase Hosting, Vercel, etc.)
cd backend && npm run build && npm start   # compiled to backend/dist, deploy anywhere Node runs
```

The frontend is a installable PWA (manifest + service worker included in
`frontend/index.html` / `frontend/public`).

---

## 7. Data model

See `firestore.rules` for the authoritative access rules. Collections:
`users`, `tournaments`, `registrations`, `results`, `transactions` — fields
match the spec exactly (see each route file in `backend/src/routes` for the
shape written to each).

## 8. Security notes (read before deploying anywhere real)

- All token-crediting, room-detail publishing, and result-verification
  logic lives **only** in `backend/src/routes/admin.ts`, gated by
  `requireAdmin` middleware that checks the caller's custom claim — never
  trust a frontend-only check.
- `firestore.rules` denies **all** direct client writes to `tokenBalance`,
  `role`, and the entire `transactions` collection.
- Room ID/password fields are stripped from the tournament payload the
  frontend receives unless the requester has a `registrations` doc for
  that tournament (enforced server-side in `tournaments.ts`).
- Duplicate-registration is enforced both client-side (disabled button)
  and server-side (Firestore transaction check in `registrations.ts`) —
  never trust the client-side check alone.
- Every write endpoint validates its inputs with the helpers in
  `backend/src/utils/validate.ts`, including Free Fire UID format
  (digits, 6–12 characters).
