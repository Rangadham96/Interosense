#!/bin/bash
set -e

npm install --legacy-peer-deps

yes "" | npx drizzle-kit push 2>&1 || true
