// ═══════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════
const BSH_SI_ID = 3;

const DEFAULT_MATERIALS = [
  { id: 1, name: "Stavební řezivo", price: 11500, density: 850, speciesId: 1 },
  {
    id: 2,
    name: "KVH hranoly",
    price: 16500,
    density: 450,
    emailCode: "KVH NSi",
    speciesId: 2,
    sizes: [
      { w: 4, h: 6, lengths: [3, 4, 5] },
      { w: 4, h: 8, lengths: [3, 4, 5] },
      { w: 4, h: 10, lengths: [3, 4, 5] },
      { w: 4, h: 12, lengths: [3, 4, 5] },
      { w: 4, h: 14, lengths: [3, 4, 5] },
      { w: 4, h: 16, lengths: [3, 4, 5] },
      { w: 4, h: 20, lengths: [3, 4, 5] },
      { w: 6, h: 6, lengths: [3, 4, 5] },
      { w: 6, h: 8, lengths: [3, 4, 5] },
      { w: 6, h: 10, lengths: [3, 4, 5] },
      { w: 6, h: 12, lengths: [3, 4, 5] },
      { w: 6, h: 14, lengths: [3, 4, 5] },
      { w: 6, h: 16, lengths: [3, 4, 5] },
      { w: 6, h: 18, lengths: [3, 4, 5] },
      { w: 6, h: 20, lengths: [3, 4, 5, 7] },
      { w: 6, h: 24, lengths: [3, 4, 5] },
      { w: 8, h: 8, lengths: [3, 4, 5] },
      { w: 8, h: 10, lengths: [3, 4, 5] },
      { w: 8, h: 12, lengths: [3, 4, 5] },
      { w: 8, h: 14, lengths: [3, 4, 5] },
      { w: 8, h: 16, lengths: [4, 5, 7] },
      { w: 8, h: 18, lengths: [4, 5, 7] },
      { w: 8, h: 20, lengths: [5, 7] },
      { w: 8, h: 24, lengths: [4, 5, 7] },
      { w: 10, h: 10, lengths: [3, 4, 5] },
      { w: 10, h: 12, lengths: [3, 4, 5] },
      { w: 10, h: 14, lengths: [4, 5, 7] },
      { w: 10, h: 16, lengths: [4, 5, 7] },
      { w: 10, h: 18, lengths: [4, 5, 7] },
      { w: 10, h: 20, lengths: [4, 5, 7] },
      { w: 12, h: 12, lengths: [3, 4, 5, 7] },
      { w: 12, h: 14, lengths: [3, 4, 5] },
      { w: 12, h: 16, lengths: [4, 5, 7] },
      { w: 12, h: 20, lengths: [4, 5, 7] },
      { w: 14, h: 14, lengths: [3, 4, 5, 7] },
      { w: 14, h: 18, lengths: [4, 5, 7] },
      { w: 16, h: 16, lengths: [4, 5, 7] },
      { w: 16, h: 20, lengths: [5, 7] },
      { w: 16, h: 24, lengths: [5, 7] },
    ],
  },
  {
    id: 3,
    name: "BSH Si hranoly",
    price: 23000,
    density: 450,
    emailCode: "BSH Si",
    speciesId: 2,
  },
];

const DEFAULT_SPECIES = [
  { id: 1, name: "Smrk – syrový", density: 850 },
  { id: 2, name: "Smrk – sušený", density: 450 },
  { id: 3, name: "Borovice – syrová", density: 920 },
  { id: 4, name: "Borovice – sušená", density: 510 },
  { id: 5, name: "Modřín – syrový", density: 1000 },
  { id: 6, name: "Modřín – sušený", density: 570 },
  { id: 7, name: "Dub – syrový", density: 1050 },
  { id: 8, name: "Dub – sušený", density: 690 },
];

let materials = loadMaterials();
let species = loadSpecies();
let selectedMatId = materials[0]?.id ?? 1;
let orders = []; // [{ id, name, rows: [{ id, w, h, l, n, price }] }]
let nextOrderId = 1;
let nextRowId = 1;
let nextMatId = Math.max(...materials.map((m) => m.id)) + 1;
let calcHistory = [];
let sessionPriceOverride = null; // dočasná cena pro aktuální výpočet (neuloží se)
let sessionDensityOverride = null; // dočasná hustota pro aktuální výpočet (neuloží se)

// ═══════════════════════════════════════════════════
//  PERSISTENCE
// ═══════════════════════════════════════════════════
function loadMaterials() {
  try {
    const s = localStorage.getItem("rezivo_materials");
    if (s) return migrateMaterials(JSON.parse(s));
  } catch (_) {}
  return DEFAULT_MATERIALS.map((m) => JSON.parse(JSON.stringify(m)));
}

// Doplní chybějící emailCode / sizes z výchozích dat (pro starší uložená data)
function migrateMaterials(mats) {
  mats.forEach((m) => {
    const def = DEFAULT_MATERIALS.find((d) => d.id === m.id);
    if (!def) return;
    if (def.emailCode && !m.emailCode) m.emailCode = def.emailCode;
    if (def.sizes && !m.sizes) m.sizes = JSON.parse(JSON.stringify(def.sizes));
    if (def.speciesId !== undefined && m.speciesId === undefined) m.speciesId = def.speciesId;
  });
  // Přidej default materiály které v uložených datech chybí
  DEFAULT_MATERIALS.forEach((def) => {
    if (!mats.find((m) => m.id === def.id)) {
      mats.push(JSON.parse(JSON.stringify(def)));
    }
  });
  // Migrace: přiřadit speciesId podle shody hustoty
  mats.forEach((m) => {
    if (m.speciesId === undefined) {
      const sp = DEFAULT_SPECIES.find((s) => s.density === m.density);
      m.speciesId = sp ? sp.id : null;
    }
  });
  return mats;
}

function saveMaterials() {
  localStorage.setItem("rezivo_materials", JSON.stringify(materials));
}

function loadSpecies() {
  try {
    const s = localStorage.getItem("rezivo_species");
    if (s) {
      const custom = JSON.parse(s);
      const merged = DEFAULT_SPECIES.map((d) => JSON.parse(JSON.stringify(d)));
      custom.forEach((c) => {
        if (!merged.find((m) => m.id === c.id)) merged.push(c);
      });
      return merged;
    }
  } catch (_) {}
  return DEFAULT_SPECIES.map((d) => JSON.parse(JSON.stringify(d)));
}

function saveSpecies() {
  const custom = species.filter(
    (s) => !DEFAULT_SPECIES.find((d) => d.id === s.id),
  );
  localStorage.setItem("rezivo_species", JSON.stringify(custom));
}

// ═══════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════
function getMaterial() {
  return materials.find((m) => m.id === selectedMatId) ?? materials[0];
}

function getDph() {
  return parseFloat(document.getElementById("dphInput").value) || 21;
}

// Parses a number accepting both comma and period as decimal separator.
function parseDecimal(s) {
  return parseFloat(String(s ?? "").replace(",", ".")) || 0;
}

function fmt(n, dec = 0) {
  return n.toLocaleString("cs-CZ", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function fmtDim(n) {
  return n.toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function fmtM3(n) {
  return fmt(n, 3) + "\u00a0m³";
}
function fmtKc(n) {
  return fmt(Math.round(n)) + "\u00a0Kč";
}
function fmtKg(n) {
  return fmt(Math.round(n)) + "\u00a0kg";
}

function showToast(msg, duration = 3500) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), duration);
}

