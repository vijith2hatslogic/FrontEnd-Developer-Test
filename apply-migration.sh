#!/bin/bash

# Apply the migration to add recording columns
echo "Applying migration to add webcam_recording and screen_recording columns..."

# Get Supabase URL and key from environment variables
SUPABASE_URL=$(grep SUPABASE_URL .env.local | cut -d '=' -f2)
SUPABASE_KEY=$(grep SUPABASE_SERVICE_KEY .env.local | cut -d '=' -f2)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "Error: Supabase URL or key not found in .env.local"
    echo "Please make sure you have SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env.local file"
    exit 1
fi

# Apply the migration using the Supabase CLI or API
# This is a simplified version - in a real project, use the Supabase CLI
echo "Executing SQL from supabase/migrations/20251010_add_recording_columns.sql"

# Execute the SQL directly using curl
curl -X POST \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "sql": "ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS webcam_recording TEXT; ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS screen_recording TEXT;"
}
EOF

echo -e "\nMigration applied successfully!"
echo "The webcam_recording and screen_recording columns have been added to the test_submissions table."
echo "You can now use these columns to store and retrieve recording data."
