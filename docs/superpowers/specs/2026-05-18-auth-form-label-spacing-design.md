# Auth Form Label Spacing Improvement

**Date:** 2026-05-18  
**Status:** Approved

## Problem

The gap between labels and their input fields in the signup/login forms is 8px (`space-y-2`), which feels cramped on desktop. Labels and inputs read as a single undifferentiated block rather than a labelled control.

## Goal

Increase the label-to-input gap to 12px (`space-y-3`) so the form breathes comfortably on desktop without altering the overall layout or between-field spacing.

## Scope

Two files only:

- `src/routes/login.tsx`
- `src/routes/signup.tsx`

No changes to shared components, design tokens, or global styles.

## Change

Replace `space-y-2` with `space-y-3` on every `<div>` that wraps a `<Label>` + field pair:

| File | Field | Wrapper class: before → after |
|------|-------|-------------------------------|
| `login.tsx` | Email | `space-y-2` → `space-y-3` |
| `signup.tsx` | Name | `space-y-2` → `space-y-3` |
| `signup.tsx` | Avatar | `space-y-2` → `space-y-3` |
| `signup.tsx` | Email | `space-y-2` → `space-y-3` |

## Out of scope

- Between-field spacing (`space-y-5`) — already comfortable, left unchanged.
- Mobile breakpoint adjustments — 12px reads well at all viewport sizes.
- Any other component or page.
