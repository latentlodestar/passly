# Passly Design System

## Guiding Principle

Passly helps people navigate high-stakes immigration processes. Every design decision must reinforce **trust, clarity, and preparedness**. We are a structured risk-reduction tool — not a legal service, not an AI toy.

**The UI must feel:** calm, trustworthy, precise, structured, and human.
**Think:** modern fintech or healthcare portal — high readability, generous spacing, clear hierarchy.

## What We Avoid

- Neon gradients, glow effects, glassmorphism, overly rounded "bubble" UI
- Cartoon icons, sparkles, "AI assistant" avatars, sci-fi motifs
- Hype words: "amazing," "magic," "instant," "AI-powered"
- Gimmicky animations or random generative imagery

---

## Color Tokens

Neutral-first palette with a single primary accent. Status colors are deliberately muted so they annotate without overwhelming.

| Token | Dark | Light | Usage |
|---|---|---|---|
| `bg` | `#0c0f16` | `#f5f6f8` | Page background |
| `surface` | `#141822` | `#ffffff` | Cards, panels |
| `surface-2` | `#1c2030` | `#f0f1f4` | Subtle backgrounds, hover |
| `surface-3` | `#232838` | `#e8eaef` | Inset/recessed areas |
| `fg` | `#e4e7ec` | `#111827` | Primary text |
| `fg-2` | `#a0a7b5` | `#4b5563` | Secondary text |
| `muted` | `#6b7280` | `#9ca3af` | Tertiary text, placeholders |
| `border` | `#232838` | `#e2e5ea` | Default borders |
| `border-strong` | `#343b4e` | `#d1d5db` | Emphasized borders |
| `primary` | `#4a8af4` | `#2556c4` | Actions, links, active states |
| `primary-fg` | `#ffffff` | `#ffffff` | Text on primary |
| `primary-hover` | `#3b7ae5` | `#1d4aa8` | Primary hover state |
| `primary-muted` | `rgba(74,138,244,0.14)` | `rgba(37,86,196,0.08)` | Primary tint backgrounds |
| `success` | `#3fb950` | `#1a7f37` | Positive states |
| `success-subtle` | `rgba(63,185,80,0.12)` | `#ecfdf5` | Success background |
| `success-text` | `#7ee787` | `#166534` | Success text |
| `warning` | `#d29922` | `#9a6700` | Caution states |
| `warning-subtle` | `rgba(210,153,34,0.12)` | `#fffbeb` | Warning background |
| `warning-text` | `#e3b341` | `#92400e` | Warning text |
| `danger` | `#e5534b` | `#c4342e` | Error, destructive |
| `danger-subtle` | `rgba(229,83,75,0.12)` | `#fef2f2` | Danger background |
| `danger-text` | `#f08882` | `#991b1b` | Danger text |

## Spacing Scale

Consistent 4px base unit. Use these values for padding, margin, and gap.

| Token | Value | Common use |
|---|---|---|
| `space-1` | `4px` | Tight inline gaps |
| `space-2` | `8px` | Icon-to-text, compact padding |
| `space-3` | `12px` | Small component padding |
| `space-4` | `16px` | Default component padding |
| `space-5` | `20px` | Medium spacing |
| `space-6` | `24px` | Section padding |
| `space-8` | `32px` | Large section gaps |
| `space-10` | `40px` | Page section spacing |
| `space-12` | `48px` | Hero/header spacing |
| `space-16` | `64px` | Page-level vertical rhythm |

## Radius Scale

Restrained radii. Avoid overly rounded corners.

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | `4px` | Small elements, badges, tags |
| `radius-md` | `6px` | Cards, inputs, buttons |
| `radius-lg` | `8px` | Modals, larger panels |
| `radius-xl` | `12px` | Mobile cards, prominent surfaces |
| `radius-full` | `9999px` | Pills, avatars |

## Typography Scale

System font stack — no web font loading. Clean hierarchy with clear contrast between levels.

| Token | Size | Weight | Usage |
|---|---|---|---|
| `text-xs` | `12px` | 400 | Captions, metadata |
| `text-sm` | `14px` | 400 | Body text (default), inputs |
| `text-base` | `16px` | 400 | Mobile body, prominent text |
| `text-lg` | `18px` | 600 | Section titles |
| `text-xl` | `20px` | 600 | Page subtitles |
| `text-2xl` | `24px` | 700 | Page headings |
| `text-3xl` | `30px` | 700 | Hero headings |

**Font stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif`

**Mono:** `ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace`

## Shadow / Elevation Scale

Subtle shadows that create depth without drama.

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,var)` | Subtle lift (buttons) |
| `shadow-md` | `0 4px 12px rgba(0,0,0,var)` | Cards, dropdowns |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,var)` | Popovers, floating UI |
| `shadow-xl` | `0 16px 48px rgba(0,0,0,var)` | Modals, dialogs |

Shadow opacity varies by theme: dark `0.4`, light `0.06`.

---

## Component Guidelines

### Buttons
- Three sizes: `sm` (32px), `md` (36px), `lg` (40px) touch target height
- Variants: `primary`, `secondary`, `ghost`, `danger`
- Always have visible focus states
- Mobile: minimum 44px tap target

### Inputs & Text Fields
- Clear label above, optional helper text below
- Validation states via border color change (not background)
- Placeholder text is muted, never used as labels

### Cards
- Used for grouping related content
- Optional status indicator via left border accent
- Consistent padding: `space-4` body, `space-3` to `space-4` header/footer

### Badges
- Small inline status indicators
- Variants match semantic colors: neutral, success, warning, danger
- Pill shape (`radius-full`)

### Alerts
- Full-width notification banners within content flow
- Icon + text + optional dismiss
- Variants: info (primary), success, warning, danger

### Stepper / Progress
- Horizontal step indicator for wizard flows
- States: completed, current, upcoming
- Show step number and label
- Connecting lines between steps

---

## UX Principles

1. **Get it right the first time.** Step-by-step flows with clear progress. Prevent errors before they happen.
2. **Non-judgmental feedback.** "Missing items" and "evidence strength" use neutral language, not alarming language.
3. **Calm validation.** Inline warnings appear early and gently. Error states are clear but not hostile.
4. **Concise copy.** Factual, calm, direct. No hype, no filler.
5. **Accessibility first.** WCAG AA contrast, focus states on web, 44px minimum tap targets on mobile, readable font sizes.

## Platform Notes

### Web (React + Tailwind)
- Tokens defined as CSS custom properties in `tokens.css`
- Semantic component classes in `components.css`
- Mobile-first responsive design with Tailwind breakpoints

### Mobile (React Native + Expo)
- Tokens defined in `constants/design-tokens.ts`
- Shared `useThemeColor` hook resolves light/dark values
- Safe-area layouts, keyboard avoiding, haptic feedback on iOS