// ═══════════════════════════════════════════════════
//  ZAKÁZKA (poznámka k zakázce)
// ═══════════════════════════════════════════════════
function getZakaz() {
  return document.getElementById("zakazInput")?.value.trim() ?? "";
}

function onZakazChange() {
  const el = document.getElementById("printZakaz");
  if (el) el.textContent = getZakaz();
}

function initZakaz() {
  // pole záměrně začíná prázdné — název zákazníka se nepamatuje mezi sezeními
  // (ukládá se pouze do záznamů historie)
}

// ═══════════════════════════════════════════════════
//  AVAILABILITY CHECK
// ═══════════════════════════════════════════════════
// Vrací: 'ok' | 'no' | null (null = materiál bez sizes = bez kontroly)
function normWH(row) {
  const a = parseDecimal(row.w);
  const b = parseDecimal(row.h);
  return { w: Math.min(a, b), h: Math.max(a, b) };
}

function checkAvailability(row, mat) {
  if (!mat?.sizes?.length) {
    // BSH Si hranoly: větší rozměr (normalizovaná h) musí být násobek 4 cm
    if (mat?.id === BSH_SI_ID) {
      const { w, h } = normWH(row);
      if (w === 0 && h === 0) return null; // prázdný řádek
      return h % 4 === 0 ? "ok" : "no";
    }
    return null;
  }
  const { w, h } = normWH(row);
  const l = parseDecimal(row.l);
  if (w === 0 && h === 0 && l === 0) return null; // prázdný řádek
  const match = mat.sizes.find((s) => s.w === w && s.h === h);
  if (!match) return "no";
  if (l > 0 && !match.lengths.includes(l)) return "no";
  return "ok";
}

// Vrací text hintu pro avail-no řádek
function getAvailHint(row, mat) {
  if (!mat?.sizes?.length) {
    if (mat?.id === BSH_SI_ID) {
      const { h } = normWH(row);
      if (h % 4 !== 0) {
        const lo = Math.floor(h / 4) * 4;
        const hi = Math.ceil(h / 4) * 4;
        return `Výška BSH musí být násobek 4 cm – nejbližší: ${lo > 0 ? lo + ", " : ""}${hi} cm`;
      }
    }
    return "";
  }
  const { w, h } = normWH(row);
  const l = parseDecimal(row.l);

  const match = mat.sizes.find((s) => s.w === w && s.h === h);
  if (match) {
    // Průřez existuje, ale délka je špatná
    return `Délky ${w}×${h} cm: ${match.lengths.map((x) => x + " m").join(", ")}`;
  }

  // Průřez neexistuje – najdi 3 nejbližší (Euklid. vzdálenost, normalizovaně)
  const nearest = [...mat.sizes]
    .map((s) => ({ s, d: Math.hypot(s.w - w, s.h - h) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map(({ s }) => `${s.w}×${s.h}`);
  return nearest.length ? `Nejbližší: ${nearest.join(", ")} cm` : "";
}

// ═══════════════════════════════════════════════════
//  CALCULATION
// ═══════════════════════════════════════════════════
function calcRow(row) {
  const w = parseDecimal(row.w);
  const h = parseDecimal(row.h);
  const l = parseDecimal(row.l);
  const n = parseDecimal(row.n);
  const m3 = (w / 100) * (h / 100) * l * n;
  const mat = getMaterial();
  const dph = getDph() / 100;
  const effPrice =
    parseDecimal(row.price) || (sessionPriceOverride ?? mat.price);
  const effDensity = sessionDensityOverride ?? mat.density;
  return {
    m3,
    priceNoDph: m3 * effPrice,
    priceWithDph: m3 * effPrice * (1 + dph),
    weight: m3 * effDensity,
  };
}

// ═══════════════════════════════════════════════════
//  MATERIAL SELECTOR
// ═══════════════════════════════════════════════════
function renderMaterialSelect() {
  const sel = document.getElementById("materialSelect");
  sel.innerHTML = "";
  materials.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.name;
    if (m.id === selectedMatId) opt.selected = true;
    sel.appendChild(opt);
  });
  syncMaterialInputs();
}

function syncMaterialInputs() {
  const mat = getMaterial();
  if (!mat) return;
  document.getElementById("priceInput").value = mat.price;
  // Sync species select
  const sel = document.getElementById("speciesSelect");
  if (mat.speciesId != null) {
    sel.value = mat.speciesId;
  } else {
    sel.value = "custom";
  }
  // Show/hide density input, update label
  const densityInput = document.getElementById("densityInput");
  if (sel.value === "custom") {
    densityInput.style.display = "";
    densityInput.value = mat.density;
  } else {
    densityInput.style.display = "none";
  }
  updateDensityLabel();
}

function onMaterialChange() {
  selectedMatId = parseInt(document.getElementById("materialSelect").value, 10);
  sessionPriceOverride = null;
  sessionDensityOverride = null;
  syncMaterialInputs();
  updatePriceInputPlaceholders();
  recalcAll();
}

function onPriceChange() {
  sessionPriceOverride =
    parseFloat(document.getElementById("priceInput").value) || null;
  updatePriceInputPlaceholders();
  recalcAll();
}

function onDensityChange() {
  sessionDensityOverride =
    parseFloat(document.getElementById("densityInput").value) || null;
  updateDensityLabel();
  recalcAll();
}

function buildSpeciesOptions(selectedId) {
  let html = "";
  species.forEach((sp) => {
    const sel = sp.id === selectedId ? " selected" : "";
    html += `<option value="${sp.id}"${sel}>${escHtml(sp.name)}</option>`;
  });
  const customSel = selectedId == null ? " selected" : "";
  html += `<option value="custom"${customSel}>Vlastní…</option>`;
  return html;
}

function renderSpeciesSelect() {
  const mat = getMaterial();
  const sel = document.getElementById("speciesSelect");
  sel.innerHTML = buildSpeciesOptions(mat?.speciesId ?? null);
  updateToolbarDensityVisibility();
  updateDensityLabel();
}

function onSpeciesChange() {
  const sel = document.getElementById("speciesSelect");
  const densityInput = document.getElementById("densityInput");
  if (sel.value === "custom") {
    densityInput.style.display = "";
    const mat = getMaterial();
    densityInput.value = sessionDensityOverride ?? mat.density;
    sessionDensityOverride = parseFloat(densityInput.value) || mat.density;
  } else {
    densityInput.style.display = "none";
    const sp = species.find((s) => s.id === parseInt(sel.value));
    const mat = getMaterial();
    if (mat.speciesId === sp?.id) {
      sessionDensityOverride = null;
    } else {
      sessionDensityOverride = sp ? sp.density : null;
    }
  }
  updateDensityLabel();
  recalcAll();
}

function updateDensityLabel() {
  const label = document.getElementById("densityLabel");
  if (!label) return;
  const sel = document.getElementById("speciesSelect");
  if (sel.value === "custom") {
    const val = sessionDensityOverride ?? getMaterial().density;
    label.textContent = val + " kg/m³";
  } else {
    const sp = species.find((s) => s.id === parseInt(sel.value));
    label.textContent = sp ? sp.density + " kg/m³" : "";
  }
}

function updateToolbarDensityVisibility() {
  const sel = document.getElementById("speciesSelect");
  const densityInput = document.getElementById("densityInput");
  densityInput.style.display = sel.value === "custom" ? "" : "none";
}

// ═══════════════════════════════════════════════════
//  TABLE ROWS
// ═══════════════════════════════════════════════════
const FIELDS = ["w", "h", "l", "n"];

function addRow(orderId, w = "", h = "", l = "", n = "") {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;
  const id = nextRowId++;
  const row = { id, w, h, l, n, price: null };
  order.rows.push(row);
  const tbody = document.querySelector(
    `.order-section[data-order-id="${orderId}"] tbody`,
  );
  if (tbody) renderRow(row, orderId, tbody);
  updateTabIndexes();
  recalcSummary();
  const first = document.querySelector(`tr[data-id="${id}"] input`);
  if (first) first.focus();
}

function renderRow(row, orderId, tbody) {
  const tr = document.createElement("tr");
  tr.dataset.id = row.id;
  tr.dataset.orderId = orderId;

  const specs = [
    { key: "w", placeholder: "0", type: "text", inputmode: "decimal" },
    { key: "h", placeholder: "0", type: "text", inputmode: "decimal" },
    { key: "l", placeholder: "0,00", type: "text", inputmode: "decimal" },
    {
      key: "n",
      placeholder: "1",
      type: "number",
      step: "1",
      min: "0",
      inputmode: "numeric",
    },
  ];

  specs.forEach((s) => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = s.type;
    if (s.min !== undefined) input.min = s.min;
    if (s.step !== undefined) input.step = s.step;
    input.placeholder = s.placeholder;
    input.inputMode = s.inputmode;
    if (s.type === "text") {
      input.autocomplete = "off";
      input.autocorrect = "off";
      input.autocapitalize = "off";
      input.spellcheck = false;
    }
    input.value = row[s.key];
    input.dataset.field = s.key;
    input.dataset.rowId = row.id;

    input.addEventListener("input", () => {
      row[s.key] = input.value;
      updateRowCalc(row);
      recalcSummary();
    });
    input.addEventListener("keydown", onInputKeyDown);

    td.appendChild(input);
    tr.appendChild(td);
  });

  // Price override input (col-price – visible only in detailed-prices mode)
  {
    const mat = getMaterial();
    const tdPrice = document.createElement("td");
    tdPrice.className = "col-price no-print";
    const priceInp = document.createElement("input");
    priceInp.type = "text";
    priceInp.inputMode = "numeric";
    priceInp.placeholder = fmt(mat.price);
    priceInp.autocomplete = "off";
    priceInp.autocorrect = "off";
    priceInp.autocapitalize = "off";
    priceInp.spellcheck = false;
    priceInp.value = row.price ?? "";
    priceInp.dataset.field = "price";
    priceInp.dataset.rowId = row.id;
    priceInp.className = "input-price-override";
    priceInp.addEventListener("input", () => {
      row.price = priceInp.value;
      updateRowCalc(row);
      recalcSummary();
    });
    tdPrice.appendChild(priceInp);
    tr.appendChild(tdPrice);
  }

  // Calculated cells
  const calcDefs = [
    { key: "m3", cls: "" },
    { key: "weight", cls: "col-weight" },
    { key: "priceNoDph", cls: "" },
    { key: "priceWithDph", cls: "" },
  ];

  calcDefs.forEach(({ key, cls }) => {
    const td = document.createElement("td");
    td.className = "calc" + (cls ? " " + cls : "");
    td.dataset.calc = key;
    td.textContent = "—";
    tr.appendChild(td);
  });

  // Hint cell (availability hint)
  const tdHint = document.createElement("td");
  tdHint.className = "td-hint no-print";
  tr.appendChild(tdHint);

  // Delete button
  const tdDel = document.createElement("td");
  tdDel.className = "td-del no-print";
  const btn = document.createElement("button");
  btn.className = "btn-del";
  btn.tabIndex = -1;
  btn.title = "Smazat řádek";
  btn.textContent = "×";
  btn.onclick = () => deleteRow(row.id);
  tdDel.appendChild(btn);
  tr.appendChild(tdDel);

  tbody.appendChild(tr);
  updateRowCalc(row);
}

