# CLAUDE.md – Průvodce kódbází pro AI asistenty

This file describes the structure, conventions, and development workflows for the **Kalkulačka řeziva** (Wood/Lumber Calculator) project. It is intended for AI assistants (Claude Code and similar) working in this repository.

---

## ⚠️ KRITICKÉ: Před každou změnou si přečti toto

**Tento projekt má funkce implementované uživatelem přímo v `master` větvi.** Při práci na feature branchích hrozí jejich přepsání. Vždy postupuj podle tohoto checklistu:

### Checklist před velkou změnou

1. **Zkontroluj `git log master` a přečti diff** oproti aktuální větvi — zjisti, co uživatel přidal od posledního společného commitu.
2. **Identifikuj všechny existující funkce** (viz sekce níže) a ověř, že je nová implementace zachová.
3. **Nikdy nezačínej od prázdné implementace** — vždy vycházej z `master` a přidávej na vrchol.
4. **Po implementaci projdi seznam chráněných funkcí** (viz níže) a ověř každou jednotlivě.

### Chráněné funkce — nesmí být přepsány ani odstraněny

| Funkce | Kde | Popis |
|---|---|---|
| Vlastní cena na řádek | `col-price no-print`, checkbox `chkDetailedPrices` | Skrytý sloupec, viditelný po zaškrtnutí |
| Email modal | `emailModalOverlay`, `openEmailModal()`, `closeEmailModal()` | Modal s výběrem formátu a náhledem textu |
| Šablony emailů | `buildEmailText()`, `buildQuoteEmailText()`, `buildProductionOrderText()` | Kalkulace / Cenová nabídka / Objednávka výroby |
| Auto-save | `saveToHistory(true)` v `exportPDF()` a `sendEmail()` | Tiché uložení při exportu |
| Historie výpočtů | `saveToHistory()`, `restoreFromHistory()`, `openHistoryModal()` | Max 20 záznamů, `rezivo_history` v localStorage |
| Poznámka k zakázce | `zakazInput`, `getZakaz()`, `initZakaz()` | Globální textové pole pro ref. číslo/název |
| Tab navigace | `FIELDS = ["w", "h", "l", "n"]` | Price je MIMO FIELDS — na vlastní cenu se nedostanete tabulátorem |
| Tmavý režim | `toggleTheme()`, `applyTheme()` | `app_theme` v localStorage |

---

## Project Overview

**Kalkulačka řeziva** is a single-page web application for calculating wood/lumber volumes, prices, and weights. It targets Czech users in the construction/lumber industry.

Key capabilities:
- Volume calculation (m³) from width × height × length × quantity
- Support for **multiple orders** (zakázky) in a single calculation, each with its own table
- Price calculation with/without VAT, optional per-row custom price
- Weight calculation based on material density
- Material management (predefined + custom)
- Available size validation with nearest-size hints
- PDF export (always in light mode, groups by order with subtotals)
- Email export via modal — three formats: Kalkulace, Cenová nabídka, Objednávka výroby
- History of calculations (up to 20 entries, save/restore)
- Dark/light theme with system preference detection
- PWA-compatible (installable on mobile)
- Fully client-side — no backend, no build step

---

## Repository Structure

