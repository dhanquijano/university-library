import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerificationActions from '../VerificationActions';
import { GCashTransaction } from '@/types/gcash-verification';

// Mock toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock('sonner', () => ({
  toast: mockToast,
}));

describe('VerificationActions', () => {
  const mockOnVerify = jest.fn();
  const mockOnReject = jest.fn();
  const mockOnStateUpdate = jest.fn();

  const baseMockTransaction: GCashTransaction = {
    id: 'tx-123',
    date: '2024-01-15',
    time: '14:30',
    branch: 'Main Branch',
    barber: 'John Doe',
    services: 'Haircut, Shampoo',
    gross: 150,
    discount: 0,
    net: 150,
    paymentMethod: 'GCash',
    status: 'completed',
    receiptUrl: 'https://example.com/receipt.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnVerify.mockResolvedValue(undefined);
    mockOnReject.mockResolvedValue(undefined);
  });

  describe('Pending Transaction', () => {
    const pendingTransaction = {
      ...baseMockTransaction,
      verification: {
        id: 'ver-123',
        status: 'pending' as const,
      },
    };

    it('should render verify and reject buttons for pending transactions', () => {
      render(
        <VerificationActions
          transaction={pendingTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    });

    it('should open verify confirmation dialog when verify button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={pendingTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      await user.click(screen.getByRole('button', { name: /verify/i }));

      expect(screen.getByRole('dialog', { name: /verify transaction/i })).toBeInTheDocument();
      expect(screen.getByText('₱150')).toBeInTheDocument();
      expect(screen.getByText('Main Branch')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should call onVerify when verify is confirmed', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={pendingTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onStateUpdate={mockOnStateUpdate}
        />
      );

      // Open verify dialog
      await user.click(screen.getByRole('button', { name: /verify/i }));
      
      // Confirm verification
      await user.click(screen.getByRole('button', { name: /verify transaction/i }));

      await waitFor(() => {
        expect(mockOnVerify).toHaveBeenCalledWith('tx-123');
        expect(mockOnStateUpdate).toHaveBeenCalledWith('tx-123', 'verified');
      });
    });

    it('should open reject dialog when reject button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={pendingTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      await user.click(screen.getByRole('button', { name: /reject/i }));

      expect(screen.getByRole('dialog', { name: /reject transaction/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/rejection reason/i)).toBeInTheDocument();
    });

    it('should require rejection reason with minimum length', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={pendingTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      // Open reject dialog
      await user.click(screen.getByRole('button', { name: /reject/i }));
      
      // Try to submit without reason
      const rejectButton = screen.getByRole('button', { name: /reject transaction/i });
      expect(rejectButton).toBeDisabled();

      // Enter short reason
      const reasonInput = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonInput, 'short');
      
      await user.click(rejectButton);
      
      expect(screen.getByText('Rejection reason must be at least 10 characters')).toBeInTheDocument();
      expect(mockOnReject).not.toHaveBeenCalled();
    });

    it('should call onReject with valid reason', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={pendingTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onStateUpdate={mockOnStateUpdate}
        />
      );

      // Open reject dialog
      await user.click(screen.getByRole('button', { name: /reject/i }));
      
      // Enter valid reason
      const reasonInput = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonInput, 'Receipt image is unclear and cannot verify payment details');
      
      // Submit rejection
      await user.click(screen.getByRole('button', { name: /reject transaction/i }));

      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalledWith('tx-123', 'Receipt image is unclear and cannot verify payment details');
        expect(mockOnStateUpdate).toHaveBeenCalledWith('tx-123', 'rejected');
      });
    });

    it('should enforce maximum character limit for rejection reason', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={pendingTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      // Open reject dialog
      await user.click(screen.getByRole('button', { name: /reject/i }));
      
      const reasonInput = screen.getByLabelText(/rejection reason/i);
      const longReason = 'a'.repeat(501); // Exceed 500 character limit
      
      // Type the long reason
      await user.clear(reasonInput);
      await user.type(reasonInput, longReason);
      
      // Try to submit
      await user.click(screen.getByRole('button', { name: /reject transaction/i }));
      
      // Check for error message
      await waitFor(() => {
        const errorMessage = screen.queryByText('Rejection reason must be less than 500 characters');
        expect(errorMessage).toBeInTheDocument();
      }, { timeout: 5000 });
      
      expect(mockOnReject).not.toHaveBeenCalled();
    });

    it('should show character count', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={pendingTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      // Open reject dialog
      await user.click(screen.getByRole('button', { name: /reject/i }));
      
      // Look for character count pattern (may be split across elements)
      expect(screen.getByText(/\/500/)).toBeInTheDocument();
      
      const reasonInput = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonInput, 'Test reason');
      
      // Check that character count updates (text might be split across elements)
      expect(screen.getByText('11')).toBeInTheDocument();
      expect(screen.getByText('/500')).toBeInTheDocument();
    });
  });

  describe('Verified Transaction', () => {
    const verifiedTransaction = {
      ...baseMockTransaction,
      verification: {
        id: 'ver-123',
        status: 'verified' as const,
        verifiedBy: 'admin@example.com',
        verifiedAt: '2024-01-15T15:30:00Z',
      },
    };

    it('should show status message for verified transactions', () => {
      render(
        <VerificationActions
          transaction={verifiedTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('Transaction verified')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /verify/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
    });
  });

  describe('Rejected Transaction', () => {
    const rejectedTransaction = {
      ...baseMockTransaction,
      verification: {
        id: 'ver-123',
        status: 'rejected' as const,
        verifiedBy: 'admin@example.com',
        verifiedAt: '2024-01-15T15:30:00Z',
        rejectionReason: 'Invalid receipt',
      },
    };

    it('should show status message for rejected transactions', () => {
      render(
        <VerificationActions
          transaction={rejectedTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('Transaction rejected')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /verify/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should disable buttons and show loading spinner during verification', async () => {
      const user = userEvent.setup();
      mockOnVerify.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(
        <VerificationActions
          transaction={baseMockTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      // Open verify dialog
      await user.click(screen.getByRole('button', { name: /verify/i }));
      
      // Start verification
      const verifyButton = screen.getByRole('button', { name: /verify transaction/i });
      await user.click(verifyButton);

      // Check loading state
      expect(screen.getByText('Verifying...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('should disable buttons and show loading spinner during rejection', async () => {
      const user = userEvent.setup();
      mockOnReject.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(
        <VerificationActions
          transaction={baseMockTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      // Open reject dialog
      await user.click(screen.getByRole('button', { name: /reject/i }));
      
      // Enter reason and start rejection
      const reasonInput = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonInput, 'Valid rejection reason for testing');
      
      const rejectButton = screen.getByRole('button', { name: /reject transaction/i });
      await user.click(rejectButton);

      // Check loading state
      expect(screen.getByText('Rejecting...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error when verification fails', async () => {
      const user = userEvent.setup();
      const error = new Error('Network error');
      mockOnVerify.mockRejectedValue(error);
      
      render(
        <VerificationActions
          transaction={baseMockTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      // Open verify dialog and confirm
      await user.click(screen.getByRole('button', { name: /verify/i }));
      await user.click(screen.getByRole('button', { name: /verify transaction/i }));

      await waitFor(() => {
        // Look for error display component or error text
        const errorElement = screen.queryByText('Network error') || screen.queryByText(/error/i);
        expect(errorElement).toBeInTheDocument();
      });
    });

    it('should display error when rejection fails', async () => {
      const user = userEvent.setup();
      const error = new Error('Server error');
      mockOnReject.mockRejectedValue(error);
      
      render(
        <VerificationActions
          transaction={baseMockTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      // Open reject dialog, enter reason, and submit
      await user.click(screen.getByRole('button', { name: /reject/i }));
      
      const reasonInput = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonInput, 'Valid rejection reason for testing');
      
      await user.click(screen.getByRole('button', { name: /reject transaction/i }));

      await waitFor(() => {
        expect(screen.getByText(/Server error/)).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Management', () => {
    it('should close verify dialog when cancelled', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={baseMockTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      // Open verify dialog
      await user.click(screen.getByRole('button', { name: /verify/i }));
      expect(screen.getByRole('dialog', { name: /verify transaction/i })).toBeInTheDocument();
      
      // Cancel dialog
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /verify transaction/i })).not.toBeInTheDocument();
      });
    });

    it('should close reject dialog when cancelled', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={baseMockTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      // Open reject dialog
      await user.click(screen.getByRole('button', { name: /reject/i }));
      expect(screen.getByRole('dialog', { name: /reject transaction/i })).toBeInTheDocument();
      
      // Cancel dialog
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /reject transaction/i })).not.toBeInTheDocument();
      });
    });

    it('should reset rejection form when dialog is closed', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={baseMockTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      // Open reject dialog and enter reason
      await user.click(screen.getByRole('button', { name: /reject/i }));
      
      const reasonInput = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonInput, 'Test reason');
      
      // Cancel dialog
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      // Wait for dialog to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /reject transaction/i })).not.toBeInTheDocument();
      });
      
      // Reopen dialog
      await user.click(screen.getByRole('button', { name: /reject/i }));
      
      // Reason should be cleared
      await waitFor(() => {
        const newReasonInput = screen.getByLabelText(/rejection reason/i);
        expect(newReasonInput).toHaveValue('');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(
        <VerificationActions
          transaction={baseMockTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    });

    it('should have proper form labels in reject dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={baseMockTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      await user.click(screen.getByRole('button', { name: /reject/i }));

      expect(screen.getByLabelText(/rejection reason/i)).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
    });

    it('should have proper dialog titles', async () => {
      const user = userEvent.setup();
      
      render(
        <VerificationActions
          transaction={baseMockTransaction}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
        />
      );

      // Check verify dialog title
      await user.click(screen.getByRole('button', { name: /verify/i }));
      expect(screen.getByRole('dialog', { name: /verify transaction/i })).toBeInTheDocument();
      
      // Close and check reject dialog title
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      await user.click(screen.getByRole('button', { name: /reject/i }));
      expect(screen.getByRole('dialog', { name: /reject transaction/i })).toBeInTheDocument();
    });
  });
});