function updateRowCalc(row) {
  const tr = document.querySelector(`tr[data-id="${row.id}"]`);
  if (!tr) return;
  const c = calcRow(row);

  const set = (key, text) => {
    const td = tr.querySelector(`[data-calc="${key}"]`);
    if (!td) return;
    td.textContent = text;
    td.classList.toggle("zero", c.m3 === 0);
  };

  set("m3", fmtM3(c.m3));
  set("priceNoDph", fmtKc(c.priceNoDph));
  set("priceWithDph", fmtKc(c.priceWithDph));
  set("weight", fmtKg(c.weight));

  // Podbarvení vstupů podle dostupnosti u dodavatele
  const avail = checkAvailability(row, getMaterial());
  const hint = avail === "no" ? getAvailHint(row, getMaterial()) : "";
  ["w", "h", "l"].forEach((f) => {
    const inp = tr.querySelector(`input[data-field="${f}"]`);
    if (!inp) return;
    inp.classList.toggle("avail-ok", avail === "ok");
    inp.classList.toggle("avail-no", avail === "no");
    inp.title = hint;
  });

  // Hint buňka
  const tdH = tr.querySelector(".td-hint");
  if (tdH) tdH.textContent = hint;

  // Vizuální označení řádku s vlastní cenou
  tr.classList.toggle(
    "has-price-override",
    row.price !== null &&
      row.price !== undefined &&
      String(row.price).trim() !== "",
  );
}

function deleteRow(id) {
  for (const order of orders) {
    const idx = order.rows.findIndex((r) => r.id === id);
    if (idx !== -1) {
      order.rows.splice(idx, 1);
      break;
    }
  }
  document.querySelector(`tr[data-id="${id}"]`)?.remove();
  updateTabIndexes();
  recalcSummary();
}

function clearAll() {
  if (!confirm("Opravdu vymazat vše?")) return;
  orders = [];
  nextOrderId = 1;
  nextRowId = 1;
  document.getElementById("ordersContainer").innerHTML = "";
  const inp = document.getElementById("zakazInput");
  if (inp) { inp.value = ""; onZakazChange(); }
  addOrder("Zakázka 1");
}

function recalcAll() {
  orders.forEach((order) => order.rows.forEach((row) => updateRowCalc(row)));
  recalcSummary();
}

function calcOrderTotals(order) {
  let m3 = 0,
    noDph = 0,
    withDph = 0,
    kg = 0;
  order.rows.forEach((row) => {
    const c = calcRow(row);
    m3 += c.m3;
    noDph += c.priceNoDph;
    withDph += c.priceWithDph;
    kg += c.weight;
  });
  return { m3, noDph, withDph, kg };
}

function updateOrderSubtotal(order, totals) {
  const tfoot = document.querySelector(
    `.order-section[data-order-id="${order.id}"] tfoot`,
  );
  if (!tfoot) return;
  const t = totals ?? calcOrderTotals(order);
  tfoot.innerHTML = `
    <tr class="order-subtotal">
      <td colspan="4"></td>
      <td class="col-price no-print"></td>
      <td class="calc">${fmtM3(t.m3)}</td>
      <td class="calc col-weight">${fmtKg(t.kg)}</td>
      <td class="calc">${fmtKc(t.noDph)}</td>
      <td class="calc">${fmtKc(t.withDph)}</td>
      <td class="no-print"></td>
      <td class="no-print"></td>
    </tr>
    <tr class="add-row-tr no-print">
      <td colspan="11">
        <button class="btn-primary btn-add-row" onclick="addRow(${order.id})">+ Přidat řádek</button>
      </td>
    </tr>`;
}

