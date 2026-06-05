# ApplyAI Mobile — Claude Master Instructions
> Version: 1.1 | Last updated: Jun 6, 2026
> Read this file every session. Entry point to the entire frontend knowledge system.
> EVERY rule is MANDATORY. "Mandatory" = no exceptions, no skipping, no "I'll do it later."

---

## THE GUARANTEE

I guarantee every document is updated every time anything changes.

> ✅ DONE = Code written + Docs updated + Committed + CHANGE RECEIPT printed
> ❌ NOT DONE = Code written but docs not yet updated

No session ends without the CHANGE RECEIPT printed at the bottom.
If you don't see a CHANGE RECEIPT, the session is not complete.

---

## ROLE

You are simultaneously the:
- **React Native Developer** — write complete, production-quality Expo + React Native code
- **UI/UX Implementer** — implement screens exactly matching product intent
- **State Manager** — maintain Redux store shape, selector patterns, action flows
- **Integration Owner** — own the backend API contract, keep it in sync with API_INTEGRATION.md
- **Navigation Architect** — maintain screen hierarchy and navigation flows
- **Documentation Owner** — keep every doc accurate, versioned, and in sync at all times

---

## FILE INDEX — WHICH FILE ANSWERS WHAT

| Question | File |
|----------|------|
| What screens exist? What's built? | `PROJECT_STATE.md` |
| What are we building next? Any blockers? | `BUILD_LOG.md` |
| How is the app structured? Navigation? State? | `ARCHITECTURE.md` |
| What does each screen look like? What state/props? | `SCREEN_SPEC.md` |
| What API calls does the app make? | `API_INTEGRATION.md` |
| What does each flow do end-to-end (UI level)? | `FUNCTIONAL_FLOW.md` |
| What packages are we using? Why? | `TECH_STACK.md` |
| Backend URL, env vars, auth flow, Android setup? | `INTEGRATION_CONFIG.md` |

---

## SESSION START PROTOCOL — MANDATORY EVERY SESSION

```
STEP 1 → Read PROJECT_STATE.md
         Check: screen status, built components, nav structure, env vars

STEP 2 → Read BUILD_LOG.md → CURRENT STATUS
         Check: what's next, open bugs, blockers

STEP 3 → Identify change category:
         Screen Build / Screen Modify / Feature Hold / Feature Skip /
         Tech Change / Bug Fix / Integration Change / Unplanned

STEP 4 → Check DEPENDENCY MAP in PROJECT_STATE.md
         All backend APIs used must be ✅ in backend before building UI for them

STEP 5 → Read relevant specialist doc:
         New screen        → read SCREEN_SPEC.md first
         Navigation change → read ARCHITECTURE.md first
         API call change   → read API_INTEGRATION.md first
         State change      → read ARCHITECTURE.md → Redux Store section

STEP 6 → Run DOC HEALTH CHECK

STEP 7 → Build

STEP 8 → Update docs using correct SCENARIO CHECKLIST

STEP 9 → Print CHANGE RECEIPT

STEP 10 → git add . && git commit && git push
```

---

## SCENARIO CHECKLISTS

---

### SCENARIO A — Screen / Feature Built

```
□ PROJECT_STATE.md → SCREEN STATUS: mark ✅, set version, set tested
□ PROJECT_STATE.md → FILES THAT EXIST: add every new file with its components/hooks
□ PROJECT_STATE.md → NAVIGATION STRUCTURE: add screen to nav tree
□ PROJECT_STATE.md → CURRENT BUILD PHASE: update Active Day + Last Session

□ BUILD_LOG.md → MASTER PROGRESS TRACKER: mark ✅, set version, date, tested
□ BUILD_LOG.md → session entry: fill What was built, Files created, Test results, Commit
□ BUILD_LOG.md → CURRENT STATUS: update Next to build + Last push

□ SCREEN_SPEC.md → add full screen entry: purpose, route name, props, state, API calls,
                   navigation triggers, empty state, error state, loading state
□ SCREEN_SPEC.md → bump version number

□ API_INTEGRATION.md → for every new API call made from this screen:
     add endpoint row with: screen, method, path, when called, success handler, error handler
□ API_INTEGRATION.md → bump version number
  (skip if screen makes no API calls)

□ FUNCTIONAL_FLOW.md → update Flow Index: mark ✅ for this feature's flows
□ FUNCTIONAL_FLOW.md → update flow steps (taps, screen transitions, what user sees)
□ FUNCTIONAL_FLOW.md → bump version number

□ TECH_STACK.md → for every new package.json dependency added:
     add row with version, purpose, why chosen; update package.json section; bump version
  (skip if no new packages)

□ ARCHITECTURE.md → if navigation structure changed: update NAV TREE section
□ ARCHITECTURE.md → if Redux store shape changed: update STORE SHAPE section
□ ARCHITECTURE.md → bump version if changed

□ ApplyAI_Build_Prompts.md → mark this day complete with date

□ If unplanned: BUILD_LOG.md → UNPLANNED FEATURES: assign FEAT-XXX, log it
```

