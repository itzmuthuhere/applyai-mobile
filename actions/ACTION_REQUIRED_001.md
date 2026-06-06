# ACTION REQUIRED 001 — Add EXPO_TOKEN to GitHub Secrets
> Blocks: APK auto-build + OTA updates via GitHub Actions
> Estimated time: 3 minutes
> Status: ⬜ PENDING

---

## WHY THIS IS NEEDED

The GitHub Actions workflows (`ota-update.yml` and `build-apk.yml`) need to authenticate
with Expo's servers to push OTA updates and trigger APK builds.
Without this token, both workflows will fail with an authentication error.

---

## EXACT STEPS

### Step 1 — Get your Expo token (1 min)
1. Open: **https://expo.dev/accounts/itzmuthuhere/settings/access-tokens**
2. Click **"Create Token"**
3. Name it: `github-actions`
4. Click **"Create"**
5. **Copy the token** — it is shown ONLY ONCE

### Step 2 — Add to GitHub (2 min)
1. Open: **https://github.com/itzmuthuhere/applyai-mobile/settings/secrets/actions**
2. Click **"New repository secret"**
3. Name: `EXPO_TOKEN`
4. Value: paste the token from Step 1
5. Click **"Add secret"**

---

## HOW TO VERIFY IT WORKED

After adding the secret:
1. Go to **https://github.com/itzmuthuhere/applyai-mobile/actions**
2. Click **"Build APK + Update Download Page"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Watch it run — should succeed within ~12 minutes
5. Check https://illustrious-kleicha-2dee8f.netlify.app — Download button will point to real APK

---

## WHEN DONE

Tell Claude: **"ACTION_REQUIRED_001 done"**
Claude will then trigger the first APK build.

---

## WHAT GETS UNBLOCKED

- ✅ `ota-update.yml` — push code → existing users auto-update
- ✅ `build-apk.yml` — trigger APK build → Netlify download page auto-updates
- ✅ First real APK can be shared with friends for testing
