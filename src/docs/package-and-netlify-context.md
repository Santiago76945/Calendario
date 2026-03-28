# package.json and netlify.toml

{
  "name": "calendario",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "serve": "vite preview",
    "netlify:dev": "netlify dev",
    "clean:install": "rm -rf node_modules package-lock.json && npm install"
  },
  "dependencies": {
    "googleapis": "^150.0.1",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.6.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.10.2",
    "netlify-cli": "^22.2.0",
    "vite": "^7.0.0"
  }
}

[build]
  command = "npm run build"
  publish = "dist"
  functions = "functions"

[dev]
  command = "npm run dev"
  targetPort = 3001
  publish = "dist"
  autoLaunch = false

[[redirects]]
  from = "/api/eventos"
  to = "/.netlify/functions/eventos"
  status = 200

[[redirects]]
  from = "/api/eventos/:id"
  to = "/.netlify/functions/eventos-by-id"
  status = 200

[[redirects]]
  from = "/api/ai/event-draft"
  to = "/.netlify/functions/ai/event-draft"
  status = 200

[[redirects]]
  from = "/api/ics/import"
  to = "/.netlify/functions/ics/import"
  status = 200

[[redirects]]
  from = "/api/ics/export"
  to = "/.netlify/functions/ics/export"
  status = 200

# OAuth server-side legacy deprecated.
# Se mantienen solo por compatibilidad temporal, pero la nueva implementación
# usa Google Identity Services en frontend.

[[redirects]]
  from = "/oauth/google/init"
  to = "/.netlify/functions/oauth2-initiateAuth"
  status = 200

[[redirects]]
  from = "/oauth/google/callback"
  to = "/.netlify/functions/oauth2-callback"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200