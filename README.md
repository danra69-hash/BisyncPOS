# Bisync POS

Web-first restaurant POS. Flutter clients come later — keep domain logic UI-agnostic.

## Modes

Staff work in specialized modes (switch in the top bar):

| Mode | Devices | Focus |
|------|---------|--------|
| **Order** | Handheld, tableside tablet, waiter terminal | Floor plan, menus, modifiers, allergies, coursing, seat-level ordering, 86 board |
| **Cashier** | Counter, bar, kiosk (+ CFD / drawer) | Tender, split checks, tips, cash drawer, takeout dispatch, discounts/voids |
| **BOH** | KDS, back office, manager tablet | Kitchen routing, time clock, reports, permissions, settings |

Device profile in the top bar records which hardware the session targets.

## Stack

- React 19 + TypeScript + Vite
- React Router
- Feature modules: `domain/` (pure) + `ui/` (React)

## Run

```bash
npm install
npm run dev
```

## Layout

```
src/
  app/                      # shell, routes
  core/modes/               # Order / Cashier / BOH
  features/
    register/               # Order Mode take-order UI
    order/                  # floor, modifiers, 86
    cashier/                # checkout, drawer, dispatch
    boh/                    # KDS, labor, reports, permissions
```
