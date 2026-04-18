# Research Notes — Kablux Drive Bug Fix & Feature Implementation

## Codebase Overview

- **Framework:** React Native 0.81.5 + Expo 54
- **State Management:** React Context (AuthContext, DriverRideContext, WebSocketProvider) + TanStack React Query v5
- **Navigation:** React Navigation 7.x (Stack → Drawer → Bottom Tabs)
- **HTTP Client:** Axios with request/response interceptors and JWT auth
- **WebSocket:** Native WebSocket API in `context/WebSocketProvider.tsx`
- **Push Notifications:** Expo Notifications (`hooks/usePushNotifications.tsx`)
- **Styling:** React Native StyleSheet, responsive scaling via `width/375`
- **Components:** Functional only, hooks-based

---

## ISSUE 1: Driver should manually be able to input fare amount

### Current State
- Fare is set during ride offer negotiation (`offer_amount` field from WebSocket)
- `ActiveRideSection.js` displays fare read-only (lines 120-125)
- `CounterOfferItem.js` allows fare adjustment during pre-ride negotiation only
- `PriceDetails.js` is a mockup with hardcoded prices, not integrated
- **No API endpoint exists for updating fare during active ride**

### Key Files
- `screens/components/ActiveRideSection.js` — Active ride UI (add fare input here)
- `services/rides.service.ts` — Ride API hooks (add fare update mutation)
- `screens/dashboard/Home.js` — Ride management handlers
- `context/WebSocketProvider.tsx` — WebSocket fare event handling

### Implementation Plan
- Add a TextInput for manual fare on ActiveRideSection (ride_started status)
- Add `useUpdateFare` mutation in rides.service.ts → `PATCH rides/{rideId}/update_fare/`
- Add confirmation modal before applying manual fare
- Validate: positive number, max 2 decimal places, reasonable range

---

## ISSUE 2: Timer for late arrival for driver/rider

### Current State
- Ride statuses: `not_busy` → `ride_created` → `arrived` → `ride_started`
- ETA calculated via Google Maps Directions API on DriverMapScreen (read-only display)
- Arrival is manual button tap with optional server-side distance validation
- **No timer/countdown exists for ride time limits**
- Timer pattern exists in OTP.js (30-second countdown with setInterval)

### Key Files
- `context/DriverRideContext.tsx` — Ride state machine
- `screens/components/ActiveRideSection.js` — Active ride UI (add timer)
- `screens/dashboard/DriverMapScreen.js` — Map with ETA display
- `services/rides.service.ts` — Ride API hooks

### Implementation Plan
- Add timer state to DriverRideContext (startTime, expectedArrivalMinutes)
- Show countdown on ActiveRideSection during `ride_created` phase
- Default ETA threshold: configurable, default 15 minutes
- Visual indicator when late (red text, warning icon)
- Handle edge cases: app background (timer continues via timestamps, not intervals)

---

## ISSUE 3: WebSocket gets deactivated after driver leaves the app

### Current State
- WebSocket in `context/WebSocketProvider.tsx` (584 lines)
- Has exponential backoff reconnection (max 30s)
- **NO AppState listener exists** — app doesn't detect foreground/background transitions
- `shouldReconnect` + `isOnlineRef` control reconnection intent
- Location tracking continues via expo-location but socket may die in background
- No heartbeat validation beyond location updates every 15s

### Root Cause
- When app goes to background, OS may close WebSocket after ~30s of inactivity
- No `AppState.addEventListener('change', ...)` to detect foreground return
- `onclose` handler does attempt reconnect IF shouldReconnect is true
- But without AppState detection, there's no proactive reconnection trigger

### Key Files
- `context/WebSocketProvider.tsx` — All WebSocket logic lives here

### Implementation Plan
- Import `AppState` from react-native
- Add `AppState.addEventListener('change', handleAppStateChange)`
- On foreground return: check socket readyState, reconnect if needed
- Re-authenticate with fresh token on reconnect
- Clear and restart location ping interval

---

## ISSUE 4: Decline button goes missing after the second counter

### Current State
- `RideOfferCard.js` uses LOCAL state `[visible, setVisible]` to track visibility
- Decline animates opacity → 0, then `setVisible(false)` → returns null
- Parent `Home.js` calls `clearNotification()` to remove from rideNotifications array
- Cards rendered via `.map()` with `key={item.ride_request_id}`

### Root Cause
- RideOfferCard has local `visible` state independent of parent's `rideNotifications`
- When a card is declined, animation callback sets `visible=false`
- If a new notification arrives and React reuses the component instance (same position),
  the stale `visible=false` persists even with new `item` prop
- The local visibility state should be derived from parent, not managed locally

