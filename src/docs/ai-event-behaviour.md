# AI Event Creation Behaviour

## Purpose

The AI event creation flow allows the user to describe an event in natural language and progressively reach a complete, valid event draft.

The app remains **ICS-first**, so even when the event is created through AI:

- the event is **not created immediately**
- the assistant may ask follow-up questions
- once enough data exists, the app generates an `.ics` preview
- the user must explicitly confirm before creation

---

## Main Goal

Make event creation faster and more natural without removing user control.

The AI flow should help the user:

- describe an event in plain language
- avoid manual field-by-field entry when possible
- get asked clarifying questions if key information is missing
- still review the exact `.ics` content before confirming

---

## Core Components Involved

### UI
- `src/pages/Calendario.jsx`
- `src/components/AiEventComposer.jsx`
- `src/components/TimezoneField.jsx`
- `src/components/IcsPreview.jsx`

### Services
- `src/services/aiEventService.js`
- `src/services/eventDraftService.js`
- `src/services/icsService.js`
- `src/services/timezoneService.js`

### Persistence / API
- `src/services/calendarService.js`
- `functions/ai/event-draft.cjs`
- `functions/eventos/index.cjs`

---

## Security Principle

The frontend must **not** call an AI provider directly with a secret API key.

The browser-facing app calls a backend endpoint:

`/api/ai/event-draft`

That backend is responsible for:

- interpreting the user prompt
- optionally integrating with an external AI provider later
- keeping credentials secret
- returning structured responses to the frontend

This is important because frontend environment variables are not a safe place for secret API keys.

---

## Entry Point

The AI creation flow starts from the calendar page when the user clicks:

`Crear con IA`

This opens the modal in **AI mode**.

---

## Shared timezone behaviour

The AI flow includes a timezone selector just like the manual flow.

### Why

Natural language requests often omit timezone or assume a local one.

### Behaviour

- the AI composer shows a timezone dropdown
- the selected timezone is persisted in local storage
- the selected timezone is also reused as the initial value in future AI event drafts

### Effect on interpretation

The selected timezone helps the backend interpret ambiguous requests consistently.

For example, if the user says:

`Tomorrow at 7:30 pm`

the selected timezone influences how that is resolved.

---

## AI conversation model

The AI event flow behaves like a structured mini-conversation.

The user sends a message such as:

`Next Thursday at 7:30 pm I want to play Baldur's Gate 3 with Dani for 90 minutes on Steam.`

The app sends the following to the backend:

- the current user message
- the selected timezone
- prior AI conversation history

The backend returns a structured response.

---

## Expected backend response shapes

The backend returns one of two broad outcomes.

### 1. More information is still needed

Example shape:

```json
{
  "status": "needs_more_info",
  "assistantMessage": "What time should the event start?",
  "missingFields": ["startDateTime"],
  "draft": {
    "summary": "Baldur's Gate 3 with Dani",
    "location": "Online (Steam)",
    "durationMinutes": 90,
    "timeZone": "Europe/Dublin"
  }
}

2. Enough information exists to generate the draft

Example shape:

{
  "status": "ready",
  "assistantMessage": "I have enough information to generate the event.",
  "draft": {
    "summary": "Baldur's Gate 3 (Steam) - Play with Dani",
    "startDateTime": "2026-04-10T19:30",
    "durationMinutes": 90,
    "location": "Online (Steam)",
    "description": "Virtual gaming session on Steam with Dani.",
    "timeZone": "Europe/Dublin",
    "uid": "",
    "status": "CONFIRMED",
    "productId": "-//Santiago Haspert Piaggio//Calendar ICS//EN",
    "categories": [],
    "notes": ""
  }
}

Minimum information required before preview

The AI flow must keep asking follow-up questions until there is enough information to generate a valid event draft.

At minimum, the app should not proceed to ICS preview without:

summary / event title
start date and time
duration or end time
timezone

Location and description are useful but may remain optional.

Follow-up question behaviour

If the user message does not contain enough data, the assistant should ask follow-up questions as many times as needed.

Example

User says:

I want to have dinner with Laura next week.

Possible assistant reply:

Sure. What day and time should it start?

If the user then says:

Wednesday at 8 pm

but no duration is provided, the assistant may ask:

How long should I make the event?

This loop continues until the backend returns status: "ready".

Frontend conversation behaviour

The frontend AI component keeps a lightweight conversation history.

It stores messages in order, for example:

user message
assistant reply
user follow-up
assistant reply

This history is sent back with each new turn so the backend can interpret context correctly.

The frontend displays this conversation clearly so the user understands the current state.

Draft generation behaviour

Once the backend returns status: "ready" and includes a valid draft:

the frontend normalizes the payload into the app's internal draft shape
the app generates the ICS string
the UI switches from conversation mode to preview mode

From that point onward, the AI flow behaves like manual creation.

Preview step is mandatory

Even in AI mode, the generated event must go through the same preview stage.

The preview must show:

a human-readable event summary
the raw .ics content
actions to:
confirm
go back
cancel

This ensures AI suggestions are always visible and reviewable before persistence.

Confirmation behaviour

The AI flow must not persist the event before preview confirmation.

After confirmation, the app sends:

the normalized draft
the generated icsContent
a source marker

to the persistence layer.

Only then is the event actually created.

Cancel behaviour

If the user cancels at any point before confirmation:

no event is created
no partial draft is persisted
the modal closes
the temporary AI conversation state is discarded

The only persistent side effect may be the saved timezone preference.

Error behaviour

The frontend should handle AI-related failures gracefully.

Possible failure cases include:

backend unavailable
invalid backend response
malformed draft
timeout
unexpected parsing errors
Expected UI behaviour

If an error happens:

keep the modal open
preserve the user context when possible
show a human-readable error message
allow the user to retry

The flow should never silently fail.

Responsibilities by layer
AiEventComposer

Responsible for:

capturing user messages
displaying conversation state
managing timezone selection
requesting AI turns from the backend
triggering preview generation when draft is ready
aiEventService

Responsible for:

HTTP communication with the backend AI endpoint
eventDraftService

Responsible for:

normalizing backend draft payloads into the app's internal shape
icsService

Responsible for:

validating the draft
generating the final .ics content
calendarService

Responsible for:

creating the actual event only after confirmation
Current implementation note

The current backend implementation at functions/ai/event-draft.cjs is intentionally simple.

At the moment it uses lightweight heuristic parsing and structured follow-up logic instead of a full external AI integration.

That means:

the frontend contract is already in place
the backend route already exists
a real provider integration can be added later without changing the frontend flow

This keeps the architecture secure and consistent while allowing the AI layer to evolve independently.

UX principles

The AI event flow should feel:

helpful
conversational
precise
reviewable
safe

The AI is meant to reduce typing, not to bypass control.

The most important principle is:

AI can prepare the event, but the user still confirms the ICS before creation.


Hay dos mejoras clave respecto al original:

1. **arregla el markdown roto** de los bloques JSON y encabezados  
2. **lo alinea con tu estado real actual**, donde ya existe `functions/ai/event-draft.cjs`, pero hoy funciona con parsing heurístico y no con OpenAI real

Si querés, seguimos con `auth-gate-behaviour.md`.