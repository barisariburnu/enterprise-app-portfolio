#!/bin/sh
set -e

# Ensure db directory exists
mkdir -p /app/db

# Run migrations to create/update the database schema
# Pin Prisma CLI to v6 to stay compatible with current schema format
bunx prisma@6.11.1 db push

# Start the application
exec bun server.js
