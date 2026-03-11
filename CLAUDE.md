# House Inventory App - Claude Code Guide

## Project Overview

A shared, real-time household inventory tracker for two users (husband and wife) built with React + Vite and Firebase Firestore. Items have a binary In Stock / Needs Refill status that syncs instantly across both phones via web browser.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React + Vite |
| Database | Firebase Firestore (real-time) |
| Styling | Plain CSS |
| Hosting | Vercel (free) |

---

## Firestore Data Schema

**Collection:** `inventory`

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | String | Auto-ID | Unique document identifier |
| `name` | String | - | Item name (e.g., "Mleko") |
| `category` | String | - | One of: "Kitchen", "Fridge", "Bathroom", "Pharmacy" |
| `isLow` | Boolean | `false` | true = Needs Refill, false = In Stock |
| `lastUpdated` | Timestamp | - | Server timestamp of last toggle |
| `updatedBy` | String | - | Display name of user who last toggled |

---

## Categories

Fixed set of four (no custom categories in v1):

- **Kitchen**
- **Fridge**
- **Bathroom**
- **Pharmacy**

---

## File Structure

```
HouseInventory/
  index.html                   # Vite entry HTML
  vite.config.js               # Vite config
  package.json                 # Dependencies & scripts
  public/
    manifest.json              # PWA manifest
  src/
    main.jsx                   # React entry point
    App.jsx                    # Root: onSnapshot, state, Shopping Mode toggle, name prompt
    firebase.js                # Firebase init + Firestore export
    styles.css                 # All styles
    data/
      suggestions.js           # Local array of ~100 common item name strings (Serbian)
    hooks/
      useUserName.js           # localStorage hook for persisted user name
    components/
      ItemRow.jsx              # Clickable row: name, updatedBy tag, green/red bg
      CategorySection.jsx      # Collapsible section header + items
      AddItemModal.jsx         # Bottom sheet: input + autocomplete + category picker
      ShoppingToggle.jsx       # Header toggle switch component
```

---

## Core Features

1. **Binary Toggle** - Single tap flips `isLow`, writes `lastUpdated` + `updatedBy`
2. **Shopping Mode** - Toggle in header; ON = only `isLow === true` items shown
3. **Quick Add** - FAB opens bottom sheet with name input, category picker, "need now" toggle
4. **Smart Autocomplete** - Local suggestions from `data/suggestions.js`, startsWith filter, max 5 results
5. **"Updated By" Tag** - User name stored in localStorage, written to Firestore on every toggle
6. **Collapsible Sections** - Category headers collapse/expand (local state only)
7. **Real-Time Sync** - `onSnapshot` listener, both phones update instantly
8. **PWA Support** - Can be added to home screen on both iOS and Android

---

## Styling Conventions

- Green (In Stock): `#4CAF50` | Red (Needs Refill): `#F44336`
- FAB: `#2196F3`, 56x56, borderRadius 28, bottom-right
- Category picker: 4 equal buttons, active = `#2196F3`
- Max width: 480px centered (mobile-first)
- Minimum touch target: 48x48

---

## Commands

```bash
npm install                 # Install dependencies
npm run dev                 # Start dev server
npm run build               # Build for production
npm run preview             # Preview production build locally
```

---

## Deployment (Vercel - free)

1. Push to GitHub
2. Go to vercel.com, import repo
3. Framework: Vite, build command: `npm run build`, output: `dist`
4. Deploy — get a URL like `your-app.vercel.app`
5. Both phones open that URL in browser
6. "Add to Home Screen" for app-like experience

---

## Out of Scope (v1)

- User authentication
- Push notifications
- Item quantities or expiry dates
- Barcode / QR scanning
- Custom categories
- Undo / change history
