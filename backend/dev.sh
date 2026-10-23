#!/bin/sh
# Starts the backend with settings from .env (if present).
cd "$(dirname "$0")" && { [ -f .env ] && set -a && . ./.env && set +a; } ; exec go run .
