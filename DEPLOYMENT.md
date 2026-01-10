# Turfics Free Deployment Guide

This guide describes how to deploy the full Turfics stack (Frontend + Backend + Database) for free using **Render**, **Neon**, and **Vercel**.

## Prerequisites
- A GitHub account with this repository pushed to it.
- Accounts on [Render.com](https://render.com), [Neon.tech](https://neon.tech), and [Vercel.com](https://vercel.com).

---

## 1. Database (Neon.tech)
We will use Neon for a free managed PostgreSQL database.

1.  Log in to Neon and create a new Project (e.g., `turfics-db`).
2.  Once created, copy the **Connection String** from the dashboard. It looks like:
    `postgres://user:password@ep-xyz.region.neon.tech/neondb?sslmode=require`
3.  Keep this string safe; you will need it for the Backend deployment.

---

## 2. Backend (Render.com)
We will deploy the Flask API on Render.

1.  Log in to Render and click **New +** -> **Web Service**.
2.  Connect your GitHub repository.
3.  **Root Directory**: `backend` (Important! this tells Render where the python app works from).
4.  **Name**: `turfics-backend` (or similar).
5.  **Environment**: Python 3.
6.  **Build Command**: `pip install -r requirements.txt`
7.  **Start Command**: `gunicorn app:app`
8.  **Free Instance Type**: Select "Free".
9.  **Environment Variables** (Advanced / Environment Section):
    - `DATABASE_URL`: Paste the Neon connection string from Step 1.
    - `JWT_SECRET_KEY`: Generate a random string (e.g., `supersecretkey123`).
    - `GEMINI_API_KEY`: Your Google Gemini API Key.
    - `PYTHON_VERSION`: `3.9.0` (Optional, stable choice).
10. Click **Create Web Service**.
11. Wait for the deployment to finish. Copy the **Service URL** (e.g., `https://turfics-backend.onrender.com`).

---

## 3. Frontend (Vercel)
We will deploy the React/Vite app on Vercel.

1.  Log in to Vercel and click **Add New...** -> **Project**.
2.  Import your GitHub repository.
3.  **Framework Preset**: Vite (should be auto-detected).
4.  **Root Directory**: Click "Edit" and select `frontend`.
5.  **Environment Variables**:
    - `VITE_API_URL`: Paste your Render Backend URL from Step 2 (e.g., `https://turfics-backend.onrender.com`).
      *Note: Do NOT add a trailing slash.*
6.  Click **Deploy**.
7.  Once deployed, your app is live!

---

## 4. Post-Deployment Setup
The database is empty initially. You need to create the tables.

### Option A: Manual Seeding via Code (Recommended for First Run)
The current `app.py` has `db.create_all()` logic or similar. If not, you might need to run migration commands.

If using **Flask-Migrate**:
1.  Locally, update your `.env` to point to the **remote Neon DB** temporarily.
2.  Run:
    ```bash
    flask db upgrade
    ```
    *This runs the migrations against the production DB.*
3.  Revert your local `.env` to localhost.

### Option B: Reset/Seed Script
If you have a `seed.py` or similar, run it locally while connected to the remote DB variable to populate initial data.

---

## Troubleshooting
- **CORS Issues**: Ensure the Backend `app.py` has `CORS(app)` enabled (it is currently set to allow `*`).
- **Mixed Content**: Ensure Backend URL is `https://`. Render provides HTTPS by default.
- **Login Failures**: Check using Browser Console (Network Tab) if the request is going to the correct URL (Render) and not localhost.