function recalcSummary() {
  let m3 = 0,
    noDph = 0,
    withDph = 0,
    kg = 0;
  orders.forEach((order) => {
    const t = calcOrderTotals(order);
    m3 += t.m3;
    noDph += t.noDph;
    withDph += t.withDph;
    kg += t.kg;
    updateOrderSubtotal(order, t);
  });
  document.getElementById("sumM3").textContent = fmtM3(m3);
  document.getElementById("sumNoDph").textContent = fmtKc(noDph);
  document.getElementById("sumWithDph").textContent = fmtKc(withDph);
  document.getElementById("sumWeight").textContent = fmtKg(kg);
  const avgPriceM3 = m3 > 0 ? noDph / m3 : (getMaterial()?.price ?? 0);
  document.getElementById("sumPriceM3").textContent =
    fmt(Math.round(avgPriceM3)) + "\u00a0Kč";
}

// ═══════════════════════════════════════════════════
//  TAB / ENTER NAVIGATION
// ═══════════════════════════════════════════════════
function updateTabIndexes() {
  let ti = 10;
  orders.forEach((order) => {
    order.rows.forEach((row) => {
      FIELDS.forEach((f) => {
        const inp = document.querySelector(
          `tr[data-id="${row.id}"] input[data-field="${f}"]`,
        );
        if (inp) inp.tabIndex = ti++;
      });
    });
  });
}

function onInputKeyDown(e) {
  if (e.key !== "Enter") return;
  e.preventDefault();

  const rowId = parseInt(e.target.dataset.rowId, 10);
  const field = e.target.dataset.field;
  const isLastF = field === "n";

  if (!isLastF) {
    const nextField = FIELDS[FIELDS.indexOf(field) + 1];
    document
      .querySelector(`tr[data-id="${rowId}"] input[data-field="${nextField}"]`)
      ?.focus();
    return;
  }

  // Poslední pole — navigace přes zakázky
  const tr = document.querySelector(`tr[data-id="${rowId}"]`);
  const orderId = parseInt(tr?.dataset.orderId, 10);
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  const isLastRowInOrder = order.rows[order.rows.length - 1]?.id === rowId;
  const isLastOrder = orders[orders.length - 1]?.id === orderId;

  if (isLastRowInOrder && isLastOrder) {
    addRow(orderId);
  } else if (isLastRowInOrder) {
    const nextOrder = orders[orders.findIndex((o) => o.id === orderId) + 1];
    if (nextOrder?.rows.length) {
      document
        .querySelector(
          `tr[data-id="${nextOrder.rows[0].id}"] input[data-field="w"]`,
        )
        ?.focus();
    }
  } else {
    const idx = order.rows.findIndex((r) => r.id === rowId);
    const nxt = order.rows[idx + 1];
    if (nxt) {
      document
        .querySelector(`tr[data-id="${nxt.id}"] input[data-field="w"]`)
        ?.focus();
    }
  }
}

// ═══════════════════════════════════════════════════
//  ORDER MANAGEMENT
// ═══════════════════════════════════════════════════
function createOrderSection(order) {
  const div = document.createElement("div");
  div.className = "order-section";
  div.dataset.orderId = order.id;

  const header = document.createElement("div");
  header.className = "order-header no-print";
  header.innerHTML = `
    <input class="order-name" type="text" value="${escHtml(order.name)}"
           title="Název zakázky" onchange="renameOrder(${order.id}, this.value)">
    <button class="btn-danger btn-del-order" onclick="deleteOrder(${order.id})">× Zakázka</button>
  `;

  const printName = document.createElement("div");
  printName.className = "order-name-print print-only";
  printName.textContent = order.name;

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "table-wrapper";

  const table = document.createElement("table");
  table.innerHTML = `
    <thead><tr>
      <th>šířka [cm]</th>
      <th>výška [cm]</th>
      <th>délka [m]</th>
      <th>počet [ks]</th>
      <th class="col-price no-print" title="Vlastní cena Kč/m³ pro tento řádek – přepíše výchozí cenu materiálu">vl. cena</th>
      <th>m³</th>
      <th class="col-weight">hmotnost [kg]</th>
      <th>bez daně</th>
      <th>s daní</th>
      <th class="col-hint no-print"></th>
      <th class="col-del no-print"></th>
    </tr></thead>
    <tbody></tbody>
    <tfoot></tfoot>
  `;

  tableWrapper.appendChild(table);
  div.appendChild(header);
  div.appendChild(printName);
  div.appendChild(tableWrapper);
  return div;
}

function addOrder(name) {
  const id = nextOrderId++;
  const order = { id, name: name ?? `Zakázka ${id}`, rows: [] };
  orders.push(order);
  document
    .getElementById("ordersContainer")
    .appendChild(createOrderSection(order));
  addRow(id);
}

function deleteOrder(orderId) {
  if (orders.length <= 1) {
    showToast("Nelze smazat poslední zakázku.");
    return;
  }
  const order = orders.find((o) => o.id === orderId);
  if (
    order?.rows.length &&
    !confirm(
      `Opravdu smazat zakázku „${order.name}" včetně ${order.rows.length} řádků?`,
    )
  )
    return;
  orders = orders.filter((o) => o.id !== orderId);
  document
    .querySelector(`.order-section[data-order-id="${orderId}"]`)
    ?.remove();
  updateTabIndexes();
  recalcSummary();
}

function renameOrder(orderId, name) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;
  order.name = name;
  const printEl = document.querySelector(
    `.order-section[data-order-id="${orderId}"] .order-name-print`,
  );
  if (printEl) printEl.textContent = name;
}

// ═══════════════════════════════════════════════════
//  MODAL: MANAGE MATERIALS
// ═══════════════════════════════════════════════════
function openSettings() {
  materials = loadMaterials();
  species = loadSpecies();
  renderMaterialTable();
  renderSizesSection();
  renderSpeciesSettingsTable();
  const dphEl = document.getElementById("dphInput");
  dphEl._savedValue = dphEl.value;
  document.getElementById("settingsModalOverlay").classList.add("open");
}

function saveSettings() {
  saveMaterials();
  saveSpecies();
  document.getElementById("settingsModalOverlay").classList.remove("open");
  renderMaterialSelect();
  renderSpeciesSelect();
  recalcAll();
}

function cancelSettings() {
  const dphEl = document.getElementById("dphInput");
  dphEl.value = dphEl._savedValue || "21";
  materials = loadMaterials();
  species = loadSpecies();
  document.getElementById("settingsModalOverlay").classList.remove("open");
  renderMaterialSelect();
  renderSpeciesSelect();
  recalcAll();
}

function closeSettingsOutside(e) {
  if (e.target === e.currentTarget) cancelSettings();
}

