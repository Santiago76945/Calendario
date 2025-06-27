<!-- README.md -->

# Mi App de Calendario (Vite + Netlify Functions)

Este proyecto despliega un **frontend estático** en Vite y un **backend serverless** con Netlify Functions que consume la API de Google Calendar.

---

## 🔧 Requisitos previos

- Node.js ≥ 18  
- Netlify CLI (`npm install -g netlify-cli`)  
- Credenciales de Google Cloud configuradas (OAuth2 y Calendar API)

---

## ⚙️ Configuración

1. Copia el archivo `.env.example` a `.env` y completa tus credenciales de Google:
   ```bash
   cp .env .env.local
   # Edita .env.local con tus valores
````

2. En Netlify (UI o CLI), añade las mismas variables de entorno (`GCAL_CLIENT_ID`, etc.) usando `netlify env:set`.

---

## 🛠️ Desarrollo local

1. Instalar dependencias:

   ```bash
   npm install
   ```
2. Iniciar Netlify Dev (simula frontend + funciones):

   ```bash
   netlify dev
   ```
3. Abre tu navegador en `http://localhost:8888`.

---

## 🚀 Despliegue

1. Autentícate con Netlify:

   ```bash
   netlify login
   ```
2. Vincula tu sitio (si aún no lo hiciste):

   ```bash
   netlify init
   ```
3. Despliega:

   ```bash
   netlify deploy --prod
   ```

   * El comando subirá tu carpeta `dist/` y las funciones en `functions/`.

---

## 📂 Estructura resumida

```
/
├── public/
├── src/
├── functions/
│   ├── oauth2callback.js
│   └── eventos/
│       ├── googleCalendarService.js
│       ├── index.js
│       ├── update.js
│       └── delete.js
├── .env.local       # Variables locales (no subir)
├── netlify.toml
├── package.json
├── vite.config.js
└── README.md
```

