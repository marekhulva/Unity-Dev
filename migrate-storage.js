// Migrate Supabase Storage from Production to Staging
// Install dependencies: npm install @supabase/supabase-js@2

const { createClient } = require('@supabase/supabase-js')

// ============================================
// UPDATE THESE WITH YOUR PROJECT CREDENTIALS
// ============================================

// PRODUCTION (Settings → API)
const OLD_PROJECT_URL = 'https://xxx.supabase.co' // REPLACE ME
const OLD_PROJECT_SERVICE_KEY = 'old-project-service-key-xxx' // REPLACE ME

// STAGING (Settings → API)
const NEW_PROJECT_URL = 'https://yyy.supabase.co' // REPLACE ME
const NEW_PROJECT_SERVICE_KEY = 'new-project-service-key-yyy' // REPLACE ME

// ============================================
// MIGRATION SCRIPT (Don't modify below)
// ============================================

;(async () => {
  console.log('🚀 Starting storage migration...\n')

  // Create Supabase clients
  const oldSupabaseRestClient = createClient(OLD_PROJECT_URL, OLD_PROJECT_SERVICE_KEY, {
    db: {
      schema: 'storage',
    },
  })
  const oldSupabaseClient = createClient(OLD_PROJECT_URL, OLD_PROJECT_SERVICE_KEY)
  const newSupabaseClient = createClient(NEW_PROJECT_URL, NEW_PROJECT_SERVICE_KEY)

  // Get all objects from old storage
  console.log('📦 Fetching objects from production storage...')
  const { data: oldObjects, error } = await oldSupabaseRestClient.from('objects').select()

  if (error) {
    console.error('❌ Error getting objects from old storage:', error)
    throw error
  }

  if (!oldObjects || oldObjects.length === 0) {
    console.log('⚠️  No objects found in production storage')
    return
  }

  console.log(`✓ Found ${oldObjects.length} files to migrate\n`)

  // Track success/failure
  let successCount = 0
  let errorCount = 0
  const errors = []

  // Move each object
  for (let i = 0; i < oldObjects.length; i++) {
    const objectData = oldObjects[i]
    const progress = `[${i + 1}/${oldObjects.length}]`

    console.log(`${progress} Moving ${objectData.bucket_id}/${objectData.name}`)

    try {
      // Download from old project
      const { data, error: downloadError } = await oldSupabaseClient.storage
        .from(objectData.bucket_id)
        .download(objectData.name)

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`)
      }

      // Upload to new project
      const { error: uploadError } = await newSupabaseClient.storage
        .from(objectData.bucket_id)
        .upload(objectData.name, data, {
          upsert: true,
          contentType: objectData.metadata?.mimetype || 'application/octet-stream',
          cacheControl: objectData.metadata?.cacheControl || '3600',
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log(`  ✓ Success`)
      successCount++

    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`)
      errorCount++
      errors.push({
        bucket: objectData.bucket_id,
        file: objectData.name,
        error: err.message
      })
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`✓ Successful: ${successCount}`)
  console.log(`✗ Failed: ${errorCount}`)
  console.log(`📦 Total: ${oldObjects.length}`)

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:')
    errors.forEach(({ bucket, file, error }) => {
      console.log(`  - ${bucket}/${file}`)
      console.log(`    ${error}`)
    })
  }

  console.log('\n✅ Migration complete!\n')
})()