function renderMaterialTable() {
  const tbody = document.getElementById("materialTableBody");
  tbody.innerHTML = "";
  materials.forEach((m) => {
    const tr = document.createElement("tr");
    const isCustom = m.speciesId == null;
    const sp = !isCustom ? species.find((s) => s.id === m.speciesId) : null;
    tr.innerHTML = `
      <td><input type="text"   value="${escHtml(m.name)}"          data-mid="${m.id}" data-field="name"      onchange="updateMat(this)"></td>
      <td><input type="text"   value="${escHtml(m.emailCode || "")}" data-mid="${m.id}" data-field="emailCode" onchange="updateMat(this)" placeholder="zkratka" maxlength="30" style="width:90px"></td>
      <td><input type="number" value="${m.price}"   min="0" step="100" data-mid="${m.id}" data-field="price"   onchange="updateMat(this)" style="text-align:right"></td>
      <td class="species-cell">
        <select data-mid="${m.id}" data-field="speciesId" onchange="updateMat(this)">
          ${buildSpeciesOptions(m.speciesId)}
        </select>
        ${
          isCustom
            ? `<input type="number" value="${m.density}" min="0" step="10" data-mid="${m.id}" data-field="density" onchange="updateMat(this)" style="text-align:right;width:80px">`
            : `<span class="density-info">${sp ? sp.density + " kg/m³" : ""}</span>`
        }
      </td>
      <td><button class="btn-del" onclick="deleteMaterial(${m.id})" tabindex="-1"
           ${materials.length <= 1 ? 'disabled title="Nelze smazat poslední typ"' : ""}>×</button></td>
    `;
    tbody.appendChild(tr);
  });
  // Update add-form species select
  const addSel = document.getElementById("newSpeciesId");
  if (addSel) {
    const prev = addSel.value;
    addSel.innerHTML = buildSpeciesOptions(species[0]?.id ?? null);
    if (prev && addSel.querySelector(`option[value="${prev}"]`))
      addSel.value = prev;
    onNewSpeciesChange();
  }
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function updateMat(input) {
  const id = parseInt(input.dataset.mid, 10);
  const mat = materials.find((m) => m.id === id);
  if (!mat) return;
  const f = input.dataset.field;
  if (f === "name") mat.name = input.value;
  if (f === "emailCode") mat.emailCode = input.value;
  if (f === "price") mat.price = parseFloat(input.value) || 0;
  if (f === "speciesId") {
    if (input.value === "custom") {
      mat.speciesId = null;
    } else {
      mat.speciesId = parseInt(input.value);
      const sp = species.find((s) => s.id === mat.speciesId);
      if (sp) mat.density = sp.density;
    }
    renderMaterialTable();
    saveMaterials();
    return;
  }
  if (f === "density") mat.density = parseFloat(input.value) || 0;
  saveMaterials();
}

function addMaterial() {
  const name = document.getElementById("newName").value.trim();
  const emailCode = document.getElementById("newEmailCode").value.trim();
  const price = parseFloat(document.getElementById("newPrice").value) || 0;
  const speciesSel = document.getElementById("newSpeciesId");
  let speciesId = null;
  let density = 0;
  if (speciesSel.value === "custom") {
    density = parseFloat(document.getElementById("newDensity").value) || 0;
  } else {
    speciesId = parseInt(speciesSel.value);
    const sp = species.find((s) => s.id === speciesId);
    density = sp ? sp.density : 0;
  }
  if (!name) {
    alert("Zadejte název materiálu.");
    return;
  }
  materials.push({
    id: nextMatId++,
    name,
    emailCode,
    price,
    density,
    speciesId,
  });
  saveMaterials();
  document.getElementById("newName").value = "";
  document.getElementById("newEmailCode").value = "";
  document.getElementById("newPrice").value = "";
  document.getElementById("newDensity").value = "";
  renderMaterialTable();
  renderSizesSection();
}

function onNewSpeciesChange() {
  const sel = document.getElementById("newSpeciesId");
  const densityField = document.getElementById("newDensityField");
  if (densityField)
    densityField.style.display = sel.value === "custom" ? "" : "none";
}

function deleteMaterial(id) {
  if (materials.length <= 1) return;
  if (!confirm("Opravdu smazat tento typ?")) return;
  materials = materials.filter((m) => m.id !== id);
  if (selectedMatId === id) selectedMatId = materials[0].id;
  saveMaterials();
  renderMaterialTable();
}

// ═══════════════════════════════════════════════════
//  MODAL: SIZES MANAGEMENT
// ═══════════════════════════════════════════════════
function renderSizesSection() {
  const sel = document.getElementById("sizesMaterialSelect");
  const prevId = sel.value ? parseInt(sel.value, 10) : null;
  sel.innerHTML = "";

  const matsWithSizes = materials.filter((m) => Array.isArray(m.sizes));
  const section = document.getElementById("sizesSection");
  section.hidden = !matsWithSizes.length;
  if (!matsWithSizes.length) return;

  matsWithSizes.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.name;
    if (m.id === prevId) opt.selected = true;
    sel.appendChild(opt);
  });
  renderSizesTable();
}

