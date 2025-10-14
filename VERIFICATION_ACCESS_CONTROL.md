# Verification Tab Access Control - ADMIN Only

## Summary
Updated the sales management page verification tab to only be accessible to users with the ADMIN role, as requested.

## Changes Made

### 1. Updated Admin Utils (`lib/admin-utils.ts`)
- Added `useAdminOnlyRole()` hook for checking ADMIN role specifically
- Added `hasAdminOnlyAccess()` server-side function for ADMIN role checking
- Added `AdminOnlyRole` component wrapper for ADMIN-only UI elements

### 2. Updated Admin Auth (`lib/admin-auth.ts`)
- Added `checkAdminOnlyPermission()` function for API route protection
- This function only allows users with `role === "ADMIN"` to access protected endpoints

### 3. Updated Sales Management Page (`app/admin/sales/page.tsx`)
- Modified `VerificationTabWrapper` to use `useAdminOnlyRole()` instead of `useAdminRole()`
- Updated access denied message to specify "Only users with ADMIN role can access the verification panel"
- Added proper state management for both general admin access and ADMIN-only access

### 4. Updated API Routes
- `app/api/admin/sales/verification/route.ts` - Now uses `checkAdminOnlyPermission()`
- `app/api/admin/sales/verify-transaction/route.ts` - Now uses `checkAdminOnlyPermission()`
- `app/api/admin/sales/gcash-verification/route.ts` - Now uses `checkAdminOnlyPermission()`

## Access Control Matrix

| Role | Sales Management Page | Verification Tab | Verification API |
|------|----------------------|------------------|------------------|
| ADMIN | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| MANAGER | ✅ Full Access | ❌ Access Denied | ❌ Access Denied |
| STAFF | ✅ Full Access | ❌ Access Denied | ❌ Access Denied |
| USER | ❌ Access Denied | ❌ Access Denied | ❌ Access Denied |

## User Experience
- Users with MANAGER or STAFF roles will see an access restriction message when they try to access the verification tab
- The message clearly states that ADMIN role is required
- All other tabs in the sales management page remain accessible to MANAGER and STAFF roles
- API endpoints return proper 403 Forbidden responses with clear error messages

## Security
- Both frontend and backend are protected
- API routes validate user role before processing any verification requests
- No sensitive verification data is exposed to non-ADMIN users
- Proper error handling maintains security while providing clear feedback

## Testing
- Existing tests should continue to work as they test components in isolation
- The verification functionality itself remains unchanged, only access control was modified