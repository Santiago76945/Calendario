# Tree

src
├── App.jsx
├── components
│   ├── AdvancedEventFields.jsx
│   ├── AiEventComposer.jsx
│   ├── AssignCalendarButton.jsx
│   ├── AuthGate.jsx
│   ├── CalendarConnectionStatus.jsx
│   ├── CalendarList.jsx
│   ├── CalendarPickerModal.jsx
│   ├── EventForm.jsx
│   ├── IcsPreview.jsx
│   └── TimezoneField.jsx
├── constants
│   ├── storageKeys.js
│   └── timezones.js
├── docs
│   ├── ai-event-behaviour.md
│   ├── auth-and-calendar.md
│   ├── calendar-connection-flow.md
│   ├── comandos.md
│   ├── manual-event-behaviour.md
│   ├── package-and-netlify-context.md
│   └── tree.md
├── index.css
├── main.jsx
├── pages
│   ├── Calendario.jsx
│   ├── Home.jsx
│   └── ImportExport.jsx
├── services
│   ├── aiEventService.js
│   ├── authService.js
│   ├── calendarConfigStorageService.js
│   ├── calendarService.js
│   ├── eventDraftService.js
│   ├── googleCalendarConnectionService.js
│   ├── icsService.js
│   └── timezoneService.js
├── styles
│   ├── calendario.css
│   ├── home.css
│   └── importexport.css
└── utils
    ├── dateTime.js
    └── icsText.js

8 directories, 38 files
(base) ➜  Calendario git:(main) ✗ tree functions
functions
├── ai
│   └── event-draft.cjs
├── eventos
│   ├── delete.cjs
│   ├── googleCalendarService.cjs
│   ├── index.cjs
│   └── update.js
├── eventos-by-id.cjs
├── ics
│   ├── export.cjs
│   └── import.cjs
├── lib
│   └── ics
│       └── parseIcsToDraft.cjs
├── oauth2-callback.cjs
├── oauth2-initiateAuth.cjs
└── services