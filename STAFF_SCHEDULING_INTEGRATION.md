# Staff Scheduling Integration with Appointments

## Overview

This integration connects the appointment booking system with staff scheduling to ensure that appointments can only be made when staff members are actually scheduled to work. The system prevents appointments from being booked when:

1. No staff member is scheduled for that time slot
2. The staff member is on approved leave
3. The appointment time falls outside scheduled shift hours
4. The appointment time falls within scheduled break periods

## Key Components

### 1. Staff Availability Checking (`lib/appointment-utils.ts`)

#### `isStaffAvailable(date, time, barberId, branchId)`
- Checks if a staff member is available for a specific time slot
- Returns `{ available: boolean, reason?: string }`
- Validates against:
  - Scheduled shifts
  - Approved leave requests
  - Break periods within shifts

#### `getAvailableTimeSlots(date, barberId, branchId)`
- Enhanced to include staff scheduling checks
- Now filters out time slots where staff is not available
- Combines appointment booking conflicts with staff availability

#### `isTimeSlotAvailable(date, time, barberId, branchId)`
- Updated to include staff availability validation
- Checks both existing appointments and staff scheduling

### 2. Appointment Creation Validation (`lib/actions/appointments.ts`)

#### `createAppointment(data)`
- Now validates staff availability before creating appointments
- Returns appropriate error messages when staff is not available
- Prevents appointment creation when:
  - No staff is scheduled
  - Staff is on approved leave
  - Time is outside shift hours

#### `updateAppointment(id, data)`
- Validates staff availability when updating appointment details
- Ensures updated appointments still respect staff scheduling

## Data Sources

### Redis Storage
The system uses Redis to store scheduling data:

- **Shifts**: `scheduling:shifts`
  ```json
  {
    "id": "shift-uuid",
    "barberId": "barber-1",
    "branchId": "branch-1", 
    "date": "2024-01-15",
    "startTime": "09:00",
    "endTime": "17:00",
    "breaks": [
      {"startTime": "12:00", "endTime": "13:00"}
    ],
    "type": "full"
  }
  ```

- **Leaves**: `scheduling:leaves`
  ```json
  {
    "id": "leave-uuid",
    "barberId": "barber-1",
    "type": "vacation",
    "date": "2024-01-15",
    "startTime": "10:00",
    "endTime": "14:00",
    "status": "approved",
    "reason": "Medical appointment"
  }
  ```

### Database Storage
- **Appointments**: PostgreSQL table with appointment details
- **Branches**: JSON file with branch information
- **Barbers**: JSON file with barber information

## API Endpoints

### Existing Endpoints (Enhanced)
- `/api/appointments/availability` - Now includes staff scheduling checks
- `/api/appointments/data` - Returns appointment data
- `/api/admin/appointments` - Admin appointment management

### Staff Scheduling Endpoints
- `/api/admin/scheduling/shifts` - Manage staff shifts
- `/api/admin/scheduling/leaves` - Manage leave requests
- `/api/admin/scheduling/availability` - Check staff availability

## Business Logic

### Availability Rules
1. **Default Behavior**: If no shifts are scheduled, staff is considered unavailable
2. **Shift Hours**: Appointments can only be made during scheduled shift hours
3. **Break Periods**: Appointments cannot be made during scheduled breaks
4. **Leave Requests**: Approved leave requests block appointment availability
5. **Full-Day Leave**: Leave without time range blocks entire day
6. **Partial Leave**: Leave with time range blocks only that period

### Error Handling
The system provides specific error messages for different scenarios:
- "No staff scheduled for this time"
- "Staff member is on approved leave"
- "Staff member is not scheduled during this time"
- "This time slot is already booked"

## Usage Examples

### Creating an Appointment with Staff Validation
```typescript
const result = await createAppointment({
  fullName: "John Doe",
  email: "john@example.com",
  mobileNumber: "+1234567890",
  appointmentDate: "2024-01-15",
  appointmentTime: "10:00",
  branch: "branch-1",
  barber: "barber-1",
  services: "Haircut, Beard trim"
});

if (!result.success) {
  console.error(result.error); // Will show staff availability issues
}
```

### Checking Available Time Slots
```typescript
const timeSlots = await getAvailableTimeSlots(
  "2024-01-15",
  "barber-1", 
  "branch-1"
);

// Returns only slots where staff is scheduled and available
const availableSlots = timeSlots.filter(slot => slot.available);
```

## Benefits

1. **Prevents Overbooking**: Staff cannot be double-booked
2. **Respects Schedules**: Appointments align with actual staff availability
3. **Handles Leave**: System respects approved leave requests
4. **Flexible Scheduling**: Supports different shift types and break periods
5. **Clear Error Messages**: Users understand why appointments cannot be made

## Testing

Use the provided test script to verify the integration:
```bash
node test-staff-scheduling-integration.js
```

## Future Enhancements

1. **Recurring Shifts**: Support for weekly/monthly recurring schedules
2. **Shift Templates**: Predefined shift patterns
3. **Automatic Scheduling**: AI-powered shift optimization
4. **Mobile Notifications**: Alert staff of schedule changes
5. **Overtime Tracking**: Monitor hours worked vs. scheduled
