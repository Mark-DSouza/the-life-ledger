# Auth Form Label Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase the label-to-input gap from 8px to 12px on all label+field wrappers in the login and signup forms.

**Architecture:** Pure Tailwind class swap — `space-y-2` → `space-y-3` on four `<div>` wrappers across two route files. No logic, no component changes, no new files.

**Tech Stack:** React, Tailwind CSS, TanStack Router

---

### Task 1: Update login.tsx — email field wrapper

**Files:**
- Modify: `src/routes/login.tsx:83`

- [ ] **Step 1: Make the change**

In `src/routes/login.tsx` at line 83, change:

```tsx
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
```

to:

```tsx
          <div className="space-y-3">
            <Label htmlFor="email">Email</Label>
```

- [ ] **Step 2: Verify visually**

Start the dev server if not already running:

```bash
bun run dev
```

Open http://localhost:5173/login. Confirm the gap between the "Email" label and the input field looks noticeably more spacious than before (12px instead of 8px).

- [ ] **Step 3: Commit**

```bash
git add src/routes/login.tsx
git commit -m "fix: increase label-to-input gap on login form (space-y-2 → space-y-3)"
```

---

### Task 2: Update signup.tsx — name, avatar, and email field wrappers

**Files:**
- Modify: `src/routes/signup.tsx:85,97,120`

- [ ] **Step 1: Make the three changes**

In `src/routes/signup.tsx`, apply the same swap at three locations:

**Line 85** — name field:
```tsx
          <div className="space-y-3">
            <Label htmlFor="name">Name</Label>
```

**Line 97** — avatar field:
```tsx
          <div className="space-y-3">
            <Label>Avatar</Label>
```

**Line 120** — email field:
```tsx
          <div className="space-y-3">
            <Label htmlFor="email">Email</Label>
```

- [ ] **Step 2: Verify visually**

Open http://localhost:5173/signup. Confirm all three fields (Name, Avatar, Email) show the same comfortable 12px gap between label and control. Check that the avatar emoji grid still aligns correctly under its label.

- [ ] **Step 3: Commit**

```bash
git add src/routes/signup.tsx
git commit -m "fix: increase label-to-input gap on signup form (space-y-2 → space-y-3)"
```