### Key Files
- `screens/components/RideOfferCard.js` — Decline button + visibility logic
- `screens/dashboard/Home.js` — Ride notification list management

### Implementation Plan
- Remove local `visible` state from RideOfferCard
- Let parent `Home.js` handle removal via `clearNotification()`
- Keep the fade-out animation but call `onDecline` immediately (don't wait for animation)
- Animation runs on unmount or via parent-controlled state

---

## ISSUE 5: Card payment method on Driver side contains invalid data

### Current State
- `SetPaymentInfo.js` has full card entry form with Luhn validation
- Card data (cardNumber, expiryDate, cvv, cardName) is collected but **NEVER SUBMITTED**
- `nextScreen()` only validates then navigates to PasskeySetup
- No API endpoint called to save payment info
- `funding.service.ts` has wallet operations but no card storage endpoint

### Root Cause
- The SetPaymentInfo screen is incomplete — validation works but data is discarded
- No backend API call to persist the card data
- The screen is part of KYC onboarding but doesn't actually save anything

### Key Files
- `screens/kyc/SetPaymentInfo.js` — Card entry form (no submission)
- `services/funding.service.ts` — Payment/wallet API hooks

### Implementation Plan
- Add API call to submit card data on form validation success
- Add `useSubmitPaymentInfo` mutation → POST to appropriate endpoint
- Pass card data to the API before navigating to next screen
- Add loading state during submission
- Document backend requirement if endpoint doesn't exist

---

## ISSUE 6: Drivers should view ride requests from push notifications

### Current State
- `usePushNotifications.tsx` sets up FCM/APNs token but notification tap handler only logs
- `addNotificationResponseReceivedListener` just does `console.log`
- No deep linking configured for ride request notifications
- Login flow sends `fcm_token` but doesn't check for pending requests after auth
- WebSocket is the primary ride notification channel
- DriverRideContext loads current ride on mount but NOT pending requests

### Key Files
- `hooks/usePushNotifications.tsx` — Push notification setup + click handler
- `context/WebSocketProvider.tsx` — Ride notification state
- `screens/dashboard/Home.js` — Ride request display
- `services/auth.service.ts` — Login flow
- `context/DriverRideContext.tsx` — Ride state loading

### Implementation Plan
- Enhance notification tap handler to parse ride request data and navigate to Home
- Add pending ride request fetch on login completion
- Handle cold start: check notification that launched the app
- Use `navigationRef` for navigation from notification handler (outside React tree)
- Add API call to fetch pending ride requests: `GET rides/pending_requests/`

---

## ISSUE 7: Go straight to Home after sign up

### Current State
- SignUp → registers → navigates to OTP
- OTP → verifies → navigates to **Login** (line 160: `navigation.navigate('Login')`)
- Login → authenticates → navigates to **Mainapp** (Home)
- So user must: Sign Up → OTP → Login (manual re-entry) → Home

### Root Cause
- OTP success handler navigates to Login instead of auto-logging in
- The registration API returns user data but NOT auth tokens
- User has to manually log in again after verifying OTP

### Key Files
- `screens/auth/OTP.js` — OTP verification (line 160: navigates to Login)
- `screens/auth/SignUp.js` — Registration
- `services/auth.service.ts` — Register + Login endpoints
- `screens/navigation/AppNavigator.js` — Navigation stack

### Implementation Plan
- After OTP verification, auto-login the user with stored credentials
- Store email + password temporarily in memory/state during signup flow
- On OTP success: call login endpoint → set tokens → navigate to Mainapp
- Alternative: If backend returns tokens on OTP verification, use those directly
- Use `navigation.reset()` pattern (same as login) to prevent back navigation

---

## Shared Dependencies / Conflict Risks

| Component | Issues Touching It |
|-----------|-------------------|
| `WebSocketProvider.tsx` | 3, 6 |
| `Home.js` | 1, 2, 4, 6 |
| `ActiveRideSection.js` | 1, 2 |
| `DriverRideContext.tsx` | 2 |
| `rides.service.ts` | 1 |
| `usePushNotifications.tsx` | 6 |
| `OTP.js` | 7 |
| `auth.service.ts` | 7 |
| `RideOfferCard.js` | 4 |
| `SetPaymentInfo.js` | 5 |

**Implementation order to minimize conflicts:**
1. Issue 3 (WebSocket) — foundational
2. Issue 4 (Decline button) — isolated UI fix
3. Issue 5 (Card payment) — isolated
4. Issue 7 (Post-signup nav) — isolated auth flow
5. Issue 6 (Push notifications) — depends on stable socket
6. Issue 2 (Late timer) — new feature
7. Issue 1 (Manual fare) — new feature
