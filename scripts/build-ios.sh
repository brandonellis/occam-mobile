#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Occam Golf — Local iOS Production Build & Submit
# Replaces EAS Build + EAS Submit with local Xcode toolchain.
#
# Usage:
#   ./scripts/build-ios.sh              # Build + upload to App Store Connect
#   ./scripts/build-ios.sh --build-only # Build archive only, skip upload
#   ./scripts/build-ios.sh --submit     # Upload most recent archive
# ──────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="$PROJECT_DIR/ios"
WORKSPACE="$IOS_DIR/OccamGolf.xcworkspace"
SCHEME="OccamGolf"
BUILD_DIR="$PROJECT_DIR/build"
ARCHIVE_PATH="$BUILD_DIR/OccamGolf.xcarchive"
EXPORT_PATH="$BUILD_DIR/export"
EXPORT_OPTIONS="$SCRIPT_DIR/ExportOptions.plist"

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
    echo "  (default)      Build archive and upload to App Store Connect"
    echo "  --build-only   Build archive only, skip upload"
    echo "  --submit       Upload the most recent archive (skip build)"
    exit 0
    ;;
esac

# ── Production environment variables ─────────────────────────
export EXPO_PUBLIC_APP_ENV=production
export EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_51Rkpc7JJjo8tO119YAIX8odwDUQMy4SCy6NaCebCH9tqA1jNfuFO1TjfYhyye3GLdD6BdhKnVevrXQxf5rUI6ATY00cp3E7DcZ"
export EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="826339810168-104olnb3ap2t5sqmkkm9c556n5qumnid.apps.googleusercontent.com"
export EXPO_PUBLIC_IOS_CLIENT_ID="826339810168-bd399kemauur3f1jjdqr5m2ldfs736er.apps.googleusercontent.com"

# ── Preflight checks ─────────────────────────────────────────
log "Running preflight checks..."

command -v xcodebuild >/dev/null 2>&1 || fail "Xcode command line tools not found. Install Xcode."
command -v xcrun      >/dev/null 2>&1 || fail "xcrun not found."

if [ ! -d "$WORKSPACE" ]; then
  fail "Xcode workspace not found at $WORKSPACE. Run 'npx expo prebuild --platform ios' first."
fi

if [ ! -f "$EXPORT_OPTIONS" ]; then
  fail "ExportOptions.plist not found at $EXPORT_OPTIONS. See scripts/ExportOptions.plist."
fi

ok "Preflight checks passed"

# ── Version & build number ──────────────────────────────────────
# Build number is persisted in a local file so it survives
# `expo prebuild --clean` (which wipes the ios/ directory).
BUILD_NUMBER_FILE="$PROJECT_DIR/.build-number"

if [ "$BUILD" = true ]; then
  CURRENT_VERSION=$(cd "$PROJECT_DIR" && node -e "console.log(require('./app.json').expo.version)")
  log "Current app version: $CURRENT_VERSION"

  # Read build number from our persistent file (fallback to Xcode project, then 0)
  if [ -f "$BUILD_NUMBER_FILE" ]; then
    CURRENT_BUILD=$(cat "$BUILD_NUMBER_FILE")
  else
    CURRENT_BUILD=$(xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" -showBuildSettings 2>/dev/null \
      | grep "CURRENT_PROJECT_VERSION" | head -1 | awk '{print $NF}')
    CURRENT_BUILD="${CURRENT_BUILD:-0}"
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
  log "Running expo prebuild..."
  cd "$PROJECT_DIR"
  npx expo prebuild --platform ios --clean --no-install

  log "Installing CocoaPods..."
  cd "$IOS_DIR"
  pod install --silent
  cd "$PROJECT_DIR"

  ok "Prebuild complete"

  # ── Apply build number AFTER prebuild ────────────────────────
  # prebuild --clean wipes ios/, so we must set the build number after.
  log "Setting build number to $NEXT_BUILD..."
  cd "$IOS_DIR"
  agvtool new-version -all "$NEXT_BUILD" >/dev/null 2>&1
  if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
    agvtool new-marketing-version "$NEW_VERSION" >/dev/null 2>&1
  fi
  cd "$PROJECT_DIR"

  # Persist build number so it survives the next --clean prebuild
  echo "$NEXT_BUILD" > "$BUILD_NUMBER_FILE"
  ok "Build number set to $NEXT_BUILD (saved to .build-number)"
fi

# ── Build archive ─────────────────────────────────────────────
if [ "$BUILD" = true ]; then
  log "Building release archive (this may take a few minutes)..."
  mkdir -p "$BUILD_DIR"

  xcodebuild -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Release \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE_PATH" \
    archive \
    COMPILER_INDEX_STORE_ENABLE=NO \
    DEVELOPMENT_TEAM="86P5XHSDSV" \
    -quiet

  ok "Archive built at $ARCHIVE_PATH"
fi

# ── Export + Upload to App Store Connect ──────────────────────
# ExportOptions.plist has destination=upload, so xcodebuild exports
# and uploads in a single step — no separate IPA file needed.
if [ "$SUBMIT" = true ]; then
  log "Exporting and uploading to App Store Connect..."

  xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -allowProvisioningUpdates \
  || {
    warn "Export/upload failed. Opening Xcode Organizer for manual upload..."
    open "$ARCHIVE_PATH"
    echo ""
    log "In Xcode Organizer: select the archive → Distribute App → App Store Connect → Upload"
    exit 0
  }

  ok "Upload complete! Check App Store Connect for the new build."
fi

echo ""
echo -e "${GREEN}Done!${NC}"
