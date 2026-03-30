# 🪵 Kalkulačka řeziva

Jednoduchá webová aplikace pro výpočet kubatury, ceny a hmotnosti řeziva. Určena pro české uživatele ve stavebnictví a dřevovýrobě.

**Plně klientská aplikace** — žádný backend, žádná instalace, funguje přímo v prohlížeči.

---

## 📐 Zadávání rozměrů

Každý řádek tabulky představuje jeden druh řeziva. Do čtyř polí zadej rozměry a počet kusů:

| Pole | Jednotka | Příklad |
|---|---|---|
| Šířka | cm | `8` |
| Výška | cm | `16` |
| Délka | m | `4,5` |
| Počet | ks | `10` |

Výsledná kubatura se vypočítá automaticky: **8 cm × 16 cm × 4,5 m × 10 ks = 0,576 m³**

> 💡 Jako desetinnou značku používej **čárku** — například `4,5` nebo `10,5`.

### Klávesové zkratky

| Klávesa | Akce |
|---|---|
| `Tab` nebo `Enter` | Přesun na další pole (šířka → výška → délka → počet) |
| `Enter` na poli Počet | Přidá nový prázdný řádek automaticky |

---

## 🔧 Panel nástrojů

| Tlačítko | Co dělá |
|---|---|
| **⬇ Stáhnout PDF** | Vygeneruje PDF přehled všech zakázek |
| **✉ Email** | Otevře okno s výběrem formátu e-mailu |
| **+ Přidat zakázku** | Přidá novou tabulku pro další zakázku |
| **💾 Uložit** | Uloží aktuální výpočet do historie |
| **📋 Historie** | Zobrazí uložené výpočty (max. 20) |
| **🗑 Vymazat** | Smaže všechny řádky a zakázky |
| **🌙 / ☀** | Přepínání světlého a tmavého režimu |

---

## 💰 Materiál a cena

V horním řádku vyber materiál z rozbalovacího seznamu. Cena a hustota se vyplní automaticky z ceníku.

> ℹ️ Cenu a hustotu lze přepsat přímo v polích vedle výběru materiálu — změna platí jen pro aktuální výpočet, ceník se nemění.

**Vlastní cena na řádek** — zaškrtni políčko `Vlastní cena na řádek`. U každého řádku se zobrazí sloupec pro zadání individuální ceny — hodí se pokud různé kusy mají jinou cenu.

**DPH** — sazbu nastav v poli `DPH %`. Tabulka zobrazuje ceny bez i včetně DPH.

---

## 📋 Více zakázek

Aplikace umožňuje pracovat s více zakázkami najednou — každá má vlastní tabulku.

1. Klikni na **+ Přidat zakázku** — přibyde nová tabulka s názvem *Zakázka 2*.
2. Klikni na název zakázky a přepiš ho (např. *Střecha*, *Podlaha*…).
3. Zadej řádky s řezivem do každé zakázky zvlášť.
4. Lišta nahoře ukazuje **celkový součet přes všechny zakázky**.

> 💡 Zakázku smažeš tlačítkem **× Zakázka** vpravo v záhlaví tabulky. Poslední zakázku nelze smazat.

---

## 📄 Export do PDF

1. Klikni na **⬇ Stáhnout PDF**.
2. Prohlížeč stáhne soubor s dnešním datem v názvu.
3. PDF obsahuje záhlaví s materiálem a datem, tabulky všech zakázek s mezisoučty a celkový součet.

> ⚠️ PDF se generuje pomocí online knihovny — pro export je potřeba **připojení k internetu**.

---

## ✉️ Odeslání e-mailem

Klikni na **✉ Email**. Otevře se okno s výběrem formátu a náhledem textu:

| Formát | Použití |
|---|---|
| 🧮 **Kalkulace** | Interní přehled s cenami a objemy |
| 📩 **Cenová nabídka** | E-mail pro zákazníka s cenami |
| 🏭 **Objednávka výroby** | Přehled pro výrobu nebo pilu |

Po kliknutí na **Odeslat** se otevře tvůj e-mailový klient s předvyplněným textem. Pokud je text příliš dlouhý, zkopíruje se automaticky do schránky — pak ho jen vlož do e-mailu.

---

## 🕐 Historie výpočtů

Aplikace si pamatuje až **20 výpočtů**. Při každém PDF exportu nebo odeslání e-mailu se stav uloží automaticky.

| Akce | Výsledek |
|---|---|
| **💾 Uložit** | Ruční uložení aktuálního stavu |
| **📋 Historie** | Zobrazí seznam uložených výpočtů |
| **Načíst** u záznamu | Obnoví daný výpočet včetně všech zakázek |

---

## ⚙️ Správa typů materiálů

1. V horním řádku vyber materiál a klikni na **Spravovat typy** vedle rozbalovacího seznamu.
2. Uprav název, zkratku, cenu nebo hustotu přímo v tabulce.
3. Nový materiál přidáš tlačítkem **+ Přidat materiál** dole.
4. Lze nastavit dostupné rozměry (šířka × výška × délky) — aplikace pak upozorní, pokud zadáš neobvyklý průřez.

> 💡 Vlastní materiály a jejich ceny se ukládají v prohlížeči — zůstanou i po zavření stránky.

---

## Technické informace

- Vanilla HTML / CSS / JavaScript — žádný framework, žádný build krok
- Data uložena v `localStorage` prohlížeče (žádný server)
- PDF export: [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) via CDN
- PWA ready — lze nainstalovat jako aplikaci na mobilu
