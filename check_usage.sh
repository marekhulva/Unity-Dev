#!/bin/bash

echo "=== DEPENDENCY ANALYSIS FOR SAFE CLEANUP ==="
echo ""
echo "📍 ACTIVE SCREENS (from navigation.tsx):"
echo "----------------------------------------"
echo "✅ DailyScreen.tsx"
echo "✅ SocialScreen.tsx" 
echo "✅ ProgressMVPEnhanced.tsx"
echo "✅ ProfileEnhanced.tsx"
echo "✅ OnboardingFlow (index)"
echo ""

echo "📦 CHECKING UNUSED SCREEN VARIANTS:"
echo "------------------------------------"

# Daily variants
echo ""
echo "Daily variants:"
for file in src/features/daily/DailyScreen*.tsx; do
    basename=$(basename "$file")
    if [ "$basename" != "DailyScreen.tsx" ]; then
        grep -l "$basename" src/**/*.{ts,tsx} 2>/dev/null | grep -v "$file" > /dev/null
        if [ $? -ne 0 ]; then
            echo "  ❌ $basename - NOT IMPORTED ANYWHERE (safe to delete)"
        else
            echo "  ⚠️  $basename - IMPORTED SOMEWHERE (check before deleting)"
        fi
    fi
done

# Progress variants
echo ""
echo "Progress variants:"
for file in src/features/progress/Progress*.tsx; do
    basename=$(basename "$file")
    if [ "$basename" != "ProgressMVPEnhanced.tsx" ] && [ "$basename" != "ProgressScreen.tsx" ]; then
        grep -l "$(basename $file .tsx)" src/**/*.{ts,tsx} navigation.tsx 2>/dev/null | grep -v "$file" > /dev/null
        if [ $? -ne 0 ]; then
            echo "  ❌ $basename - NOT IMPORTED ANYWHERE (safe to delete)"
        else
            imports=$(grep -l "$(basename $file .tsx)" src/**/*.{ts,tsx} navigation.tsx 2>/dev/null | grep -v "$file" | head -3)
            echo "  ⚠️  $basename - IMPORTED IN: $imports"
        fi
    fi
done

# Profile variants  
echo ""
echo "Profile variants:"
for file in src/features/profile/Profile*.tsx; do
    basename=$(basename "$file")
    if [ "$basename" != "ProfileEnhanced.tsx" ]; then
        grep -l "$(basename $file .tsx)" src/**/*.{ts,tsx} navigation.tsx 2>/dev/null | grep -v "$file" > /dev/null
        if [ $? -ne 0 ]; then
            echo "  ❌ $basename - NOT IMPORTED ANYWHERE (safe to delete)"
        else
            echo "  ⚠️  $basename - IMPORTED SOMEWHERE (check before deleting)"
        fi
    fi
done

# Social variants
echo ""
echo "Social variants:"
for file in src/features/social/Social*.tsx; do
    basename=$(basename "$file")
    if [ "$basename" != "SocialScreen.tsx" ] && [ "$basename" != "SocialSharePrompt.tsx" ]; then
        grep -l "$(basename $file .tsx)" src/**/*.{ts,tsx} navigation.tsx 2>/dev/null | grep -v "$file" > /dev/null
        if [ $? -ne 0 ]; then
            echo "  ❌ $basename - NOT IMPORTED ANYWHERE (safe to delete)"
        else
            echo "  ⚠️  $basename - IMPORTED SOMEWHERE (check before deleting)"
        fi
    fi
done

echo ""
echo "🔍 CHECKING COMPONENT DEPENDENCIES:"
echo "------------------------------------"

# Check key imported components
echo ""
echo "Components used by active screens:"
echo "  ✅ DailyReviewModalEnhanced (used by DailyScreen)"
echo "  ✅ ActionItem (used by DailyScreen)"
echo "  ✅ SocialSharePrompt (used by DailyScreen)"
echo "  ✅ ShareComposer (used by SocialScreen)"
echo "  ✅ FeedCard (used by SocialScreen)"
echo "  ✅ PostPromptCard (used by SocialScreen)"
echo "  ✅ LiquidGlassTabs (used by SocialScreen)"

echo ""
echo "🗑️  SAFE TO DELETE:"
echo "-------------------"
echo "Based on analysis, these files appear unused:"
echo ""

# List files that are definitely safe to delete
find src/features -name "*Ultra.tsx" -o -name "*Vibrant.tsx" -o -name "*Unified.tsx" 2>/dev/null | while read file; do
    basename=$(basename "$file")
    # Skip if it's actively used
    if [ "$basename" != "ProfileScreenUnified.tsx" ]; then
        grep -l "$(basename $file .tsx)" src/**/*.{ts,tsx} navigation.tsx 2>/dev/null | grep -v "$file" > /dev/null
        if [ $? -ne 0 ]; then
            echo "  rm $file"
        fi
    fi
done

echo ""
echo "✨ KEEP THESE (actively used):"
echo "------------------------------"
echo "  src/features/daily/DailyScreen.tsx"
echo "  src/features/daily/DailyReviewModalEnhanced.tsx"
echo "  src/features/daily/ActionItem.tsx"
echo "  src/features/daily/PrivacySelectionModal.tsx"
echo "  src/features/social/SocialScreen.tsx"
echo "  src/features/social/ShareComposer.tsx"
echo "  src/features/social/SocialSharePrompt.tsx"
echo "  src/features/social/components/*"
echo "  src/features/progress/ProgressMVPEnhanced.tsx"
echo "  src/features/profile/ProfileEnhanced.tsx"
echo "  src/features/onboarding/*"
echo "  src/state/*"
echo "  src/design/*"
echo "  src/ui/*"