function renderSizesTable() {
  const sel = document.getElementById("sizesMaterialSelect");
  const matId = parseInt(sel.value, 10);
  const mat = materials.find((m) => m.id === matId);
  const tbody = document.getElementById("sizesTableBody");
  tbody.innerHTML = "";
  if (!mat?.sizes) return;

  mat.sizes.forEach((s, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align:right">${s.w}</td>
      <td style="text-align:right">${s.h}</td>
      <td><input type="text" value="${s.lengths.join(", ")}"
                 style="width:130px"
                 title="Dostupné délky v metrech"
                 onchange="updateSizeLengths(${matId}, ${idx}, this.value)"></td>
      <td><button class="btn-del" onclick="deleteSize(${matId}, ${idx})" tabindex="-1">×</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateSizeLengths(matId, idx, val) {
  const mat = materials.find((m) => m.id === matId);
  if (!mat?.sizes?.[idx]) return;
  const lengths = val
    .split(",")
    .map((v) => parseFloat(v.trim()))
    .filter((v) => !isNaN(v) && v > 0);
  mat.sizes[idx].lengths = lengths;
  saveMaterials();
  recalcAll();
}

function addSize() {
  const sel = document.getElementById("sizesMaterialSelect");
  const matId = parseInt(sel.value, 10);
  const mat = materials.find((m) => m.id === matId);
  if (!mat) return;

  const w = parseFloat(document.getElementById("newSizeW").value);
  const h = parseFloat(document.getElementById("newSizeH").value);
  const lengthsStr = document.getElementById("newSizeLengths").value;
  if (!w || !h) {
    alert("Zadejte šířku a výšku průřezu.");
    return;
  }

  const lengths = lengthsStr
    .split(",")
    .map((v) => parseFloat(v.trim()))
    .filter((v) => !isNaN(v) && v > 0);
  if (!lengths.length) {
    alert("Zadejte alespoň jednu dostupnou délku.");
    return;
  }

  if (!mat.sizes) mat.sizes = [];
  if (mat.sizes.find((s) => s.w === w && s.h === h)) {
    alert(`Průřez ${w} × ${h} cm již v seznamu existuje.`);
    return;
  }

  mat.sizes.push({ w, h, lengths });
  mat.sizes.sort((a, b) => (a.w !== b.w ? a.w - b.w : a.h - b.h));
  saveMaterials();
  document.getElementById("newSizeW").value = "";
  document.getElementById("newSizeH").value = "";
  document.getElementById("newSizeLengths").value = "";
  renderSizesTable();
  recalcAll();
}

function deleteSize(matId, idx) {
  const mat = materials.find((m) => m.id === matId);
  if (!mat?.sizes) return;
  mat.sizes.splice(idx, 1);
  saveMaterials();
  renderSizesTable();
  recalcAll();
}

// ═══════════════════════════════════════════════════
//  SPECIES MANAGEMENT
// ═══════════════════════════════════════════════════
function renderSpeciesSettingsTable() {
  const tbody = document.getElementById("speciesTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  species.forEach((sp) => {
    const isDefault = !!DEFAULT_SPECIES.find((d) => d.id === sp.id);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escHtml(sp.name)}</td>
      <td style="text-align:right">${sp.density}</td>
      <td>${isDefault ? "" : `<button class="btn-del" onclick="deleteSpecies(${sp.id})" tabindex="-1">×</button>`}</td>
    `;
    tbody.appendChild(tr);
  });
}

function addSpecies() {
  const name = document.getElementById("newSpeciesName").value.trim();
  const density =
    parseFloat(document.getElementById("newSpeciesDensity").value) || 0;
  if (!name) {
    alert("Zadejte název dřeviny.");
    return;
  }
  if (density <= 0) {
    alert("Zadejte hustotu.");
    return;
  }
  const newId = Math.max(...species.map((s) => s.id), 100) + 1;
  species.push({ id: newId, name, density });
  document.getElementById("newSpeciesName").value = "";
  document.getElementById("newSpeciesDensity").value = "";
  renderSpeciesSettingsTable();
  renderMaterialTable();
}

function deleteSpecies(id) {
  if (DEFAULT_SPECIES.find((d) => d.id === id)) return;
  if (!confirm("Opravdu smazat tuto dřevinu?")) return;
  species = species.filter((s) => s.id !== id);
  materials.forEach((m) => {
    if (m.speciesId === id) m.speciesId = null;
  });
  renderSpeciesSettingsTable();
  renderMaterialTable();
}

// ═══════════════════════════════════════════════════
//  EXPORT HELPERS
// ═══════════════════════════════════════════════════
function weightIncluded() {
  return document.getElementById("chkWeight").checked;
}

function detailedPrices() {
  return document.getElementById("chkDetailedPrices").checked;
}

function toggleDetailedPrices() {
  const on = detailedPrices();
  document
    .getElementById("ordersContainer")
    .classList.toggle("detailed-prices", on);
  updatePriceInputPlaceholders();
}

function updatePriceInputPlaceholders() {
  const mat = getMaterial();
  document.querySelectorAll(".input-price-override").forEach((inp) => {
    inp.placeholder = fmt(mat.price);
  });
}

// ═══════════════════════════════════════════════════
//  EXPORT: PRINT / PDF
// ═══════════════════════════════════════════════════
function exportPDF() {
  const mat = getMaterial();
  const dph = getDph();
  const inclWght = weightIncluded();
  const dateStr = new Date().toLocaleDateString("cs-CZ");
  const zakaz = getZakaz();

  // Summary totals
  let totM3 = 0,
    totNoDph = 0,
    totWithDph = 0,
    totKg = 0;
  orders.forEach((order) => {
    const t = calcOrderTotals(order);
    totM3 += t.m3;
    totNoDph += t.noDph;
    totWithDph += t.withDph;
    totKg += t.kg;
  });

  const avgPriceM3Pdf = totM3 > 0 ? totNoDph / totM3 : (mat?.price ?? 0);

  // Styles matching the app's @media print CSS
  const S = {
    th: "padding:6px 8px;background:#f0f0f0;border-bottom:1px solid #ccc;text-align:right;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#444;font-weight:600;white-space:nowrap;",
    td: "padding:5px 8px;border-bottom:1px solid #eee;text-align:right;font-size:13px;color:#111;white-space:nowrap;",
    tdInput:
      "padding:5px 8px;border-bottom:1px solid #eee;text-align:right;font-size:13px;color:#111;white-space:nowrap;",
    tfTd: "padding:5px 8px;text-align:right;font-size:14px;font-weight:700;color:#111;border-top:2px solid #1d6f42;",
  };

  const th = (label) => `<th style="${S.th}">${label}</th>`;
  const tfTd = (v) => `<td style="${S.tfTd}">${v}</td>`;

  const colCount = 4 + 3 + (inclWght ? 1 : 0);
  const multiOrder = orders.length > 1;
  const rowsHtml = orders
    .map((order) => {
      const orderHeader = multiOrder
        ? `<tr><td colspan="${colCount}" style="padding:5px 8px;font-weight:700;font-size:12px;background:#f0f0f0;border-top:1px solid #ccc;">${escHtml(order.name)}</td></tr>`
        : "";
      const orderRows = order.rows
        .map((row) => {
          const c = calcRow(row);
          const w = parseDecimal(row.w);
          const h = parseDecimal(row.h);
          const l = parseDecimal(row.l);
          const n = parseDecimal(row.n);
          if (w === 0 && h === 0 && l === 0 && n === 0) return "";
          return `<tr>
        <td style="${S.tdInput}">${fmtDim(w)}</td>
        <td style="${S.tdInput}">${fmtDim(h)}</td>
        <td style="${S.tdInput}">${fmt(l, 2)}</td>
        <td style="${S.tdInput}">${fmt(n, 0)}</td>
        <td style="${S.td}">${fmtM3(c.m3)}</td>
        ${inclWght ? `<td style="${S.td}">${fmtKg(c.weight)}</td>` : ""}
        <td style="${S.td}">${fmtKc(c.priceNoDph)}</td>
        <td style="${S.td}">${fmtKc(c.priceWithDph)}</td>
      </tr>`;
        })
        .join("");
      if (!multiOrder) return orderRows;
      const ot = calcOrderTotals(order);
      const subtotal = `<tr>
      <td colspan="4" style="padding:4px 8px;font-size:11px;font-style:italic;color:#666;border-top:1px dashed #ccc;">Mezisoučet</td>
      <td style="${S.td};border-top:1px dashed #ccc;">${fmtM3(ot.m3)}</td>
      ${inclWght ? `<td style="${S.td};border-top:1px dashed #ccc;">${fmtKg(ot.kg)}</td>` : ""}
      <td style="${S.td};border-top:1px dashed #ccc;">${fmtKc(ot.noDph)}</td>
      <td style="${S.td};border-top:1px dashed #ccc;">${fmtKc(ot.withDph)}</td>
    </tr>`;
      return orderHeader + orderRows + subtotal;
    })
    .join("");

  // Stat bar items matching the screen layout
  const statItem = (lbl, val, accent) => `
    <div style="display:inline-block;padding:6px 16px 6px 0;margin-right:16px;${accent ? "border-left:3px solid #1d6f42;padding-left:10px;" : "border-right:1px solid #e0e0e0;"}">
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#999;font-weight:600;">${lbl}</div>
      <div style="font-size:13px;font-weight:700;color:#111;">${val}</div>
    </div>`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;color:#111;background:#fff;color-scheme:light;">

      <!-- Hlavička firmy -->
      <div style="display:flex;justify-content:space-between;align-items:stretch;background:#1d6f42;color:#fff;border-radius:6px 6px 0 0;margin-bottom:0;">
        <div style="padding:12px 16px;">
          <div style="font-size:18px;font-weight:800;letter-spacing:-.02em;line-height:1.1;">SAMYCO</div>
          <div style="font-size:11px;font-weight:500;opacity:.9;margin-top:2px;">Rudolf Houfek</div>
        </div>
        <div style="background:rgba(0,0,0,.15);width:1px;margin:10px 0;"></div>
        <div style="padding:12px 16px;text-align:right;font-size:10.5px;opacity:.92;line-height:1.7;">
          <div>Pražská 422/133, Č. Budějovice</div>
          <div>www.samyco.cz</div>
        </div>
      </div>

      <!-- Header -->
      <div style="display:flex;align-items:baseline;gap:10px;padding:8px 0 8px;border-bottom:1px solid #ccc;margin-bottom:0;margin-top:10px;">
        <span style="font-size:14px;font-weight:700;letter-spacing:-.01em;">Kalkulačka řeziva</span>
        <span style="font-size:11px;color:#999;">kubatura · ceny · hmotnost</span>
      </div>

      <!-- Stat bar -->
      <div style="padding:6px 0;border-bottom:1px solid #ccc;margin-bottom:6px;">
        ${statItem("Cena za m³ bez DPH", fmt(Math.round(avgPriceM3Pdf)) + "\u00a0Kč", false)}
        ${statItem("Celkem m³", fmtM3(totM3), false)}
        ${statItem("Celkem bez DPH", fmtKc(totNoDph), false)}
        ${inclWght ? statItem("Celková hmotnost", fmtKg(totKg), false) : ""}
        ${statItem("Celkem s DPH", fmtKc(totWithDph), true)}
      </div>

      <!-- Print meta -->
      <div style="margin-bottom:10px;">
        ${zakaz ? `<div style="font-size:13px;font-weight:600;color:#333;margin-bottom:3px;">${escHtml(zakaz)}</div>` : ""}
        <div style="font-size:16px;font-weight:700;color:#1d6f42;letter-spacing:-.01em;margin-bottom:4px;">${escHtml(mat?.name ?? "")}</div>
        <div style="font-size:10px;color:#666;">
          <strong style="color:#444;">Cena za m³ bez DPH:</strong> ${fmt(Math.round(avgPriceM3Pdf))} Kč &emsp;
          <strong style="color:#444;">DPH:</strong> ${dph} % &emsp;
          <strong style="color:#444;">Datum:</strong> ${dateStr}
        </div>
      </div>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f8f8f8;">
          ${th("šířka [cm]")}${th("výška [cm]")}${th("délka [m]")}${th("počet [ks]")}
          ${th("m³")}${inclWght ? th("hmotnost [kg]") : ""}${th("bez daně")}${th("s daní")}
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot><tr>
          <td colspan="4" style="padding:5px 8px;font-weight:700;font-size:14px;border-top:2px solid #1d6f42;">Celkem</td>
          ${tfTd(fmtM3(totM3))}${inclWght ? tfTd(fmtKg(totKg)) : ""}${tfTd(fmtKc(totNoDph))}${tfTd(fmtKc(totWithDph))}
        </tr></tfoot>
      </table>
    </div>`;

  const filename = `kalkulacka-reziva-${dateStr.replace(/\./g, "-")}.pdf`;

  saveToHistory(true);
  html2pdf()
    .from(html)
    .set({
      margin: [10, 10, 10, 10],
      filename,
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", windowWidth: 900 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .save();
}

// ═══════════════════════════════════════════════════
//  EXPORT: EMAIL (mailto s fallbackem na clipboard)
// ═══════════════════════════════════════════════════
function buildEmailText() {
  const mat = getMaterial();
  const dph = getDph();
  const inclWght = weightIncluded();
  const pad = (s, n) => String(s).padStart(n);

  const colHeader = () => {
    let h = `Šířka[cm]  Výška[cm]  Délka[m]  Počet     m³     `;
    if (inclWght) h += `   Hmot.[kg]`;
    h += `   Bez DPH       S DPH    `;
    return h + "\n";
  };

  let body = "";
  orders.forEach((order) => {
    if (orders.length > 1) body += `\n--- ${order.name} ---\n`;
    body += colHeader();
    let oM3 = 0,
      oNoDph = 0,
      oWithDph = 0,
      oKg = 0;
    order.rows
      .filter(
        (row) =>
          parseDecimal(row.w) > 0 ||
          parseDecimal(row.n) > 0 ||
          parseDecimal(row.l) > 0,
      )
      .forEach((row) => {
        const c = calcRow(row);
        oM3 += c.m3;
        oNoDph += c.priceNoDph;
        oWithDph += c.priceWithDph;
        oKg += c.weight;
        let cols = [
          pad(parseDecimal(row.w), 9),
          pad(parseDecimal(row.h), 9),
          pad(parseDecimal(row.l), 8),
          pad(parseDecimal(row.n), 7),
          pad(fmtM3(c.m3), 10),
        ];
        if (inclWght) cols.push(pad(fmtKg(c.weight), 10));
        cols.push(pad(fmtKc(c.priceNoDph), 13));
        cols.push(pad(fmtKc(c.priceWithDph), 12));
        let r = cols.join("  ");
        body += r + "\n";
      });
    if (orders.length > 1) {
      body += `Mezisoučet: ${fmtM3(oM3)}   Bez DPH: ${fmtKc(oNoDph)}   S DPH: ${fmtKc(oWithDph)}`;
      if (inclWght) body += `   ${fmtKg(oKg)}`;
      body += "\n";
    }
  });

  let footer =
    `\nCelkem m³:        ${document.getElementById("sumM3").textContent}\n` +
    `Celkem bez DPH:   ${document.getElementById("sumNoDph").textContent}\n` +
    `Celkem s DPH:     ${document.getElementById("sumWithDph").textContent}\n`;
  if (inclWght)
    footer += `Celková hmotnost: ${document.getElementById("sumWeight").textContent}\n`;

  return (
    `Kalkulace řeziva\n` +
    `================\n\n` +
    `Materiál: ${mat?.name}\n` +
    `Cena za m³ bez DPH: ${document.getElementById("sumPriceM3").textContent}\n` +
    `DPH: ${dph}%\n` +
    `Datum: ${new Date().toLocaleDateString("cs-CZ")}\n` +
    body +
    footer
  );
}

function openEmailModal() {
  saveToHistory(true);
  const overlay = document.getElementById("emailModalOverlay");
  overlay.classList.add("open");
  document.getElementById("emailFormat").value = "quote";
  const text = buildQuoteEmailText();
  document.getElementById("emailText").value = text;
  updateMailtoButton(text);
  autoClipboard(text);
}

function onEmailFormatChange() {
  const format = document.getElementById("emailFormat").value;
  let text;
  if (format === "quote") text = buildQuoteEmailText();
  else if (format === "production") text = buildProductionOrderText();
  else text = buildEmailText();
  document.getElementById("emailText").value = text;
  updateMailtoButton(text);
}

function autoClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Zkopírováno do schránky.");
    });
  }
}

function copyEmailText() {
  const text = document.getElementById("emailText").value;
  const btn = document.getElementById("btnCopy");
  const status = document.getElementById("copyStatus");
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add("btn-copied");
      status.textContent = "✓ Zkopírováno";
      setTimeout(() => {
        btn.classList.remove("btn-copied");
        status.textContent = "";
      }, 2000);
    });
  }
}

