#!/bin/bash
# Export Production Database to Staging
# This script dumps all data from production and imports to staging

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Unity Vision Database Migration ===${NC}\n"

# STEP 1: Get Production Credentials
echo -e "${YELLOW}Step 1: Production Database Connection${NC}"
echo "Go to Production Supabase → Settings → Database → Connection string"
echo "Copy the 'Connection string' (NOT the pooler)"
echo ""
read -p "Paste Production Connection String: " PROD_URL
echo ""

# STEP 2: Get Staging Credentials
echo -e "${YELLOW}Step 2: Staging Database Connection${NC}"
echo "Go to Staging Supabase → Settings → Database → Connection string"
echo ""
read -p "Paste Staging Connection String: " STAGING_URL
echo ""

# STEP 3: Export from Production
echo -e "${YELLOW}Step 3: Exporting data from Production...${NC}"
pg_dump "$PROD_URL" \
  --data-only \
  --inserts \
  --no-owner \
  --no-privileges \
  --exclude-table-data='_archived_*' \
  --exclude-table-data='storage.*' \
  --exclude-table-data='auth.*' \
  --file=production_data_backup.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Export successful! File: production_data_backup.sql${NC}"
  FILE_SIZE=$(du -h production_data_backup.sql | cut -f1)
  echo -e "${GREEN}  File size: $FILE_SIZE${NC}\n"
else
  echo -e "${RED}✗ Export failed!${NC}"
  exit 1
fi

# STEP 4: Import to Staging
echo -e "${YELLOW}Step 4: Importing data to Staging...${NC}"
echo -e "${RED}WARNING: This will add data to your staging database!${NC}"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

psql "$STAGING_URL" \
  --file=production_data_backup.sql \
  --quiet

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Import successful!${NC}\n"
else
  echo -e "${RED}✗ Import failed! Check errors above.${NC}"
  exit 1
fi

# STEP 5: Summary
echo -e "${GREEN}=== Migration Complete ===${NC}"
echo -e "Database data has been copied from production to staging."
echo -e "Backup file saved: ${YELLOW}production_data_backup.sql${NC}"
echo -e "\n${YELLOW}Next step: Copy Storage files (avatars, photos)${NC}"
echo -e "See: copy-storage-files.sh\n"
