#!/usr/bin/env bash
# Run all Maestro E2E flows in the correct order.
#
# Strategy:
#   1. Reset keychain → login as member client → run member flows
#   2. Reset keychain → login as non-member client → run non-member flows
#   3. Reset keychain → login as coach → run coach flows
#   4. Reset keychain → login as admin → run admin flows
#
# Usage:
#   cd occam-mobile && .maestro/run-all.sh
#
# Prerequisites:
#   - iOS Simulator running with com.occamgolf.app installed
#   - Metro bundler running (npx expo start)
#   - E2E tenant seeded (php artisan e2e:setup --seed-only)

set -euo pipefail

APP_ID="com.occamgolf.app"
DEVICE_ID="${MAESTRO_DEVICE_ID:-booted}"
MAESTRO="${MAESTRO_BIN:-maestro}"

# ── Env vars (override via environment or .env file) ─────────────────
MEMBER_EMAIL="${E2E_MEMBER_EMAIL:-e2e-client@occam.test}"
MEMBER_PASSWORD="${E2E_MEMBER_PASSWORD:-password}"
GUEST_EMAIL="${E2E_GUEST_EMAIL:-e2e-guest@occam.test}"
GUEST_PASSWORD="${E2E_GUEST_PASSWORD:-password}"
COACH_EMAIL="${E2E_COACH_EMAIL:-coach.alpha@e2e-golf.test}"
COACH_PASSWORD="${E2E_COACH_PASSWORD:-password}"
ADMIN_EMAIL="${E2E_ADMIN_EMAIL:-e2e-staff@occam.test}"
ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-password}"
TEST_ORG="${E2E_TEST_ORG:-e2e}"
TEST_CLIENT_NAME="${E2E_TEST_CLIENT_NAME:-E2E Client}"

PASSED=0
FAILED=0
FAILURES=()

run_flow() {
  local name="$1"; shift
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Running: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if "$MAESTRO" test "$@"; then
    echo "  ✅ PASSED: $name"
    PASSED=$((PASSED + 1))
  else
    echo "  ❌ FAILED: $name"
    FAILED=$((FAILED + 1))
    FAILURES+=("$name")
  fi
}

reset_keychain() {
  echo ""
  echo "🔑 Resetting simulator keychain..."
  xcrun simctl terminate "$DEVICE_ID" "$APP_ID" 2>/dev/null || true
  sleep 2
  xcrun simctl keychain "$DEVICE_ID" reset 2>/dev/null || true
  sleep 2
  xcrun simctl launch "$DEVICE_ID" "$APP_ID" 2>/dev/null || true
  echo "⏳ Waiting for app to stabilize..."
  sleep 15
}

# ── Phase 1: Member client flows ─────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
echo "  Phase 1: Member Client Flows (${MEMBER_EMAIL})"
echo "═══════════════════════════════════════════════════════════════"

reset_keychain

run_flow "auth-client" \
  .maestro/external/auth-client.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

reset_keychain

run_flow "booking-flow" \
  .maestro/external/booking-flow.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "booking-flow-auth" \
  .maestro/external/booking-flow-auth.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "variable-duration-booking" \
  .maestro/external/variable-duration-booking.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "booking-visibility-auth" \
  .maestro/external/booking-visibility-auth.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "online-booking-controls" \
  .maestro/external/online-booking-controls.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "membership-booking-discount" \
  .maestro/external/membership-booking-discount.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "caddie-chat" \
  .maestro/external/caddie-chat.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "client-bookings" \
  .maestro/external/client-bookings.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "membership-plans" \
  .maestro/external/membership-plans.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "notifications" \
  .maestro/external/notifications.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "client-profile" \
  .maestro/external/client-profile.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "tab-navigation-client" \
  .maestro/external/tab-navigation-client.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "deep-link-booking" \
  .maestro/external/deep-link-booking.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "deep-link-notifications" \
  .maestro/external/deep-link-notifications.yaml \
  -e CLIENT_EMAIL="$MEMBER_EMAIL" \
  -e CLIENT_PASSWORD="$MEMBER_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

# ── Phase 2: Non-member client flows ─────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Phase 2: Non-Member Client Flows (${GUEST_EMAIL})"
echo "═══════════════════════════════════════════════════════════════"

reset_keychain

run_flow "booking-visibility" \
  .maestro/external/booking-visibility.yaml \
  -e CLIENT_EMAIL="$GUEST_EMAIL" \
  -e CLIENT_PASSWORD="$GUEST_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "package-list" \
  .maestro/external/package-list.yaml \
  -e CLIENT_EMAIL="$GUEST_EMAIL" \
  -e CLIENT_PASSWORD="$GUEST_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

# ── Phase 3: Coach flows ─────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Phase 3: Coach Flows (${COACH_EMAIL})"
echo "═══════════════════════════════════════════════════════════════"

reset_keychain

run_flow "auth-coach" \
  .maestro/external/auth-coach.yaml \
  -e COACH_EMAIL="$COACH_EMAIL" \
  -e COACH_PASSWORD="$COACH_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

reset_keychain

run_flow "booking-flow-coach" \
  .maestro/external/booking-flow-coach.yaml \
  -e COACH_EMAIL="$COACH_EMAIL" \
  -e COACH_PASSWORD="$COACH_PASSWORD" \
  -e TEST_ORG="$TEST_ORG" \
  -e TEST_CLIENT_NAME="$TEST_CLIENT_NAME"

run_flow "marshal-chat" \
  .maestro/external/marshal-chat.yaml \
  -e COACH_EMAIL="$COACH_EMAIL" \
  -e COACH_PASSWORD="$COACH_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "coach-schedule" \
  .maestro/external/coach-schedule.yaml \
  -e COACH_EMAIL="$COACH_EMAIL" \
  -e COACH_PASSWORD="$COACH_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "coach-profile" \
  .maestro/external/coach-profile.yaml \
  -e COACH_EMAIL="$COACH_EMAIL" \
  -e COACH_PASSWORD="$COACH_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "tab-navigation-coach" \
  .maestro/external/tab-navigation-coach.yaml \
  -e COACH_EMAIL="$COACH_EMAIL" \
  -e COACH_PASSWORD="$COACH_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

# ── Phase 4: Admin flows ─────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Phase 4: Admin Flows (${ADMIN_EMAIL})"
echo "═══════════════════════════════════════════════════════════════"

reset_keychain

run_flow "auth-admin" \
  .maestro/external/auth-admin.yaml \
  -e ADMIN_EMAIL="$ADMIN_EMAIL" \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

reset_keychain

run_flow "marshal-admin-chat" \
  .maestro/external/marshal-admin-chat.yaml \
  -e ADMIN_EMAIL="$ADMIN_EMAIL" \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

run_flow "admin-schedule" \
  .maestro/external/admin-schedule.yaml \
  -e ADMIN_EMAIL="$ADMIN_EMAIL" \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  -e TEST_ORG="$TEST_ORG"

# ── Summary ──────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Results: $PASSED passed, $FAILED failed ($(( PASSED + FAILED )) total)"
echo "═══════════════════════════════════════════════════════════════"

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "  Failed flows:"
  for f in "${FAILURES[@]}"; do
    echo "    ❌ $f"
  done
  exit 1
fi

echo "  🎉 All flows passed!"
exit 0
