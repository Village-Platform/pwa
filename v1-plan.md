# V1 plan

Tracks what is left before the PWA's first release. Findings come from the V1 review of the business rules,
the Android app (from the docs; its code is not in this workspace), the API reference and the code.

Run `npm run check` before every commit.

## Must fix for V1

- [x] Firm form: show server validation errors on every field, and check coordinate ranges (lat ±90, lng ±180)
- [x] API client: time out stalled requests instead of loading forever
- [x] API client: if the guest token can't be fetched (for example rate limited), still send the request without it
- [x] API client: a late 401 must not sign out a user who has since signed in again
- [x] API client: treat a 200 reply that is not JSON (captive portal) as an error, and never show technical error text
- [x] Infinite lists: keep loading when the end of the list is already on screen
- [x] Accept Arabic-Indic digits (٠١٢…) in phone numbers and coordinates
- [x] Account: show a retry instead of "0 firms" and a subscribe prompt when loading fails; count firms with `meta.total`
- [x] Firm pages: show the rejection reason to the owner
- [x] Notifications: a notification with an unknown screen opens the inbox; use the server's unread count; report failed mark-as-read
- [x] News and Home: reviewers should not see drafts or pending articles in the public feeds
- [x] Explore: keep the search in the URL, and only scroll to the top on forward navigation
- [x] CI: run lint, typecheck and tests on pull requests too

## After the list above

- [x] Firebase: initialized from `VITE_FIREBASE_*` variables (off without them)
- [x] Analytics: screen views and key actions; errors and crashes sent as `exception` events
- [x] FCM web push: permission, token, device registration, service worker, detach on logout
- [ ] Turn push on: add the Firebase web app and variables, then the backend accepts `platform: web` and sends `web_push: true`

## Blocked on the backend or a decision

- Web push: the server accepts only `platform: android`; it needs `web`, a `webpush` block in FCM messages, and the `web_push` flag
- A logout endpoint that revokes the token (logout only deletes the local copy)
- Deploy the `PATCH /me` fix; confirm CORS allows `X-Installation-Id`; confirm the topic JSON fields
- Payment receipt upload (the receipts branch is on hold)

## Later (not needed for V1)

- Content-Security-Policy meta tag; safe `localStorage` access when storage is blocked
- Re-approving a rejected firm; article scheduling; quota counters; scheduled/expired plans on the account card
- Map `phone_taken`, `invalid_password`, `already_reviewed` to fields or a refresh
- Keyboard and focus polish (Home search, input focus ring, safer default focus in danger dialogs)
- Tests for session sync, Pay/Plans/Payments, Firm permissions, ArticleForm, Notifications, Explore