```
rezivo-vypocet/
├── index.html               # Main application HTML (entry point)
├── kalkulacka_reziva.js     # All application logic (~1360 lines)
├── kalkulacka_reziva.css    # All styles (dark mode + responsive)
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

1. **DATA** – Default materials array (`DEFAULT_MATERIALS`). Each material has:
   - `id`, `name`, `price` (CZK/m³), `density` (kg/m³)
   - `emailCode`: optional short code for price-quote emails
   - `sizes`: array of `{w, h, lengths[]}` objects (cm/m), or omitted for unrestricted

2. **PERSISTENCE** – localStorage helpers:
   - `loadMaterials()` – loads from `rezivo_materials`, merges defaults
   - `saveMaterials()` – serializes and saves
   - `migrateMaterials()` – handles backward-compat data migrations

3. **HELPERS** – Utilities:
   - `getMaterial()` – returns current material object from dropdown selection
   - `getDph()` – read VAT rate from UI
   - `getZakaz()` / `initZakaz()` – global order note/reference number
   - `parseDecimal(str)` – accepts comma or period as decimal separator
   - `fmt()`, `fmtM3()`, `fmtKc()`, `fmtKg()` – Czech locale formatting with `\u00a0` separators
   - `fmtDim(n)` – formats dimension (w/h) with 0–1 decimal places
   - `showToast(msg)` – transient user feedback

4. **AVAILABILITY CHECK**:
   - `checkAvailability(mid, w, h)` – validates dimensions against material's allowed sizes
   - `getAvailHint(mid, w, h)` – returns hint string with nearest available size (Euclidean distance)

5. **CALCULATION**:
   - `calcRow(row)` – returns `{m3, priceNoDph, priceWithDph, weight}`
   - Formula: `(w/100) × (h/100) × l × n = m³`
   - Per-row price: uses `parseDecimal(row.price) || mat.price`

6. **MATERIAL SELECTOR** – Dropdown change handler, syncs price/density inputs

7. **TABLE ROWS** – Dynamic row management:
   - `renderRow(row, orderId, tbody)` – renders one row into the given tbody
   - `addRow(orderId, w?, h?, l?, n?)` – adds row to specific order, renders it
   - `deleteRow(rowId)` – searches all `orders[].rows` to find and remove
   - `updateRowCalc(row)` – recalculates and updates DOM cells for one row
   - `FIELDS = ["w", "h", "l", "n"]` – Tab navigation order (**price is NOT in FIELDS**)
   - `onInputKeyDown(e)` – Enter on last field (`n`) creates new row or jumps to next order

8. **ORDER MANAGEMENT** – Multi-order support:
   - `createOrderSection(order)` – creates DOM section with header + table (thead/tbody/tfoot)
   - `addOrder(name?)` – creates order, appends section, adds first empty row
   - `deleteOrder(orderId)` – removes order with confirmation (cannot delete last)
   - `renameOrder(orderId, name)` – updates `order.name` and DOM
   - `calcOrderTotals(order)` – returns `{m3, noDph, withDph, kg}` for one order
   - `updateOrderSubtotal(order)` – updates tfoot with subtotals + "+ Přidat řádek" button
   - `recalcSummary()` – aggregates all orders → updates stat bar + calls `updateOrderSubtotal` for each
   - `recalcAll()` – recalculates all rows across all orders
   - `clearAll()` – resets to single empty `Zakázka 1`

9. **MODAL: MANAGE MATERIALS** – CRUD UI for custom materials and their available sizes

10. **EXPORT: PDF**:
    - `exportPDF()` – uses html2pdf.js, always light mode, portrait A4
    - Renders all orders with headers and subtotals; **skips empty rows**
    - Calls `saveToHistory(true)` (silent auto-save) before generating PDF
    - All styles are **inline** inside `exportPDF()` — CSS changes do NOT affect PDF

11. **EXPORT: EMAIL**:
    - `openEmailModal()` / `closeEmailModal()` — email modal with format selector and text preview
    - `buildEmailText()` — Kalkulace format: plain-text table grouped by orders; **skips empty rows**
    - `buildQuoteEmailText()` — Cenová nabídka format: customer-facing, grouped by orders; skips empty rows
    - `buildProductionOrderText()` — Objednávka výroby format: production order; skips empty rows
    - `sendEmail()` — builds mailto: URI, falls back to clipboard if >1900 chars; calls `saveToHistory(true)`
    - `onEmailFormatChange()` — updates modal preview on format switch

12. **DARK MODE**:
    - `toggleTheme()` / `applyTheme(theme)` – toggle and apply
    - Stored in `localStorage` key `app_theme`
    - Fallback: `prefers-color-scheme` media query

13. **HISTORY**:
    - `saveToHistory(silent?)` – saves current `orders[]` snapshot; max 20 entries
    - `restoreFromHistory(id)` – restores orders from entry; backward-compat: old entries with `rows[]` (no `orders[]`) are wrapped in `[{ id:1, name: entry.note, rows: entry.rows }]`
    - `openHistoryModal()` / `closeHistoryModal()` – history list modal
    - Stored in `localStorage` key `rezivo_history`

14. **INIT** – Self-executing initialization (loads data, creates `Zakázka 1`, renders UI, binds events)

---

## Global State

```js
let orders = [];        // [{ id, name, rows: [{id, w, h, l, n, price}] }]
let nextOrderId = 1;
let nextRowId = 1;
let materials = [];     // loaded from localStorage or defaults
let calcHistory = [];   // loaded from localStorage
```

**`orders[]` is the single source of truth.** The DOM is always a derived view — mutate `orders`, then call `renderRow()`/`recalcAll()`/`recalcSummary()`. Never mutate the DOM table directly.

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

### Key Classes

| Class | Purpose |
|---|---|
| `.order-section` | Wrapper for one order (header + table) |
| `.order-header` | Flex row with order name input + delete button (hidden on print) |
| `.order-name` | Editable order name input |
| `.btn-del-order` | Delete order button (aligned right via `justify-content: space-between`) |
| `.order-name-print` | Print-only order name div (`print-only` class) |
| `.order-subtotal` | Tfoot row with subtotals |
| `.add-row-tr` | Tfoot row with "+ Přidat řádek" button (hidden on print) |
| `.col-price` | Per-row custom price column — hidden by default |
| `.detailed-prices` | Class on `#ordersContainer` — makes `.col-price` visible in all tables |
| `.no-print` | Hidden in print/PDF |
| `.print-only` | Visible only in print/PDF |

