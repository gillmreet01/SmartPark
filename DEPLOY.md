# 🚀 Deploying SmartPark (free tier)

This guide takes SmartPark from the repo to a live, public URL using **100% free tiers**:

| Layer | Service | Free tier |
| --- | --- | --- |
| Database | **MongoDB Atlas** (M0) | 512 MB, no card required |
| Backend API | **Render** web service (Docker) | Free instance (sleeps when idle) |
| Frontend | **Render** static site *(or Vercel / Netlify)* | Free static hosting |

> **How the pieces talk.** The static frontend and the backend live on different domains, so the browser calls the backend by its absolute URL. The frontend reads that URL from the `VITE_API_BASE` build variable, and the backend allows the frontend's origin via `SMARTPARK_CORS_ORIGINS`. Those two values are the only "wiring" you set by hand.

---

## Step 1 — MongoDB Atlas (database)

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a **M0 (free)** cluster.
2. **Database Access** → add a database user (username + password). Save the password.
3. **Network Access** → add IP `0.0.0.0/0` (allow from anywhere — required so Render can connect).
4. **Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Insert your password and add the database name `smartpark` before the `?`:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/smartpark?retryWrites=true&w=majority
   ```
   Keep this string — it's your `MONGODB_URI`.

---

## Step 2 — Deploy to Render (recommended: Blueprint)

The repo ships a [`render.yaml`](render.yaml) Blueprint that defines both services.

1. Push your fork to GitHub (already done for this repo).
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint** → connect the `SmartPark` repo.
3. Render reads `render.yaml` and proposes two services: **smartpark-api** and **smartpark-web**. Click **Apply**.
4. Render will ask for the `sync: false` values. Set what you can now and finish the rest after the URLs exist:

   **smartpark-api**
   | Variable | Value |
   | --- | --- |
   | `MONGODB_URI` | the Atlas string from Step 1 |
   | `SMARTPARK_ADMIN_PASS` | a password of your choice (replaces `admin123`) |
   | `SMARTPARK_CORS_ORIGINS` | *fill after the web URL exists (Step 3)* |
   | `SMARTPARK_JWT_SECRET` | auto-generated — leave it |

   **smartpark-web**
   | Variable | Value |
   | --- | --- |
   | `VITE_API_BASE` | *fill after the api URL exists (Step 3)* |

5. Let the first build run. You'll get two URLs, e.g.
   - API → `https://smartpark-api.onrender.com`
   - Web → `https://smartpark-web.onrender.com`

---

## Step 3 — Wire the two URLs together

Now connect them (this is the only fiddly part):

1. **smartpark-api → Environment**: set
   ```
   SMARTPARK_CORS_ORIGINS = https://smartpark-web.onrender.com
   ```
   (no trailing slash; comma-separate if you add more origins). Save — the API restarts.
2. **smartpark-web → Environment**: set
   ```
   VITE_API_BASE = https://smartpark-api.onrender.com
   ```
   Save, then **Manual Deploy → Clear build cache & deploy** (a static build bakes the value in, so it must rebuild).
3. Open the web URL. Sign in with `admin` / the password you set. 🎉

---

## Alternative — frontend on Vercel or Netlify

Prefer Vercel/Netlify for the static site? Deploy only the backend on Render (Step 2 keeps `smartpark-api`), then:

**Vercel**
- **Import** the repo → set **Root Directory** to `frontend`.
- Framework preset: **Vite**. Build: `npm run build`, output: `dist`.
- **Environment Variables** → `VITE_API_BASE = https://smartpark-api.onrender.com`.
- SPA routing works out of the box; if needed add `vercel.json`:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

**Netlify**
- **Base directory** `frontend`, **build command** `npm run build`, **publish directory** `frontend/dist`.
- Environment: `VITE_API_BASE = https://smartpark-api.onrender.com`.
- Add `frontend/public/_redirects` with: `/*  /index.html  200`.

Then set the backend's `SMARTPARK_CORS_ORIGINS` to your Vercel/Netlify URL.

---

## Environment variables reference

**Backend (`smartpark-api`)**

| Variable | Required | Example |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | yes | `prod` |
| `MONGODB_URI` | yes | `mongodb+srv://…/smartpark` |
| `SMARTPARK_CORS_ORIGINS` | yes | `https://smartpark-web.onrender.com` |
| `SMARTPARK_JWT_SECRET` | yes | *(generated)* |
| `SMARTPARK_ADMIN_PASS` | recommended | *your password* |
| `SMARTPARK_SIM_ENABLED` | no | `true` |

**Frontend (`smartpark-web`)**

| Variable | Required | Example |
| --- | --- | --- |
| `VITE_API_BASE` | yes (split deploy) | `https://smartpark-api.onrender.com` |

---

## Troubleshooting

- **CORS error in the browser console** → `SMARTPARK_CORS_ORIGINS` doesn't exactly match the frontend origin. It must include scheme, no trailing slash (`https://smartpark-web.onrender.com`). Restart the API after changing it.
- **Live map/feed never connects (WebSocket)** → same cause as CORS; the STOMP endpoint honours the same allowed origins. Confirm `VITE_API_BASE` has no trailing slash and points at the API, and that the API finished restarting.
- **First request hangs ~30–50s** → the free Render instance sleeps when idle and cold-starts on the next hit. Normal for the free tier; upgrade the instance to keep it warm.
- **Changed `VITE_API_BASE` but the app still calls the old URL** → Vite bakes env vars in at build time. Trigger a fresh build (Render: *Clear build cache & deploy*; Vercel/Netlify: redeploy).
- **Backend fails to connect to Atlas** → check the DB user/password and that Network Access allows `0.0.0.0/0`.
- **Data resets** → expected only in local dev (embedded Mongo is ephemeral). In prod, Atlas persists; the seeder only runs when the collections are empty.

---

## Cost

Everything above is free. The only limits worth knowing: the free Render API sleeps after ~15 min idle (cold starts), and Atlas M0 is capped at 512 MB — both are fine for a portfolio demo.
