# Beiwe — Brand Guidelines
### Brand Guideline · v1.1

*This document is the practical extension of the Beiwe Book (Chapter 6 — Design Language). The book defines the principle; this guide defines the concrete usage rules of that principle on the logo and brand.*

---

## 1. Logo Family

Beiwe's brand mark is based on a single idea: **two consonants within a single continuous body.** An orange "W" passes through the inside of a thick, monolithic "B" body. This hidden arrangement also symbolizes the **"With Beiwe"** philosophy. The letter is not a separate decoration — it emerges from the flesh of the B, engraved into it.

There are three primary variants:

| Variant | Usage Area |
|---|---|
| **Icon** (black body + orange W) | Light backgrounds, landing page, documents |
| **Reversed** (cream body + orange W) | Dark backgrounds, dark mode, app icon |
| **Monochrome** | Stamp, emboss, single-color print, engraving |

**Rule:** The orange accent remains constant under all circumstances. Except for single-color printing, the W is never shown in the same color as the body of the icon — this is a direct extension of the brand's "single accent, single meaning" principle (Book, Chapter 6).

---

## 2. Clear Space

A safety area is defined around the icon where no text, line, or other graphic can enter. This area is equal to the width of the icon's vertical bar (reference unit = 1x). No edge of the logo can be adjacent to any element closer than this 1x distance.

*This rule carries the same logic as the principle in Chapter 4 of the book ("The browser never interrupts thinking"): the logo, too, should not blend into the "noise" in a cramped, crowded space.*

---

## 3. Minimum Size

The icon must not be reduced below **24×24 px**. Below this size, the inner line of the W visually disappears, and the shape turns into a simple "B" blob — which does not carry the brand's identity.

- Favicon / browser tab: 32×32 px (recommended minimum)
- App icon: 48×48 px and above
- Inline use in documents: at least 20 px height

---

## 4. Dark Mode / Light Mode

| Mode | Background | Icon |
|---|---|---|
| **Light Mode** | #FAFAF8 (Paper) | Black body + orange W |
| **Dark Mode** | #171717 (Ink) | Cream body + orange W |

The orange W remains constant with the exact same hex value (#D98A26) in both modes — even when the user interface transitions to darkness, Beiwe's "signature" does not change. This consistency is the foundation of the brand's recognizability.

---

## 5. Favicon

Only the **Icon** variant is used as a favicon — never the Primary Lockup (icon + wordmark). In extremely small areas like a browser tab, the wordmark becomes illegible; the icon itself is sufficiently distinctive on its own.

The favicon background must always be transparent or the paper tone (#FAFAF8) — this prevents clashing with the browser's own tab color.

---

## 6. App Icon

The app icon is the reversed variant placed on a rounded square background:

- Background: #171717 (Ink), corner radius is ~20% of the background width (approximates the iOS/Android/macOS "superellipse" feel)
- The icon is positioned in the center of the background, adhering to the clear space rule from the edges
- This design is neutral enough to look natural across Windows, macOS, iOS, and Android icon systems — no platform-specific sharp corners or different proportions are required

---

## 7. Browser Toolbar

In Beiwe's own browser shell (Chapter 6, Sidebar/Navigation), the icon only appears in these two places:
1. **Inside a tab** — at favicon size, to the left of the tab title
2. **At the top of the left vertical icon rail** — as the application's "home / identity" anchor, it is always shown in full color (black + orange), unlike the other neutral gray icons

The logo is **never** used inside the address bar or the search box — this space belongs to the "most sacred component," the search bar defined in Chapter 6, where the brand remains silent.

---

## 8. Wordmark

- Font: **Playfair Display** (serif, editorial)
- Always mixed case: "Beiwe" — all caps (BEIWE) or all lowercase (beiwe) are not used
- When the wordmark is used alone (without the icon), its color is ink (#171717) or paper (#FAFAF8) depending on the context — it is never written in orange. The orange belongs only to the W of the icon, not carried over to the word
- **Spacing between Icon + Wordmark:** In a Lockup, the space between the icon and the word "Beiwe" must be at least 35% of the icon's own width — if left narrow, it gives a cramped, amateurish feel.

---

## 9. Prohibited Uses

None of the following may be done:

- ❌ **Distorting proportions** — disproportionately squishing or stretching the icon horizontally or vertically
- ❌ **Changing the accent color** — showing the W in any color other than orange (blue, purple, red, etc.)
- ❌ **Rotating or tilting** — the icon always stands upright, it is never rotated at any angle
- ❌ **Adding shadow or glow** — the logo is a flat, two (or single) color mark; effects like drop-shadow, gradient, or bevel are not added
- ❌ **Swapping the body and W** — the W always remains *inside* the body, it does not spill outside or get used as an element separate from the body
- ❌ **Writing the wordmark with a different font** — "Beiwe" is not written with any serif other than Playfair Display, or any sans-serif

---

## 10. Color System

| Color | Hex | Meaning |
|---|---|---|
| **Ink** | `#171717` | Text, icon body, primary background (dark mode) |
| **Burnt Orange (Accent)** | `#D98A26` | Only for action and brand signature (W) — not decorative |
| **Paper** | `#FAFAF8` | Primary background (light mode) |
| **Consensus Green** | `#1FA34A` | Only in collective intelligence consensus badges (Book, Chapter 6) |

---

## 11. Typography

- **Headings / Editorial:** Playfair Display
- **Interface / Body text:** Outfit
- **Rule:** A third font family is never used on a single screen (Exactly the same rule as Book, Chapter 6).

---

## 12. UI Examples

- **Browser tab:** icon at favicon size + gray tab background + a URL label like "beiwe.app"
- **Landing page navbar:** Primary Lockup (icon + wordmark) on the top left, orange "Download" button on the right
- **Left icon rail:** only the top Beiwe anchor is in full color, the navigation icons below it are neutral gray

---

## 13. Beiwe Book Cover — Standalone "W" Usage

On the cover of the Beiwe Book, instead of the full icon, only the **W stroke itself**, enlarged and alone, may be used in cream color on a dark (#171717) background:

```
        W

   Beiwe Book

The Constitution of Clarity
```

This draws inspiration from the simplicity of Apple's Human Interface Guidelines (HIG) covers: a single powerful symbol, two lines of typography below it, nothing else. This usage is strictly limited to book covers and similar "editorial, single-title" surfaces — within the product interface, the W is never used alone as a brand mark without the B. In the product, the brand is always the whole icon; in the book, however, the W can stand out as the "signature" of the brand.

---

## 14. Brand Philosophy

*This section is the concluding part that ties the visual system of the brand to the Manifesto of the Beiwe Book (Chapter 2).*

> **The logo is intentionally quiet. It is not designed to attract attention. It is designed to be remembered.**

> **The orange W represents the moment when clarity emerges from complexity.**

> **A logo that shouts is a logo that is forgotten by tomorrow. A logo that whispers is the one you draw from memory years later.**

> **We did not design a symbol to be seen once. We designed a mark to be recognized in a glance, and understood over time.**

This logo is not a decoration. It is the compressed form of the Clarity Model defined in Chapter 3 of the Beiwe Book — the idea that context is gathered first, and clarity emerges last — into a single graphic mark. The body is the context; the W is the answer emerging from that context. As the brand grows, as new products are added, as new screens are designed — this single sentence must be the test of every decision: *Is this staying quiet, or is it shouting?*