function updateMailtoButton(text) {
  const mat = getMaterial();
  const subj = encodeURIComponent(`Kalkulace řeziva – ${mat?.name}`);
  const link = `mailto:?subject=${subj}&body=${encodeURIComponent(text)}`;
  document.getElementById("btnMailto").style.display =
    link.length <= 1900 ? "" : "none";
}

function openEmailMailto() {
  const text = document.getElementById("emailText").value;
  const mat = getMaterial();
  const subj = encodeURIComponent(`Kalkulace řeziva – ${mat?.name}`);
  const link = `mailto:?subject=${subj}&body=${encodeURIComponent(text)}`;
  const a = document.createElement("a");
  a.href = link;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function closeEmailModal() {
  document.getElementById("emailModalOverlay").classList.remove("open");
}

function closeEmailModalOutside(event) {
  if (event.target === document.getElementById("emailModalOverlay")) {
    closeEmailModal();
  }
}

// ═══════════════════════════════════════════════════
//  EXPORT: CENOVÁ NABÍDKA (jednoduchý formát pro zákazníka)
// ═══════════════════════════════════════════════════
function buildQuoteEmailText() {
  const mat = getMaterial();
  const label = mat.emailCode?.trim() || mat.name;

  let sections = [];
  let grandTotal = 0;

  orders.forEach((order) => {
    const lines = order.rows
      .filter((r) => parseDecimal(r.w) > 0 && parseDecimal(r.n) > 0)
      .map((r) => {
        const w = parseDecimal(r.w);
        const h = parseDecimal(r.h);
        const l = parseDecimal(r.l);
        const n = parseDecimal(r.n);
        const c = calcRow(r);
        const price = Math.round(c.priceWithDph);
        grandTotal += price;
        const lCm = Math.round(l * 100);
        return `${label} ${w} x ${h} x ${lCm} cm - ${n} ks - ${fmt(price)},- Kč vč. DPH`;
      });
    if (lines.length) {
      const section =
        orders.length > 1
          ? `${order.name}:\n${lines.join("\n")}`
          : lines.join("\n");
      sections.push(section);
    }
  });

  return [
    "Dobrý den,",
    "zasílám cenovou nabídku:",
    "",
    ...sections.flatMap((s, i) => (i < sections.length - 1 ? [s, ""] : [s])),
    "",
    `Celkem ${fmt(Math.round(grandTotal))},- Kč vč. DPH`,
  ].join("\n");
}

// ═══════════════════════════════════════════════════
//  EXPORT: OBJEDNÁVKA VÝROBY (jen rozměry, bez cen)
// ═══════════════════════════════════════════════════
function buildProductionOrderText() {
  const mat = getMaterial();
  const dateStr = new Date().toLocaleDateString("cs-CZ");
  let body = `Objednávka materiálu – ${mat?.name}\nDatum: ${dateStr}\n`;
  let grandM3 = 0;

  orders.forEach((order) => {
    const validRows = order.rows.filter(
      (r) => parseDecimal(r.w) > 0 && parseDecimal(r.n) > 0,
    );
    if (!validRows.length) return;
    if (orders.length > 1) body += `\n=== ${order.name} ===\n`;
    let orderM3 = 0;
    validRows.forEach((r) => {
      const w = parseDecimal(r.w);
      const h = parseDecimal(r.h);
      const l = parseDecimal(r.l);
      const n = parseDecimal(r.n);
      const { m3 } = calcRow(r);
      orderM3 += m3;
      const lCm = Math.round(l * 100);
      body += `${w} \u00d7 ${h} \u00d7 ${lCm} cm  \u2013  ${n} ks\n`;
    });
    grandM3 += orderM3;
    if (orders.length > 1) body += `Kubatura: ${fmtM3(orderM3)}\n`;
  });

  body += `\nCelkem: ${fmtM3(grandM3)}\n`;
  return body;
}

// ═══════════════════════════════════════════════════
//  HISTORY (historie výpočtů)
// ═══════════════════════════════════════════════════
const HISTORY_MAX = 20;
const HISTORY_KEY = "rezivo_history";

function loadHistory() {
  try {
    const s = localStorage.getItem(HISTORY_KEY);
    if (s) return JSON.parse(s);
  } catch (_) {}
  return [];
}

function persistHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(calcHistory));
}

