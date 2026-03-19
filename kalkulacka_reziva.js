// ═══════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════
const DEFAULT_MATERIALS = [
  { id: 1, name: "Stavební řezivo", price: 11500, density: 550 },
  {
    id: 2,
    name: "KVH hranoly",
    price: 16500,
    density: 450,
    emailCode: "KVH NSi",
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
  },
];

let materials = loadMaterials();
let selectedMatId = materials[0]?.id ?? 1;
let rows = []; // { id, w, h, l, n }
let nextRowId = 1;
let nextMatId = Math.max(...materials.map((m) => m.id)) + 1;

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
  });
  return mats;
}

function saveMaterials() {
  localStorage.setItem("rezivo_materials", JSON.stringify(materials));
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

function fmt(n, dec = 0) {
  return n.toLocaleString("cs-CZ", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
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
//  AVAILABILITY CHECK
// ═══════════════════════════════════════════════════
// Vrací: 'ok' | 'no' | null (null = materiál bez sizes = bez kontroly)
function normWH(row) {
  const a = parseFloat(row.w) || 0;
  const b = parseFloat(row.h) || 0;
  return { w: Math.min(a, b), h: Math.max(a, b) };
}

function checkAvailability(row, mat) {
  if (!mat?.sizes?.length) return null;
  const { w, h } = normWH(row);
  const l = parseFloat(row.l) || 0;
  if (w === 0 && h === 0 && l === 0) return null; // prázdný řádek
  const match = mat.sizes.find((s) => s.w === w && s.h === h);
  if (!match) return "no";
  if (l > 0 && !match.lengths.includes(l)) return "no";
  return "ok";
}

// Vrací text hintu pro avail-no řádek
function getAvailHint(row, mat) {
  if (!mat?.sizes?.length) return "";
  const { w, h } = normWH(row);
  const l = parseFloat(row.l) || 0;

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
  const w = parseFloat(row.w) || 0;
  const h = parseFloat(row.h) || 0;
  const l = parseFloat(row.l) || 0;
  const n = parseFloat(row.n) || 0;
  const m3 = (w / 100) * (h / 100) * l * n;
  const mat = getMaterial();
  const dph = getDph() / 100;
  return {
    m3,
    priceNoDph: m3 * mat.price,
    priceWithDph: m3 * mat.price * (1 + dph),
    weight: m3 * mat.density,
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
  document.getElementById("densityInput").value = mat.density;
}

function onMaterialChange() {
  selectedMatId = parseInt(document.getElementById("materialSelect").value, 10);
  syncMaterialInputs();
  recalcAll();
}

function onPriceChange() {
  const mat = getMaterial();
  if (!mat) return;
  mat.price = parseFloat(document.getElementById("priceInput").value) || 0;
  saveMaterials();
  recalcAll();
}

function onDensityChange() {
  const mat = getMaterial();
  if (!mat) return;
  mat.density = parseFloat(document.getElementById("densityInput").value) || 0;
  saveMaterials();
  recalcAll();
}

// ═══════════════════════════════════════════════════
//  TABLE ROWS
// ═══════════════════════════════════════════════════
const FIELDS = ["w", "h", "l", "n"];

function addRow(w = "", h = "", l = "", n = "") {
  const id = nextRowId++;
  rows.push({ id, w, h, l, n });
  renderRow(rows[rows.length - 1]);
  updateTabIndexes();
  recalcSummary();
  const first = document.querySelector(`tr[data-id="${id}"] input`);
  if (first) first.focus();
}

function renderRow(row) {
  const tbody = document.getElementById("tableBody");
  const tr = document.createElement("tr");
  tr.dataset.id = row.id;

  const specs = [
    { key: "w", placeholder: "0", step: "0.5", min: "0" },
    { key: "h", placeholder: "0", step: "0.5", min: "0" },
    { key: "l", placeholder: "0.00", step: "0.01", min: "0" },
    { key: "n", placeholder: "1", step: "1", min: "0" },
  ];

  specs.forEach((s) => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.min = s.min;
    input.step = s.step;
    input.placeholder = s.placeholder;
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

  // Calculated cells
  const calcDefs = [
    { key: "m3", cls: "" },
    { key: "priceNoDph", cls: "" },
    { key: "priceWithDph", cls: "" },
    { key: "weight", cls: "col-weight" },
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
}

function deleteRow(id) {
  rows = rows.filter((r) => r.id !== id);
  document.querySelector(`tr[data-id="${id}"]`)?.remove();
  updateTabIndexes();
  recalcSummary();
}

function clearAll() {
  if (!confirm("Opravdu vymazat všechny řádky?")) return;
  rows = [];
  document.getElementById("tableBody").innerHTML = "";
  recalcSummary();
  addRow();
}

function recalcAll() {
  rows.forEach((row) => updateRowCalc(row));
  recalcSummary();
}

function recalcSummary() {
  let m3 = 0,
    noDph = 0,
    withDph = 0,
    kg = 0;
  rows.forEach((row) => {
    const c = calcRow(row);
    m3 += c.m3;
    noDph += c.priceNoDph;
    withDph += c.priceWithDph;
    kg += c.weight;
  });
  document.getElementById("sumM3").textContent = fmtM3(m3);
  document.getElementById("sumNoDph").textContent = fmtKc(noDph);
  document.getElementById("sumWithDph").textContent = fmtKc(withDph);
  document.getElementById("sumWeight").textContent = fmtKg(kg);
  document.getElementById("sumPriceM3").textContent =
    fmt(getMaterial()?.price ?? 0) + "\u00a0Kč";
}

// ═══════════════════════════════════════════════════
//  TAB / ENTER NAVIGATION
// ═══════════════════════════════════════════════════
function updateTabIndexes() {
  let ti = 10;
  rows.forEach((row) => {
    FIELDS.forEach((f) => {
      const inp = document.querySelector(
        `tr[data-id="${row.id}"] input[data-field="${f}"]`,
      );
      if (inp) inp.tabIndex = ti++;
    });
  });
}

function onInputKeyDown(e) {
  if (e.key !== "Enter") return;
  e.preventDefault();

  const rowId = parseInt(e.target.dataset.rowId, 10);
  const field = e.target.dataset.field;
  const isLastF = field === "n";
  const isLastR = rows[rows.length - 1]?.id === rowId;

  if (isLastF && isLastR) {
    addRow();
  } else if (isLastF) {
    const idx = rows.findIndex((r) => r.id === rowId);
    const nxt = rows[idx + 1];
    if (nxt) {
      document
        .querySelector(`tr[data-id="${nxt.id}"] input[data-field="w"]`)
        ?.focus();
    }
  } else {
    const nextField = FIELDS[FIELDS.indexOf(field) + 1];
    document
      .querySelector(`tr[data-id="${rowId}"] input[data-field="${nextField}"]`)
      ?.focus();
  }
}

// ═══════════════════════════════════════════════════
//  MODAL: MANAGE MATERIALS
// ═══════════════════════════════════════════════════
function openModal() {
  renderMaterialTable();
  renderSizesSection();
  document.getElementById("modalOverlay").classList.add("open");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  renderMaterialSelect();
  recalcAll();
}

function closeModalOutside(e) {
  if (e.target === document.getElementById("modalOverlay")) closeModal();
}

function renderMaterialTable() {
  const tbody = document.getElementById("materialTableBody");
  tbody.innerHTML = "";
  materials.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="text"   value="${escHtml(m.name)}"          data-mid="${m.id}" data-field="name"      onchange="updateMat(this)"></td>
      <td><input type="text"   value="${escHtml(m.emailCode || "")}" data-mid="${m.id}" data-field="emailCode" onchange="updateMat(this)" placeholder="zkratka" maxlength="30" style="width:90px"></td>
      <td><input type="number" value="${m.price}"   min="0" step="100" data-mid="${m.id}" data-field="price"   onchange="updateMat(this)" style="text-align:right"></td>
      <td><input type="number" value="${m.density}" min="0" step="10"  data-mid="${m.id}" data-field="density" onchange="updateMat(this)" style="text-align:right"></td>
      <td><button class="btn-del" onclick="deleteMaterial(${m.id})" tabindex="-1"
           ${materials.length <= 1 ? 'disabled title="Nelze smazat poslední typ"' : ""}>×</button></td>
    `;
    tbody.appendChild(tr);
  });
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
  if (f === "density") mat.density = parseFloat(input.value) || 0;
  saveMaterials();
}

function addMaterial() {
  const name = document.getElementById("newName").value.trim();
  const emailCode = document.getElementById("newEmailCode").value.trim();
  const price = parseFloat(document.getElementById("newPrice").value) || 0;
  const density = parseFloat(document.getElementById("newDensity").value) || 0;
  if (!name) {
    alert("Zadejte název materiálu.");
    return;
  }
  materials.push({ id: nextMatId++, name, emailCode, price, density });
  saveMaterials();
  document.getElementById("newName").value = "";
  document.getElementById("newEmailCode").value = "";
  document.getElementById("newPrice").value = "";
  document.getElementById("newDensity").value = "";
  renderMaterialTable();
  renderSizesSection();
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
  section.style.display = matsWithSizes.length ? "" : "none";
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
//  EXPORT HELPERS
// ═══════════════════════════════════════════════════
function weightIncluded() {
  return document.getElementById("chkWeight").checked;
}

// ═══════════════════════════════════════════════════
//  EXPORT: PRINT / PDF
// ═══════════════════════════════════════════════════
function exportPDF() {
  const mat = getMaterial();
  document.getElementById("printMaterial").textContent = mat?.name ?? "";
  document.getElementById("printPrice").textContent = fmt(mat?.price ?? 0);
  document.getElementById("printDph").textContent = getDph();
  document.getElementById("printDate").textContent =
    new Date().toLocaleDateString("cs-CZ");

  const hideWeight = !weightIncluded();
  if (hideWeight) document.body.classList.add("hide-weight");

  window.print();

  if (hideWeight) document.body.classList.remove("hide-weight");
}

// ═══════════════════════════════════════════════════
//  EXPORT: EMAIL (mailto s fallbackem na clipboard)
// ═══════════════════════════════════════════════════
function buildEmailText() {
  const mat = getMaterial();
  const dph = getDph();
  const inclWght = weightIncluded();
  const pad = (s, n) => String(s).padStart(n);

  let header = `Šířka[cm]  Výška[cm]  Délka[m]  Počet     m³        Bez DPH       S DPH    `;
  if (inclWght) header += `     Hmot.[kg]`;
  header += `\n` + "─".repeat(header.length) + "\n";

  const bodyRows = rows
    .map((row) => {
      const c = calcRow(row);
      let r = [
        pad(parseFloat(row.w) || 0, 9),
        pad(parseFloat(row.h) || 0, 9),
        pad(parseFloat(row.l) || 0, 8),
        pad(parseFloat(row.n) || 0, 7),
        pad(fmtM3(c.m3), 10),
        pad(fmtKc(c.priceNoDph), 13),
        pad(fmtKc(c.priceWithDph), 12),
      ].join("  ");
      if (inclWght) r += "  " + pad(fmtKg(c.weight), 10);
      return r;
    })
    .join("\n");

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
    `Cena za m³ bez DPH: ${fmt(mat?.price ?? 0)} Kč\n` +
    `DPH: ${dph}%\n` +
    `Datum: ${new Date().toLocaleDateString("cs-CZ")}\n\n` +
    header +
    bodyRows +
    footer
  );
}

function sendEmail() {
  const mat = getMaterial();
  const text = buildEmailText();
  const subj = encodeURIComponent(`Kalkulace řeziva – ${mat?.name}`);
  const link = `mailto:?subject=${subj}&body=${encodeURIComponent(text)}`;

  if (link.length <= 1900) {
    // Short enough — open mail client via temporary <a>
    const a = document.createElement("a");
    a.href = link;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    // Too long for mailto — copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showToast(
            "Text nabídky byl zkopírován do schránky. Vložte ho do emailu ručně.",
          );
        })
        .catch(() => {
          showToast(
            "Nepodařilo se zkopírovat. Text je příliš dlouhý pro email — zkuste tisk.",
          );
        });
    } else {
      showToast(
        "Text nabídky je příliš dlouhý pro mailto. Použijte Tisk / PDF.",
      );
    }
  }
}

// ═══════════════════════════════════════════════════
//  EXPORT: CENOVÁ NABÍDKA (jednoduchý formát pro zákazníka)
// ═══════════════════════════════════════════════════
function buildQuoteEmailText() {
  const mat = getMaterial();
  const label = mat.emailCode?.trim() || mat.name;
  const dph = getDph() / 100;

  const lines = rows
    .filter((r) => (parseFloat(r.w) || 0) > 0 && (parseFloat(r.n) || 0) > 0)
    .map((r) => {
      const w = parseFloat(r.w) || 0;
      const h = parseFloat(r.h) || 0;
      const l = parseFloat(r.l) || 0;
      const n = parseFloat(r.n) || 0;
      const m3 = (w / 100) * (h / 100) * l * n;
      const price = Math.round(m3 * mat.price * (1 + dph));
      const lCm = Math.round(l * 100);
      return `${label} ${w} x ${h} x ${lCm} cm - ${n} ks - ${fmt(price)},- Kč vč. DPH`;
    });

  const total = rows.reduce((s, r) => {
    const m3 =
      ((parseFloat(r.w) || 0) / 100) *
      ((parseFloat(r.h) || 0) / 100) *
      (parseFloat(r.l) || 0) *
      (parseFloat(r.n) || 0);
    return s + m3 * mat.price * (1 + dph);
  }, 0);

  return [
    "Dobrý den,",
    "zasílám cenovou nabídku:",
    "",
    ...lines,
    "",
    `Celkem ${fmt(Math.round(total))},- Kč vč. DPH`,
  ].join("\n");
}

function sendQuoteEmail() {
  const text = buildQuoteEmailText();
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast(
          "Cenová nabídka zkopírována do schránky. Vložte ji do emailu.",
        );
      })
      .catch(() => {
        showToast("Nepodařilo se zkopírovat nabídku do schránky.");
      });
  } else {
    showToast("Schránka není dostupná — zkopírujte text ručně.");
  }
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
  localStorage.setItem("rezivo_theme", next ? "dark" : "light");
  applyTheme(next);
}

function initTheme() {
  const saved = localStorage.getItem("rezivo_theme");
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
  initTheme();
  renderMaterialSelect();
  addRow();
  recalcSummary();
})();
