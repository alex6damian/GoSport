#!/bin/bash
# testing_script/cleanup_count_columns.sh

echo "🔧 Removing duplicate _count columns..."
echo ""

docker exec gosport-db psql -U pgadmin -d gosport <<EOF
-- Show current state
SELECT 
    id,
    title,
    views,
    views_count,
    likes,
    likes_count,
    favorites,
    favorites_count
FROM videos 
LIMIT 3;

-- Merge data (keep highest value)
UPDATE videos 
SET 
    views = GREATEST(COALESCE(views, 0), COALESCE(views_count, 0)),
    likes = GREATEST(COALESCE(likes, 0), COALESCE(likes_count, 0)),
    favorites = GREATEST(COALESCE(favorites, 0), COALESCE(favorites_count, 0));

-- Drop duplicate _count columns
ALTER TABLE videos DROP COLUMN IF EXISTS views_count;
ALTER TABLE videos DROP COLUMN IF EXISTS likes_count;
ALTER TABLE videos DROP COLUMN IF EXISTS favorites_count;

-- Verify final columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'videos' 
AND (column_name IN ('views', 'likes', 'favorites'))
ORDER BY ordinal_position;

-- Show final data
SELECT id, title, views, likes, favorites FROM videos LIMIT 3;
EOF

echo ""
echo "✅ Cleanup complete! DB now has: views, likes, favorites"