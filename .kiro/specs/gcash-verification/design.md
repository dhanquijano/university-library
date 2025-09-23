# GCash Transaction Verification Design

## Overview

The GCash verification system adds a new tab to the existing sales management page, providing administrators with tools to review, verify, and manage GCash transactions. The system integrates with the existing sales data structure and adds verification status tracking.

## Architecture

### Component Structure
```
SalesManagementPage
├── Existing Tabs (Daily Report, Branches, Barbers, Services, Payments)
└── New Verification Tab
    ├── VerificationStats (summary cards)
    ├── VerificationFilters (status filter)
    ├── GCashTransactionTable
    │   ├── TransactionRow
    │   ├── ReceiptThumbnail
    │   ├── VerificationActions
    │   └── StatusBadge
    └── ReceiptModal (full-size image viewer)
```

### Database Schema Extensions

#### New Table: transaction_verifications
```sql
CREATE TABLE transaction_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text NOT NULL REFERENCES sales(id),
  status varchar(20) NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verified_by text, -- admin user ID/name
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Sales Table Updates
- No changes needed to existing sales table
- Verification data stored in separate table for better normalization

## Components and Interfaces

### 1. VerificationTab Component
**Purpose:** Main container for the verification interface
**Props:**
- `gcashTransactions: GCashTransaction[]`
- `onVerify: (transactionId: string) => void`
- `onReject: (transactionId: string, reason: string) => void`

### 2. VerificationStats Component
**Purpose:** Display verification statistics
**Data:**
- Total pending transactions
- Total verified transactions
- Total rejected transactions
- Verification rate percentage

### 3. GCashTransactionTable Component
**Purpose:** Display list of GCash transactions with verification controls
**Features:**
- Sortable columns (date, amount, status)
- Filterable by verification status
- Pagination for large datasets

### 4. ReceiptModal Component
**Purpose:** Full-size receipt image viewer
**Features:**
- Image zoom functionality
- Navigation between receipts
- Download receipt option

### 5. VerificationActions Component
**Purpose:** Verify/Reject action buttons
**States:**
- Pending: Show Verify/Reject buttons
- Verified: Show verified badge with timestamp
- Rejected: Show rejected badge with reason

## Data Models

### GCashTransaction Interface
```typescript
interface GCashTransaction extends SalesRecord {
  paymentMethod: 'GCash';
  receiptUrl: string;
  verification?: {
    id: string;
    status: 'pending' | 'verified' | 'rejected';
    verifiedBy?: string;
    verifiedAt?: string;
    rejectionReason?: string;
  };
}
```

### VerificationAction Interface
```typescript
interface VerificationAction {
  transactionId: string;
  status: 'verified' | 'rejected';
  reason?: string; // Required for rejected status
}
```

## API Endpoints

### GET /api/admin/sales/gcash-verification
**Purpose:** Fetch all GCash transactions with verification status
**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [/* GCashTransaction[] */],
    "stats": {
      "pending": 5,
      "verified": 23,
      "rejected": 2,
      "total": 30
    }
  }
}
```

### POST /api/admin/sales/verify-transaction
**Purpose:** Verify or reject a GCash transaction
**Request:**
```json
{
  "transactionId": "tx_123",
  "action": "verified" | "rejected",
  "reason": "Optional rejection reason",
  "verifiedBy": "admin_user_id"
}
```

### GET /api/admin/sales/verification-history
**Purpose:** Get verification history for audit trail
**Response:** List of all verification actions with timestamps

## Error Handling

### Client-Side Error Handling
- Network errors during verification actions
- Image loading failures for receipts
- Invalid verification actions (already processed)

### Server-Side Error Handling
- Database connection errors
- Invalid transaction IDs
- Missing receipt files
- Unauthorized access attempts

### Error Messages
- "Failed to verify transaction. Please try again."
- "Receipt image could not be loaded."
- "Transaction has already been processed."
- "You don't have permission to perform this action."

## Testing Strategy

### Unit Tests
- VerificationTab component rendering
- VerificationActions button states
- API endpoint request/response handling
- Data transformation functions

### Integration Tests
- Complete verification workflow
- Database transaction integrity
- File upload and retrieval
- Admin permission checks

### E2E Tests
- Admin login and navigation to verification tab
- Verify GCash transaction end-to-end
- Reject transaction with reason
- View receipt images in modal

## Security Considerations

### Authentication & Authorization
- Only authenticated admin users can access verification tab
- Role-based access control for verification actions
- Audit logging for all verification activities

### Data Protection
- Receipt images stored securely
- Verification history immutable once created
- Sensitive data encrypted in transit

### Input Validation
- Transaction ID validation
- Rejection reason length limits
- File type validation for receipts

## Performance Considerations

### Optimization Strategies
- Lazy loading of receipt images
- Pagination for large transaction lists
- Caching of verification statistics
- Debounced search and filter inputs

### Database Optimization
- Indexes on transaction_id and status columns
- Efficient queries for verification statistics
- Connection pooling for concurrent requests

## User Experience Design

### Visual Design
- Clear status indicators (pending/verified/rejected)
- Intuitive action buttons with confirmation dialogs
- Responsive design for mobile admin access
- Consistent styling with existing sales page

### Interaction Flow
1. Admin navigates to Sales Management → Verification tab
2. Views list of GCash transactions with thumbnails
3. Clicks receipt thumbnail to view full image
4. Reviews transaction details and receipt
5. Clicks Verify or Reject button
6. For rejection: enters reason in modal dialog
7. Confirms action and sees updated status

### Accessibility
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Alt text for receipt images