---

### SCENARIO B — Screen / Feature Modified

```
□ SCREEN_SPEC.md → update screen entry: props, state, API calls, navigation
□ SCREEN_SPEC.md → CHANGE LOG: add row with what changed + why
□ SCREEN_SPEC.md → bump version

□ API_INTEGRATION.md → if API call changed: update endpoint row
□ API_INTEGRATION.md → bump version if changed

□ FUNCTIONAL_FLOW.md → update affected flow steps
□ FUNCTIONAL_FLOW.md → bump version

□ PROJECT_STATE.md → FILES THAT EXIST: update if component/hook added or removed
□ PROJECT_STATE.md → SCREEN STATUS: update tested date

□ BUILD_LOG.md → session entry: describe what changed and why
□ BUILD_LOG.md → CURRENT STATUS: update Last push

□ ARCHITECTURE.md → if nav or store structure changed: update + add note to CHANGE LOG
```

---

### SCENARIO C — Feature Put On Hold

```
□ BUILD_LOG.md → CURRENT STATUS: skip past held feature in Next to build
□ BUILD_LOG.md → session entry: log reason

□ PROJECT_STATE.md → SCREEN STATUS: mark ⏸ On Hold with reason

□ TECH_STACK.md → if a package was planned only for this feature: mark ⏸ On Hold

□ FUNCTIONAL_FLOW.md → Flow Index: mark ⏸ On Hold for affected flows

□ Tell user: "Day X is on hold. Next I will build Day Y."
```

---

### SCENARIO D — Feature Skipped

```
□ Check DEPENDENCY MAP — list missing backend APIs or screens

□ PROJECT_STATE.md → SCREEN STATUS: mark ⏭ Skipped with reason
□ PROJECT_STATE.md → OUT-OF-ORDER LOG: add entry

□ BUILD_LOG.md → tag session [OUT-OF-ORDER]
□ BUILD_LOG.md → session entry: note what was skipped and workaround

□ Tell user: "Skipping Day X. Missing: [list]. Proceeding with: [workaround]."
```

---

### SCENARIO E — Tech Stack Change

```
□ TECH_STACK.md → update package row: status, added date, notes
□ TECH_STACK.md → package.json section: reflect current state
□ TECH_STACK.md → CHANGE LOG: add row with version, date, change, reason
□ TECH_STACK.md → bump version

□ PROJECT_STATE.md → package.json dependencies section: reflect current state

□ ARCHITECTURE.md → if new package changes architecture: update
```

---

### SCENARIO F — Bug Found

```
□ Assign ID: BUG-001, BUG-002, etc.
□ BUILD_LOG.md → OPEN BUGS: add row with ID, description, screen, opened date, OPEN
□ PROJECT_STATE.md → KNOWN ISSUES: add same entry

□ If fixable now → fix → run Scenario G
□ If needs backend change → log and flag
□ If needs env var / config → create actions/ACTION_REQUIRED_XXX.md
```

---

### SCENARIO G — Bug Fixed

```
□ BUILD_LOG.md → OPEN BUGS: mark FIXED, add date + one-line fix
□ PROJECT_STATE.md → KNOWN ISSUES: mark FIXED with same info

□ If fix changed screen behavior → run Scenario B for that screen

□ BUILD_LOG.md → session entry: describe bug + fix
```

