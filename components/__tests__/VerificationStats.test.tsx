import React from 'react';
import { render, screen } from '@testing-library/react';
import { VerificationStats } from '../VerificationStats';
import { VerificationStats as VerificationStatsType } from '@/types/gcash-verification';

describe('VerificationStats', () => {
  const mockStats: VerificationStatsType = {
    pending: 5,
    verified: 15,
    rejected: 3,
    total: 23,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal State', () => {
    it('should render all stat cards with correct values', () => {
      render(<VerificationStats stats={mockStats} />);

      // Check pending card
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Awaiting verification')).toBeInTheDocument();

      // Check verified card
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Successfully verified')).toBeInTheDocument();

      // Check rejected card
      expect(screen.getByText('Rejected')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Failed verification')).toBeInTheDocument();
    });

    it('should calculate and display processing rate correctly', () => {
      render(<VerificationStats stats={mockStats} />);

      // Processing rate should be (verified + rejected) / total * 100 = 18/23 * 100 = 78%
      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText('18/23 processed')).toBeInTheDocument();
    });

    it('should show "Good" badge when verification rate is >= 80%', () => {
      const highRateStats = {
        pending: 2,
        verified: 18,
        rejected: 2,
        total: 22,
      };

      render(<VerificationStats stats={highRateStats} />);

      // Processing rate should be 20/22 * 100 = 91%
      expect(screen.getByText('91%')).toBeInTheDocument();
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('should show "Needs Attention" badge when verification rate is < 80%', () => {
      render(<VerificationStats stats={mockStats} />);

      expect(screen.getByText('Needs Attention')).toBeInTheDocument();
    });

    it('should display verification summary with approval rate', () => {
      render(<VerificationStats stats={mockStats} />);

      expect(screen.getByText('Verification Summary')).toBeInTheDocument();
      expect(screen.getByText('23')).toBeInTheDocument(); // Total transactions
      expect(screen.getByText('Total Transactions')).toBeInTheDocument();
      
      // Approval rate should be verified / (verified + rejected) * 100 = 15/18 * 100 = 83%
      expect(screen.getByText('83%')).toBeInTheDocument();
      expect(screen.getByText('Approval Rate (15/18)')).toBeInTheDocument();
      
      expect(screen.getByText('5')).toBeInTheDocument(); // Awaiting review
      expect(screen.getByText('Awaiting Review')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero transactions', () => {
      const emptyStats = {
        pending: 0,
        verified: 0,
        rejected: 0,
        total: 0,
      };

      render(<VerificationStats stats={emptyStats} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('No transactions')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument(); // Approval rate
    });

    it('should handle only pending transactions', () => {
      const pendingOnlyStats = {
        pending: 10,
        verified: 0,
        rejected: 0,
        total: 10,
      };

      render(<VerificationStats stats={pendingOnlyStats} />);

      expect(screen.getByText('0%')).toBeInTheDocument(); // Processing rate
      expect(screen.getByText('0/10 processed')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument(); // Approval rate (0/0)
    });

    it('should handle only verified transactions', () => {
      const verifiedOnlyStats = {
        pending: 0,
        verified: 10,
        rejected: 0,
        total: 10,
      };

      render(<VerificationStats stats={verifiedOnlyStats} />);

      expect(screen.getByText('100%')).toBeInTheDocument(); // Processing rate
      expect(screen.getByText('10/10 processed')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument(); // Approval rate (10/10)
    });
  });

  describe('Loading State', () => {
    it('should show loading spinners when loading is true', () => {
      render(<VerificationStats stats={mockStats} loading={true} />);

      const loadingSpinners = document.querySelectorAll('.animate-spin');
      expect(loadingSpinners.length).toBeGreaterThan(0);
      expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
    });

    it('should not show stat values when loading', () => {
      render(<VerificationStats stats={mockStats} loading={true} />);

      // Values should not be visible when loading
      expect(screen.queryByText('5')).not.toBeInTheDocument();
      expect(screen.queryByText('15')).not.toBeInTheDocument();
      expect(screen.queryByText('3')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to load statistics';
      
      render(<VerificationStats stats={mockStats} error={errorMessage} />);

      expect(screen.getByText('Statistics Unavailable')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should not show stats when in error state', () => {
      render(<VerificationStats stats={mockStats} error="Network error" />);

      expect(screen.queryByText('Pending')).not.toBeInTheDocument();
      expect(screen.queryByText('Verified')).not.toBeInTheDocument();
      expect(screen.queryByText('Rejected')).not.toBeInTheDocument();
    });

    it('should show error icon in error state', () => {
      render(<VerificationStats stats={mockStats} error="Network error" />);

      // Check for XCircle icon (error icon)
      const errorIcon = document.querySelector('.text-destructive');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  describe('Badge Variants', () => {
    it('should apply correct badge classes for pending status', () => {
      render(<VerificationStats stats={mockStats} />);

      const pendingBadge = screen.getByText('Pending');
      expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should apply correct badge classes for verified status', () => {
      render(<VerificationStats stats={mockStats} />);

      const verifiedBadge = screen.getByText('Verified');
      expect(verifiedBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should apply correct badge classes for rejected status', () => {
      render(<VerificationStats stats={mockStats} />);

      const rejectedBadge = screen.getByText('Rejected');
      expect(rejectedBadge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<VerificationStats stats={mockStats} />);

      expect(screen.getByRole('heading', { name: 'Pending' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Verified' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Rejected' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Processing Rate' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Verification Summary' })).toBeInTheDocument();
    });

    it('should have descriptive text for screen readers', () => {
      render(<VerificationStats stats={mockStats} />);

      expect(screen.getByText('Awaiting verification')).toBeInTheDocument();
      expect(screen.getByText('Successfully verified')).toBeInTheDocument();
      expect(screen.getByText('Failed verification')).toBeInTheDocument();
    });
  });
});