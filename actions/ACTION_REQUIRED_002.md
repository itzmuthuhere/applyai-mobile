# ACTION REQUIRED 002 — Cloudinary Account + Keys
> Blocks: Day 4 — Resume Upload (backend + frontend)
> Estimated time: 10 minutes
> Status: ⬜ PENDING (same as backend ACTION_REQUIRED_002)

---

## WHY THIS IS NEEDED

Resumes are stored on Cloudinary (cloud file storage).
When a user uploads a PDF resume, it goes to Cloudinary and the URL is saved in the database.
Without Cloudinary credentials, the backend will throw an error on upload.

Note: This is the same action required by the backend. If you have already set up Cloudinary
for the backend, the mobile app just calls the backend — no extra Cloudinary setup needed here.

---

## EXACT STEPS

### Step 1 — Create Cloudinary account (5 min)
1. Go to **https://cloudinary.com**
2. Click "Sign Up For Free"
3. Use your Google account to sign up
4. After login → go to Dashboard

### Step 2 — Get your credentials (1 min)
From the Cloudinary Dashboard, copy these 3 values:
- **Cloud Name** (e.g., `dxxxxxxxx`)
- **API Key** (e.g., `123456789012345`)
- **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

### Step 3 — Add to Railway backend (4 min)
1. Open **https://railway.app** → your backend service → Variables tab
2. Add these variables:
   ```
   CLOUDINARY_CLOUD_NAME = your_cloud_name
   CLOUDINARY_API_KEY    = your_api_key
   CLOUDINARY_API_SECRET = your_api_secret
   ```
3. Railway auto-redeploys (~2 min)

---

## HOW TO VERIFY IT WORKED

After backend redeploys:
```
curl -X POST https://applyai-backend-production-3b67.up.railway.app/api/resumes/upload \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "file=@/path/to/test.pdf"
```
Should return 201 with a Cloudinary URL.

---

## WHEN DONE

Tell Claude: **"ACTION_REQUIRED_002 done, continue Day 4"**

---

## WHAT GETS UNBLOCKED

- ✅ Backend Day 4: Resume upload endpoint
- ✅ Frontend Day 4: ResumeUploadScreen → pick PDF → upload → stored in Cloudinary