### Responsive Breakpoints

| Breakpoint | Target |
|---|---|
| ≥ 900px | Desktop (full layout) |
| 640–900px | Tablet (adjusted padding/fonts) |
| ≤ 640px | Mobile (touch-friendly, 42px+ buttons, 16px min font to prevent iOS zoom) |
| ≤ 420px | Small phone (single-column stat bar) |

### Print Styles (`@media print`)

- Forces white background / black text
- Hides `.no-print` elements (toolbar, modals, order-header, add-row-tr)
- Shows `.print-only` metadata and `.order-name-print`

---

## Data Persistence

`localStorage` keys:

| Key | Content |
|---|---|
| `rezivo_materials` | JSON array of all materials (default + custom) |
| `app_theme` | `"dark"` or `"light"` |
| `rezivo_history` | JSON array of history entries (max 20); each entry has `orders[]` (new) or `rows[]` (legacy) |
| `rezivo_zakaz` | String — global order note/reference number |

---

## Key Conventions

### Language
- **All user-facing strings are in Czech** (the application targets Czech users)
- Code comments are also mostly in Czech
- Git commit messages use Czech with conventional commit prefixes (`fix:`, `feat:`, `refactor:`)

### JavaScript
- **Procedural/functional style** — no classes, no frameworks
- camelCase for functions and variables
- `data-*` attributes for DOM↔data binding (`data-id`, `data-field`, `data-mid`, `data-order-id`)
- Event handling: inline `onclick` in HTML for actions; `addEventListener` for input changes
- Always use `parseDecimal()` instead of `parseFloat()` for user-entered numbers (supports comma as decimal separator)
- HTML escaping via `escHtml()` before inserting user content into HTML strings

### CSS
- kebab-case class names (`.btn-primary`, `.col-weight`, `.no-print`)
- Use CSS custom properties for all colors/spacing that differ between themes
- Avoid inline styles except where dynamically set by JS
- **`.detailed-prices` class is on `#ordersContainer`**, not on individual tables — affects all order tables at once

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

