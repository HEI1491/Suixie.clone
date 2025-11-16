# Suixie Portal

Modern Vue 3 + Vite application that powers the Suixie account portal (register, login, customer support, etc.). The project now follows a layered structure so UI, state, and network logic stay isolated and easier to scale.

## Getting Started

```bash
npm install
npm run dev    # Starts Vite dev server
npm run build  # Builds production bundle
npm run preview
```

> Windows PowerShell blocks `npm` by default. Run `& "C:\Program Files (x86)\nodejs\npm.cmd" run dev` (or use an elevated shell) if you hit execution-policy errors.

## Project Structure

- `src/core` – shared primitives such as the API defaults (`constants.js`), environment resolver (`config.js`), and reusable errors (`errors.js`).
- `src/services/httpClient.js` – low-level fetch wrapper with error normalization.
- `src/services/modules` – domain-specific services (`authService`, `contentService`) composed in `apiClient.js` and injected via the `api` plugin.
- `src/composables` – cross-component logic (themes, snackbar, etc.).
- `src/components` – route-level pages plus reusable UI.
- `src/plugins/api.js` – registers the API client instance so any component can call `const api = useApi()`.

## Development Notes

- Use the `@` alias (configured in `vite.config.js`) for all source imports to avoid brittle relative paths.
- API credentials/base URL can be overridden with `VITE_API_BASE_URL`, `VITE_API_KEY`, and `VITE_TOKEN_STORAGE_KEY` in `.env` files.
