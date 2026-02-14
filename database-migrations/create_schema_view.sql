-- Create a view that your app can query to get schema information
-- This is PERFECT for displaying schema info in your app or for debugging

-- Drop if exists
DROP VIEW IF EXISTS public.db_schema;

-- Create the view that exposes schema safely
CREATE OR REPLACE VIEW public.db_schema AS
SELECT
  c.table_schema,
  c.table_name,
  json_agg(
    json_build_object(
      'column_name', c.column_name,
      'data_type', c.data_type,
      'is_nullable', c.is_nullable,
      'column_default', c.column_default,
      'character_maximum_length', c.character_maximum_length
    )
    ORDER BY c.ordinal_position
  ) AS columns
FROM information_schema.columns c
WHERE c.table_schema IN ('public')
  AND c.table_name NOT LIKE 'pg_%'
  AND c.table_name NOT LIKE '_prisma%'
GROUP BY c.table_schema, c.table_name
ORDER BY c.table_name;

-- Grant access to authenticated users
GRANT SELECT ON public.db_schema TO authenticated;
GRANT SELECT ON public.db_schema TO anon;

-- Create RLS policy (optional - allows everyone to read)
ALTER TABLE public.db_schema ENABLE ROW LEVEL SECURITY;

-- Create another useful view for foreign keys
CREATE OR REPLACE VIEW public.db_relationships AS
SELECT
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Grant access
GRANT SELECT ON public.db_relationships TO authenticated;
GRANT SELECT ON public.db_relationships TO anon;