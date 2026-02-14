#!/bin/bash
# Copy Storage Files from Production to Staging
# This copies all files from Supabase Storage buckets

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Unity Vision Storage Migration ===${NC}\n"

# STEP 1: Install Supabase CLI (if not installed)
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
fi

echo -e "${YELLOW}Step 1: Production Storage Setup${NC}"
echo "Go to Production Supabase → Settings → API"
read -p "Paste Production Project URL (https://xxx.supabase.co): " PROD_URL
read -p "Paste Production Service Role Key: " PROD_KEY
echo ""

echo -e "${YELLOW}Step 2: Staging Storage Setup${NC}"
echo "Go to Staging Supabase → Settings → API"
read -p "Paste Staging Project URL (https://xxx.supabase.co): " STAGING_URL
read -p "Paste Staging Service Role Key: " STAGING_KEY
echo ""

# STEP 2: List buckets in production
echo -e "${YELLOW}Step 3: Fetching storage buckets from production...${NC}"

# Common bucket names (adjust based on your setup)
BUCKETS=("avatars" "post-photos" "challenge-photos" "audio")

echo -e "${GREEN}Buckets to copy:${NC}"
for bucket in "${BUCKETS[@]}"; do
  echo "  - $bucket"
done
echo ""

read -p "Continue with migration? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

# STEP 3: Download files from production
echo -e "${YELLOW}Step 4: Downloading files from production...${NC}"
mkdir -p storage_backup

for bucket in "${BUCKETS[@]}"; do
  echo -e "\n${YELLOW}Downloading bucket: $bucket${NC}"

  # Use curl to list files in bucket
  FILES=$(curl -s "$PROD_URL/storage/v1/object/list/$bucket" \
    -H "Authorization: Bearer $PROD_KEY" | jq -r '.[].name')

  if [ -z "$FILES" ]; then
    echo -e "${YELLOW}  No files in $bucket (or bucket doesn't exist)${NC}"
    continue
  fi

  mkdir -p "storage_backup/$bucket"

  # Download each file
  for file in $FILES; do
    echo "  Downloading: $file"
    curl -s "$PROD_URL/storage/v1/object/public/$bucket/$file" \
      -H "Authorization: Bearer $PROD_KEY" \
      -o "storage_backup/$bucket/$file"
  done

  echo -e "${GREEN}  ✓ Downloaded $bucket${NC}"
done

# STEP 4: Upload files to staging
echo -e "\n${YELLOW}Step 5: Uploading files to staging...${NC}"

for bucket in "${BUCKETS[@]}"; do
  if [ ! -d "storage_backup/$bucket" ]; then
    continue
  fi

  echo -e "\n${YELLOW}Uploading bucket: $bucket${NC}"

  # Create bucket in staging if it doesn't exist
  curl -s -X POST "$STAGING_URL/storage/v1/bucket" \
    -H "Authorization: Bearer $STAGING_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"$bucket\",\"name\":\"$bucket\",\"public\":true}" > /dev/null

  # Upload each file
  for file in storage_backup/$bucket/*; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      echo "  Uploading: $filename"

      curl -s -X POST "$STAGING_URL/storage/v1/object/$bucket/$filename" \
        -H "Authorization: Bearer $STAGING_KEY" \
        -F "file=@$file" > /dev/null
    fi
  done

  echo -e "${GREEN}  ✓ Uploaded $bucket${NC}"
done

# STEP 5: Summary
echo -e "\n${GREEN}=== Migration Complete ===${NC}"
echo -e "Storage files have been copied from production to staging."
echo -e "Backup folder: ${YELLOW}storage_backup/${NC}"
echo -e "\n${YELLOW}Note: You can delete storage_backup/ after verifying files in staging.${NC}\n"
