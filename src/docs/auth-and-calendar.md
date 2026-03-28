# Auth Behaviour and Calendar Assignment

## Purpose

This document explains the current separation between:

1. app access auth
2. Google Calendar connection
3. calendar assignment

These are different layers.

---

## 1. App access auth

The app still uses a lightweight frontend auth gate.

It is controlled by:

- `VITE_AUTH_CODE`
- `src/components/AuthGate.jsx`
- `src/services/authService.js`

Its only purpose is to block casual access to the UI.

It is not related to Google login.

---

## 2. Google Calendar connection

Google Calendar access is now initiated from the frontend through Google Identity Services.

The browser obtains an access token for the current user session.

This session is then reused for backend operations until it expires or is cleared.

The relevant frontend files are:

- `src/services/googleCalendarConnectionService.js`
- `src/services/calendarConfigStorageService.js`
- `src/components/AssignCalendarButton.jsx`
- `src/components/CalendarPickerModal.jsx`
- `src/components/CalendarConnectionStatus.jsx`

---

## 3. Calendar assignment

Once the user is connected to Google, the app fetches accessible calendars and lets the user choose one.

That chosen calendar becomes the assigned calendar for the app in that browser.

The assignment is stored in local storage and reused until:

- the token expires
- Google rejects access
- the user changes calendar
- the user clears the connection

---

## Persistence model

The browser stores:

- Google access token
- Google access token expiration
- connected email when available
- assigned calendar ID
- assigned calendar summary
- assigned calendar timezone

This is browser-local persistence, not account-based persistence across devices.

---

## Backend model

The backend no longer relies on:

- `GCAL_REFRESH_TOKEN`
- `CALENDAR_ID`

as the active runtime calendar configuration for normal event operations.

Instead, each request sends:

- `Authorization: Bearer ...`
- `X-Calendar-Id: ...`

and the backend uses that dynamic request context.

---

## Important distinction

### App auth decides:
who may open the app

### Google session decides:
whether the current browser session can call Google Calendar

### Assigned calendar decides:
which calendar the app will actually list, create, update, delete, import and export against

---

## Practical summary

### To open the app

The user must pass the frontend access gate if `VITE_AUTH_CODE` is configured.

### To use Google Calendar

The user must connect Google and obtain a valid access token.

### To operate on a specific calendar

The user must explicitly assign one calendar from the available list.

---

## Key principle

The key principle is:

**opening the app, connecting Google, and assigning a calendar are now separate concerns.**