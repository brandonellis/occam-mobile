# Maestro E2E Tests

End-to-end tests for the Occam Mobile booking flows using [Maestro](https://maestro.mobile.dev/).

Mirrors the Playwright E2E test structure from `occam-client/tests/e2e/`.

## Directory Structure

```
.maestro/
├── config.yaml                              # Global config + env vars
├── README.md                                # This file
├── helpers/
│   ├── login.yaml                           # Auth setup (mirrors client.setup.js)
│   ├── navigate-to-booking.yaml             # Navigate to service selection
│   ├── select-service.yaml                  # Select a service by name
│   ├── handle-location-selection.yaml       # Handle location step if shown
│   ├── handle-coach-selection.yaml          # Handle coach step if shown
│   └── select-first-timeslot.yaml           # Wait for + select first timeslot
└── external/
    ├── booking-flow.yaml                    # mirrors booking-flow.spec.js
    ├── booking-flow-auth.yaml               # mirrors booking-flow.auth.spec.js
    ├── variable-duration-booking.yaml       # mirrors variable-duration-booking.spec.js
    ├── booking-visibility.yaml              # mirrors booking-visibility.spec.js
    ├── booking-visibility-auth.yaml         # mirrors booking-visibility.auth.spec.js
    └── online-booking-controls.yaml         # mirrors online-booking-controls.spec.js
```

## Prerequisites

1. **Maestro CLI** installed:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   export PATH="$PATH:$HOME/.maestro/bin"
   ```

2. **iOS Simulator** running with Expo Go, or a physical device connected.

3. **Expo dev server** running:
   ```bash
   cd occam-mobile && npx expo start
   ```

4. **E2E seeded tenant** — flows rely on the same test data as the web E2E tests
   (from `E2eTenantSeeder` in `occam-platform`):
   - `e2e-client@occam.test` / `password` — member client with Premium membership
   - `e2e-nonmember@occam.test` / `password` — client without membership
   - "1:1 Coaching Session" — requires coach, `booking_visibility='all'`
   - "Member Lesson" — `booking_visibility='members_only'`
   - "Simulator Bay Rental" — variable duration, `requires_resource`
   - "Range Session" — no coach required
   - "Staff Only Fitting" — `online_booking_enabled=false`
   - "Short Game Lesson" — `advance_booking_limit_days=7`, $55
   - Coach Alpha, Coach Beta — seeded coaches

## Web ↔ Mobile Test Mapping

| Web Playwright Spec | Mobile Maestro Flow | What it tests |
|---|---|---|
| `booking-flow.spec.js` | `external/booking-flow.yaml` | 1:1 booking: service → coach → timeslot → confirmation |
| `booking-flow.auth.spec.js` | `external/booking-flow-auth.yaml` | Auth member: skips customer info, membership coverage |
| `variable-duration-booking.spec.js` | `external/variable-duration-booking.yaml` | Duration selection, price scaling, resource auto-selection |
| `booking-visibility.spec.js` | `external/booking-visibility.yaml` | Non-member can't see `members_only` services |
| `booking-visibility.auth.spec.js` | `external/booking-visibility-auth.yaml` | Member sees `members_only` + coach assignment filtering |
| `online-booking-controls.spec.js` | `external/online-booking-controls.yaml` | `online_booking_enabled` filtering, advance booking limits |

### Not yet ported (web-only)
- `membership-flow.spec.js` — membership purchase (not yet in mobile app)
- `membership-flow.auth.spec.js` — auth membership purchase
- `online-booking-controls.auth.spec.js` — admin booking controls
- `internal/` tests — admin/staff flows

## Running Tests

### Single flow:
```bash
maestro test .maestro/external/booking-flow.yaml \
  -e CLIENT_EMAIL=e2e-client@occam.test \
  -e CLIENT_PASSWORD=password \
  -e TEST_ORG=e2e
```

### Variable duration + resource auto-selection:
```bash
maestro test .maestro/external/variable-duration-booking.yaml \
  -e CLIENT_EMAIL=e2e-client@occam.test \
  -e CLIENT_PASSWORD=password \
  -e TEST_ORG=e2e
```

### Booking visibility (requires non-member account):
```bash
maestro test .maestro/external/booking-visibility.yaml \
  -e CLIENT_EMAIL=e2e-nonmember@occam.test \
  -e CLIENT_PASSWORD=password \
  -e TEST_ORG=e2e
```

### All external flows:
```bash
maestro test .maestro/external/ \
  -e CLIENT_EMAIL=e2e-client@occam.test \
  -e CLIENT_PASSWORD=password \
  -e TEST_ORG=e2e
```

## Test IDs

The following `testID` props are available for Maestro targeting:

### Service Selection
- `service-selection-list` — ScrollView containing service cards
- `service-card-{id}` — Individual service card

### Coach Selection
- `coach-selection-list` — ScrollView containing coach cards
- `coach-card-{id}` — Individual coach card

### Location Selection
- `location-selection-list` — ScrollView containing location cards
- `location-card-{id}` — Individual location card

### Duration Selection
- `duration-card-{minutes}` — Duration option card (e.g. `duration-card-60`)
- `duration-continue-button` — Continue button

### Time Slot Selection
- `date-item-{YYYY-MM-DD}` — Date selector item
- `time-slot-{id}` — Regular time slot
- `class-slot-{session_id}` — Class session slot
- `continue-button` — Continue button

### Booking Confirmation
- `confirm-booking-button` — Final confirm/pay button

## Notes

- Flows stop before actually confirming a booking to avoid creating real data.
  Uncomment the final `tapOn` in each flow to test full confirmation.
- Helper flows in `helpers/` are shared sub-flows called via `runFlow`.
- `maestro studio` is useful for exploring the UI hierarchy interactively.
- Each flow documents which web Playwright test it mirrors in its header comments.
