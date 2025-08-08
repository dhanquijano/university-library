-- Remove university columns from users table
-- This migration will remove the university_id and university_card columns
-- that are no longer needed in the application

-- First drop the unique constraint if it exists
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_university_id_unique";

-- Then drop the columns if they exist
ALTER TABLE "users" DROP COLUMN IF EXISTS "university_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "university_card"; 