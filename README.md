# 🪵 Kalkulačka řeziva

Jednoduchá webová aplikace pro výpočet kubatury, ceny a hmotnosti řeziva. Určena pro české uživatele ve stavebnictví a dřevovýrobě.

Dostupné na https://kalkulacka.samyco.cz

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
| **⚙ Nastavení** | Otevře modal s nastavením materiálů, rozměrů, dřevin a DPH |
| **🌙 / ☀** | Přepínání světlého a tmavého režimu |

---

## 💰 Materiál a cena

V horním řádku vyber materiál z rozbalovacího seznamu. Cena se vyplní automaticky z ceníku.

Vedle materiálu je dropdown **Dřevina** — výběr dřeviny automaticky nastaví hustotu materiálu (zobrazí se jako label vedle dropdownu). Volba **"Vlastní…"** zobrazí pole pro ruční zadání hustoty.

> ℹ️ Cenu lze přepsat přímo v poli vedle výběru materiálu — změna platí jen pro aktuální výpočet, ceník se nemění.

**Vlastní cena na řádek** — zaškrtni políčko `Vlastní cena na řádek`. U každého řádku se zobrazí sloupec pro zadání individuální ceny — hodí se pokud různé kusy mají jinou cenu.

**DPH** — sazbu nastav v Nastavení (⚙). Tabulka zobrazuje ceny bez i včetně DPH.

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

## ⚙️ Nastavení

Klikni na **⚙ Nastavení** v panelu nástrojů. Otevře se modal se čtyřmi sekcemi:

### Typy materiálů

Tabulka všech materiálů, kde u každého lze upravit:

- **Název** — zobrazuje se v rozbalovacím seznamu
- **Zkratka** — krátký kód používaný v e-mailových nabídkách
- **Cena** Kč/m³ bez DPH
- **Dřevina** — dropdown s druhy dřevin (nastaví hustotu), nebo "Vlastní…" s ručním zadáním hustoty

Nový materiál přidáš formulářem **+ Přidat materiál** pod tabulkou. Poslední materiál nelze smazat.

### Dostupné rozměry

Pro materiály s definovanými velikostmi (KVH, stavební řezivo apod.):

- Vyber materiál z dropdownu
- Tabulka průřezů (šířka × výška) s editovatelnými délkami
- Průřezy lze přidávat i mazat
- Aplikace upozorní při zadání neobvyklého průřezu a nabídne nejbližší dostupný

### Druhy dřevin

Správa dřevin a jejich hustot:

- **Předdefinované dřeviny** (Smrk, Borovice, Modřín, Dub — syrový/sušený) — nelze smazat
- Možnost přidat **vlastní dřevinu** (název + hustota kg/m³)
- Vlastní dřeviny lze smazat

### DPH

Nastavení sazby DPH (%).

> 💡 Všechna nastavení se ukládají v prohlížeči — zůstanou i po zavření stránky.

---

## Technické informace

- Vanilla HTML / CSS / JavaScript — žádný framework, žádný build krok
- Data uložena v `localStorage` prohlížeče (žádný server)
- PDF export: [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) via CDN
- PWA ready — lze nainstalovat jako aplikaci na mobilu
