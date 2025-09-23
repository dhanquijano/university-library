# GCash Transaction Verification Requirements

## Introduction

This feature adds a verification system for GCash transactions in the sales management page. Only administrators can access this feature to review and verify GCash payments with uploaded receipts, ensuring transaction authenticity and proper record-keeping.

## Requirements

### Requirement 1: Admin-Only Verification Tab

**User Story:** As an administrator, I want a dedicated verification tab in the sales management page, so that I can review and verify GCash transactions separately from other sales data.

#### Acceptance Criteria

1. WHEN an administrator accesses the sales management page THEN they SHALL see a "Verification" tab alongside existing tabs
2. WHEN a non-administrator user accesses the sales management page THEN the "Verification" tab SHALL NOT be visible
3. WHEN the administrator clicks the "Verification" tab THEN they SHALL see a list of all GCash transactions requiring verification

### Requirement 2: GCash Transaction Display

**User Story:** As an administrator, I want to see all GCash transactions with their receipt images, so that I can verify the authenticity of each payment.

#### Acceptance Criteria

1. WHEN viewing the verification tab THEN the system SHALL display all transactions where payment method is "GCash"
2. WHEN displaying GCash transactions THEN each transaction SHALL show transaction details (date, time, amount, branch, barber, services)
3. WHEN displaying GCash transactions THEN each transaction SHALL show the uploaded receipt image
4. WHEN displaying GCash transactions THEN each transaction SHALL show its current verification status (pending, verified, rejected)
5. WHEN no receipt image exists for a GCash transaction THEN the system SHALL display a "No Receipt" indicator

### Requirement 3: Transaction Verification Actions

**User Story:** As an administrator, I want to verify or reject GCash transactions, so that I can maintain accurate financial records and identify fraudulent payments.

#### Acceptance Criteria

1. WHEN viewing a pending GCash transaction THEN the administrator SHALL see "Verify" and "Reject" action buttons
2. WHEN the administrator clicks "Verify" THEN the transaction status SHALL change to "verified"
3. WHEN the administrator clicks "Reject" THEN the transaction status SHALL change to "rejected"
4. WHEN the administrator clicks "Reject" THEN they SHALL be prompted to enter a rejection reason
5. WHEN a transaction is verified or rejected THEN the system SHALL record the administrator's action and timestamp
6. WHEN a transaction is already verified or rejected THEN the action buttons SHALL be disabled or hidden

### Requirement 4: Verification Status Tracking

**User Story:** As an administrator, I want to track verification history and status, so that I can maintain an audit trail of all verification decisions.

#### Acceptance Criteria

1. WHEN a transaction is verified THEN the system SHALL store the verification timestamp and administrator ID
2. WHEN a transaction is rejected THEN the system SHALL store the rejection timestamp, administrator ID, and rejection reason
3. WHEN viewing transaction history THEN verified transactions SHALL be clearly marked as "Verified"
4. WHEN viewing transaction history THEN rejected transactions SHALL be clearly marked as "Rejected" with reason
5. WHEN filtering transactions THEN administrators SHALL be able to filter by verification status (all, pending, verified, rejected)

### Requirement 5: Receipt Image Viewing

**User Story:** As an administrator, I want to view receipt images in full size, so that I can properly examine the payment details for verification.

#### Acceptance Criteria

1. WHEN viewing a GCash transaction with receipt THEN the administrator SHALL see a thumbnail of the receipt image
2. WHEN the administrator clicks on the receipt thumbnail THEN the image SHALL open in a modal or new tab at full size
3. WHEN viewing the full-size receipt THEN the administrator SHALL be able to zoom in/out for detailed examination
4. WHEN the receipt image fails to load THEN the system SHALL display an error message

### Requirement 6: Verification Statistics

**User Story:** As an administrator, I want to see verification statistics, so that I can monitor the verification process and identify trends.

#### Acceptance Criteria

1. WHEN viewing the verification tab THEN the system SHALL display total counts of pending, verified, and rejected transactions
2. WHEN viewing verification statistics THEN the system SHALL show the percentage of verified vs rejected transactions
3. WHEN viewing verification statistics THEN the system SHALL show recent verification activity