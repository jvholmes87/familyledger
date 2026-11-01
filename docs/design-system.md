# SpendWise Design System — “Calm Ledger”

SpendWise should feel like a contemporary private ledger: composed, tactile, and unusually clear. The interface borrows the useful structure of archival financial stationery—folio marks, ruled lines, indexes, and aligned figures—without imitating an old-fashioned bank or adding decorative clutter.

Every screen and component uses the tokens in `src/app/globals.css`. Components must not contain literal hex colors.

## Visual thesis

- **Subject:** a personal spending ledger for people who want clarity without financial theater.
- **Single job:** make entering and reviewing everyday spending feel calm, fast, and trustworthy.
- **Signature:** the **folio rail**—a fine vertical rule, small coordinate labels, and ordered entry marks that make each screen feel like part of one bound ledger.
- **Aesthetic risk:** large Bricolage Grotesque display type gives the restrained finance palette a warmer, more contemporary voice than a conventional banking sans or editorial serif.
- **Imagery:** product artifacts are the imagery. Charts, category bars, monetary figures, and ledger previews are built from real UI primitives; stock or generated illustrations should only be introduced when they communicate something the interface cannot.

## Core palette

Light mode is primary. The palette uses one chromatic accent—deep forest—and earns variety from paper depth, ink weight, opacity, and line strength.

| Token                       | Role                             | oklch                    | Approx. hex |
| --------------------------- | -------------------------------- | ------------------------ | ----------- |
| `--background`              | archival paper canvas            | `oklch(0.975 0.012 82)`  | `#FBF6EE`   |
| `--foreground`              | green-black ledger ink           | `oklch(0.205 0.022 154)` | `#0F1A13`   |
| `--card` / `--paper-raised` | raised sheet surface             | `oklch(0.995 0.006 82)`  | `#FFFDF9`   |
| `--paper-deep`              | inset paper / segmented controls | `oklch(0.93 0.02 82)`    | `#EFE7D9`   |
| `--primary`                 | action and folio forest          | `oklch(0.39 0.085 159)`  | `#0A5234`   |
| `--muted-foreground`        | secondary graphite               | `oklch(0.47 0.02 84)`    | `#605A4E`   |
| `--border`                  | ordinary ledger rule             | `oklch(0.855 0.018 80)`  | `#D6CEC3`   |
| `--negative`                | destructive / adverse change     | `oklch(0.5 0.145 28)`    | `#A63931`   |

Supporting tokens:

- `--primary-hover` is a deliberately darker solid state. Do not create primary hover states by lowering opacity; that weakens text contrast.
- `--border-strong` is for interactive field boundaries and high-value dividers.
- `--ledger-line` draws ruled-paper structure.
- `--button-highlight`, `--field-shadow`, `--ledger-shadow`, and `--ledger-shadow-float` centralize the few depth effects in the system.
- Chart tokens are tonal variations of forest, ink, and paper. They are not additional brand accents.

Accent discipline remains strict: forest marks primary actions, current state, positive emphasis, and the folio rail. Most of the product is paper, ink, and line.

## Typography

Three roles create the identity:

- **Display and page headings — Bricolage Grotesque:** expressive, tightly tracked, and used for the hero, page titles, panel titles, and prominent figures.
- **Interface and body — Geist Sans:** compact, legible UI copy, form controls, navigation, and descriptions.
- **Coordinates and data — Geist Mono:** folio numbers, dates, compact metadata, entry indexes, and selected numeric labels.

All currency uses tabular numerals. Monetary values must continue to use the shared `MoneyAmount` component. Large figures use tight tracking; body copy uses relaxed line-height. Uppercase mono labels are short coordinates, not generic decoration.

## Layout language

- Public landing pages use an editorial split: a strong proposition beside a product-native ledger preview.
- Auth uses a forest story panel and a focused paper access panel.
- The authenticated shell uses a persistent compact header, named primary navigation, an explicit active route, and a maximum content width of `72rem`.
- Dashboard hierarchy is asymmetric: one dominant monthly figure, two supporting measures, a wide trend register, a narrower category index, then recent entries.
- Expense entry and history form a two-column register on large screens and a single vertical flow on small screens.
- Category management pairs a compact count/index panel with the editable register.

Mobile is not a compressed desktop. At small widths, navigation becomes its own full row, panels stack, action groups wrap, fields keep their full hit target, and long descriptions remain truncation-safe. No screen may introduce horizontal scrolling at 375px.

## Shape, depth, and spacing

- Base radius: `0.75rem`; important sheets use `rounded-2xl`, not indiscriminate pills.
- Fields and primary controls are at least 40px high; primary form fields are 44px.
- Hairline borders do most of the separation. Shadows are reserved for a floating hero sheet, auth panel, or dominant data surface.
- Panels use roomy 20–32px padding. Dense entry registers use repeated 16px rows with clear dividers.
- The folio rail, coordinate marks, and ruled backgrounds encode hierarchy. Remove decorative marks that do not explain order, grouping, or state.

## Motion

One orchestrated entrance (`ledger-enter`) fades and lifts the page’s main composition over 520ms. Hover and focus transitions use 150–200ms. Do not scatter animation across every card or chart.

`prefers-reduced-motion: reduce` disables the entrance and smooth scrolling.

## Components

- **Brand:** shared `Brand` mark with a compact SW ledger stamp and Bricolage wordmark.
- **Buttons:** solid forest primary; paper-and-ink outline; quiet ghost; tinted destructive. Focus rings remain visible and hover states retain contrast.
- **Inputs and native select:** raised paper fill, strong hairline boundary, 44px height, and a three-pixel low-opacity forest focus ring.
- **Cards:** raised sheet, `rounded-2xl`, hairline border, generous spacing, and tokenized restrained depth.
- **Header:** `Primary navigation` landmark with Dashboard, Expenses, and Categories; the current route uses `aria-current="page"`.
- **Trend chart:** visual columns are paired with a screen-reader-readable month and currency list.
- **Row actions:** accessible names include the affected category or expense; repeated generic “Delete” and “Rename” controls are not acceptable.
- **Auth tabs:** implement the tab pattern with selected state, roving tab stop, and left/right keyboard navigation.

## Accessibility floor

- Every route has one descriptive `h1`; dashboard panels use real `h2` headings.
- Focus must always remain visible against both paper and forest surfaces.
- Do not rely on hue alone for deltas or state; keep sign, text, or current-page semantics.
- Decorative initials, indexes, and lines are `aria-hidden`.
- Field groups use `fieldset` and `legend` when the relationship matters.
- Touch targets, text contrast, reduced motion, keyboard navigation, and 375px overflow are release gates, not polish tasks.

## Implementation rules

1. Define design tokens once in `src/app/globals.css` through Tailwind 4’s CSS-first theme.
2. Components consume semantic token classes or CSS variables, never literal hex colors.
3. Add reusable controls under `src/components/ui/`; do not hand-style a one-off input or select in a page.
4. Add every new token here and in `globals.css` in the same change.
5. Keep user-visible behavior, accessible names, server actions, route protections, and RLS boundaries intact while changing presentation.
6. Validate each significant surface at 375px, 768px, and 1440px, with reduced-motion and keyboard behavior covered where relevant.