---

### SCENARIO H — "What's Next?" asked

```
□ Read PROJECT_STATE.md → CURRENT BUILD PHASE + SCREEN STATUS
□ Read BUILD_LOG.md → CURRENT STATUS

□ Report:
   - Last completed: Day X — [screen name] — [date]
   - Next to build: Day Y — [screen name]
   - Blocked on: [backend APIs not ready / env vars / nothing]
   - Open bugs: [list or "None"]
   - What to unblock: [specific action or "nothing, ready to build"]
```

---

## CHANGE RECEIPT — PRINTED AT END OF EVERY RESPONSE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE RECEIPT — [date]
Scenario: [A/B/C/D/E/F/G/H] — [name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Code changes:
  ✅ [file] — [what changed]

Docs updated:
  ✅ PROJECT_STATE.md — [what field]
  ✅ BUILD_LOG.md — [what field]
  ✅ SCREEN_SPEC.md — [what] (vX.X → vX.Y)
  ✅ API_INTEGRATION.md — [what] (vX.X → vX.Y)
  ✅ FUNCTIONAL_FLOW.md — [what]
  ✅ TECH_STACK.md — [what]
  ✅ ARCHITECTURE.md — [what]

Docs NOT changed (reason):
  — [doc]: [why not touched]

Committed: [hash] — [message]

Next to build: Day [N] — [screen name]
Blocked on: [anything] or "Nothing — ready"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## DOC HEALTH CHECK — RUN AT SESSION START AND END

| Check | How to verify |
|-------|--------------|
| Every screen in SCREEN STATUS has full entry in SCREEN_SPEC.md | Compare both |
| Every API call in API_INTEGRATION.md maps to real backend endpoint | Cross-ref backend API_SPEC.md |
| Every ✅ screen in SCREEN STATUS has ✅ in BUILD_LOG MASTER TRACKER | Compare both |
| FUNCTIONAL_FLOW.md Flow Index matches SCREEN STATUS | Compare both |
| No "[DATE]" placeholders in BUILD_LOG session entries | Scan BUILD_LOG |

---

## VERSION NUMBERING RULES

- **Minor (X.Y → X.Y+1):** Any content change
- **Major (X.Y → X+1.0):** New section added, section removed, format overhaul
- Always update `Last updated:` date in the same edit

---

## CODE STANDARDS (NON-NEGOTIABLE)

- No class components — functional components + hooks only
- No inline styles — StyleSheet.create() always
- No hardcoded backend URL — always from `process.env.EXPO_PUBLIC_API_URL`
- No hardcoded strings — constants file for all labels, routes, keys
- Axios for all HTTP calls — with interceptor for JWT injection
- Redux Toolkit for all global state — no useState for shared state
- expo-secure-store for JWT — never AsyncStorage for tokens
- Loading state on every API call — never show blank screen
- Error state on every API call — never silently fail
- TypeScript types for all props and API responses
- Package layout: `src/screens/`, `src/components/`, `src/store/`, `src/api/`

---

## BACKEND INTEGRATION RULES

- Before building any screen that calls an API, verify backend endpoint is ✅ Working in backend `API_SPEC.md`
- Define a TypeScript interface for every API response in `src/types/api.types.ts`
- All API calls go through `src/api/apiClient.ts` — never call axios directly from a screen
- JWT injected by Axios interceptor — screens never touch the token
- On 401 → clear token → navigate to Login

---

## PROJECT IDENTITY

| Item | Value |
|------|-------|
| App | ApplyAI Mobile |
| Stack | React Native 0.85.3, Expo SDK 56, TypeScript 6, React 19 |
| Package name | com.applyai.mobile |
| GitHub | https://github.com/itzmuthuhere/applyai-mobile |
| Local | D:\applyai-mobile |
| Backend URL | https://applyai-backend-production-3b67.up.railway.app |
| Platform | Android first → iOS Phase 2 |
| Deploy | Expo EAS Build → Google Play Store |
| Backend repo | D:\backend |
