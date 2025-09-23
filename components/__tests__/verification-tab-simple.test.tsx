import React from 'react';
import { render, screen } from '@testing-library/react';
import VerificationTab from '../VerificationTab';

// Mock the API calls
global.fetch = jest.fn();

describe('VerificationTab - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          transactions: [],
          stats: { pending: 0, verified: 0, rejected: 0, total: 0 }
        }
      })
    });
  });

  it('should render the verification tab', () => {
    render(<VerificationTab />);
    
    // Check for main heading
    const heading = screen.getByText('GCash Transaction Verification');
    expect(heading).toBeDefined();
    
    // Check for description
    const description = screen.getByText('Review and verify GCash payments with uploaded receipts');
    expect(description).toBeDefined();
  });

  it('should render the refresh button', () => {
    render(<VerificationTab />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDefined();
  });

  it('should render the filters section', () => {
    render(<VerificationTab />);
    
    const filtersHeading = screen.getByText('Filters & Search');
    expect(filtersHeading).toBeDefined();
  });
});