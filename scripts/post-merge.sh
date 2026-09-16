#!/bin/bash
set -e

npm install --legacy-peer-deps

npx drizzle-kit push --force 2>&1 || true

npx expo export --platform web --output-dir dist
