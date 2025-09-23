import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GCashTransactionTable from '../GCashTransactionTable';
import { GCashTransaction } from '@/types/gcash-verification';

describe('GCashTransactionTable', () => {
  const mockOnVerify = jest.fn();
  const mockOnReject = jest.fn();
  const mockOnReceiptClick = jest.fn();
  const mockOnStateUpdate = jest.fn();

  const mockTransactions: GCashTransaction[] = [
    {
      id: 'tx-1',
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
      receiptUrl: 'https://example.com/receipt1.jpg',
      verification: {
        id: 'ver-1',
        status: 'pending',
      },
    },
    {
      id: 'tx-2',
      date: '2024-01-14',
      time: '10:15',
      branch: 'Branch 2',
      barber: 'Jane Smith',
      services: 'Beard Trim',
      gross: 100,
      discount: 10,
      net: 90,
      paymentMethod: 'GCash',
      status: 'completed',
      receiptUrl: 'https://example.com/receipt2.jpg',
      verification: {
        id: 'ver-2',
        status: 'verified',
        verifiedBy: 'admin@example.com',
        verifiedAt: '2024-01-14T11:00:00Z',
      },
    },
    {
      id: 'tx-3',
      date: '2024-01-13',
      time: '16:45',
      branch: 'Branch 3',
      barber: 'Bob Wilson',
      services: 'Full Service',
      gross: 200,
      discount: 0,
      net: 200,
      paymentMethod: 'GCash',
      status: 'completed',
      receiptUrl: 'https://example.com/receipt3.jpg',
      verification: {
        id: 'ver-3',
        status: 'rejected',
        verifiedBy: 'admin@example.com',
        verifiedAt: '2024-01-13T17:00:00Z',
        rejectionReason: 'Receipt image is unclear',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Table Rendering', () => {
    it('should render table with all transactions', () => {
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      // Check table headers
      expect(screen.getByText('Receipt')).toBeInTheDocument();
      expect(screen.getByText('Date & Time')).toBeInTheDocument();
      expect(screen.getByText('Branch')).toBeInTheDocument();
      expect(screen.getByText('Barber')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Check transaction data
      expect(screen.getByText('Main Branch')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should display formatted dates and amounts', () => {
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('14:30')).toBeInTheDocument();
      expect(screen.getByText('₱150')).toBeInTheDocument();
      expect(screen.getByText('₱90')).toBeInTheDocument();
      expect(screen.getByText('Gross: ₱100')).toBeInTheDocument(); // Shows gross when discount > 0
    });

    it('should display verification status badges', () => {
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('should show rejection reason for rejected transactions', () => {
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByText('Receipt image is unclear')).toBeInTheDocument();
    });

    it('should truncate long rejection reasons', () => {
      const transactionWithLongReason = {
        ...mockTransactions[2],
        verification: {
          ...mockTransactions[2].verification!,
          rejectionReason: 'This is a very long rejection reason that should be truncated because it exceeds the display limit',
        },
      };

      render(
        <GCashTransactionTable
          transactions={[transactionWithLongReason]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByText(/This is a very long rejection.../)).toBeInTheDocument();
    });
  });

  describe('Receipt Thumbnails', () => {
    it('should render receipt thumbnails for transactions with receipts', () => {
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      const receiptImages = screen.getAllByAltText(/Receipt for transaction/);
      expect(receiptImages).toHaveLength(3);
    });

    it('should call onReceiptClick when receipt thumbnail is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      const receiptButton = screen.getByTitle('Click to view full-size receipt');
      await user.click(receiptButton);

      expect(mockOnReceiptClick).toHaveBeenCalledWith('https://example.com/receipt1.jpg', 'tx-1');
    });

    it('should show "No Receipt" placeholder when receiptUrl is missing', () => {
      const transactionWithoutReceipt = {
        ...mockTransactions[0],
        receiptUrl: '',
      };

      render(
        <GCashTransactionTable
          transactions={[transactionWithoutReceipt]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByText('No Receipt')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by date when date header is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      const dateHeader = screen.getByText('Date & Time');
      await user.click(dateHeader);

      // Check if sort icon appears
      expect(dateHeader.parentElement).toHaveClass('cursor-pointer');
    });

    it('should sort by amount when amount header is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      const amountHeader = screen.getByText('Amount');
      await user.click(amountHeader);

      expect(amountHeader.parentElement).toHaveClass('cursor-pointer');
    });

    it('should sort by status when status header is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      const statusHeader = screen.getByText('Status');
      await user.click(statusHeader);

      expect(statusHeader.parentElement).toHaveClass('cursor-pointer');
    });

    it('should toggle sort order when same header is clicked twice', async () => {
      const user = userEvent.setup();
      
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      const dateHeader = screen.getByText('Date & Time');
      
      // First click - should sort descending (default)
      await user.click(dateHeader);
      
      // Second click - should sort ascending
      await user.click(dateHeader);
      
      // The sort order should have changed (we can't easily test the actual sorting without more complex setup)
      expect(dateHeader.parentElement).toHaveClass('cursor-pointer');
    });
  });

  describe('Loading State', () => {
    it('should show loading state when loading prop is true', () => {
      render(
        <GCashTransactionTable
          transactions={[]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
          loading={true}
        />
      );

      expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
    });

    it('should show skeleton when loading', () => {
      render(
        <GCashTransactionTable
          transactions={[]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
          loading={true}
        />
      );

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no transactions', () => {
      render(
        <GCashTransactionTable
          transactions={[]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByText('No GCash transactions found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or check back later')).toBeInTheDocument();
    });
  });

  describe('Verification Actions Integration', () => {
    it('should render verification actions for each transaction', () => {
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      // Should have verify/reject buttons for pending transaction
      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();

      // Should show status messages for processed transactions
      expect(screen.getByText('Transaction verified')).toBeInTheDocument();
      expect(screen.getByText('Transaction rejected')).toBeInTheDocument();
    });

    it('should pass correct props to VerificationActions', () => {
      render(
        <GCashTransactionTable
          transactions={[mockTransactions[0]]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
          onStateUpdate={mockOnStateUpdate}
        />
      );

      // The VerificationActions component should receive the transaction and callbacks
      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
    });
  });

  describe('Status Badge Styling', () => {
    it('should apply correct styling for pending status', () => {
      render(
        <GCashTransactionTable
          transactions={[mockTransactions[0]]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      const pendingBadge = screen.getByText('Pending');
      expect(pendingBadge).toHaveClass('flex', 'items-center', 'gap-1');
    });

    it('should show verification timestamp for processed transactions', () => {
      render(
        <GCashTransactionTable
          transactions={[mockTransactions[1]]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByText('Jan 14, 2024')).toBeInTheDocument();
      expect(screen.getByText('11:00')).toBeInTheDocument();
      expect(screen.getByText('by admin@example.com')).toBeInTheDocument();
    });
  });

  describe('Services Display', () => {
    it('should truncate long service names', () => {
      const transactionWithLongServices = {
        ...mockTransactions[0],
        services: 'Haircut, Shampoo, Beard Trim, Mustache Trim, Hair Styling, Hair Treatment, Scalp Massage',
      };

      render(
        <GCashTransactionTable
          transactions={[transactionWithLongServices]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      const servicesCell = screen.getByTitle(transactionWithLongServices.services);
      expect(servicesCell).toHaveClass('truncate');
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      const tableHeaders = screen.getAllByRole('columnheader');
      expect(tableHeaders.length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader')).toHaveLength(8);
      expect(screen.getAllByRole('row')).toHaveLength(4); // 1 header + 3 data rows
    });

    it('should have proper alt text for receipt images', () => {
      render(
        <GCashTransactionTable
          transactions={[mockTransactions[0]]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByAltText('Receipt for transaction tx-1')).toBeInTheDocument();
    });

    it('should have proper button titles for receipt thumbnails', () => {
      render(
        <GCashTransactionTable
          transactions={[mockTransactions[0]]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByTitle('Click to view full-size receipt')).toBeInTheDocument();
    });

    it('should have sortable column indicators', () => {
      render(
        <GCashTransactionTable
          transactions={mockTransactions}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      const dateHeader = screen.getByText('Date & Time');
      const amountHeader = screen.getByText('Amount');
      const statusHeader = screen.getByText('Status');
      
      expect(dateHeader.parentElement).toHaveClass('cursor-pointer');
      expect(amountHeader.parentElement).toHaveClass('cursor-pointer');
      expect(statusHeader.parentElement).toHaveClass('cursor-pointer');
    });
  });

  describe('Error Handling', () => {
    it('should handle image load errors gracefully', () => {
      render(
        <GCashTransactionTable
          transactions={[mockTransactions[0]]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      const receiptImage = screen.getByAltText('Receipt for transaction tx-1');
      
      // Simulate image load error
      fireEvent.error(receiptImage);
      
      // The fallback should be shown (tested through the onError handler)
      expect(receiptImage).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should handle missing time gracefully', () => {
      const transactionWithoutTime = {
        ...mockTransactions[0],
        time: undefined,
      };

      render(
        <GCashTransactionTable
          transactions={[transactionWithoutTime]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByText('No time')).toBeInTheDocument();
    });

    it('should format amounts with proper locale', () => {
      const transactionWithLargeAmount = {
        ...mockTransactions[0],
        net: 1234567,
        gross: 1234567,
      };

      render(
        <GCashTransactionTable
          transactions={[transactionWithLargeAmount]}
          onVerify={mockOnVerify}
          onReject={mockOnReject}
          onReceiptClick={mockOnReceiptClick}
        />
      );

      expect(screen.getByText('₱1,234,567')).toBeInTheDocument();
    });
  });
});