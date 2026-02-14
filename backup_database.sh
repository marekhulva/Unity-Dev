#!/bin/bash

# Database Backup Script for Supabase
# Usage: ./backup_database.sh

echo "🔒 Starting Full Database Backup..."

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/full_backup_$TIMESTAMP.sql"

# You need to set your connection string here
# Get it from: https://supabase.com/dashboard/project/ojusijzhshvviqjeyhyn/settings/database
# Look for "Connection string" → "URI"
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.ojusijzhshvviqjeyhyn.supabase.co:5432/postgres"

# Check if DATABASE_URL is set
if [[ "$DATABASE_URL" == *"[YOUR-PASSWORD]"* ]]; then
    echo "❌ Error: Please update DATABASE_URL with your actual password!"
    echo "   Edit this file and replace [YOUR-PASSWORD] with your database password"
    echo "   Get it from: Supabase Dashboard → Settings → Database → Connection String"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform the backup
echo "📦 Creating backup: $BACKUP_FILE"
echo "⏳ This may take a few minutes..."

pg_dump "$DATABASE_URL" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --quote-all-identifiers \
    --no-comments \
    --verbose \
    > "$BACKUP_FILE" 2> "$BACKUP_DIR/backup_log_$TIMESTAMP.txt"

# Check if backup was successful
if [ $? -eq 0 ]; then
    # Get file size
    SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "✅ Backup completed successfully!"
    echo "📁 File: $BACKUP_FILE"
    echo "📊 Size: $SIZE"
    echo ""
    echo "📝 To restore this backup later:"
    echo "   psql \$DATABASE_URL < $BACKUP_FILE"
else
    echo "❌ Backup failed! Check $BACKUP_DIR/backup_log_$TIMESTAMP.txt for errors"
    exit 1
fi

# Optional: Compress the backup
echo "🗜️ Compressing backup..."
gzip -k "$BACKUP_FILE"
echo "📦 Compressed file: ${BACKUP_FILE}.gz"

echo ""
echo "🎯 Backup Summary:"
echo "   Original: $BACKUP_FILE"
echo "   Compressed: ${BACKUP_FILE}.gz"
echo "   Log: $BACKUP_DIR/backup_log_$TIMESTAMP.txt"
echo ""
echo "💡 Keep this backup safe! You can restore your entire database from it."