#!/bin/sh
set -e

# Ensure db directory exists
mkdir -p /app/db

# Run migrations to create/update the database schema
# Prisma 6 no longer supports --skip-generate for db push
# Client is already generated during image build
bunx prisma db push

# Start the application
exec bun server.js
