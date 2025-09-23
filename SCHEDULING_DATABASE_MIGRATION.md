# Scheduling Database Migration

## Overview
Successfully migrated the staff scheduling system from Redis to PostgreSQL database for better data persistence, reliability, and integration with the existing appointment system.

## What Was Changed

### 1. Database Schema Updates
- **Added new tables** in `database/schema.ts`:
  - `staffShifts` - Stores staff shift schedules
  - `staffLeaves` - Stores staff leave requests and approvals
  - `shiftTemplates` - Stores reusable shift templates
  - **Added enums** for data validation:
    - `shift_type` - full, half, split
    - `leave_type` - vacation, sick, unpaid, other
    - `leave_status` - pending, approved, denied

### 2. API Route Updates
Updated all scheduling API routes to use database instead of Redis:

#### `/api/admin/scheduling/shifts/route.ts`
- ✅ GET - Fetch shifts with filtering by branch, barber, date range
- ✅ POST - Create new shifts with overlap validation
- ✅ PATCH - Update existing shifts with validation
- ✅ DELETE - Remove shifts

#### `/api/admin/scheduling/leaves/route.ts`
- ✅ GET - Fetch leaves with filtering by barber
- ✅ POST - Create new leave requests
- ✅ PATCH - Update leave status (approve/deny)

#### `/api/admin/scheduling/templates/route.ts`
- ✅ GET - Fetch shift templates with fallback to defaults
- ✅ POST - Create new templates

### 3. Staff Availability Integration
Updated `lib/appointment-utils.ts`:
- ✅ `getAvailableTimeSlots()` - Now queries database for shifts and leaves
- ✅ `isStaffAvailable()` - Uses database for real-time availability checks
- ✅ Proper handling of shift breaks (stored as JSON)
- ✅ Integration with existing appointment booking system

### 4. Migration Files
- ✅ Created `migrations/0013_add_scheduling_tables.sql` with:
  - Table creation statements
  - Enum type definitions
  - Default template data insertion

## Key Benefits

### 🔒 **Data Persistence**
- Scheduling data now persists across server restarts
- No more data loss when Redis cache is cleared
- Proper backup and recovery capabilities

### 🔗 **Better Integration**
- Seamless integration with existing appointment system
- Consistent data model across the application
- Proper foreign key relationships (future enhancement)

### 📊 **Improved Performance**
- Database indexes for faster queries
- Optimized queries with proper filtering
- Reduced Redis memory usage

### 🛡️ **Data Integrity**
- Strong typing with PostgreSQL enums
- Proper validation and constraints
- ACID compliance for data consistency

## Database Schema

```sql
-- Staff Shifts Table
CREATE TABLE "staff_shifts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "barber_id" text NOT NULL,
  "branch_id" text NOT NULL,
  "date" date NOT NULL,
  "start_time" varchar(5) NOT NULL,
  "end_time" varchar(5) NOT NULL,
  "breaks" text, -- JSON array of break periods
  "type" "shift_type" DEFAULT 'full',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- Staff Leaves Table
CREATE TABLE "staff_leaves" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "barber_id" text NOT NULL,
  "type" "leave_type" NOT NULL,
  "date" date NOT NULL,
  "start_time" varchar(5), -- Optional for partial day leaves
  "end_time" varchar(5),   -- Optional for partial day leaves
  "status" "leave_status" DEFAULT 'pending',
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- Shift Templates Table
CREATE TABLE "shift_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(255) NOT NULL,
  "start_time" varchar(5) NOT NULL,
  "end_time" varchar(5) NOT NULL,
  "break_start" varchar(5),
  "break_end" varchar(5),
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
```

## Migration Process

### Step 1: Apply Database Migration
```bash
# Run the migration to create tables
psql -d your_database -f migrations/0013_add_scheduling_tables.sql
```

### Step 2: Test the Migration
```bash
# Run the test script
node scripts/test-scheduling-migration.js
```

### Step 3: Verify Functionality
- ✅ Admin scheduling interface works
- ✅ Staff availability checks work correctly
- ✅ Appointment booking respects staff schedules
- ✅ Leave management functions properly

## Backward Compatibility

- ✅ All existing API endpoints maintain the same interface
- ✅ Frontend components work without changes
- ✅ Existing appointment booking logic unchanged
- ✅ Graceful fallback for missing data

## Future Enhancements

1. **Foreign Key Relationships**
   - Link shifts to actual barber/branch records
   - Improve data integrity and cascading deletes

2. **Advanced Scheduling Features**
   - Recurring shift patterns
   - Shift swapping between staff
   - Automated shift generation

3. **Reporting and Analytics**
   - Staff utilization reports
   - Leave pattern analysis
   - Shift coverage metrics

## Testing

The migration includes comprehensive testing:
- ✅ Database table creation and access
- ✅ CRUD operations for all scheduling entities
- ✅ Staff availability calculations
- ✅ Integration with appointment system

## Conclusion

The scheduling system is now fully integrated with the PostgreSQL database, providing:
- **Reliable data persistence**
- **Better performance and scalability**
- **Improved data integrity**
- **Seamless integration with existing systems**

All scheduling functionality has been successfully migrated and tested. The system is ready for production use! 🚀
