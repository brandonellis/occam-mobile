#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Occam Golf — Local Android Production Build & Submit
# Replaces EAS Build + EAS Submit with local Gradle toolchain.
#
# Usage:
#   ./scripts/build-android.sh              # Build + upload to Play Store (internal track)
#   ./scripts/build-android.sh --build-only # Build AAB only, skip upload
#   ./scripts/build-android.sh --submit     # Upload most recent AAB
# ──────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"
BUILD_DIR="$PROJECT_DIR/build"
AAB_OUTPUT="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
AAB_DEST="$BUILD_DIR/OccamGolf.aab"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[build]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Parse args ────────────────────────────────────────────────
BUILD=true
SUBMIT=true

case "${1:-}" in
  --build-only) SUBMIT=false ;;
  --submit)     BUILD=false ;;
  --help|-h)
    echo "Usage: $0 [--build-only | --submit]"
    echo "  (default)      Build AAB and upload to Google Play (internal track)"
    echo "  --build-only   Build AAB only, skip upload"
    echo "  --submit       Upload the most recent AAB (skip build)"
    exit 0
    ;;
esac

# ── Production environment variables ─────────────────────────
export EXPO_PUBLIC_APP_ENV=production
export EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_51Rkpc7JJjo8tO119YAIX8odwDUQMy4SCy6NaCebCH9tqA1jNfuFO1TjfYhyye3GLdD6BdhKnVevrXQxf5rUI6ATY00cp3E7DcZ"
export EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="826339810168-104olnb3ap2t5sqmkkm9c556n5qumnid.apps.googleusercontent.com"
export EXPO_PUBLIC_ANDROID_CLIENT_ID="${EXPO_PUBLIC_ANDROID_CLIENT_ID:-}"

# ── Preflight checks ─────────────────────────────────────────
log "Running preflight checks..."

if [ "$BUILD" = true ]; then
  if ! command -v java >/dev/null 2>&1; then
    fail "Java not found. Install JDK 17+ (e.g., 'brew install openjdk@17')."
  fi

  JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
  if [ "$JAVA_VERSION" -lt 17 ] 2>/dev/null; then
    fail "JDK 17+ required. Found JDK $JAVA_VERSION."
  fi
fi

ok "Preflight checks passed"

# ── Version & build number ──────────────────────────────────────
BUILD_NUMBER_FILE="$PROJECT_DIR/.build-number-android"

if [ "$BUILD" = true ]; then
  CURRENT_VERSION=$(cd "$PROJECT_DIR" && node -e "console.log(require('./app.json').expo.version)")
  log "Current app version: $CURRENT_VERSION"

  if [ -f "$BUILD_NUMBER_FILE" ]; then
    CURRENT_BUILD=$(cat "$BUILD_NUMBER_FILE")
  else
    CURRENT_BUILD=0
  fi
  NEXT_BUILD=$((CURRENT_BUILD + 1))

  log "Current build number: $CURRENT_BUILD"
  log "Next build number: $NEXT_BUILD"

  read -rp "$(echo -e "${YELLOW}Version ($CURRENT_VERSION) ok? Enter new version or press Enter to keep:${NC} ")" NEW_VERSION
  NEW_VERSION="${NEW_VERSION:-$CURRENT_VERSION}"

  read -rp "$(echo -e "${YELLOW}Build number $NEXT_BUILD ok? Enter different number or press Enter:${NC} ")" CUSTOM_BUILD
  NEXT_BUILD="${CUSTOM_BUILD:-$NEXT_BUILD}"

  # Update version in app.json if changed
  if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
    log "Updating app.json version to $NEW_VERSION..."
    node -e "
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('app.json', 'utf8'));
      config.expo.version = '$NEW_VERSION';
      fs.writeFileSync('app.json', JSON.stringify(config, null, 2) + '\n');
    "
    ok "Version updated to $NEW_VERSION"
  fi
fi

# ── Prebuild (regenerate native project) ─────────────────────
if [ "$BUILD" = true ]; then
  log "Running expo prebuild for Android..."
  cd "$PROJECT_DIR"
  npx expo prebuild --platform android --clean

  ok "Prebuild complete"

  # ── Apply version code AFTER prebuild ────────────────────────
  log "Setting versionCode to $NEXT_BUILD..."
  GRADLE_FILE="$ANDROID_DIR/app/build.gradle"
  if [ -f "$GRADLE_FILE" ]; then
    sed -i '' "s/versionCode [0-9]*/versionCode $NEXT_BUILD/" "$GRADLE_FILE"
    if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
      sed -i '' "s/versionName \"[^\"]*\"/versionName \"$NEW_VERSION\"/" "$GRADLE_FILE"
    fi
  fi

  echo "$NEXT_BUILD" > "$BUILD_NUMBER_FILE"
  ok "Build number set to $NEXT_BUILD (saved to .build-number-android)"
fi

# ── Build AAB ─────────────────────────────────────────────────
if [ "$BUILD" = true ]; then
  log "Building release AAB (this may take a few minutes)..."
  mkdir -p "$BUILD_DIR"

  cd "$ANDROID_DIR"
  ./gradlew bundleRelease --no-daemon -q

  if [ ! -f "$AAB_OUTPUT" ]; then
    fail "AAB not found at $AAB_OUTPUT"
  fi

  cp "$AAB_OUTPUT" "$AAB_DEST"
  ok "AAB built at $AAB_DEST"
  cd "$PROJECT_DIR"
fi

# ── Upload to Google Play ────────────────────────────────────
if [ "$SUBMIT" = true ]; then
  if [ ! -f "$AAB_DEST" ]; then
    fail "No AAB found at $AAB_DEST. Run a build first."
  fi

  log "Uploading to Google Play (internal track)..."
  npx eas-cli submit --platform android --path "$AAB_DEST" --non-interactive \
    || {
      warn "EAS Submit failed. You can manually upload $AAB_DEST to Google Play Console."
      exit 0
    }

  ok "Upload complete! Check Google Play Console for the new build."
fi

echo ""
echo -e "${GREEN}Done!${NC}"
