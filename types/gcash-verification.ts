// GCash Verification System Types

// Base SalesRecord interface (matching the structure from sales API)
export interface SalesRecord {
  id: string;
  date: string; // ISO date
  time?: string; // HH:mm
  branch: string;
  barber: string;
  services: string; // comma-separated
  gross: number;
  discount: number;
  net: number;
  paymentMethod: PaymentMethod;
  status: "completed" | "cancelled" | "refunded" | "pending";
  isManual?: boolean;
  notes?: string;
  receiptUrl?: string;
}

// Payment method types
export type PaymentMethod = "Cash" | "GCash" | "Maya" | "Bank Transfer" | "Card" | "Unknown";

// Verification status enum
export type VerificationStatus = "pending" | "verified" | "rejected";

// Verification data interface
export interface VerificationData {
  id: string;
  status: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

// Transaction interface for payment methods that require verification
export interface VerifiableTransaction extends SalesRecord {
  paymentMethod: "GCash" | "Maya" | "Bank Transfer";
  receiptUrl: string; // Required for verifiable transactions
  verification?: VerificationData;
}

// GCash transaction interface extending SalesRecord (for backward compatibility)
export interface GCashTransaction extends VerifiableTransaction {
  paymentMethod: "GCash";
}

// Verification action interface for API requests
export interface VerificationAction {
  transactionId: string;
  action: "verified" | "rejected";
  reason?: string; // Required when action is "rejected"
  verifiedBy?: string;
}

// Verification statistics interface
export interface VerificationStats {
  pending: number;
  verified: number;
  rejected: number;
  total: number;
  verificationRate?: number; // Percentage of verified transactions
}

// API response interfaces
export interface VerificationResponse {
  success: boolean;
  data: {
    transactions: VerifiableTransaction[];
    stats: VerificationStats;
  };
  error?: string;
}

// GCash verification response (for backward compatibility)
export interface GCashVerificationResponse extends VerificationResponse {
  data: {
    transactions: GCashTransaction[];
    stats: VerificationStats;
  };
}

export interface VerificationActionResponse {
  success: boolean;
  data?: {
    transactionId: string;
    status: VerificationStatus;
    verifiedBy?: string;
    verifiedAt?: string;
  };
  error?: string;
}

// Filter and search interfaces
export interface VerificationFilters {
  status?: VerificationStatus | "all";
  dateFrom?: string;
  dateTo?: string;
  branch?: string;
  searchTerm?: string;
}

// Pagination interface
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: "date" | "amount" | "status";
  sortOrder?: "asc" | "desc";
}

// Component prop interfaces
export interface VerificationTableProps {
  transactions: VerifiableTransaction[];
  onVerify: (transactionId: string) => void;
  onReject: (transactionId: string, reason: string) => void;
  loading?: boolean;
}

export interface VerificationStatsProps {
  stats: VerificationStats;
  loading?: boolean;
}

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string;
  transactionId: string;
  receipts?: Array<{ url: string; transactionId: string; }>;
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

// Form interfaces
export interface RejectionFormData {
  reason: string;
}

// Error handling
export interface VerificationError {
  code: string;
  message: string;
  details?: any;
}