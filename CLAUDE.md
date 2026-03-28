# CLAUDE.md – Průvodce kódbází pro AI asistenty

This file describes the structure, conventions, and development workflows for the **Kalkulačka řeziva** (Wood/Lumber Calculator) project. It is intended for AI assistants (Claude Code and similar) working in this repository.

---

## Project Overview

**Kalkulačka řeziva** is a single-page web application for calculating wood/lumber volumes, prices, and weights. It targets Czech users in the construction/lumber industry.

Key capabilities:
- Volume calculation (m³) from width × height × length × quantity
- Price calculation with/without VAT
- Weight calculation based on material density
- Material management (predefined + custom)
- Available size validation with nearest-size hints
- PDF export (always in light mode)
- Email/price-quote export via mailto with clipboard fallback
- Dark/light theme with system preference detection
- PWA-compatible (installable on mobile)
- Fully client-side — no backend, no build step

---

## Repository Structure

```
rezivo-vypocet/
├── index.html               # Main application HTML (entry point)
├── kalkulacka_reziva.js     # All application logic (~931 lines)
├── kalkulacka_reziva.css    # All styles (~806 lines, dark mode + responsive)
├── manifest.json            # PWA manifest (name, icons, theme color)
├── nginx.conf               # Production nginx deployment config
└── .gitignore               # Ignores .vscode/, *.swp, .DS_Store, .claude/
```

**No build system.** There is no package.json, bundler, transpiler, or test runner. The app runs directly in the browser as written.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Markup | Vanilla HTML5 |
| Styling | Vanilla CSS3 (custom properties, grid, flexbox) |
| Logic | Vanilla ES6+ JavaScript (no frameworks) |
| PDF export | [html2pdf.js v0.10.1](https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js) via CDN |
| Persistence | `localStorage` only (no backend) |
| Deployment | Static files served by nginx |

---

## JavaScript Architecture (`kalkulacka_reziva.js`)

The file is organized into clearly marked sections with `═══` separator comments:

### Sections (in order)

1. **DATA** – Default materials array. Each material has:
   - `id`, `name`, `pricePerM3`, `density` (kg/m³)
   - `availableSizes`: array of `{w, h}` objects (cm), or empty array for unrestricted

2. **PERSISTENCE** – localStorage helpers:
   - `loadMaterials()` – loads from `rezivo_materials`, merges defaults
   - `saveMaterials()` – serializes and saves
   - `migrateMaterials()` – handles backward-compat data migrations

3. **HELPERS** – Utilities:
   - `getMaterial()` – returns current material object from dropdown selection
   - `getDph()` – read VAT rate from UI
   - `parseDecimal(str)` – accepts comma or period as decimal separator
   - `fmt()`, `fmtM3()`, `fmtKc()`, `fmtKg()` – Czech locale formatting with `\u00a0` separators
   - `fmtDim(n)` – formats dimension (w/h) with 0–1 decimal places (e.g. `10` not `10,0`, but `10,5` stays `10,5`)
   - `showToast(msg)` – transient user feedback

4. **AVAILABILITY CHECK**:
   - `checkAvailability(mid, w, h)` – validates dimensions against material's allowed sizes
   - `getAvailHint(mid, w, h)` – returns hint string with nearest available size (Euclidean distance)

5. **CALCULATION**:
   - `calcRow(row)` – returns `{m3, priceNoDph, priceWithDph, weight}`
   - Formula: `(w/100) × (h/100) × l × n = m³`

6. **MATERIAL SELECTOR** – Dropdown change handler, syncs price/density inputs

7. **TABLE ROWS** – Dynamic row management:
   - `rows` array of `{id, w, h, l, n}`
   - `renderRows()` – re-renders the table from `rows`
   - `addRow()` / `deleteRow(id)` – mutate `rows` and re-render
   - Tab/Enter keyboard navigation between cells

8. **MODAL: MANAGE MATERIALS** – CRUD UI for custom materials and their available sizes

