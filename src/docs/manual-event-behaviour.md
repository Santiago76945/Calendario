# Manual Event Creation Behaviour

Sí. Este también conviene actualizarlo para que quede bien alineado con la implementación actual y con la forma en que ya resolvimos IA, preview, create/update y lectura de eventos existentes.

Te dejo una versión corregida y coherente para reemplazar completa en `src/docs/manual-event-behaviour.md`:

```md
# Manual Event Creation Behaviour

## Purpose

The manual event creation flow is designed to make the app **ICS-first**.

This means a manual event is **not created immediately** when the user fills the form.  
Instead, the app first builds an internal draft, generates an `.ics` preview, and only creates or updates the event **after explicit user confirmation**.

---

## Main Goal

Provide a simple, user-friendly event creation flow centered around the final `.ics` output.

The user should always be able to:

- enter the minimum required event information easily
- optionally expand into advanced fields
- preview the generated `.ics` content before confirming
- go back and edit if something is wrong
- confirm only when the generated file looks correct

---

## Entry Points

The manual flow can begin from:

- **Home page**
  - the user navigates to the calendar management page
- **Calendar page**
  - clicking **"Nuevo evento manual"**
- **Existing calendar event**
  - clicking **"Editar"** on an existing event

---

## Core Components Involved

### UI
- `src/pages/Calendario.jsx`
- `src/components/EventForm.jsx`
- `src/components/TimezoneField.jsx`
- `src/components/AdvancedEventFields.jsx`
- `src/components/IcsPreview.jsx`

### Services and helpers
- `src/services/eventDraftService.js`
- `src/services/icsService.js`
- `src/services/timezoneService.js`
- `src/utils/dateTime.js`
- `src/utils/icsText.js`

### Persistence / API
- `src/services/calendarService.js`
- `functions/eventos/index.cjs`
- `functions/eventos-by-id.cjs`

---

## Flow Overview

## 1. Open manual event form

When the user clicks **"Nuevo evento manual"**, the app opens the modal in **manual creation mode**.

At this point:

- there is no persisted event yet
- there is no generated `.ics` yet
- the form is initialized with defaults

### Default values

The form starts with:

- empty event title
- current date
- near-future default start time
- default duration of 60 minutes
- empty location
- timezone loaded from local storage if available
- advanced fields collapsed by default

If the user is editing an existing event instead of creating a new one, the form is pre-filled from the existing event data.

---

## 2. Required fields in simple mode

The simple manual flow collects the minimum information needed to build a valid ICS event:

- **Event name**
- **Date**
- **Start time**
- **Timezone**
- **Duration in minutes**
- **Location** optional from a technical point of view, but part of the normal user-facing flow

The system combines:

- `date`
- `time`

into a single internal local datetime value such as:

`2026-04-10T19:30`

Then it calculates the end datetime using the duration.

---

## 3. Timezone behaviour

Timezone handling is shared between manual and AI creation.

### Dropdown

The timezone field shows a dropdown with popular timezone options focused on Europe and the Americas.

### Manual option

If the user needs another timezone, they can choose:

`Otra (escribir manualmente)`

and enter it as free text.

### Persistence

The selected timezone is saved to local storage.

### Reset rule

When the user creates a new manual event later:

- all regular form fields reset
- the timezone remains preselected from local storage

This is intentional, because timezone is expected to be reused often.

---

## 4. Advanced mode

The form contains a toggle for **advanced mode**.

### Behaviour

By default, advanced mode is hidden in manual creation.

If the user expands it, the form may show additional fields such as:

- description
- status
- manual UID override
- PRODID
- categories
- internal notes

### Purpose

Advanced mode is meant for users who want more control over the generated `.ics` structure without making the simple flow harder to use.

### Editing

When editing an existing event, advanced mode is opened by default so richer event data can be reviewed and preserved more easily.

---

## 5. Submit does not create the event yet

When the user clicks:

`Generar vista previa ICS`

the app does **not** call the final create endpoint yet.

Instead, the app:

1. validates required fields
2. builds an internal draft object
3. computes:
   - `startDateTime`
   - `endDateTime`
   - `durationMinutes`
   - `timeZone`
4. generates the ICS string from the draft
5. switches from form view to preview view

This is the central behaviour of the manual flow.

---

## 6. ICS preview step

The preview screen is mandatory.

It shows:

### Human-readable summary

A clean summary of the event, including:

- title
- start
- end
- duration
- location
- timezone
- description if present

### Raw `.ics` content

The exact text content that will represent the event.

This lets the user verify that the generated file is correct before anything is saved.

### Available actions

At preview stage, the user can:

- **Confirmar creación** or **Confirmar actualización**
- **Volver a editar**
- **Cancelar**
- **Copiar** the ICS content

---

## 7. Final confirmation

Only after clicking confirm in the preview step does the app persist the event.

### For new events

The app sends:

- the normalized draft
- the generated `icsContent`
- a source marker such as `ics-preview`

to the persistence layer.

### For existing events

The same preview-confirmation rule applies to updates.

The event is only updated after the user confirms the new `.ics` preview.

---

## 8. Cancel behaviour

If the user cancels from the form or preview:

- no event is created
- no update is saved
- the modal closes
- temporary draft state is discarded

The only persistent side effect that may remain is the saved timezone preference in local storage.

---

## 9. Edit behaviour

Editing follows the same philosophy as creation.

### Expected flow

1. user clicks **Editar**
2. the existing event is converted into an internal draft
3. the form opens with pre-filled values
4. the user changes data
5. the app generates a new `.ics` preview
6. the user confirms the update
7. only then is the event updated

This keeps the app consistently ICS-first for both creation and editing.

---

## 10. View existing ICS behaviour

The calendar list also allows the user to inspect an existing event as an ICS preview without immediately entering edit mode.

### Expected flow

1. user clicks **Ver ICS**
2. the existing event is converted into an internal draft
3. the app generates the `.ics` content
4. the modal opens directly in preview mode

In this read-only preview case, the user can review the generated ICS and close the modal, but that action does not itself create or update anything.

---

## 11. Validation expectations

The form prevents preview generation if the minimum required data is missing.

At minimum, the system rejects preview generation when any of the following is missing:

- event name
- start date
- start time
- duration
- timezone

The ICS service also rejects invalid draft generation if required core values are missing.

It also rejects cases where:

- the draft is malformed
- start or end datetime is invalid
- the end is not later than the start
- duration is not a valid positive number

---

## 12. Relationship with calendar storage

The manual form is responsible for collecting user input and generating preview state.

It is **not** responsible for final persistence logic.

Persistence belongs mainly to:

- `src/services/calendarService.js`
- `functions/eventos/index.cjs`
- `functions/eventos-by-id.cjs`

ICS generation belongs to:

- `src/services/icsService.js`

Form normalization belongs to:

- `src/services/eventDraftService.js`

This separation keeps the code easier to maintain and reduces the risk of breaking unrelated functionality.

---

## 13. Data shape and normalization

The manual flow works with an internal normalized draft shape before any persistence happens.

Typical fields include:

- `summary`
- `description`
- `location`
- `startDateTime`
- `endDateTime`
- `durationMinutes`
- `timeZone`
- `uid`
- `status`
- `productId`
- `categories`
- `notes`

This draft is the source of truth for preview generation.

Only after confirmation is it translated into the backend payload used for create or update.

---

## 14. Expected UX principles

The manual event flow should feel:

- predictable
- reversible before confirmation
- easy in simple mode
- more flexible in advanced mode
- centered on the generated `.ics` file, not on opaque background event objects

The user should always understand that:

**the preview is the final checkpoint before creation or update.**
```

Las mejoras principales frente al original son estas:

* lo alineé con los **nombres reales de la UI actual**: `Nuevo evento manual`, `Editar`, `Generar vista previa ICS`
* agregué el comportamiento real de **“Ver ICS”**, que en tu implementación actual existe y merece quedar documentado
* lo alineé con la arquitectura actual de persistencia:

  * `calendarService.js`
  * `functions/eventos/index.cjs`
  * `functions/eventos-by-id.cjs`
* reforcé la parte de **validación real**, no solo la ideal
* dejé más claro que el **draft normalizado** es la verdad interna antes de persistir

Seguimos con el siguiente `.md`.
