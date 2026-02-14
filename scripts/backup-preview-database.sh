#!/bin/bash

# Backup Preview Branch Database
# Created: 2026-02-09
# This backs up the preview database before deletion

BACKUP_DIR="/home/marek/Unity-vision/database-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/preview-branch-backup-$TIMESTAMP.sql"

echo "🗄️  Backing up Preview Branch Database"
echo "======================================"
echo ""
echo "Backup location: $BACKUP_FILE"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Database connection details
DB_HOST="aws-0-us-west-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.iqlibqtswseitxtqpmlm"
DB_PASSWORD="AQhMrbHzPiHnLhkTivHvZJIYNKTbqBud"

# Export using pg_dump
echo "📦 Exporting database..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F c \
  -f "$BACKUP_FILE.dump" \
  --verbose

# Also export as plain SQL for readability
echo ""
echo "📝 Creating readable SQL version..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f "$BACKUP_FILE" \
  --verbose

echo ""
echo "✅ Backup complete!"
echo ""
echo "Files created:"
echo "  1. $BACKUP_FILE (readable SQL)"
echo "  2. $BACKUP_FILE.dump (compressed binary)"
echo ""
echo "File sizes:"
ls -lh "$BACKUP_FILE"* | awk '{print "  " $9 " - " $5}'
echo ""
echo "🎯 You can now safely delete the preview branch!"
echo ""