9. **EXPORT HELPERS**:
   - `exportPDF()` – uses html2pdf.js, always forces light mode, portrait orientation; displays average price per m³ (totNoDph/totM3)
   - `buildEmailText()` – builds plain-text calculation table for mailto/clipboard; reads average price from `#sumPriceM3` DOM element
   - `sendEmail()` – builds mailto: URI from `buildEmailText()`, falls back to clipboard if >1900 chars
   - `buildQuoteEmailText()` – formats a customer-facing price-quote email body
   - `escHtml()` – XSS-safe HTML escaping (used inside `exportPDF()`)

10. **DARK MODE**:
    - `toggleTheme()` / `applyTheme(theme)` – toggle and apply
    - Stored in `localStorage` key `rezivo_theme`
    - Fallback: `prefers-color-scheme` media query

11. **INIT** – Self-executing initialization (loads data, renders UI, binds events)

---

## CSS Architecture (`kalkulacka_reziva.css`)

### CSS Custom Properties (Theming)

Light mode (default) and dark mode are defined via `:root` and `[data-theme="dark"]` selectors:

```css
:root {
  --bg: #f2f2f2;
  --accent: #1d6f42;
  /* ... */
}
[data-theme="dark"] {
  --bg: #18181b;
  --accent: #22c55e;
  /* ... */
}
```

### Responsive Breakpoints

| Breakpoint | Target |
|---|---|
| ≥ 900px | Desktop (full layout) |
| 640–900px | Tablet (adjusted padding/fonts) |
| ≤ 640px | Mobile (touch-friendly, 42px+ buttons, 16px min font to prevent iOS zoom) |
| ≤ 420px | Small phone (single-column stat bar) |

### Print Styles (`@media print`)

- Forces white background / black text
- Hides `.no-print` elements (toolbar buttons, modals)
- Shows `.print-only` metadata
- PDF export also uses these styles but applied via JS class manipulation

---

## Data Persistence

Two `localStorage` keys:

| Key | Content |
|---|---|
| `rezivo_materials` | JSON array of all materials (default + custom) |
| `rezivo_theme` | `"dark"` or `"light"` |

Custom materials created by the user are appended to the default list and saved. On load, defaults are merged with any saved customizations.

---

## Key Conventions

### Language
- **All user-facing strings are in Czech** (the application targets Czech users)
- Code comments are also mostly in Czech
- Git commit messages use Czech with conventional commit prefixes (`fix:`, `feat:`, `refactor:`)

### JavaScript
- **Procedural/functional style** — no classes, no frameworks
- camelCase for functions and variables
- `data-*` attributes for DOM↔data binding (`data-id`, `data-field`, `data-mid`, `data-rowId`, `data-calc`)
- Event handling: inline `onclick` in HTML for actions; `addEventListener` for input changes
- Always use `parseDecimal()` instead of `parseFloat()` for user-entered numbers (supports comma as decimal separator)
- HTML escaping via `escapeHtml()` before inserting user content into HTML strings

### CSS
- kebab-case class names (`.btn-primary`, `.col-weight`, `.no-print`)
- Use CSS custom properties for all colors/spacing that differ between themes
- Avoid inline styles except where dynamically set by JS

### No build artifacts
- Never commit minified files, `node_modules`, or build output
- The source files **are** the deployment artifacts

---

## Development Workflow

### Local Development

No build step required. Open `index.html` directly in a browser, or serve with any static server:

```bash
# Python (built-in)
python3 -m http.server 8080

# Node (npx)
npx serve .
```

### Making Changes

1. Edit `index.html`, `kalkulacka_reziva.js`, or `kalkulacka_reziva.css` directly
2. Refresh the browser to see changes
3. Test in both light and dark mode
4. Test on mobile viewport (browser dev tools)
5. Test PDF export and email export manually

### Deployment

Copy all files (`index.html`, `kalkulacka_reziva.js`, `kalkulacka_reziva.css`, `manifest.json`) to the server directory referenced in `nginx.conf`:

