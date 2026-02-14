#!/bin/bash
# Complete Production → Staging Migration
# This script automates the entire backup and restore process

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║   Unity Vision: Production → Staging Migration        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not found${NC}"
    echo "  Install: npm install -g supabase"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ psql (PostgreSQL client) not found${NC}"
    echo "  Install: sudo apt-get install postgresql-client"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "  Install: https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}\n"

# ==============================================
# PART 1: BACKUP PRODUCTION DATABASE
# ==============================================

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PART 1: BACKUP PRODUCTION DATABASE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Getting production database connection string...${NC}"
echo "1. Go to Production Supabase → Click 'Connect' button"
echo "2. Choose 'Session pooler' tab"
echo "3. Copy the connection string"
echo ""
read -p "Paste Production DB connection string: " PROD_DB
echo ""

echo -e "${YELLOW}Backing up production database...${NC}"
echo "This may take 2-5 minutes depending on database size..."
echo ""

# Backup roles
echo "  📋 Backing up roles..."
supabase db dump --db-url "$PROD_DB" -f roles.sql --role-only
echo -e "${GREEN}  ✓ roles.sql created${NC}"

# Backup schema
echo "  📋 Backing up schema..."
supabase db dump --db-url "$PROD_DB" -f schema.sql
echo -e "${GREEN}  ✓ schema.sql created${NC}"

# Backup data
echo "  📋 Backing up data..."
supabase db dump --db-url "$PROD_DB" -f data.sql --use-copy --data-only
echo -e "${GREEN}  ✓ data.sql created${NC}"

echo -e "\n${GREEN}✓ Production backup complete!${NC}"
ls -lh roles.sql schema.sql data.sql
echo ""

# ==============================================
# PART 2: RESTORE TO STAGING DATABASE
# ==============================================

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PART 2: RESTORE TO STAGING DATABASE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Have you created the staging Supabase project?${NC}"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Click 'New project'"
echo "3. Name: Unity-Vision-Staging"
echo "4. Wait for provisioning"
echo ""
read -p "Press ENTER when staging project is ready..."
echo ""

echo -e "${YELLOW}Getting staging database connection string...${NC}"
echo "1. Go to Staging Supabase → Click 'Connect' button"
echo "2. Choose 'Session pooler' tab"
echo "3. Copy the connection string"
echo ""
read -p "Paste Staging DB connection string: " STAGING_DB
echo ""

echo -e "${YELLOW}Restoring to staging database...${NC}"
echo "This may take 2-5 minutes..."
echo ""

psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$STAGING_DB"

echo -e "\n${GREEN}✓ Database restored to staging!${NC}\n"

# ==============================================
# PART 3: MIGRATE STORAGE FILES
# ==============================================

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PART 3: MIGRATE STORAGE FILES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Installing storage migration dependencies...${NC}"
npm install @supabase/supabase-js@2
echo ""

echo -e "${YELLOW}Getting storage credentials...${NC}"
echo ""
echo "PRODUCTION:"
echo "1. Production Supabase → Settings → API"
echo "2. Copy 'Project URL' (https://xxx.supabase.co)"
read -p "Production Project URL: " PROD_URL
echo "3. Copy 'service_role key' (click Reveal)"
read -p "Production Service Key: " PROD_KEY
echo ""

echo "STAGING:"
echo "1. Staging Supabase → Settings → API"
echo "2. Copy 'Project URL' (https://yyy.supabase.co)"
read -p "Staging Project URL: " STAGING_URL
echo "3. Copy 'service_role key' (click Reveal)"
read -p "Staging Service Key: " STAGING_KEY
echo ""

echo -e "${YELLOW}Updating migrate-storage.js with your credentials...${NC}"

# Update migrate-storage.js with actual credentials
sed -i "s|const OLD_PROJECT_URL = '.*'|const OLD_PROJECT_URL = '$PROD_URL'|" migrate-storage.js
sed -i "s|const OLD_PROJECT_SERVICE_KEY = '.*'|const OLD_PROJECT_SERVICE_KEY = '$PROD_KEY'|" migrate-storage.js
sed -i "s|const NEW_PROJECT_URL = '.*'|const NEW_PROJECT_URL = '$STAGING_URL'|" migrate-storage.js
sed -i "s|const NEW_PROJECT_SERVICE_KEY = '.*'|const NEW_PROJECT_SERVICE_KEY = '$STAGING_KEY'|" migrate-storage.js

echo -e "${GREEN}✓ Credentials updated${NC}\n"

echo -e "${YELLOW}Running storage migration...${NC}"
echo "This may take 1-30 minutes depending on file count..."
echo ""

node migrate-storage.js

# ==============================================
# SUMMARY
# ==============================================

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ MIGRATION COMPLETE!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

echo "📁 Backup files created:"
echo "  - roles.sql"
echo "  - schema.sql"
echo "  - data.sql"
echo ""

echo "🎯 Next steps:"
echo "1. Verify data in staging (check Table Editor row counts)"
echo "2. Verify files in staging (check Storage buckets)"
echo "3. Update .env.staging with staging credentials"
echo "4. Switch to staging: cp .env.staging .env"
echo "5. Start testing: npm start"
echo ""

echo -e "${YELLOW}Keep the backup files safe! They're your safety net.${NC}\n"