1. **Read the existing code first** — never modify what you haven't read
2. Edit `index.html`, `kalkulacka_reziva.js`, or `kalkulacka_reziva.css` directly
3. Refresh the browser to see changes
4. Test in both light and dark mode
5. Test on mobile viewport (browser dev tools)
6. Test all three email formats and PDF export
7. Test history save/restore
8. Test with multiple orders

### Deployment

Copy all files (`index.html`, `kalkulacka_reziva.js`, `kalkulacka_reziva.css`, `manifest.json`) to the server directory referenced in `nginx.conf`:

```bash
/var/www/kalkulacka-reziva/
```

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
  sizes: [                  // optional; omit for unrestricted sizes
    { w: 4, h: 6, lengths: [3, 4, 5] },  // w/h in cm, lengths in m
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
- All styles are **inline** inside `exportPDF()` — not driven by `kalkulacka_reziva.css`
- Multiple orders: renders a header row per order + subtotal row; single order: no headers
- **Skips empty rows** (all dimensions = 0)
- Calls `saveToHistory(true)` silently before generating

---

## Email Export Notes

- Accessed via email modal (`emailModalOverlay`) — three formats in dropdown
- **Kalkulace** (`buildEmailText()`): plain-text table, groups by order, mezisoučet per order; skips empty rows
- **Cenová nabídka** (`buildQuoteEmailText()`): customer-facing, per-order sections; skips empty rows
- **Objednávka výroby** (`buildProductionOrderText()`): production order format; skips empty rows
- Falls back to clipboard if mailto: URI >1900 chars
- Calls `saveToHistory(true)` silently on send

---

## Potential Gotchas for AI Assistants

1. **`orders[]` not `rows[]`**: The top-level state is `orders[]`, each with its own `rows[]`. There is no global flat `rows` array. Always iterate `orders.forEach(o => o.rows.forEach(...))`.

2. **Comma decimal separator**: User inputs use comma (`,`) as decimal separator (Czech convention). Always use `parseDecimal()` — never `parseFloat()` directly on user input.

3. **`FIELDS = ["w", "h", "l", "n"]` — price is outside FIELDS**: Tab/Enter keyboard navigation must NOT include the price column. The user explicitly requires this — do not change it.

4. **Normalized dimensions**: Width and height are automatically normalized so `w ≤ h` when checking available sizes. A user entering `120×60` is treated the same as `60×120`.

5. **Material IDs are stable identifiers**: The `id` field in materials is persisted in localStorage. Renaming or removing default material IDs will break existing user data.

6. **Material property is `price`, not `pricePerM3`**: The field in the material object is `mat.price`.

7. **No module system**: The JS file uses no `import`/`export`. All functions are in the global scope.

8. **html2pdf.js CDN dependency**: PDF export fails without internet. There is no local fallback.

9. **PDF styles are inline, not CSS**: `exportPDF()` builds a self-contained HTML string with inline styles. Changes to `kalkulacka_reziva.css` do **not** affect PDF output.

10. **`.detailed-prices` is on `#ordersContainer`**: The selector for the custom price column is `.detailed-prices .col-price`, not `#mainTable.detailed-prices .col-price`. Changing the selector breaks the feature.

11. **Average price vs. material price**: `#sumPriceM3` shows `noDph / m3` (average effective price), **not** `mat.price`. Do not replace this with `mat.price`.

12. **History backward compatibility**: Old entries have `rows[]` (no `orders[]`). `restoreFromHistory()` wraps them: `entry.orders ?? [{ id:1, name: entry.note||"Zakázka 1", rows: entry.rows??[] }]`. Do not break this.

13. **Empty rows are filtered in all exports**: PDF, all three email formats skip rows where dimensions are zero. If adding a new export format, add the same filter.

14. **`deleteOrder` cannot delete the last order**: There is a guard — `orders.length <= 1` prevents deletion. Preserve this behavior.
