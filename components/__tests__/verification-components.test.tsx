/**
 * Unit tests for GCash verification components
 * This test suite covers the core functionality of verification components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { VerificationTab } from '../VerificationTab';

describe('VerificationTab Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock fetch for API calls
        global.fetch = jest.fn().mockResolvedValue({
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

    it('should render verification tab with all components', async () => {
        render(<VerificationTab />);

        expect(screen.getByText('GCash Transaction Verification')).toBeInTheDocument();
        expect(screen.getByText('Review and verify GCash payments with uploaded receipts')).toBeInTheDocument();
    });
}); 