```bash
/var/www/kalkulacka-reziva/
```

Use the provided `nginx.conf` in `/etc/nginx/sites-available/`. It includes:
- Gzip compression for HTML/CSS/JS/manifest
- Cache headers (7 days for CSS/JS, 1 day for JSON/images)
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`)

---

## Adding or Modifying Materials

Default materials are defined at the top of `kalkulacka_reziva.js` in the `DEFAULT_MATERIALS` array. Each entry follows this shape:

```js
{
  id: 4,                    // number, never change after release (used in localStorage)
  name: "Display Name",     // Czech name shown in dropdown
  price: 16500,             // number, CZK per m³ (property is `price`, not `pricePerM3`)
  density: 450,             // number, kg per m³
  emailCode: "KVH NSi",     // optional short code used in price-quote email
  availableSizes: [         // array of {w, h} pairs in cm; [] = unrestricted
    { w: 45, h: 45 },
    { w: 60, h: 120 },
    // ...
  ]
}
```

**Important:** Never change an existing `id` value — it is used as the localStorage key for user-saved data. Add new materials with new unique ids only.

---

## PDF Export Notes

- Uses `html2pdf.js` loaded from CDN — requires internet access to generate PDFs
- Always renders in **light mode** regardless of user's current theme preference
- Portrait orientation (`format: 'a4', orientation: 'portrait'`)
- All styles are **inline** inside `exportPDF()` — not driven by `@media print` CSS
- Displays **average price per m³** = `totNoDph / totM3`; falls back to `mat.price` when table is empty
- Dimension formatting uses `fmtDim()` — no trailing decimal zero (e.g. `10`, not `10,0`)

---

## Email Export Notes

- Uses `mailto:` URI scheme (opens user's email client)
- If the generated URI exceeds ~1900 characters (email client limit), falls back to **copying to clipboard** and shows a toast notification
- `buildEmailText()` reads summary values (including average price) directly from DOM elements (`#sumPriceM3`, `#sumM3`, etc.) — these are always up to date after `recalcSummary()`
- Plain-text table format — no separator line under header (box-drawing chars cause line wrapping in email clients with proportional fonts)
- Price-quote email (`buildQuoteEmailText()`) uses `mat.price` directly per row — this is correct since each row is calculated at the current material price

---

## Potential Gotchas for AI Assistants

1. **Comma decimal separator**: User inputs use comma (`,`) as decimal separator (Czech convention). Always use `parseDecimal()` — never `parseFloat()` directly on user input.

2. **Normalized dimensions**: Width and height are automatically normalized so `w ≤ h` when checking `availableSizes`. A user entering `120×60` is treated the same as `60×120`.

3. **Material IDs are stable identifiers**: The `id` field in materials is persisted in localStorage. Renaming or removing default material IDs will break existing user data.

4. **No module system**: The JS file uses no `import`/`export`. All functions are in the global scope (the file is not a module).

5. **html2pdf.js CDN dependency**: PDF export fails without internet. There is no local fallback.

6. **Print vs PDF**: The `@media print` CSS is used both for `window.print()` and for html2pdf.js rendering. Changes to print styles affect both outputs.

7. **`rows` array is the source of truth**: The DOM table is always a derived view. Mutate `rows`, then call `renderRows()` — never mutate the DOM table directly.

8. **Average price vs. material price**: `#sumPriceM3` in the stat bar shows `noDph / m3` (average effective price), **not** `mat.price`. `exportPDF()` and `buildEmailText()` follow the same logic. Do not replace these with `mat.price`.

9. **Material property is `price`, not `pricePerM3`**: The field in the material object is `mat.price`. The CLAUDE.md previously documented it incorrectly as `pricePerM3`.

10. **PDF styles are inline, not CSS**: `exportPDF()` builds a self-contained HTML string with inline styles. Changes to `kalkulacka_reziva.css` do **not** affect PDF output — only the inline `S` object inside `exportPDF()` does.
