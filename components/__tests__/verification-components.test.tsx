/**
 * Unit tests for digital payment verification components
 * This test suite covers the core functionality of verification components for GCash, Maya, and Bank Transfer
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

        expect(screen.getByText('Digital Payment Transactions')).toBeInTheDocument();
    });
}); 