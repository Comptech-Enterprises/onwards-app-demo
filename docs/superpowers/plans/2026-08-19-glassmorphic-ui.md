# Plan: Glassmorphic UI

Spec: `docs/superpowers/specs/2026-08-19-glassmorphic-ui-design.md`

## 1. Tokens + mesh

Update `app/globals.css`: `--glass`, `--glass-strong`, `--glass-border`, `--blur`, `--mesh`. Fixed `body::before` mesh. `@supports` fallback to solid `--surface`. Glass on global modal + footer. Strip rules that move to modules.

## 2. Shared panel

Add `app/components/glass.module.css` with `.panel` (glass recipe) and `.row` (inner, no nested blur). Views `composes` these.

## 3. View modules + JSX

Wire CSS modules and swap panel class names:

- Login, Header, EmployeeView, ManagerView, CmView, IssueForm, VisitorForm, PhotoLightbox

Keep global: buttons, fields, pills, badges, chips, issue-list/issue-item, tabs, layout helpers.

## 4. Check

App loads. Login, header, cards look frosted on mesh in light and dark. Primary buttons stay solid orange.
