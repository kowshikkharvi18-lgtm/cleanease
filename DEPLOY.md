# Deploy CleanEase — Free Hosting + Android App

## PART 1 — Put code on GitHub (free)

1. Go to https://github.com and create a free account
2. Click **New repository** → name it `cleanease` → click **Create**
3. Download **GitHub Desktop** from https://desktop.github.com
4. Open GitHub Desktop → **Add existing repository** → select your `CLEANEASE` folder
5. Click **Publish repository** → make it **Public** → click Publish

---

## PART 2 — Deploy on Render (free hosting)

1. Go to https://render.com and sign up with your GitHub account
2. Click **New** → **Web Service**
3. Select your `cleanease` GitHub repository
4. Fill in:
   - **Name:** cleanease
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
5. Click **Create Web Service**
6. Wait 2-3 minutes — Render gives you a URL like:
   `https://cleanease.onrender.com`
7. Open that URL — your app is live for anyone!

> ⚠️ Free Render apps sleep after 15 min of inactivity.
> First load may take 30 seconds to wake up. That's normal.

---

## PART 3 — Make Android App (free)

1. Go to https://www.webintoapp.com
2. Click **Create App**
3. Enter your Render URL: `https://cleanease.onrender.com`
4. Set App Name: **CleanEase**
5. Upload a logo (optional)
6. Click **Build Free**
7. Download the APK file
8. Send the APK to any Android phone and install it

> On Android: Settings → Security → Allow unknown sources → Install APK

---

## Done! 🎉

- Website: `https://cleanease.onrender.com`
- Android App: Install the APK on any phone
- Both are completely FREE
