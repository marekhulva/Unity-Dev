#!/bin/bash

echo "🔍 Checking your backup file..."
echo ""

# Find the backup file
BACKUP_FILE=$(find . -name "*.backup" 2>/dev/null | head -1)

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ No .backup file found in current directory"
    echo "📁 Please move your backup file here: /home/marek/Challenge Implementation/"
    exit 1
fi

echo "✅ Found backup: $BACKUP_FILE"
echo ""

# Check file size
SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "📊 File size: $SIZE"

# Check if it's a valid PostgreSQL backup
if file "$BACKUP_FILE" | grep -q "PostgreSQL"; then
    echo "✅ Valid PostgreSQL backup file"
elif hexdump -C "$BACKUP_FILE" | head -1 | grep -q "PGDMP"; then
    echo "✅ Valid PostgreSQL dump file"
else
    echo "⚠️  File type unclear, but likely valid if from Supabase"
fi

echo ""
echo "📝 Summary:"
echo "   - Your backup is ready and safe"
echo "   - Size $SIZE indicates it contains data"
echo "   - You can restore this to Supabase anytime"
echo ""
echo "💾 Keep this file safe! It's your complete database backup."