function saveToHistory(silent = false) {
  const hasRows = orders.some((o) => o.rows.length > 0);
  if (!hasRows) {
    if (!silent) showToast("Nic k uložení.");
    return;
  }
  const mat = getMaterial();
  let totM3 = 0,
    totWithDph = 0;
  orders.forEach((order) => {
    const t = calcOrderTotals(order);
    totM3 += t.m3;
    totWithDph += t.withDph;
  });

  const entry = {
    id: Date.now(),
    savedAt: new Date().toLocaleString("cs-CZ"),
    note: getZakaz(),
    materialName: mat?.name ?? "",
    materialPrice: mat?.price ?? 0,
    dph: getDph(),
    totM3,
    totWithDph,
    orders: JSON.parse(JSON.stringify(orders)),
  };

  calcHistory.unshift(entry);
  if (calcHistory.length > HISTORY_MAX)
    calcHistory = calcHistory.slice(0, HISTORY_MAX);
  persistHistory();
  if (!silent) showToast("Výpočet uložen do historie.");
}

function openHistoryModal() {
  renderHistoryList();
  document.getElementById("historyModalOverlay").classList.add("open");
}

function closeHistoryModal() {
  document.getElementById("historyModalOverlay").classList.remove("open");
}

function closeHistoryModalOutside(e) {
  if (e.target === document.getElementById("historyModalOverlay"))
    closeHistoryModal();
}

function renderHistoryList() {
  const ul = document.getElementById("historyList");
  ul.innerHTML = "";
  if (!calcHistory.length) {
    ul.innerHTML = '<li class="history-empty">Žádné uložené výpočty.</li>';
    return;
  }
  calcHistory.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `
      <div class="history-item-meta">
        <span class="history-date">${escHtml(entry.savedAt)}</span>
        ${entry.note ? `<span class="history-note">${escHtml(entry.note)}</span>` : ""}
      </div>
      <div class="history-item-detail">
        <span class="history-material">${escHtml(entry.materialName)}</span>
        <span class="history-totals">${fmtM3(entry.totM3)} &middot; ${fmtKc(entry.totWithDph)} s&nbsp;DPH</span>
      </div>
      <div class="history-item-actions">
        <button class="btn-action history-btn-restore" onclick="restoreFromHistory(${entry.id})">Načíst</button>
        <button class="btn-del history-btn-del" onclick="deleteFromHistory(${entry.id})" title="Smazat záznam">×</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

function restoreFromHistory(id) {
  const entry = calcHistory.find((e) => e.id === id);
  if (!entry) return;
  const label = entry.note || entry.savedAt;
  if (!confirm(`Načíst výpočet „${label}"?\nAktuální tabulka bude přepsána.`))
    return;

  orders = [];
  nextOrderId = 1;
  nextRowId = 1;
  document.getElementById("ordersContainer").innerHTML = "";

  const savedOrders = entry.orders ?? [
    { id: 1, name: entry.note || "Zakázka 1", rows: entry.rows ?? [] },
  ];

  savedOrders.forEach((savedOrder) => {
    const oid = nextOrderId++;
    const order = {
      id: oid,
      name: savedOrder.name ?? `Zakázka ${oid}`,
      rows: [],
    };
    orders.push(order);
    const section = createOrderSection(order);
    document.getElementById("ordersContainer").appendChild(section);
    const tbody = section.querySelector("tbody");
    savedOrder.rows.forEach((savedRow) => {
      const rid = nextRowId++;
      const row = { ...savedRow, id: rid };
      order.rows.push(row);
      renderRow(row, oid, tbody);
    });
  });

  updateTabIndexes();
  const inp = document.getElementById("zakazInput");
  if (inp) {
    inp.value = entry.note ?? "";
    onZakazChange();
  }
  recalcAll();
  updatePriceInputPlaceholders();
  closeHistoryModal();
  showToast("Výpočet načten z historie.");
}

function deleteFromHistory(id) {
  calcHistory = calcHistory.filter((e) => e.id !== id);
  persistHistory();
  renderHistoryList();
}

function clearHistory() {
  if (!confirm("Opravdu smazat celou historii výpočtů?")) return;
  calcHistory = [];
  persistHistory();
  renderHistoryList();
}

// ═══════════════════════════════════════════════════
//  DARK MODE
// ═══════════════════════════════════════════════════
function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? "dark" : "";
  document.getElementById("themeToggle").textContent = dark ? "☀️" : "🌙";
}

function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === "dark";
  const next = !isDark;
  localStorage.setItem("app_theme", next ? "dark" : "light");
  applyTheme(next);
}

function initTheme() {
  const saved = localStorage.getItem("app_theme");
  if (saved) {
    applyTheme(saved === "dark");
  } else {
    applyTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
}

// ═══════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════
(function init() {
  calcHistory = loadHistory();
  initTheme();
  initZakaz();
  renderSpeciesSelect();
  renderMaterialSelect();
  addOrder("Zakázka 1");
})();
