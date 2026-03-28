# Calendar Connection Flow

## Purpose

The app no longer works with one globally fixed Google Calendar configured on the server.

Instead, the user connects Google from the frontend, selects a calendar, and that assignment is stored locally in the browser until:

- the session expires
- Google rejects the token
- the user clears the connection
- the user explicitly assigns another calendar

---

## High-level model

There are now three separate concepts:

1. app access gate
2. Google session
3. assigned calendar

They should not be confused.

### 1. App access gate

This is the lightweight UI gate controlled by:

- `VITE_AUTH_CODE`
- `AuthGate`
- `authService`

It only decides whether the user can open the app UI.

### 2. Google session

This is the browser session obtained through Google Identity Services.

It provides an access token that is later sent to the backend on each request.

### 3. Assigned calendar

This is the specific Google Calendar selected by the user after Google login.

The selected calendar is persisted in local storage and reused until invalid.

---

## New UX flow

### Entry point

The user clicks:

`Asignar calendario`

This action is available from the menu / status area.

### Login

The frontend opens the Google flow and requests permissions for Calendar access.

### Calendar selection

After Google returns an access token, the frontend fetches the user's accessible calendars and displays a picker.

The user selects one calendar and confirms.

### Persistence

The app saves locally:

- Google access token
- expiration timestamp
- connected email when available
- assigned calendar ID
- assigned calendar summary
- assigned calendar timezone
- optional visual metadata such as colors

---

## What local storage is used for

The connection is browser-local.

This means the assignment persists only for:

- the current browser
- the current local storage context

If the browser storage is cleared, the user must assign a calendar again.

---

## Backend request model

The backend no longer decides the calendar from `CALENDAR_ID`.

Instead, each relevant request sends:

- `Authorization: Bearer <access_token>`
- `X-Calendar-Id: <selected_calendar_id>`

The Netlify Functions use that request context to operate on the chosen calendar.

---

## Endpoints affected

The following endpoints depend on the assigned calendar and the Google token sent by the frontend:

- `/api/eventos`
- `/api/eventos/:id`
- `/api/ics/import`
- `/api/ics/export`

The following endpoint is unchanged conceptually because it only produces a draft:

- `/api/ai/event-draft`

---

## Error behaviour

If Google rejects the token or the calendar is no longer accessible:

- the request fails
- the frontend clears the stored Google session and assigned calendar
- the user must assign a calendar again

This avoids stale or misleading local state.

---

## Important principle

The key principle is:

**the frontend remembers which Google calendar is assigned, and the backend executes all event operations against that assigned calendar using the token provided by the frontend.**

# Environment Variables Reference

## Frontend

### `VITE_AUTH_CODE`

Optional frontend access code.

If present:

- `AuthGate` is enabled
- the user must enter the code before using the app

If absent:

- the app opens directly

### `VITE_GOOGLE_CLIENT_ID`

Required for the new Google Calendar connection flow.

Used by:

- `src/services/googleCalendarConnectionService.js`

Purpose:

- initialize Google Identity Services from the frontend
- request an access token for the current user

Without it:

- the user cannot assign a calendar

---

## Backend

### `TIMEZONE`

Optional backend fallback timezone.

Used by:

- `functions/eventos/googleCalendarService.cjs`

Purpose:

- fallback timezone when the draft does not specify one

Default:

- `Europe/Dublin`

---

## Legacy server OAuth variables

These variables are no longer part of the main runtime calendar flow:

- `GCAL_CLIENT_ID`
- `GCAL_CLIENT_SECRET`
- `GCAL_REDIRECT_URI`
- `GCAL_REFRESH_TOKEN`
- `CALENDAR_ID`

They belonged to the old model where the backend used one fixed Google account and one fixed calendar.

The new implementation does not depend on them for normal CRUD/import/export behaviour.

---

## Optional / unrelated

### `OPENAI_API_KEY`

Used only if you later connect a real AI provider on the backend.

The current `functions/ai/event-draft.cjs` implementation is heuristic and does not require a real provider yet.

### `SITE_URL`

Contextual environment variable that may still be useful for deployment-level logic, but it is not the driver of the new Google calendar assignment flow.