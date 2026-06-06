# ACTION REQUIRED 003 — Anthropic API Key
> Blocks: Day 5 — Resume AI Analysis (backend)
> Estimated time: 5 minutes
> Status: ⬜ PENDING (same as backend ACTION_REQUIRED_003)

---

## WHY THIS IS NEEDED

All AI features (resume parsing, resume scoring, match scoring, cover letter, tailoring) use
the Claude API (Anthropic). Without this key, every AI feature in the app will fail.

Note: This is a backend requirement. The mobile app calls the backend which calls Claude.
No Anthropic key is needed in the mobile app directly.

---

## EXACT STEPS

### Step 1 — Get API key (3 min)
1. Go to **https://console.anthropic.com**
2. Sign in (create account if needed)
3. Go to **API Keys** → **Create Key**
4. Name it: `applyai-production`
5. Copy the key (starts with `sk-ant-...`)

### Step 2 — Add billing (2 min)
1. In Anthropic console → **Billing** → Add a credit card
2. Add $5–$10 credit to start
3. Claude API is cheap: ~$0.003 per resume analysis

### Step 3 — Add to Railway (1 min)
1. Open **https://railway.app** → your backend service → Variables tab
2. Add:
   ```
   ANTHROPIC_API_KEY = sk-ant-your-key-here
   ```
3. Railway auto-redeploys

---

## COST ESTIMATE

| Feature | API calls per user action | Approx cost |
|---------|--------------------------|-------------|
| Resume parse | 1 Claude call | ~$0.002 |
| Resume score | 1 Claude call | ~$0.002 |
| Match score | 1 Claude call | ~$0.003 |
| Tailor resume | 1 Claude call | ~$0.01 |
| Cover letter | 1 Claude call | ~$0.005 |
| Interview eval (per Q) | 1 Claude call | ~$0.003 |

$5 credit = ~500 full interview sessions

---

## WHEN DONE

Tell Claude: **"ACTION_REQUIRED_003 done, continue Day 5"**

---

## WHAT GETS UNBLOCKED

- ✅ Backend Day 5: Resume parse + score endpoints
- ✅ Backend Day 7: Match score endpoint
- ✅ Backend Day 8: Tailor resume + cover letter endpoints
- ✅ Frontend Days 5, 7, 8: All AI-powered screens
