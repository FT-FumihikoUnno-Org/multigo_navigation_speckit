#!/usr/bin/env sh
# POSIX shell variant (avoid bash-only options) - downloads Roboto TTF files
set -eu

OUT_DIR="$(dirname "$0")/../public/fonts"
mkdir -p "$OUT_DIR"

download() {
  url="$1"
  out="$2"
  if [ -f "$out" ]; then
    echo "Skipping existing $out"
    return 0
  fi
  if command -v curl >/dev/null 2>&1; then
    echo "Downloading $url -> $out"
    curl -fsSL "$url" -o "$out"
  elif command -v wget >/dev/null 2>&1; then
    echo "Downloading $url -> $out"
    wget -q -O "$out" "$url"
  else
    echo "Error: curl or wget is required to download fonts" >&2
    exit 1
  fi
}

# Try multiple known raw URL roots (GitHub raw and raw.githubusercontent)
# Allow overriding source via FONT_BASE_URL env var (useful if you host fonts)
# If not provided, tries a couple of known roots but may fail in restricted environments.
if [ -n "${FONT_BASE_URL:-}" ]; then
  BASEURL="$FONT_BASE_URL"
  echo "Using FONT_BASE_URL=$BASEURL"
  try_download() {
    name="$1"
    out="$2"
    url="$BASEURL/$name"
    echo "Attempting $url"
    if command -v curl >/dev/null 2>&1; then
      if curl -fsSL "$url" -o "$out"; then
        echo "Downloaded $name from $BASEURL"
        return 0
      fi
    elif command -v wget >/dev/null 2>&1; then
      if wget -q -O "$out" "$url"; then
        echo "Downloaded $name from $BASEURL"
        return 0
      fi
    fi
    return 1
  }
else
  BASE1="https://github.com/google/fonts/raw/main/apache/roboto"
  BASE2="https://raw.githubusercontent.com/google/fonts/main/apache/roboto"
  try_download() {
    name="$1"
    out="$2"
    for base in "$BASE1" "$BASE2"; do
      url="$base/$name"
      echo "Attempting $url"
      if command -v curl >/dev/null 2>&1; then
        if curl -fsSL "$url" -o "$out"; then
          echo "Downloaded $name from $base"
          return 0
        fi
      elif command -v wget >/dev/null 2>&1; then
        if wget -q -O "$out" "$url"; then
          echo "Downloaded $name from $base"
          return 0
        fi
      fi
    done
    return 1
  }
fi

if ! try_download "Roboto-Regular.ttf" "$OUT_DIR/Roboto-Regular.ttf"; then
  echo "Failed to download Roboto-Regular.ttf from known sources.\nYou can either set FONT_BASE_URL to point to a host that serves these files, or place the files manually into $OUT_DIR" >&2
  exit 1
fi
if ! try_download "Roboto-Medium.ttf" "$OUT_DIR/Roboto-Medium.ttf"; then
  echo "Failed to download Roboto-Medium.ttf from known sources.\nYou can either set FONT_BASE_URL to point to a host that serves these files, or place the files manually into $OUT_DIR" >&2
  exit 1
fi
if ! try_download "Roboto-Bold.ttf" "$OUT_DIR/Roboto-Bold.ttf"; then
  echo "Failed to download Roboto-Bold.ttf from known sources.\nYou can either set FONT_BASE_URL to point to a host that serves these files, or place the files manually into $OUT_DIR" >&2
  exit 1
fi

echo "Fonts downloaded to $OUT_DIR"