#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting Passly with Docker Compose..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up --build "$@"
