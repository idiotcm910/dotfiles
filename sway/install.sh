#!/usr/bin/env bash
# Apply the versioned Sway configuration to the current user's ~/.config safely.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
SOURCE_DIR="${CONFIG_SOURCE:-$REPO_DIR/config}"
HOME_CONFIG="$HOME/.config"
PACKAGE_FILE="$REPO_DIR/packages.txt"
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage: bash sway/install.sh [--dry-run]

Install missing Ubuntu packages and copy the Sway desktop configuration into
~/.config. Existing component directories are moved to timestamped backups.

Options:
  --dry-run  Print package and file operations without changing anything.
  --help     Show this help text.
EOF
}

say() { printf '%s\n' "$*"; }
run() {
  if [ "$DRY_RUN" -eq 1 ]; then
    printf 'DRY RUN: '; printf '%q ' "$@"; printf '\n'
  else
    "$@"
  fi
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --help) usage; exit 0 ;;
    *) printf 'Unknown option: %s\n' "$arg" >&2; usage >&2; exit 2 ;;
  esac
done

[ -f "$PACKAGE_FILE" ] || { printf 'Missing package manifest: %s\n' "$PACKAGE_FILE" >&2; exit 1; }
[ -d "$SOURCE_DIR" ] || { printf 'Missing configuration source: %s\n' "$SOURCE_DIR" >&2; exit 1; }

mapfile -t packages < <(awk 'NF && $1 !~ /^#/' "$PACKAGE_FILE")
missing=()
for package in "${packages[@]}"; do
  dpkg-query -W -f='${db:Status-Status}' "$package" 2>/dev/null | grep -qx installed || missing+=("$package")
done

if [ "${#missing[@]}" -eq 0 ]; then
  say 'All declared packages are already installed.'
elif [ "${SKIP_APT:-0}" = 1 ]; then
  say "SKIP_APT=1: not installing missing packages: ${missing[*]}"
else
  run sudo apt-get update
  run sudo apt-get install -y "${missing[@]}"
fi

if [ "$DRY_RUN" -eq 1 ]; then say 'DRY RUN: no files will be changed.'; fi

timestamp="$(date +%Y%m%d-%H%M%S)"
found=0
while IFS= read -r -d '' source; do
  found=1
  component="$(basename "$source")"
  target="$HOME_CONFIG/$component"
  if [ -e "$target" ] || [ -L "$target" ]; then
    backup="$HOME_CONFIG/$component.backup-$timestamp"
    n=1
    while [ -e "$backup" ] || [ -L "$backup" ]; do backup="$HOME_CONFIG/$component.backup-$timestamp-$n"; n=$((n + 1)); done
    run mkdir -p "$HOME_CONFIG"
    run mv "$target" "$backup"
    say "Backup: $target -> $backup"
  fi
  run mkdir -p "$HOME_CONFIG"
  run cp -a "$source" "$target"
  say "Apply: $source -> $target"
done < <(find "$SOURCE_DIR" -mindepth 1 -maxdepth 1 -type d -print0 | sort -z)

[ "$found" -eq 1 ] || { printf 'No component directories found in: %s\n' "$SOURCE_DIR" >&2; exit 1; }
say 'Sway configuration apply complete.'
