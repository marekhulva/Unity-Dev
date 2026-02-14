#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const PREVIEW_URL = 'https://iqlibqtswseitxtqpmlm.supabase.co';
const PREVIEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbGlicXRzd3NlaXR4dHFwbWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTczNzE2MiwiZXhwIjoyMDg1MzEzMTYyfQ.R61BBNfOMrBG52DCEbOhPSOOBA5aSG3_24Jm4KIYH2c';

const preview = createClient(PREVIEW_URL, PREVIEW_KEY);

async function checkFlag() {
  const { data } = await preview.from('feature_flags').select('*');
  console.log('Feature flag in preview database:\n');
  console.log(JSON.stringify(data, null, 2));
}

checkFlag();
