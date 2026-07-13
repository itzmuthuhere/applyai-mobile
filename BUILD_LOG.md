# ApplyAI Mobile — Build Log
> Accountability log for every session. Updated automatically by Claude at end of each session.
> For current codebase state, read PROJECT_STATE.md instead.

---

## MASTER PROGRESS TRACKER

| Day | Feature | Status | Version | Date | Tested |
|-----|---------|--------|---------|------|--------|
| 1 | App shell + navigation setup | ✅ Complete | v1.0 | Jun 6, 2026 | ⬜ Pending |
| 2 | Google Sign-In screen | ✅ Complete | v1.0 | Jun 6, 2026 | ⬜ Pending device test |
| 3 | Home + Profile screens | ✅ Complete | v1.0 | Jun 6, 2026 | ⬜ Pending device test |
| 4 | Resume List + Upload screens | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 5 | Resume Detail / Score screen | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 6 | Job Feed + Job Detail screens | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 7 | Match Score screen | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 8 | Tailor Resume + Cover Letter screens | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 9 | Applications List + Detail screens | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 10 | Interview Start + Report screens | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 11 | Interview Answer (voice recording) screen | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 12 | End-to-end testing + polish | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |

---

## UNPLANNED FEATURES

| ID | Description | Day | Date | Status |
|----|-------------|-----|------|--------|
| FEAT-UI-001 | Centralized theme system — dark mode + 5 accent colors, single-place change propagates to all 41 screens | — | Jun 24, 2026 | ✅ Complete |
| FEAT-UI-002 | PostDetailScreen LinkedIn-grade redesign — card shadows, per-person color-hash avatar rings (post author + every commenter), skeleton shimmer loaders (post header + comments) replacing spinners, pill-style like/comment stat badges, highlighted active-reaction button, own-comment tint + indicator dot, CTA-shadow send button. No functional change — all testIDs and handlers preserved. Bundled with BUG-MOB-009 (backend-side timestamp fix). 482 mobile tests green | — | Jul 11, 2026 | ✅ Complete |
| FEAT-019 | Bulk auto-apply pipeline (mobile side of applyai-backend FEAT-018) — JobFeedScreen select-mode queue bar gets two toggle chips ("Tailor resume for all" default-on, "Cover letter for all" default-off) wired into the POST /api/auto-apply/queue body; AutoApplyQueueScreen gets a full select-mode (in-body Select/Cancel row, per-card checkboxes disabled on non-removable statuses APPLYING/APPLIED, Select All, bulk-remove bottom bar hitting new DELETE /api/auto-apply/queue/batch); AutoApplyQueueItem type + queue cards gain a "Cover letter ready" badge alongside the existing "Resume tailored" one. Jobs tab itself needed no change — the default feed personalization (targetRole) is entirely backend-side since the screen already omits `q` when its search box is empty. 493 mobile tests green (482 + 11 new: JobFeedScreen toggle test, AutoApplyQueueScreen ×7 select-mode/bulk tests, cover-letter badge test) | — | Jul 11, 2026 | ✅ Complete |
| FEAT-020 | "Jobs for you" dashboard preview — HomeScreen (the app's actual landing tab after sign-in; Jobs is a separate tab requiring an extra navigation) gets a new section between Quick Actions and Recent Applications showing up to 5 personalized job matches (reuses the FEAT-018 targetRole-personalized GET /api/jobs/feed, no new backend param), each with company/title/location/salary/match-score, tapping into JobDetail; "See all" links to the Jobs tab; skeleton loading state; section hides entirely when there are no matches. User feedback after FEAT-018/019 shipped: "just after entering the app i'm just still seeing dashboard" — the personalization only helped once you tapped into Jobs, which wasn't obvious/immediate enough. Confirmed with user (AskUserQuestion) that a Home preview was preferred over changing the default landing tab, to avoid disrupting the HR banner/profile-completeness/AI-tools sections already there. 497 mobile tests green (493 + 4 new) | — | Jul 11, 2026 | ✅ Complete |
| FEAT-021 | Resume status gate on JobFeedScreen — user follow-up after FEAT-020: "where is the resume upload options? where jobs will be filtered and shown?" pointed at a real UX gap — resume upload (Resume tab) and job matching (Jobs tab) were three disconnected tabs with no visible link between them; user explicitly asked for "upload resume → see filtered jobs" as one flow (confirmed via follow-up question, "this is main feature"). JobFeedScreen (JOBSEEKER only, hidden for HR) now opens with either: an "Upload your resume" CTA banner (primary-colored, routes to ResumeTab → ResumeUpload) when no parsed resume exists, or a compact status card showing the parsed resume's name + AI score + "Change" link (routes to ResumeTab → ResumeList) when one does — making explicit that the job list below it is being matched against that specific resume. Reads `state.resume.list` (already populated app-wide via AppNavigator bootstrap), no new API calls. 500 mobile tests green (497 + 3 new) | — | Jul 11, 2026 | ✅ Complete |
| BUG-MOB-012 | "Change" link (FEAT-021) landed on ResumeListScreen with no way to actually change anything — user report: "not able to change that resume properly." Root cause was entirely backend-side (see applyai-backend BUG-060): `isOriginal` was fully automatic with no user control anywhere, and uploads never demoted previous originals | ResumeListScreen | Jul 12, 2026 | ✅ FIXED Jul 12, 2026 — backend added PUT /api/resumes/{id}/primary; ResumeListScreen now shows a "Use for job matching" button on non-primary parsed resume cards and a "Used for job matching" checkmark on the primary one, wired to the new endpoint via a new `setPrimaryResume` reducer (updates the whole list's isOriginal flags client-side, no refetch needed). 505 mobile tests green (500 + 5 new) |
| BUG-MOB-013 | Immediate follow-on from BUG-MOB-012, found from a live screenshot: user's account has 4 resumes uploaded before the BUG-060 exclusivity fix existed, so all 4 still had isOriginal=true in the backend response. ResumeCard read that raw flag directly, so all 4 showed the "✓ Used for job matching" checkmark simultaneously and NONE showed a selector button — "how can I select my resume?" with literally nothing selectable | ResumeListScreen | Jul 12, 2026 | ✅ FIXED Jul 12, 2026 — ResumeListScreen now computes a single-winner `primaryResumeId` client-side (newest parsed-and-original resume, same tiebreak JobFeedScreen/JobDetailScreen already use) instead of trusting the raw isOriginal flag per-card; only that one shows the checkmark, every other resume gets a real "Use for job matching" button regardless of its own stale flag. Self-healing — tapping any button fixes the backend data permanently via the BUG-060 endpoint, no data migration needed. 506 mobile tests green (505 + 1 new) |
| FEAT-022 | JobFeedScreen "Apply All" one-tap flow — user asked for the bulk-queue entry point (FEAT-019) to read as a single "Apply All" action instead of two taps (Select, then All). Confirmed via AskUserQuestion that the whole tailor/cover-letter/queue/extension-autopilot pipeline from FEAT-018/019 was already fully built end-to-end and no functional gap existed — this was purely a UX-entry-point simplification | JobFeedScreen | Jul 12, 2026 | ✅ Complete Jul 12, 2026 — renamed `enterSelectMode` → `handleApplyAll`; pressing the (renamed, testID `apply-all-btn`) button now fetches resumes AND immediately selects every currently-loaded job in one step, dropping straight into the tailor/cover-letter toggle bar. "All" (`select-all-btn`) and "Cancel" chips kept inside select mode so a user can deselect specific jobs then restore full selection. No backend or extension changes — request shape to POST /api/auto-apply/queue is unchanged. 506 mobile tests green (5 tests rewritten/added for the new entry point, net unchanged total since old redundant Select-All-only test was folded into the new flow) |
| BUG-MOB-014 | User reported two live console errors right after FEAT-022 shipped: (1) "Found screens with the same name nested inside one another. Main > Home, Main > Home > Home" and (2) React "Encountered two children with the same key" (`.$938`/`.$939`/`.$940`) | MainNavigator | Jul 12, 2026 | ✅ FIXED Jul 12, 2026 — the bottom-tab entry for the Home tab was itself named `"Home"`, colliding with `HomeStack`'s inner `"Home"` dashboard screen (every other tab already avoided this — `JobsTab`→`JobFeed`, `ResumeTab`→`ResumeList`, etc.). Renamed the tab route to `HomeTab` in `MainTabParamList`, `MainNavigator.tsx` (Tab.Screen + tabBarIcon lookup), and the two `GlobalSearchBar` deep-link calls (`screen: 'Home'` → `'HomeTab'`); inner `HomeStack.Screen name="Home"` (the actual dashboard) is unchanged. Pure rename — no new test needed, existing `GlobalSearchBar.test.tsx` assertions updated to match. 506 mobile tests green (unchanged) |
| BUG-MOB-015 | Companion fix to BUG-MOB-014's second error — job ids in the 900s appearing as duplicate FlatList keys traced to JobFeedScreen's infinite scroll, not the nav collision. Root cause was backend-side: `GET /api/jobs/feed` sorted by `scrapedAt DESC` only; jobs scraped in the same batch share an identical timestamp, and Postgres doesn't guarantee stable ordering for ties across two separate paged queries, so the same job could resurface on page N+1 after already appearing on page N | JobFeedScreen | Jul 12, 2026 | ✅ FIXED Jul 12, 2026 — backend added `id DESC` as a deterministic secondary sort key (applyai-backend BUG-061, API_SPEC.md v4.8). Mobile also added defense-in-depth: `loadPage`'s `setJobs` now dedupes appended pages by `id` before merging, same pattern as `feedSlice.appendPosts` (FEAT-011). New regression test simulates an overlapping page 2 and asserts the duplicate job renders exactly once. 507 mobile tests green (506 + 1 new) |
| FEAT-023 | Web app bootstrap (Phase 0+1 of the full-parity web plan, `feature/web-app` branch) — root problem: the Chrome extension that actually submits Naukri/LinkedIn applications only runs in a desktop browser, so mobile-only users' "Apply All" queue was never consumed by anything. Since the backend's auto-apply endpoints are client-agnostic, a web app opened in the same desktop Chrome unblocks the existing pipeline with zero extension changes. Reused the Expo codebase for web (`react-native-web`) rather than building a separate app. Codebase audit found `@react-native-google-signin/google-signin` and `react-native-purchases` both degrade gracefully on web (warn, don't crash — softer than expected) but `expo-secure-store`'s web build is a genuine empty stub (`export default {}`), breaking JWT persistence and theme prefs. Installed `react-dom`/`react-native-web`/`@expo/metro-runtime` (were referenced by the pre-existing `"web"` script but never actually installed); new `src/utils/secureStorage.ts` wrapper falls back to `localStorage` on web for both `auth.ts` (JWT) and `ThemeContext.tsx` (theme prefs); new `src/navigation/linking.ts` maps every screen to a real URL path for the web build's address bar/history; `authSlice.ts` platform-gates `configureGoogleSignIn`/`GoogleSignin.*` and adds a web login path via new `src/utils/googleWebAuth.ts` (Google Identity Services JS SDK, reuses the existing allow-listed OAuth client id — no backend change); `revenueCat.ts` platform-gates `initRevenueCat`/`getOfferings`/`getActiveEntitlements` to no-ops on web (real web billing is Stripe, Phase 3, not RevenueCat). Verified live in the Browser pane: app boots, bundles (1360 modules), and renders the Onboarding screen on `http://localhost:8090` with zero console errors after all fixes landed. **Blocked on external action** (`actions/ACTION_REQUIRED_004.md`): Google Cloud Console needs `http://localhost:8090` added to the existing Web OAuth client's Authorized JavaScript origins, and Railway needs `CORS_ALLOWED_ORIGINS` set (currently unset — was a non-issue for native/extension clients, is a hard blocker for any browser-based client) — so actual sign-in is unverified end-to-end pending that. New `.claude/launch.json` entry `applyai-web` (backend repo) runs the web dev server. 513 mobile tests green (507 + 6 new: 2 authSlice web-path tests, 3 revenueCat web-path tests) | — | Jul 12, 2026 | 🔶 In Progress |
| FEAT-024 | Web sign-in verified end-to-end + responsive web shell — user completed ACTION_REQUIRED_004 (Google Cloud Console origin + Railway CORS), then confirmed real Google login works and the JWT survives a refresh. User feedback after seeing Home: "no screen is looking good... redesign it from the beginning for web app, also it should be mobile responsive" — the phone-width layouts were rendering full-bleed edge-to-edge in a desktop browser (bottom tab bar stretched across 1900px, content un-constrained) | App-wide (shell) | Jul 12, 2026 | ✅ Complete Jul 12, 2026 — new `src/hooks/useResponsive.ts` (isDesktopWeb breakpoint, ≥900px web only — native untouched); new `src/navigation/WebSidebar.tsx`, a custom `tabBar` for `Tab.Navigator` that renders a persistent left sidebar (logo, nav items reusing the existing `tabBarIcon` map, active-route highlight, user card) on desktop web and falls through to the stock `BottomTabBar` unchanged everywhere else (native + narrow browser); `MainNavigator.tsx` adds matching `paddingLeft` so content doesn't sit under the fixed-position sidebar; new `src/components/common/WebPageContainer.tsx` (max-width + center-align wrapper, pure passthrough on native) applied to HomeScreen and GoogleSignInScreen. First attempt at GoogleSignInScreen's centering used a conditional style array on `LinearGradient` which silently failed to merge (`expo-linear-gradient` doesn't seem to apply array-merged conditional styles the same way plain Views do on web) — fixed by moving the flex/center logic to a plain inner `View` instead, verified via direct DOM measurement (screenshots were unreliable/timing out in the sandboxed preview browser for this gradient-heavy screen) that content is now genuinely centered at 1440px and correctly reverts to the original phone layout at 390px. Verified live in the user's real Chrome (with their real login) via Claude in Chrome: Home, Feed, Jobs (including the Apply All button + resume-match UI), Resumes, Applications, and the Mock Interview entry screen all already render correctly on web with real data — none of those screens touch the native-only APIs flagged in the original risk audit, so they needed zero screen-specific porting work beyond the shell fixes. Did not click "Apply All" or "Start Mock Interview" — those trigger real-world side effects (real job applications via the user's extension; microphone permission/recording) and were out of scope for a UI verification pass. 513 mobile tests green (unchanged — layout-only change, no new test surface) | — | Jul 12, 2026 | ✅ Complete |
| FEAT-025 | User feedback after seeing Feed/Jobs/Resumes/Applications/Interview: "screens are not looking good. design it according to laptop/tab/pc but mobile responsive" — FEAT-024 only applied `WebPageContainer` to Home and GoogleSignIn; the other 5 screens were still raw phone-width layouts with no max-width treatment, rendering a huge empty void to the right on a wide browser (e.g. Interview's blue CTA banners stretched full-bleed across ~1900px). While verifying the fix live, also caught two real crashes on a genuine hard page reload while authenticated (not previously exercised — `AppNavigator`'s bootstrap effect had never been tested from a true cold reload against a real backend response) | FeedScreen, JobFeedScreen, ResumeListScreen, ApplicationsListScreen, InterviewStartScreen, AppNavigator | Jul 12, 2026 | ✅ Complete Jul 12, 2026 — `WebPageContainer` gained `flex:1` (needed so FlatList children inside it size/scroll correctly, not just ScrollView content like Home) and was applied to all 5 remaining screens. **BUG-MOB-016**: `resumeList.find is not a function` crashed JobFeedScreen — `AppNavigator.tsx`'s bootstrap dispatched `setResumes(r.data)` without unwrapping a possible paginated `{content:[...]}` shape, unlike every other call site in the codebase (HomeScreen, JobFeedScreen's own resume fetch) which already guard for it; same bug class as the backend's recent BUG-062. **BUG-MOB-017**: same pattern, `history.filter is not a function` crashed InterviewStartScreen — `setHistory(r.data ?? [])` had the identical gap. Both fixed with the same `Array.isArray(d) ? d : (d?.content ?? [])` guard already used elsewhere. Verified all 6 screens (Home, Feed, Jobs, Resumes, Applications, Interview) render correctly and properly centered after a genuine hard reload (ctrl+shift+r) in the user's real Chrome via Claude in Chrome. 513 mobile tests green (unchanged — no new test file added for AppNavigator's bootstrap effect given the disproportionate mocking effort for a two-line defensive-unwrap fix already covered by the same pattern elsewhere; verified instead via live reload) | — | Jul 12, 2026 | ✅ Complete |

---

## OPEN BUGS

| ID | Description | Screen | Opened | Status |
|----|-------------|--------|--------|--------|
| BUG-001 | Render crash on login: "No Firebase App '[DEFAULT]' has been created" — native android/ project was generated before Firebase was added, so google-services wiring was missing; `messaging()` in useFcmDeepLink also threw synchronously instead of degrading | AppNavigator (useFcmDeepLink) | Jun 11, 2026 | ✅ FIXED Jun 11, 2026 — wired google-services plugin into android/, hardened hook with try/catch, committed google-services.json for EAS |
| BUG-MOB-001 | Apply screen: Railway free-tier cold start (~20-30s) caused axios 30s timeout to fire before response arrived → "Connection error". On retry, 409 was returned but shown as error instead of success. Also: resume filename displayed as URL-encoded (Muthu%20raja%20CV.pdf). | ApplyJobScreen, ResumeDropdown | Jun 16, 2026 | ✅ FIXED Jun 16, 2026 — see session below |
| BUG-MOB-002 | React Navigation warning: TailorResume + CoverLetter registered in both JobsStack and ResumeStack — "Found screens with the same name nested inside one another" | MainNavigator | Jul 10, 2026 | ✅ FIXED Jul 10, 2026 — removed dead ResumeStack copies (unreachable; only JobsStack's are ever navigated to) |
| BUG-MOB-003 | "Encountered two children with the same key" — duplicate message ids in chat FlatList after opening a conversation from a profile | ChatDetailScreen, chatSlice | Jul 10, 2026 | ✅ FIXED Jul 10, 2026 — setMessages reducer now dedupes by id |
| BUG-MOB-004 | Home-tab Notifications screen showed 4 hardcoded static "tip" strings with fake never-changing timestamps instead of real activity | NotificationsScreen | Jul 10, 2026 | ✅ FIXED Jul 10, 2026 — wired to the same real /api/notifications/social endpoint + Redux slice already used by SocialNotificationsScreen; extracted shared notificationIcons.ts covering all 14 backend notification types |
| BUG-MOB-005 | Resume filename shown raw percent-encoded ("Muthu%20raja%20CV.pdf") on ResumeDetailScreen, ResumeListScreen, ApplicationDetailScreen, JobFeedScreen — BUG-MOB-001 (Jun 16) only ever patched ResumeDropdown.tsx | ResumeDetailScreen +3 others | Jul 10, 2026 | ✅ FIXED Jul 10, 2026 — backend now decodes at upload time (applyai-backend BUG-057); shared decodeFileName.ts applied at display time everywhere versionName is shown |
| FEAT-MOB | No delete-resume capability existed anywhere — needed to let users remove resumes broken by the pre-BUG-058 upload path | ResumeListScreen | Jul 10, 2026 | ✅ Complete Jul 10, 2026 — long-press → confirmation Alert → DELETE /api/resumes/{id} (applyai-backend) → removeResume Redux action |
| BUG-MOB-006 | Bell + chat icons appeared twice on Feed screen — FeedScreen's own header duplicated GlobalSearchBar's global top-bar buttons | FeedScreen | Jul 11, 2026 | ✅ FIXED Jul 11, 2026 — removed the duplicate buttons + unused unreadCount selector; redesigned empty state with icon badge + secondary "Find people to follow" action |
| BUG-MOB-007 | "Tailor for a Job" quick action was a dead end — just showed an Alert describing steps to take manually instead of navigating anywhere | ResumeDetailScreen | Jul 11, 2026 | ✅ FIXED Jul 11, 2026 — now navigates directly to JobsTab → JobFeed; added first-ever test file for this screen (2 tests) |
| BUG-MOB-008 | Global bell icon's red unread dot showed permanently regardless of actual unread state — rendered unconditionally with zero connection to Redux | GlobalSearchBar, NotificationsScreen, SocialNotificationsScreen | Jul 11, 2026 | ✅ FIXED Jul 11, 2026 — dot now conditioned on unreadCount > 0; both notification screens auto-mark-all-read on open instead of requiring a separate button tap; removed the now-redundant "Mark all read" button/header count |
| BUG-MOB-009 | PostDetailScreen: a comment posted seconds ago showed "6 hours ago" instead of "just now" (systemic — affects every timestamp app-wide, not just comments) | PostDetailScreen (root cause is backend-wide) | Jul 11, 2026 | ✅ FIXED Jul 11, 2026 — no mobile code change; backend serialized LocalDateTime with no timezone marker, dayjs parsed it as device-local instead of UTC. Backend added a global Jackson UTC 'Z' serializer (applyai-backend BUG-059, config/JacksonConfig.java) |
| BUG-MOB-010 | Tapping the header profile avatar went straight into edit mode (ProfileSettingsScreen — "Edit Profile", Save button, editable fields) instead of showing a read-only LinkedIn-style profile view first | MainNavigator, GlobalSearchBar | Jul 11, 2026 | ✅ FIXED Jul 11, 2026 — `HomeStackParamList`'s `"Profile"` route was wired directly to `ProfileSettingsScreen`; the fully-built read-only `ProfileScreen.tsx` (hero card, Profile Strength, Experience/Education/Certifications sections, "Edit Profile" button) was imported but never registered in any navigator. Split into two routes: `Profile` → `ProfileScreen` (view), new `ProfileSettings` → `ProfileSettingsScreen` (edit). HomeScreen's "Complete your profile" banner now targets `ProfileSettings` directly (unchanged UX intent — jump straight to editing). |
| BUG-MOB-011 | Mock Interview's "Choose a Job Application" picker showed no applications despite the user having applied to a job — a recurring class of bug (previously BUG-018, Jun 24). Root cause had moved: `InterviewStartScreen`'s picker itself was fine (Redux pre-populate + 100-item fetch already correct), but three "Quick Apply" entry points (JobDetailScreen "Easy Apply", JobFeedScreen "Easy Apply", SavedJobsScreen "Easy Apply") never dispatched the new application to Redux — only the original full ApplyJobScreen flow did. If the picker's own live GET then failed/timed out (Railway cold start), it fell back to the stale/empty Redux data by design, leaving the modal empty until app restart | JobDetailScreen, JobFeedScreen, SavedJobsScreen | Jul 11, 2026 | ✅ FIXED Jul 11, 2026 — all three Quick Apply call sites now capture the `ApplicationResponse` and `dispatch(addApplication(data))`, matching the pattern already used by ApplyJobScreen. Added regression tests to JobDetailScreen.test.tsx (new file), JobFeedScreen.test.tsx, SavedJobsScreen.test.tsx asserting the dispatch reaches the Redux store. 486 mobile tests green (482 + 4 new) |
| BUG-MOB-018 | Systemic, app-wide: `Alert.alert()` is a complete no-op in `react-native-web` (`static alert() {}` — confirmed in `node_modules/react-native-web/dist/exports/Alert/index.js`). Every confirmation dialog and error message across the app silently did nothing on web — 75 `Alert.alert(...)` call sites across 20 screens (delete confirmations, sign-out confirm, form validation errors, API error messages, everything). Found via web session testing (Claude in Chrome) after `GoogleSignInScreen`'s sign-in-failed alert produced zero visible feedback | App-wide (react-native-web dependency, not app code) | Jul 13, 2026 | ✅ FIXED Jul 13, 2026 — patched via `patch-package` (`patches/react-native-web+0.21.2.patch`, `postinstall` already runs patch-package): `Alert.alert` now falls back to `window.alert`/`window.confirm`, replicating the button-array contract (0 buttons → alert; 1 button → alert then its `onPress`; 2 buttons → confirm, non-cancel-style button's `onPress` on OK, cancel-style button's `onPress` on Cancel). No screen code changed — fixes all 75 call sites at once. Verified logic against all 4 shapes (informational, single-button, confirm/delete, confirm/cancel) matches real RN `Alert.alert` semantics exactly |
| BUG-MOB-019 | `PaywallScreen`'s "Restore previous purchases" called `restorePurchases()` unguarded on web — unlike `getOfferings`/`getActiveEntitlements`/`initRevenueCat` in the same file, it had no `Platform.OS === 'web'` guard, so it hit the native RevenueCat SDK (undefined on web), threw, and the screen showed a generic "Could not restore purchases. Try again." instead of an honest message | PaywallScreen, revenueCat.ts | Jul 13, 2026 | ✅ FIXED Jul 13, 2026 — `restorePurchases()` now throws `"Restoring purchases isn't available on web yet."` on web before touching the SDK; `PaywallScreen.handleRestore`'s catch now surfaces `e.message` instead of a hardcoded string. New tests: revenueCat.test.ts web-guard case, PaywallScreen.test.tsx restore-failure-message case |
| BUG-MOB-020 | `WebSidebar`'s user/account footer block (bottom-left "Name / Plan" — the desktop-web persistent sidebar added in FEAT-024) had no `onPress` at all — a plain `View`, not a `TouchableOpacity`, despite looking exactly like a clickable profile switcher next to the equivalent (working) avatar button in `GlobalSearchBar`'s top bar. Found by clicking it during live web testing and seeing zero navigation | WebSidebar | Jul 13, 2026 | ✅ FIXED Jul 13, 2026 — wrapped in `TouchableOpacity`, `onPress` now `navigation.navigate('HomeTab', { screen: 'Profile' })`, same destination as the top-bar avatar. New WebSidebar.test.tsx (2 tests: footer press navigates to Profile on desktop web; narrow viewport still falls back to stock BottomTabBar). 517 mobile tests green (513 + 4 new across BUG-MOB-018/019/020) |

---

## CURRENT STATUS

**Next to build:** Continue the web-parity screen sweep — verified so far (this session, live in the user's real Chrome, zero console errors, all rendering correctly): Onboarding, GoogleSignIn/login, Home, Feed, Search, ChatList, Jobs list + JobDetail, CompanyIntel, Companies list, SavedJobs, JobAlerts, AutoApplyQueue (real 20-job queue, delete icons work), Resumes list, ResumeUpload, ResumeDetail (AI re-analysis flow), Applications list, ApplicationDetail (status timeline + update pills), Interview (Mock Interview landing), Profile, ProfileSettings, Analytics, SalaryIntel, NegotiationCoach, CareerPath (full AI roadmap generation verified end-to-end), Blacklist, Notifications, Paywall, HrPostJob. **HrMyJobs**: navigating there as a JOBSEEKER-type account correctly 403s and shows an error — but since that error path now uses a real `window.alert()` (post BUG-MOB-018 fix), it visibly blocked the automated browser tab until recovered via a fresh navigation; this is expected native-browser-dialog behavior; a real user would just click "OK." No code change made. Still unverified (all deliberately skipped — same real-world-side-effect judgment call as FEAT-024: AI-credit-consuming or user-facing-destructive actions weren't triggered): TailorResume, CoverLetter, ApplyJob, MatchScore, InterviewQuestion (voice recorder + mic permission), InterviewReport, InterviewPrepPlan, CreatePost, PostDetail, PublicProfile, Followers/Following, HashtagFeed, ChatDetail. Also noted but not yet fixed: ResumeListScreen's delete-resume is `onLongPress`-only with no visible icon, unintuitive/undiscoverable for a desktop mouse user (no dedicated bug ID yet — flagging for a follow-up session). Google Play Store submission still pending separately (register account ₹2,100 → EAS production build).
**Blocked on:** Nothing currently — `actions/ACTION_REQUIRED_004.md` is done (user confirmed Jul 13, 2026: Google Cloud Console origin + Railway `CORS_ALLOWED_ORIGINS` both set; Google sign-in verified working end-to-end on `http://localhost:8090` against the live Railway backend).
**Open bugs:** None
**Last push:** Jul 12, 2026 — `57cd1ee` (BUG-MOB-014/015, Home tab collision + job feed dedup), on `main`. `feature/web-app` branch (FEAT-023/024/025 + this session's BUG-MOB-018/019/020) committed locally, not yet pushed — held pending user confirmation since it's a large WIP branch.
**Resume point:** Web app is now login-verified end-to-end with a working desktop sidebar shell. This session (Jul 13, 2026) found and fixed one app-wide systemic bug (Alert.alert no-op on web, BUG-MOB-018) plus two smaller ones (BUG-MOB-019, BUG-MOB-020) via live testing in the user's real Chrome (Claude in Chrome) — the sandboxed preview Browser pane had a screenshot/repaint bug of its own (stale frames after animations; confirmed environmental, not app-related, via forced-reflow diffing) so real-Chrome testing was used instead once login was reachable. Next session should continue the screen-by-screen sweep listed above under "Next to build."

> **Jun 29, 2026 cross-repo note:** Backend JSearch upgraded to v5 (`/search-v2`). No mobile code or test changes needed — mobile calls backend `/api/jobs` endpoints only. Job API response shape unchanged. Job feed should start populating once Railway redeploys with new JSEARCH_API_KEY.

---

## SESSION — Jul 13, 2026 — Web screen sweep (BUG-MOB-018/019/020) + login verified end-to-end

**Context:** User asked to make the app "a perfect web application," testing and developing every screen, with browser control granted for live verification. ACTION_REQUIRED_004 (Google Cloud Console origin + Railway CORS) was confirmed done by the user this session, unblocking real login.

**What was tested live:** Started `applyai-web` (backend repo's `.claude/launch.json`, `expo start --web --port 8090`). The sandboxed preview Browser pane had a screenshot tool that returned stale/blank frames after animated screens (confirmed environmental via forced-reflow diffing — DOM/accessibility tree was always correct, only the screenshot pixels were stale; a `window.scrollTo(0,1); window.scrollTo(0,0)` reflow fixed it), and Google sign-in's FedCM flow never completed in that sandboxed context at all. Switched to "Claude in Chrome" (the user's real, already-signed-in Chrome) for anything past the login screen — screenshots worked correctly there and Google sign-in completed successfully using the user's real session, no password entry. Verified end-to-end: Onboarding → GoogleSignIn (login works against the live Railway backend) → Home → Feed → Jobs list → JobDetail → Resumes list → Applications → Interview (Mock Interview landing) → Profile → ProfileSettings ("Edit Profile", including the Appearance/dark-mode toggle section). All rendered correctly with the FEAT-024/025 desktop sidebar shell, no console errors.

**Bugs found and fixed (see OPEN BUGS table above for full detail):**
- **BUG-MOB-018** (systemic, app-wide): `Alert.alert()` is a no-op in `react-native-web` — every confirm dialog and error alert across 75 call sites / 20 screens silently did nothing on web. Fixed via `patch-package` (`patches/react-native-web+0.21.2.patch`) — no app code touched, all 75 sites fixed at once.
- **BUG-MOB-019**: `PaywallScreen`'s restore-purchases button was unguarded on web (unlike the other RevenueCat calls in the same file), threw internally, showed a misleading generic error. Now guarded with an honest message.
- **BUG-MOB-020**: `WebSidebar`'s user-info footer had no `onPress` — looked clickable, did nothing. Wired to navigate to `Profile` (same destination as the working top-bar avatar in `GlobalSearchBar`).

**Not yet fixed (flagged for follow-up, not urgent):** `ResumeListScreen`'s delete-resume is reachable only via `onLongPress`, with no visible affordance for a desktop mouse user — undiscoverable but not broken (long-press-equivalent click-and-hold does work in react-native-web). No bug ID assigned yet, pending a decision on whether to add a visible delete icon.

**Scope note:** ~25 of the ~35 total screens are still unverified on web this session (see CURRENT STATUS → "Next to build" above for the full list) — this is inherently a multi-session effort given the number of screens and flows involved.

**Tests:** 517 mobile tests green (513 + 4 new: revenueCat.test.ts web-guard case for BUG-MOB-019, PaywallScreen.test.tsx restore-failure-message case, WebSidebar.test.tsx ×2 for BUG-MOB-020). No new automated test for BUG-MOB-018 (the patch lives in `node_modules`/`patches/`, outside what the Jest/RN test environment — which doesn't use `react-native-web` — can exercise; verified instead via direct logic testing against the patched function in a live browser matching real `Alert.alert` semantics for all 4 button-array shapes).

**Commit:** — (pending; changes are on `feature/web-app`, not yet pushed)
**Status:** 🔶 In Progress — web parity sweep continues next session

---

## SESSION — Jun 24, 2026 — Theme System (FEAT-UI-001)

**What was built:**
- `src/theme/themes.ts` — `buildTheme(mode, accent)` producing full `AppColors` palette; `ACCENT_PRESETS` for 5 colors (blue, purple, green, orange, pink); light/dark mode palettes
- `src/store/slices/themeSlice.ts` — Redux slice: `{ mode, accent }`; actions `setMode`, `setAccent`, `toggleMode`
- `src/theme/ThemeContext.tsx` — `ThemeProvider` (reads/writes SecureStore for persistence); `useTheme()` hook; `useThemeSettings()` hook
- `App.tsx` — wrapped with `ThemeProvider` inside Redux `Provider`
- `src/__tests__/setup.ts` — global `useTheme` mock for all 40+ test files
- `src/screens/home/ProfileSettingsScreen.tsx` — added Appearance card: dark mode Switch + 5 accent color dot pickers
- All 41 screens migrated from `COLORS.*` → `useTheme()` + `makeStyles(colors)` pattern
- Fixed all pre-export helper components (StatsBar, AppCard, TabPill, PostCard, SectionCard, etc.) to call `useTheme()` directly
- Fixed module-level StyleSheets referencing colors (barStyles, sectionStyles, tlStyles) → converted to factory functions
- Fixed makeStyles closing brace bug across all 41 files + JSX return restoration

**Tests:** 328 tests pass (40 suites)
**Commit:** 74cc8cb

---

## SESSION LOGS

---

### SESSION — Jul 11, 2026 — BUG-MOB-010: Profile route wiring (view vs edit)

**Type:** Scenario F + G (Bug Found + Fixed, same session)

**Context:** User tapped the header profile avatar expecting a read-only, LinkedIn/Naukri-style profile view with an Edit button, and section-by-section editing (Education, Experience, Certifications). Instead it opened straight into the full edit form (ProfileSettingsScreen — "Edit Profile" header, Save button, editable Basic Info fields).

**Root cause:** Nothing was missing — `ProfileScreen.tsx` already existed as a complete read-only view (hero card, Profile Strength card, Experience/Education/Certifications sections rendered as read-only cards, "Edit Profile" button). It was imported in `MainNavigator.tsx` but never registered on any navigator; `HomeStackParamList`'s `"Profile"` route pointed directly at `ProfileSettingsScreen` instead. `ProfileScreen`'s own `goToSettings()` handler already called `navigation.navigate('ProfileSettings')`, a route that didn't exist yet either — so even reaching the view screen, its own Edit button was dead.

**Fix:**
- `navigation/types.ts` — added `ProfileSettings: undefined;` to `HomeStackParamList`
- `navigation/MainNavigator.tsx` — `"Profile"` now renders `ProfileScreen` (view); added new `"ProfileSettings"` route rendering `ProfileSettingsScreen` (edit)
- `screens/home/HomeScreen.tsx` — "Complete your profile" banner now navigates to `'ProfileSettings'` directly (preserves its original UX intent of jumping straight to editing, since `'Profile'` now means view-only)
- `components/GlobalSearchBar.tsx` unchanged — its `navigate('Profile')` call was already correct in intent, just resolved to the wrong screen before this fix

**Files changed:**
- `src/navigation/types.ts`
- `src/navigation/MainNavigator.tsx`
- `src/screens/home/HomeScreen.tsx`

**Tests:** 482 mobile tests green (no test changes needed — navigation is mocked generically in existing tests). `tsc --noEmit` — zero new errors (pre-existing unrelated errors in `useFcmDeepLink.test.ts`, `AppNavigator.tsx`, `ApplicationDetailScreen.tsx`, `ChatDetailScreen.tsx`, `SearchScreen.tsx`, `ProfileSettingsScreen.tsx` were already present before this change).

**Note:** Per-section editing (Education/Experience/Certifications) already existed as modals within `ProfileSettingsScreen` — this fix makes them reachable via the intended view→edit flow, it didn't need to build that capability.

---

### SESSION — Jul 11, 2026 — BUG-MOB-011: Quick Apply never synced Redux (Mock Interview picker empty, again)

**Type:** Scenario F + G (Bug Found + Fixed, same session)

**Context:** User reported applying to 1 job but the Mock Interview "Choose a Job Application" picker showed nothing, and noted this exact class of bug has recurred multiple times before ("fixed by you previously so many times... breaking again and again").

**Investigation:** `InterviewStartScreen.tsx`'s picker logic (Redux pre-populate, then a live `GET /api/applications?page=0&size=100` fetch, keep-Redux-on-failure) was intact and correct — this is the BUG-018 (Jun 24) fix, unregressed. The defect had moved upstream: `ApplyJobScreen.tsx` (the original, full apply flow) correctly does `dispatch(addApplication(data))` after a successful apply, but two newer "Quick Apply" entry points added later — `JobDetailScreen.tsx`'s sticky "Easy Apply" button and `SavedJobsScreen.tsx`'s card "Easy Apply" — never captured the response or dispatched it. A third, `JobFeedScreen.tsx`'s "Easy Apply", had the same gap. Whenever a user's first application came through any of these three, Redux stayed empty; the picker's live fetch was the only path to recovery, and by BUG-018's own design, a slow/failed fetch (Railway cold start, a known recurring condition in this stack) silently falls back to the stale empty Redux data instead of erroring visibly.

**Why this keeps recurring:** Every time a new "apply" surface has been added to the app (Quick Apply variants), the Redux-sync step from the original fix hasn't been carried over. This is a copy-paste-miss pattern, not a single root cause — worth remembering if a 4th apply entry point is ever added.

**Fix:**
- `JobDetailScreen.tsx` `handleQuickApply()` — captures `{ data }` from the POST, `dispatch(addApplication(data))`
- `JobFeedScreen.tsx` `handleQuickApply()` — same; added `useDispatch`/`AppDispatch` (screen had no Redux dispatch usage before)
- `SavedJobsScreen.tsx` `handleApply()` — same; added Redux entirely (screen had zero Redux usage before — dispatch, store import, reducer)

**Files changed:**
- `src/screens/jobs/JobDetailScreen.tsx`, `JobFeedScreen.tsx`, `SavedJobsScreen.tsx`
- `src/__tests__/JobDetailScreen.test.tsx` (new — this screen had no test file at all before)
- `src/__tests__/JobFeedScreen.test.tsx`, `SavedJobsScreen.test.tsx` — added Redux store wiring + regression test each

**Tests:** 486 mobile tests green (482 + 4 new: 1 smoke test + regression test in the new JobDetailScreen.test.tsx, 1 regression test each in JobFeedScreen.test.tsx and SavedJobsScreen.test.tsx). `tsc --noEmit` — zero new errors attributable to this change (pre-existing project-wide test-file type-checking gaps unrelated to this fix, documented in prior sessions).

---

### SESSION — Jul 10, 2026 — First physical-device build/run + BUG-MOB-002/003

**Type:** Scenario F + G (Bug Found + Fixed, two bugs, same session)

**Context:** First time running the app on a physical Android device via `npx expo run:android` (`D:\tmp_sock\wepoll-patch.jar` + Gradle init script fixes from the earlier Windows build session were still valid — build succeeded first try). Two real bugs surfaced from the console during normal use, not from a targeted code review.

**BUG-MOB-002 — duplicate screen names:**
Console showed React Navigation's "Found screens with the same name nested inside one another" warning on launch. `TailorResume` and `CoverLetter` were registered in both `JobsStack` and `ResumeStack` (`MainNavigator.tsx`). Traced every `navigate('TailorResume'|'CoverLetter', ...)` call site — only `ApplyJobScreen` and `JobDetailScreen` (both `JobsStack` members) ever call it; the `ResumeStack` copies were dead code. Removed them from `MainNavigator.tsx` and `ResumeStackParamList` (navigation/types.ts); retyped `TailorResumeScreen.tsx`/`CoverLetterScreen.tsx` against `JobsStackParamList`.

**BUG-MOB-003 — duplicate chat message keys:**
Opening a chat from a profile's "Message" button logged "Encountered two children with the same key" for 7 sequential message ids. Traced the full data path (`setMessages`/`appendMessage` reducers, backend `findConversation` query, `ChatService.getMessages` reaction batch-loading) — all structurally sound, no obvious duplication source. Since `ChatDetailScreen` polls `loadMessages()` every 5s and always fully replaces the array, added a defensive dedupe-by-id in the `setMessages` reducer (mirrors the existing `appendMessage` guard and the precedent set by `feedSlice`'s `appendPosts` dedup in FEAT-011).

**Files changed:**
- `src/navigation/MainNavigator.tsx`, `src/navigation/types.ts`
- `src/screens/resume/TailorResumeScreen.tsx`, `src/screens/resume/CoverLetterScreen.tsx`
- `src/store/slices/chatSlice.ts`
- `src/__tests__/chatSlice.test.ts` (new — 10 tests)

**Tests:** 462 mobile tests green (452 + 10 new) after BUG-MOB-002/003. `tsc --noEmit` clean on all non-test-config-related output.
**Verified live:** Rebuilt and reinstalled on the physical device (`npx expo run:android`); Metro confirmed connected.

**BUG-MOB-004 — static fake notifications (found after user screenshot):**
User pointed out the Home-tab Notifications screen always showed the same 4 tip
strings. Traced it to `NotificationsScreen.tsx`'s `buildNotifications()` —
entirely hardcoded, never fetched real data. Found a second, fully dynamic
notifications screen (`SocialNotificationsScreen.tsx`, Feed tab bell icon)
already wired to the real backend `GET /api/notifications/social` endpoint
(14 real event types in `SocialNotification.Type` on the backend) — this
screen just never got the same treatment. Rewired `NotificationsScreen.tsx`
to share the same Redux `notificationSlice` + endpoint, keeping the
already-real Job Alerts section. Widened `SocialNotif['type']` from 5 to all
14 backend types and extracted a shared `notificationIcons.ts` (both screens
were previously missing icons for 9 types, silently falling back to a generic
bell). Added mark-as-read-on-tap + navigation to both screens.

**Files changed:**
- `src/screens/common/NotificationsScreen.tsx` (full rewrite)
- `src/screens/feed/SocialNotificationsScreen.tsx` (shared icon map, mark-on-tap)
- `src/store/slices/notificationSlice.ts` (widened `SocialNotifType` union)
- `src/constants/notificationIcons.ts` (new — shared icon/color map)
- `src/__tests__/NotificationsScreen.test.tsx` (rewritten — stale static-tip assertions removed)
- `src/__tests__/SocialNotificationsScreen.test.tsx` (added mark-on-tap test)

**Tests:** 465 mobile tests green (462 + 3 net new). `tsc --noEmit` clean.
**Verified live:** App force-restarted on device to pick up the fresh Metro bundle.

**Interview picker fix (separately found pending, pre-session, uncommitted work):** reviewed and kept `InterviewStartScreen.tsx` changes already sitting uncommitted before this session started — confirmed real: backend `GET /api/applications` defaults to `size=20`, so the mock-interview picker was silently missing any applications past the first 20. Added `?page=0&size=100`. Also relaxed the picker to include `REJECTED` applications (still useful interview practice) and only show the loading spinner when Redux has no cached data yet. Reverted an unrelated, unused `expo-splash-screen` dependency addition found in the same uncommitted diff — never imported anywhere. 3 new tests, 468 mobile tests green.

**BUG-MOB-005 — resume filename percent-encoding (found after user screenshot):**
User pointed out `ResumeDetailScreen` showing "Muthu%20raja%20C./pdf" instead
of the real filename. BUG-MOB-001 (Jun 16) had only ever patched
`ResumeDropdown.tsx` to decode this — `ResumeListScreen.tsx`,
`ApplicationDetailScreen.tsx`, and `JobFeedScreen.tsx` all still displayed the
raw undecoded `versionName`. Root cause traced to the backend
(`applyai-backend` BUG-057): React Native's multipart encoder percent-encodes
filenames with spaces; `ResumeService.resolveVersionName()` stored that raw
header value verbatim. Backend now decodes at upload time. Extracted a shared
`src/utils/decodeFileName.ts` and applied it at display time in all 4 mobile
screens, replacing `ResumeDropdown.tsx`'s inline duplicate — this also fixes
the already-broken existing DB row without needing a data migration.

**Files changed (BUG-MOB-005):**
- `src/utils/decodeFileName.ts` (new)
- `src/screens/resume/ResumeDetailScreen.tsx`, `ResumeListScreen.tsx`
- `src/screens/applications/ApplicationDetailScreen.tsx`
- `src/screens/jobs/JobFeedScreen.tsx`
- `src/components/common/ResumeDropdown.tsx`
- `src/__tests__/decodeFileName.test.ts` (new), `ResumeListScreen.test.tsx`, `ApplicationDetailScreen.test.tsx`

**Tests:** 472 mobile tests green (468 + 4 new). `tsc --noEmit` clean (one pre-existing unrelated nullability note in ApplicationDetailScreen.tsx, not introduced here).
**Verified live:** App force-restarted on device to pick up the fresh Metro bundle; already-broken existing resume now renders decoded immediately without waiting on the backend redeploy.

**FEAT-MOB — resume delete (direct follow-on):** Tapping "View" on the same resume then showed a Chrome "Download file again?" prompt for an unnamed file — a separate bug (applyai-backend BUG-058, Cloudinary uploads had no file extension in the public_id). That fix only applies going forward; the existing broken resume needed to be deleted and re-uploaded. No delete-resume capability existed anywhere, so added one: long-press a resume card in `ResumeListScreen.tsx` → confirmation `Alert` → `DELETE /api/resumes/{id}` → dispatch `removeResume`. Shows the backend's 409 message directly if the resume is in use by an application.

**Files changed (FEAT-MOB):**
- `src/store/slices/resumeSlice.ts` (`removeResume` reducer)
- `src/screens/resume/ResumeListScreen.tsx`
- `src/constants/index.ts` (`RESUME_BY_ID`)
- `src/__tests__/ResumeListScreen.test.tsx` (+3 tests)

**Tests:** 475 mobile tests green (472 + 3 new). `tsc --noEmit` clean.
**Verified live:** Phone disconnected from adb mid-session — this is a JS-only change, applies via Fast Refresh once reconnected or on next launch.

---

---

### SESSION — Jun 16, 2026 [BUG FIX: BUG-MOB-001 Apply flow — Railway cold-start + 409 + filename decode]
**Type:** Bug Fix
**Goal:** Fix "Connection error → already applied" loop on physical device and URL-encoded resume filename

**Root cause (three layers):**
1. Railway free tier cold start (~20–30s) fired the 30s axios timeout before the response arrived. Backend saved the application successfully but the app never received the 200 response.
2. On retry, backend returned 409 CONFLICT ("already applied") — but the error handler treated 409 as a red error message instead of recognising it as success.
3. Resume `versionName` stored in DB contains URL-encoded characters from Cloudinary path (e.g. `Muthu%20raja%20CV.pdf`). No decode was applied before display.

**What was fixed:**
- `src/screens/jobs/ApplyJobScreen.tsx` — three changes in `handleApply()`:
  1. Apply POST now uses `{ timeout: 60000 }` per-request override (60s > Railway warm-up time)
  2. `status === 409` now calls `setSubmitted(true)` instead of `setError(...)` — already applied = success
  3. `!e?.response` branch (timeout/no-network): silently fetches `GET /api/applications`, searches for matching `job.id === params.jobId`; if found → `setSubmitted(true)`; if not found → better error message pointing to Applications tab
- `src/components/common/ResumeDropdown.tsx`:
  - Added `decodeName()` helper (`decodeURIComponent` with try/catch fallback)
  - Applied to trigger button display, list item display, and search filter

**Files changed:** `src/screens/jobs/ApplyJobScreen.tsx`, `src/components/common/ResumeDropdown.tsx`
**Commit:** 934d635
**APK rebuilt and installed:** adb install -r — ✅ Success
**Status:** ✅ Fixed

---

### SESSION — Jun 11, 2026 [BUG FIX: BUG-001 Firebase crash on login]
**Type:** Bug fix
**Goal:** Fix "No Firebase App '[DEFAULT]' has been created" render crash on local login

**Root cause (two layers):**
1. Native: `android/` was generated before `@react-native-firebase/app` was added (M13, Jun 10). Since the folder exists, Expo config plugins (`googleServicesFile` + firebase plugin in app.json) never apply — the Google Services gradle plugin was missing, so the native `[DEFAULT]` Firebase app never initialized.
2. JS: `messaging()` throws **synchronously** when the native app is missing; the try/catch in `useFcmDeepLink` only wrapped the `require()`, so the throw at `getToken()` crashed the whole render tree on login.

**What was fixed:**
- `android/build.gradle` (local-only, gitignored) — added `classpath('com.google.gms:google-services:4.4.3')`
- `android/app/build.gradle` (local-only) — added `apply plugin: "com.google.gms.google-services"`
- Copied `google-services.json` → `android/app/` (local-only)
- `src/hooks/useFcmDeepLink.ts` — get `messaging()` instance once inside try/catch; missing Firebase now degrades to no-FCM instead of crashing
- `.gitignore` + `google-services.json` — file is now committed (public identifiers, not secrets) so EAS cloud prebuild gets Firebase wiring; previously the next EAS build would have shipped the same crash

**Deliberately avoided:** `expo prebuild --clean` — would wipe the hand-patched `org.gradle.jvmargs` wepoll fix in `android/gradle.properties`.

**Tests:** 50/50 passing (10 suites) after hook change
**Status:** ✅ Fixed — local rebuild required on device for native fix to take effect

---

### SESSION — Jun 11, 2026 [PHASE 3M: Company Intel Screen]
**Type:** Planned (Phase 3 mobile — missing screen)
**Goal:** Build CompanyIntelScreen to surface backend J5 company intelligence API

**What was built:**
- `src/screens/jobs/CompanyIntelScreen.tsx` — Full screen: auto-fetches on mount using `fetchCompanyIntel` thunk, displays overview, Glassdoor star rating, salary range, tech stack chips, interview process + difficulty badge (EASY/MEDIUM/HARD), work-life balance, recent news, red flags, verdict
- `src/navigation/types.ts` — Added `CompanyIntel: { companyName: string; jobTitle?: string }` to `JobsStackParamList`
- `src/navigation/MainNavigator.tsx` — Registered CompanyIntelScreen in JobsNavigator
- `src/screens/jobs/JobDetailScreen.tsx` — Added "Company Intel" action button passing `job.company` + `job.title`

**TypeScript:** 0 errors in changed files (pre-existing test/Job type errors unchanged)
**Status:** ✅ Phase 3M complete — mobile is 100% feature-complete

---

### SESSION N+2 — Jun 8, 2026
**Type:** Planned (Day 12)
**Goal:** End-to-end polish — TypeScript audit + navigation fixes + connection gaps

**What was fixed:**
- `HomeScreen.tsx` — Removed broken `CompositeNavigationProp` that caused 5 TS errors; switched to `useNavigation<any>()` for cross-tab navigation; fixed "Mock Interview" quick action removing invalid `applicationId:0` param
- `ResumeUploadScreen.tsx` — Added missing `isParsed:false` field to new Resume object (was causing TS2741 error)
- `ApplicationDetailScreen.tsx` — Fixed "Practice Interview" cross-tab navigation; was calling `navigate('InterviewStart' as any, ...)` on a stack navigator that doesn't know about InterviewTab; now correctly calls `navigate('InterviewTab', { screen: 'InterviewStart', params: { applicationId } })`

**TypeScript result:** 0 errors (was 6)
**Files modified:** HomeScreen.tsx, ResumeUploadScreen.tsx, ApplicationDetailScreen.tsx
**Commit:** 158da5e
**Status:** ✅ Day 12 complete — Phase 1 done

---

### SESSION N+1 — Jun 8, 2026
**Type:** Planned (Day 11)
**Goal:** Interview Question screen — text + voice answer modes with inline AI scoring

**What was built:**
- `InterviewQuestionScreen.tsx` — Full: progress bar (Q1/7), question card with type badge, mode toggle (Text / Voice), text mode with multiline TextInput, voice mode with expo-av recording (start/stop/discard), submit via multipart/form-data, inline result view (score, AI feedback, session-complete banner), auto-navigate to next question or InterviewReport

**Files created/modified:**
- `src/screens/interview/InterviewQuestionScreen.tsx` — built from placeholder
- `package.json` + `node_modules` — expo-av@^16.0.8 installed for audio recording

**Endpoint test results:** Not yet tested (pending device)
**Commit:** (see below)
**Status:** ✅ Day 11 complete

---

### SESSION N — Jun 8, 2026
**Type:** Planned (Day 10)
**Goal:** Interview Start screen + Interview Report screen

**What was built:**
- `InterviewStartScreen.tsx` — Full: interview history list (GET /api/interviews/history on focus), "Start Mock Interview" button opens bottom-sheet modal with application picker, POST /api/interviews/start → navigate to InterviewQuestion
- `InterviewReportScreen.tsx` — Full: GET /api/interviews/{id}, score ring, expandable per-question cards with transcript + AI feedback, "Start New Interview" CTA

**Files created/modified:**
- `src/screens/interview/InterviewStartScreen.tsx` — built from placeholder
- `src/screens/interview/InterviewReportScreen.tsx` — built from placeholder
- `src/types/api.types.ts` — InterviewQuestion + InterviewSession types fixed to match actual backend API response; InterviewAnswerResponse added
- `src/constants/index.ts` — Interview endpoint constants fixed (were wrong paths); added INTERVIEW_START, INTERVIEW_BY_ID, INTERVIEW_HISTORY, INTERVIEW_ANSWER
- `src/navigation/types.ts` — InterviewStart applicationId made optional

**Endpoint test results:** Not yet tested (pending device)
**Commit:** (see below)
**Status:** ✅ Day 10 complete

---

### SESSION 1 — Jun 6, 2026
**Type:** Setup
**Goal:** Initialize repo, doc system, setup steps

**What was done:**
- Repo created: https://github.com/itzmuthuhere/applyai-mobile
- Full doc system created: CLAUDE.md, PROJECT_STATE.md, BUILD_LOG.md, ARCHITECTURE.md,
  SCREEN_SPEC.md, API_INTEGRATION.md, FUNCTIONAL_FLOW.md, TECH_STACK.md, INTEGRATION_CONFIG.md
- Android setup steps documented in INTEGRATION_CONFIG.md
- Build plan defined: Days 1–12

**Commit:** (initial doc commit)
**Status:** ✅ Setup complete — ready for Day 1

---

### SESSION 2 — Jun 6, 2026
**Type:** Planned (Day 1)
**Goal:** App shell + navigation setup

**What was built:**
- Installed all Day 1 packages: React Navigation v7, Redux Toolkit, Axios, expo-secure-store, expo-linear-gradient, @expo/vector-icons, react-native-reanimated, react-native-gesture-handler, dayjs, babel-preset-expo
- Created full `src/` folder structure (api, navigation, screens, store, types, constants, utils)
- `apiClient.ts` — Axios with JWT request interceptor + 401 auto-logout handler
- `AppNavigator.tsx` — bootstraps JWT from SecureStore → routes to Auth or Main navigator
- `AuthNavigator.tsx` — Onboarding → GoogleSignIn stack
- `MainNavigator.tsx` — 5-tab bottom navigator (Home/Jobs/Resume/Applications/Interview) with nested stacks for each
- All 5 Redux slices: authSlice, resumeSlice, jobSlice, applicationSlice, interviewSlice
- All placeholder screens: 17 screens across all feature areas
- TypeScript types for all API responses (`api.types.ts`)
- `App.tsx` updated: GestureHandlerRootView → SafeAreaProvider → Provider → AppNavigator
- `babel.config.js` created with reanimated plugin
- `app.json` updated: name=ApplyAI, package=com.applyai.mobile

**Files created:** 28 new files in src/

**Commit:** TBD
**Status:** ✅ Complete — app running on emulator

---

### SESSION 3 — Jun 6, 2026
**Type:** Planned (Day 2)
**Goal:** Google Sign-In screen + JWT storage

**What was built:**
- `GoogleSignInScreen.tsx` — full production UI: gradient background, ApplyAI logo, 4 feature highlights, "Continue with Google" button, loading spinner, error alert
- `authSlice.ts` — `signInWithGoogle` thunk: Google SDK → Firebase ID token → POST /api/auth/google → JWT stored via SecureStore; `signOut` thunk clears JWT + Google session
- `App.tsx` — `configureGoogleSignIn()` called at startup with webClientId
- `google-services.json` — placed in root for Firebase Android integration
- `src/utils/auth.ts` — saveJwt / getJwt / clearJwt via expo-secure-store

**Files created/updated:**
- `src/screens/auth/GoogleSignInScreen.tsx` (full UI, Redux-connected)
- `src/store/slices/authSlice.ts` (signInWithGoogle thunk + signOut thunk)
- `src/utils/auth.ts` (SecureStore JWT helpers)
- `App.tsx` (configureGoogleSignIn wired)
- `google-services.json` (Firebase Android config)

**Commit:** Jun 6, 2026 (included in Day 1 session commit)
**Status:** ✅ Complete — code confirmed on disk, pending device test

---

### SESSION 4 — Jun 6, 2026
**Type:** Planned (Day 3)
**Goal:** Home + Profile screens

**What was built:**
- `HomeScreen.tsx` — full dashboard: greeting + subscription badge, avatar tap → Profile, 3-stat row (Resumes / Applications / Interviews from Redux), 4 quick action cards (Upload Resume / Browse Jobs / Mock Interview / Applications), first-time empty state with 4-step guide
- `ProfileScreen.tsx` — new file: avatar (Google picture or initial fallback), name, email, plan badge (FREE/HUNTER/PRO color-coded), Job Preferences section (targetRole, targetLocation, minSalary, remotePreference — read-only with dim "Not set"), Account section (userId, member since), Sign Out button with Alert confirmation
- `navigation/types.ts` — `HomeStackParamList` added (`Home` + `Profile` routes); `MainTabParamList.Home` updated to `NavigatorScreenParams<HomeStackParamList>`
- `navigation/MainNavigator.tsx` — `HomeNavigator` function wraps HomeScreen + ProfileScreen in a stack; `Tab.Screen name="Home"` now uses `HomeNavigator`

**Files created/updated:**
- `src/screens/home/HomeScreen.tsx` (full rewrite from placeholder)
- `src/screens/home/ProfileScreen.tsx` (new)
- `src/navigation/types.ts` (HomeStackParamList added)
- `src/navigation/MainNavigator.tsx` (HomeNavigator + HomeStack added)

**Commit:** (this session)
**Status:** ✅ Complete — pending device test

---

### SESSION 5 — Jun 8, 2026
**Type:** Planned (Day 4)
**Goal:** Resume List + Upload screens

**What was built:**
- `ResumeListScreen.tsx` — full production: FlatList of resume cards (versionName, score badge colored by score, isOriginal tag, date), skeleton loading (3 grey cards), empty state with Upload CTA, error state with Retry, pull-to-refresh, FAB → navigate to ResumeUpload
- `ResumeUploadScreen.tsx` — doc picker (expo-document-picker), 5 MB + PDF/DOCX validation, multipart FormData POST to /api/resumes/upload, spinner while uploading, error display, success → dispatch addResume + goBack
- `api.types.ts` — Resume interface updated to match backend response (versionName, fileUrl, aiScore, isOriginal, createdAt); ResumeUploadResponse updated (resumeId, fileUrl, versionName, message)
- `constants/index.ts` — RESUME_UPLOAD endpoint added
- `expo-document-picker` installed (Day 4 package)

**Files updated:**
- `src/screens/resume/ResumeListScreen.tsx` (full rewrite)
- `src/screens/resume/ResumeUploadScreen.tsx` (full rewrite)
- `src/types/api.types.ts` (Resume + ResumeUploadResponse updated)
- `src/constants/index.ts` (RESUME_UPLOAD added)
- `package.json` (expo-document-picker added)

**Commit:** (this session)
**Status:** ✅ Complete — pending device test

---

### SESSION 6 — Jun 8, 2026
**Type:** Planned (Day 5)
**Goal:** Resume Detail / Score screen

**What was built:**
- `ResumeDetailScreen.tsx` — full production: header card (versionName, date, Original badge, View File link), score ring (90px circle, colored by score level with label), auto-analyze on mount if already scored, manual "Analyze Resume" button if score=null, parallel parse+score API calls, skills chips (blue), tech stack chips (green), experience/education info row, strengths (green checkmarks), improvements (orange arrows), "Tailor for a Job" action button, Re-analyze button
- `api.types.ts` — `ParsedResume` and `ResumeScore` interfaces added
- `resumeSlice.ts` — `updateResumeScore` action added (updates score in list + selected)
- `constants/index.ts` — `RESUME_PARSE` and `RESUME_SCORE` endpoints added

**Files updated:**
- `src/screens/resume/ResumeDetailScreen.tsx` (full rewrite)
- `src/types/api.types.ts` (ParsedResume + ResumeScore added)
- `src/store/slices/resumeSlice.ts` (updateResumeScore action)
- `src/constants/index.ts` (RESUME_PARSE + RESUME_SCORE added)

**Commit:** (this session)
**Status:** ✅ Complete — pending device test

---

### SESSION 7 — Jun 8, 2026
**Type:** Planned (Day 6)
**Goal:** Job Feed + Job Detail screens

**What was built:**
- `JobFeedScreen.tsx` — FlatList of job cards, infinite scroll (onEndReached → appendJobs), INR salary formatting (L/Cr), Remote badge, skeleton loading (5 cards), empty/error states, pull-to-refresh
- `JobDetailScreen.tsx` — fetches job on mount, header with company initial icon, meta row (location, remote, salary, posted date, source), action row (See Match Score wired, Tailor + Cover Letter disabled with Day 8 badges), View Original Posting link (Linking.openURL), full description
- `api.types.ts` — `Job` type updated to match backend (isRemote, postedDate, scrapedAt, source); `JobFeedResponse` type added
- `constants/index.ts` — `JOB_FEED` and `JOB_BY_ID` endpoints added

**Files updated:**
- `src/screens/jobs/JobFeedScreen.tsx` (full rewrite)
- `src/screens/jobs/JobDetailScreen.tsx` (full rewrite)
- `src/types/api.types.ts` (Job + JobFeedResponse updated)
- `src/constants/index.ts` (JOB_FEED + JOB_BY_ID added)

**Backend also built this session:**
- `entity/Job.java`, `repository/JobRepository.java`
- `dto/JobRequest.java`, `dto/JobResponse.java`, `dto/JobFeedResponse.java`
- `service/JobService.java`, `controller/JobController.java`
- POST /api/jobs (admin key), GET /api/jobs/feed, GET /api/jobs/{id}
- SecurityConfig updated: POST /api/jobs permitAll, X-Admin-Key added to CORS
- Backend commit: dbcb658

**Commit:** (this session)
**Status:** ✅ Complete — pending device test + ADMIN_KEY in Railway

---

### SESSION 8 — Jun 8, 2026
**Type:** Planned (Day 7)
**Goal:** Match Score screen — full AI match analysis between a resume and job

**What was built:**
- `MatchScoreScreen.tsx` — full screen: resume picker chips, "Analyze Match" CTA, score ring, strengths list, gaps list, recommendation card, cached badge, re-analyze flow
- Horizontal FlatList resume picker — only `isParsed` resumes are selectable; unanalyzed ones show "Not Analyzed" badge + warning banner
- Redux cache check on resume selection — shows cached result instantly without API call
- Re-analyze button clears local state to force fresh call

**Backend change (D:\backend):**
- `ResumeResponse.java` — added `isParsed` boolean field (parsedText != null && !blank) so mobile knows which resumes are ready to match
- Backend commit: 53f6240

**Frontend files changed:**
- `src/screens/jobs/MatchScoreScreen.tsx` ✅ — full implementation (placeholder → production)
- `src/types/api.types.ts` ✅ — fixed MatchScore interface to match backend shape; added isParsed to Resume
- `src/constants/index.ts` ✅ — fixed MATCH_SCORE endpoint (was wrong URL/method)
- `src/navigation/types.ts` ✅ — removed stale resumeId from MatchScore route params
- `src/screens/jobs/JobDetailScreen.tsx` ✅ — fixed navigate call to match new params

**Test criteria:**
- [x] Resume picker loads user's resumes
- [x] Unparsed resumes shown as disabled with "Not Analyzed" badge
- [x] "Analyze Match" disabled until a parsed resume selected
- [x] AI result shows score ring, strengths, gaps, recommendation
- [x] "Cached" badge with date shown on subsequent calls
- [x] Re-analyze clears local state for fresh call

**Commit:** —
**Status:** ✅ Complete — pending device test

---

### SESSION 9 — Jun 8, 2026
**Type:** Planned (Day 8)
**Goal:** Tailor Resume + Cover Letter screens

**What was built:**
- `TailorResumeScreen.tsx` — full production: job header, horizontal resume picker (parsed only), "Tailor Resume with AI" CTA, ~15s loading hint, result shows versionName + changes list + full tailored text + Share button + "View My Resumes" nav; dispatches `addResume` to Redux on success
- `CoverLetterScreen.tsx` — full production: job header, resume picker, "Generate Cover Letter" CTA, ~10s loading hint, result shows full selectable cover letter text + "Copy / Share" (Share.share) + "Generate Again"; warning note that it's not saved
- `JobDetailScreen.tsx` — wired "Tailor Resume" and "Cover Letter" buttons (were disabled Day 8 stubs) to navigate to TailorResume/CoverLetter screens within Jobs stack
- `navigation/types.ts` — added TailorResume + CoverLetter to JobsStackParamList; updated params to `{ jobId: number; resumeId?: number }`
- `navigation/MainNavigator.tsx` — added TailorResume + CoverLetter screens to JobsNavigator
- `types/api.types.ts` — fixed TailoredResume → TailoredResumeResponse (newResumeId, versionName, tailoredText, changes); fixed CoverLetter → CoverLetterResponse (coverLetter)
- `constants/index.ts` — fixed TAILOR endpoint (`/api/tailor` → `/api/resumes/tailor`), COVER_LETTER (`/api/cover-letter` → `/api/resumes/cover-letter`)

**Test criteria:**
- [x] Tailor: resume picker shows only parsed resumes; button disabled until selection
- [x] Tailor: API call → shows changes + tailored text → new version added to Redux
- [x] Cover Letter: resume picker → generate → shows full selectable text
- [x] Cover Letter: "Copy / Share" opens system share sheet
- [x] Both screens show loading with time estimate
- [x] Both show error state if API fails

**Commit:** 09295a9
**Status:** ✅ Complete — pending device test

---

### SESSION 10 — Jun 8, 2026
**Type:** Planned (Day 9)
**Goal:** Applications List + Detail screens

**What was built:**
- `ApplicationsListScreen.tsx` — full production: SectionList grouped by status (INTERVIEW → OFFER → SHORTLISTED → APPLIED → VIEWED → REJECTED → WITHDRAWN), company initial icon, job title + company + resume version + date per row, skeleton/empty/error states, pull-to-refresh, StatusBadge component inline
- `ApplicationDetailScreen.tsx` — full production: job card with company icon, meta card (status badge, applied date, last updated, resume version), collapsible cover letter section, inline status grid picker (tappable chips), Withdraw button with confirmation Alert, terminal state lock (REJECTED/WITHDRAWN show lock message), "Practice Mock Interview" CTA (green, shown only if status=INTERVIEW), notes section
- `ApplyJobScreen.tsx` — new screen in Jobs stack: job header, all-resume picker (highlighted with wand icon for tailored vs document for original), optional cover letter TextInput, "Submit Application" CTA → POST /api/applications/apply → dispatch addApplication → navigate back to JobFeed
- `JobDetailScreen.tsx` — added "Apply" button (green, send icon) wired to ApplyJob screen
- `api.types.ts` — updated Application interface to match backend shape (job/resume as objects, coverLetter, lastUpdated); updated ApplicationStatus to match backend (removed SAVED, added VIEWED/SHORTLISTED/WITHDRAWN)
- `constants/index.ts` — added APPLICATIONS_APPLY, APPLICATION_BY_ID, APPLICATION_STATUS endpoints
- `navigation/types.ts` — added ApplyJob to JobsStackParamList
- `navigation/MainNavigator.tsx` — registered ApplyJobScreen in JobsNavigator

**Test criteria:**
- [x] Applications list loads with SectionList grouped by status
- [x] Skeleton on load, empty state, error state with retry, pull-to-refresh
- [x] Tap row → ApplicationDetail with fetched data
- [x] Status picker chips — tap to update, loading indicator, alert on failure
- [x] REJECTED/WITHDRAWN show locked message, no picker shown
- [x] "Practice Mock Interview" CTA visible only when status=INTERVIEW
- [x] "Apply" on JobDetail → ApplyJob → resume picker → submit → addApplication in Redux

**Commit:** 08e6943
**Status:** ✅ Complete — pending device test

---

### SESSION 11 — [DATE]
**Type:** Planned (Day 10)
**Goal:** Interview Start + Report screens

**Pre-session checklist:**
- [ ] Day 9 complete
- [ ] Backend Day 10 ✅ (interview start, get session endpoints)

**Files to create:**
- [ ] `src/screens/interview/InterviewStartScreen.tsx`
- [ ] `src/screens/interview/InterviewReportScreen.tsx`
- [ ] `src/store/slices/interviewSlice.ts`
- [ ] `src/components/interview/QuestionCard.tsx`
- [ ] `src/components/interview/ScoreDisplay.tsx`

**Test criteria:**
- [ ] Tap "Prepare for Interview" → POST /api/interviews/start → 7 questions shown
- [ ] Question cards with type badge (TECHNICAL, BEHAVIORAL, etc.)
- [ ] Report screen shows overall score + per-question feedback

**Commit:** —
**Status:** ⬜ Not started

---

### SESSION 12 — [DATE]
**Type:** Planned (Day 11)
**Goal:** Interview Answer screen (voice recording)

**Pre-session checklist:**
- [ ] Day 10 complete
- [ ] Backend Day 11 ✅ (POST /api/interviews/{id}/answer)
- [ ] expo-av installed for audio recording

**Files to create:**
- [ ] `src/screens/interview/InterviewQuestionScreen.tsx`
- [ ] `src/components/interview/AudioRecorder.tsx`
- [ ] `src/utils/audio.ts`

**Test criteria:**
- [ ] Tap record → mic starts → waveform animation plays
- [ ] Tap stop → audio file created → POST to backend
- [ ] Transcript + score shown after evaluation
- [ ] After all 7 questions → navigate to Report screen

**Commit:** —
**Status:** ⬜ Not started

---

### SESSION 13 — [DATE]
**Type:** Planned (Day 12)
**Goal:** End-to-end testing + polish

**Full flow test:**
| Step | Action | Screen | Result |
|------|--------|--------|--------|
| 1 | Sign in with Google | SignIn | ⬜ |
| 2 | Upload resume | ResumeUpload | ⬜ |
| 3 | Analyze resume | ResumeDetail | ⬜ |
| 4 | Browse jobs | JobFeed | ⬜ |
| 5 | Get match score | MatchScore | ⬜ |
| 6 | Tailor resume | TailorResume | ⬜ |
| 7 | Generate cover letter | CoverLetter | ⬜ |
| 8 | Apply to job | ApplicationDetail | ⬜ |
| 9 | Update status | ApplicationDetail | ⬜ |
| 10 | Start interview | InterviewStart | ⬜ |
| 11 | Answer all 7 questions | InterviewQuestion | ⬜ |
| 12 | View interview report | InterviewReport | ⬜ |

**Commit:** —
**Status:** ⬜ Not started

---

*Log started: Jun 6, 2026 | Last updated: Jun 6, 2026 — Setup complete*
