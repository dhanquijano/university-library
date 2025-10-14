# Users Table Migration: Status to Branch

This migration changes the `users` table structure by replacing the `status` column with a `branch` column.

## What This Migration Does

### Before Migration
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  status status DEFAULT 'PENDING',  -- ❌ This column will be removed
  role role DEFAULT 'USER',
  last_activity_date DATE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### After Migration
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  branch TEXT,                      -- ✅ New column added
  role role DEFAULT 'USER',
  last_activity_date DATE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## How to Run the Migration

### Option 1: Using npm scripts (Recommended)
```bash
# Run the migration
npm run migrate:users

# If you need to rollback
npm run rollback:users
```

### Option 2: Direct script execution
```bash
# Run the migration
node scripts/run-migration.js

# If you need to rollback
node scripts/rollback-users-branch-to-status.js
```

## Migration Steps

The migration script performs these steps:

1. **Check existing columns** - Verifies current table structure
2. **Add branch column** - Adds the new `branch TEXT` column
3. **Migrate data** - Handles existing user data (currently sets branch to NULL)
4. **Drop status column** - Removes the old `status` column
5. **Clean up enum** - Drops the unused `status` enum type if not used elsewhere

## Data Migration Strategy

Currently, the migration sets all existing users' `branch` to `NULL`. You can customize this by modifying the migration script:

```javascript
// Example: Set all users to a default branch
await db.execute(sql`UPDATE users SET branch = 'main' WHERE branch IS NULL`);

// Example: Set branch based on role
await db.execute(sql`
  UPDATE users 
  SET branch = CASE 
    WHEN role = 'ADMIN' THEN 'headquarters'
    WHEN role = 'MANAGER' THEN 'main'
    ELSE 'general'
  END 
  WHERE branch IS NULL
`);
```

## Rollback Process

If you need to revert the changes, the rollback script will:

1. Recreate the `status` enum type
2. Add back the `status` column with default value 'PENDING'
3. Set all existing users to 'PENDING' status
4. Drop the `branch` column

## Important Notes

⚠️ **Before running the migration:**

1. **Backup your database** - Always backup before schema changes
2. **Test in development** - Run the migration in a development environment first
3. **Check dependencies** - Ensure no application code depends on the `status` field
4. **Plan downtime** - Consider if you need maintenance mode during migration

## Environment Requirements

- Node.js environment with database access
- `DATABASE_URL` environment variable set
- Required dependencies: `drizzle-orm`, `postgres`

## Troubleshooting

### Common Issues

1. **Permission denied**: Ensure your database user has ALTER TABLE permissions
2. **Column already exists**: The script handles this gracefully and will skip existing columns
3. **Enum in use**: If the `status` enum is used elsewhere, it won't be dropped

### Checking Migration Status

You can verify the migration by checking the table structure:

```sql
-- Check current columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if status enum still exists
SELECT typname FROM pg_type WHERE typname = 'status';
```

## Files Created

- `scripts/migrate-users-status-to-branch.js` - Main migration script
- `scripts/rollback-users-branch-to-status.js` - Rollback script  
- `scripts/run-migration.js` - Simple runner script
- `scripts/MIGRATION_README.md` - This documentation

## Support

If you encounter issues during migration:

1. Check the console output for specific error messages
2. Verify your database connection and permissions
3. Ensure all dependencies are installed
4. Consider running the rollback if needed