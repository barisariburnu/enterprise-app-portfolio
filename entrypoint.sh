#!/bin/sh
set -e

# Ensure db directory exists
mkdir -p /app/db

# Run migrations to create/update the database schema
# This is idempotent - safe to run on every startup
bunx prisma db push --skip-generate

# Start the application
exec bun server.js
