# Deployment notes (PI CRM)

## Why `https://pi-crm.hyfprojects.com/` might redirect to `/login`

In the app code, **`/` shows the Landing page** and does not redirect to `/login`. If production always shows the login page when you open the root URL, the cause is usually one of these:

### 1. Server/hosting redirect

The host may be redirecting `/` to `/login` (e.g. in Nginx, Apache, or the platform’s “redirect” rules). **Fix:** remove any rule that redirects `/` to `/login`. The root URL must be handled by the SPA.

### 2. SPA fallback missing

If the server does not serve `index.html` for `/` (and other client routes), you may get a 404 or an unexpected redirect. **Fix:** configure the server so that all requests that don’t match a real file are served with `index.html` (SPA fallback).

### 3. Old build

An older build might have had different routing (e.g. `/` → dashboard → then redirect to login). **Fix:** build again from the current repo and redeploy so production uses the version where `/` renders the Landing page.

---

## Config files in this repo

- **`public/_redirects`** – Netlify: SPA fallback; no redirect from `/` to `/login`.
- **`vercel.json`** – Vercel: rewrites so all routes serve `index.html`.
- **`public/.htaccess`** – Apache: rewrite so non-file requests go to `index.html`.

If **hyfprojects.com** uses Nginx or a custom config, add equivalent rules:

- **Nginx:** `try_files $uri $uri/ /index.html;` and **no** `return 302 /login` or similar for `/`.
- **Platform “Redirects”:** ensure there is **no** rule like “/ → /login”. Only use a single SPA fallback (e.g. “/* → /index.html” with status 200).

After changing server config or redeploying, clear cache or use an incognito window and open `https://pi-crm.hyfprojects.com/` again; you should see the Landing page, not the login page.
