# Glassmorphic UI (system light/dark)

Date: 2026-08-19  
Status: approved for planning

## Goal

Restyle the whole Onward Workspaces web app as subtle glass over a mesh wash, following `prefers-color-scheme`. Keep brand orange/navy, solid controls, and all current behaviour. No new features.

## Decisions

- Theme: system light and dark (not a forced single mood).
- Glass strength: subtle (`blur(8px)`, panels mostly opaque so task/issue lists stay readable).
- Background: mesh wash (full-page gradient), not blobs and not a flat wash.
- Controls: solid brand (primary orange, solid chips/pills/status). Not frosted buttons.
- Structure: CSS modules per view. Shared tokens and primitives stay in `globals.css`.

## Architecture

### Tokens (`app/globals.css`)

Add (names exact):

- `--glass` — panel fill (light: ~82% white; dark: ~82% navy surface).
- `--glass-strong` — inner rows (tasks, issues) slightly more opaque than `--glass`.
- `--glass-border` — light edge (white/alpha in light; white/12% in dark).
- `--blur` — `8px`.
- `--mesh` — full-page background gradient.

Keep existing `--brand`, `--text`, `--ok`, `--warn`, `--radius`. Replace opaque `--surface` usage on glass panels with `--glass`; keep `--surface` as the no-backdrop-filter fallback.

Light mesh: cream → peach → sky (`#fff9f5` → `#f5c9bc` → `#c5d4ec`).  
Dark mesh: navy → deep blue → ember (`#06182e` → `#1a3a68` → `#3d1e18`).

Apply mesh on `body` (or `.app` and `.login-screen`) as a fixed background so it does not scroll-jank. Remove the old flat `--bg` fill on those roots.

### CSS modules (one owner per surface)

| File | Owns |
|------|------|
| `app/components/Login.module.css` | login screen, login card |
| `app/components/Header.module.css` | sticky header, drawer |
| `app/components/EmployeeView.module.css` | task cards, accordion, pantry gate, completion ring hole |
| `app/components/ManagerView.module.css` | stats, people grid, tabs, issue groups |
| `app/components/CmView.module.css` | CM cards/lists |
| `app/components/IssueForm.module.css` | issue form card |
| `app/components/VisitorForm.module.css` | visitor form card |
| `app/components/PhotoLightbox.module.css` | lightbox overlay (dark scrim, not mesh) |

Shared, stay global in `globals.css`: `.btn-primary`, `.btn-secondary`, `.btn-delete`, `.field`, inputs/selects/textarea, `.status-badge`, `.pill`, `.flash`, `.footer`, layout helpers (`.container`, `.stack`, `.page-head`), and modal chrome (`.modal`, `.modal-wrap`, `.modal-backdrop`, `.modal-head`) because Manager and CM both use it. Modal panel uses the glass recipe in that global block.

When a class moves into a module, delete the duplicate from `globals.css` so one owner remains. JSX for that view imports `styles` and uses `styles.card` (or `className={`${styles.card} ${styles.accordion}`}`). Shared primitives keep their global class names.

`.app` footer and loading skeleton stay global.

### Glass recipe (every panel)

```css
background: var(--glass);
backdrop-filter: blur(var(--blur));
-webkit-backdrop-filter: blur(var(--blur));
border: 1px solid var(--glass-border);
border-radius: var(--radius);
```

Inner rows (`.task`, `.issue-item`, pantry boxes): `var(--glass-strong)`, same blur or none if nested blur is muddy — prefer no nested blur on inner rows.

Header already uses a light blur; switch it to the same tokens.

Modals and drawer: same glass recipe. Backdrop stays dim (existing navy/black overlay).

Accent stat tile stays solid brand gradient (not glass). Complete person-cards keep `--ok-soft` fill so “all done” still reads.

### Controls (solid)

Do not frost: `.btn-primary`, `.btn-secondary`, `.role-switch button.active`, `.pill`, `.status-chip.active`, `.status-badge`, `.check` when done. Secondary buttons may sit on glass but keep opaque fill.

## Fallback and motion

If `backdrop-filter` is unsupported, `--glass` is near-solid `--surface` so layout does not go transparent.

No required animation. If mesh uses animated stops later, gate with `prefers-reduced-motion: reduce`. Blur may remain.

## Out of scope

- New screens, roles, or data.
- User-toggled theme (OS only).
- Glass buttons, heavy blur, photo backgrounds.
- Tailwind or a design-system package.

## Testing (manual)

Light and dark OS theme:

1. Login
2. Employee: tasks, accordion, pantry photos
3. Manager: dashboard tiles, people modal, issues, visitors, CM
4. Mobile: hamburger drawer
5. Lightbox
6. Forms: issue + visitor

Pass: text contrast on mesh; lists readable; brand orange still the main CTA; no behaviour change.

## Risks

- Global vs module class clash: one owner per surface; strip moved rules from `globals.css`.
- Nested blur + mesh: inner rows use `--glass-strong` without extra blur.
- Photos in lightbox: keep dark scrim, not mesh, so images stay true.
