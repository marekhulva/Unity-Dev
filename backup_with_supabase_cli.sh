#!/bin/bash

# Easier Backup Using Supabase CLI
# This uses the Supabase CLI which already has your credentials

echo "🔒 Starting Database Backup with Supabase CLI..."

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/supabase_backup_$TIMESTAMP.sql"
PROJECT_ID="ojusijzhshvviqjeyhyn"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup using Supabase CLI..."
echo "⏳ This may take a few minutes..."

# Use Supabase CLI to dump the database
npx supabase db dump \
    --project-ref "$PROJECT_ID" \
    > "$BACKUP_FILE" 2> "$BACKUP_DIR/backup_log_$TIMESTAMP.txt"

# Check if backup was successful
if [ $? -eq 0 ]; then
    # Get file size
    SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "✅ Backup completed successfully!"
    echo "📁 File: $BACKUP_FILE"
    echo "📊 Size: $SIZE"
    
    # Compress it
    echo "🗜️ Compressing backup..."
    gzip -k "$BACKUP_FILE"
    echo "📦 Compressed: ${BACKUP_FILE}.gz"
else
    echo "❌ Backup failed!"
    echo "You might need to login first:"
    echo "  npx supabase login"
    exit 1
fi

echo ""
echo "🎯 Done! Your entire database is backed up to:"
echo "   $BACKUP_FILE"