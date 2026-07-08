#!/bin/bash
set -e

npm install --legacy-peer-deps

npx drizzle-kit push --force 2>&1 || true
