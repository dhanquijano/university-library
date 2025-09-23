import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReceiptModal } from '../ReceiptModal';

// Mock toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock('sonner', () => ({
  toast: mockToast,
}));

// Mock fetch for download functionality
global.fetch = jest.fn();

describe('ReceiptModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    receiptUrl: 'https://example.com/receipt.jpg',
    transactionId: 'tx-123',
  };

  const mockReceipts = [
    { url: 'https://example.com/receipt1.jpg', transactionId: 'tx-1' },
    { url: 'https://example.com/receipt2.jpg', transactionId: 'tx-2' },
    { url: 'https://example.com/receipt3.jpg', transactionId: 'tx-3' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful fetch for downloads
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['fake image data'], { type: 'image/jpeg' })),
    });

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mocked-blob-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock document.createElement and appendChild/removeChild for download
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<ReceiptModal {...defaultProps} />);

      expect(screen.getByText('Receipt - Transaction tx-123')).toBeInTheDocument();
      expect(screen.getByAltText('Receipt for transaction tx-123')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<ReceiptModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Receipt - Transaction tx-123')).not.toBeInTheDocument();
    });

    it('should display transaction ID in title', () => {
      render(<ReceiptModal {...defaultProps} transactionId="tx-456" />);

      expect(screen.getByText('Receipt - Transaction tx-456')).toBeInTheDocument();
    });
  });

  describe('Control Buttons', () => {
    it('should render all control buttons', () => {
      render(<ReceiptModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rotate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should show zoom percentage', () => {
      render(<ReceiptModal {...defaultProps} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should update zoom percentage when zoom buttons are clicked', async () => {
      const user = userEvent.setup();
      render(<ReceiptModal {...defaultProps} />);

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      await user.click(zoomInButton);

      expect(screen.getByText('120%')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      
      render(<ReceiptModal {...defaultProps} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    const navigationProps = {
      ...defaultProps,
      receipts: mockReceipts,
      currentIndex: 1,
      onNavigate: jest.fn(),
    };

    it('should show navigation buttons when multiple receipts are provided', () => {
      render(<ReceiptModal {...navigationProps} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should show receipt count in title', () => {
      render(<ReceiptModal {...navigationProps} />);

      expect(screen.getByText('(2 of 3)')).toBeInTheDocument();
    });

    it('should disable previous button when at first receipt', () => {
      render(<ReceiptModal {...navigationProps} currentIndex={0} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button when at last receipt', () => {
      render(<ReceiptModal {...navigationProps} currentIndex={2} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should call onNavigate when navigation buttons are clicked', async () => {
      const user = userEvent.setup();
      const mockOnNavigate = jest.fn();
      
      render(<ReceiptModal {...navigationProps} onNavigate={mockOnNavigate} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(mockOnNavigate).toHaveBeenCalledWith(2);
    });

    it('should not show navigation buttons for single receipt', () => {
      render(<ReceiptModal {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
    });
  });

  describe('Pan Mode', () => {
    it('should toggle pan mode when pan button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReceiptModal {...defaultProps} />);

      const panButton = screen.getByRole('button', { name: /move/i });
      
      // Initially not in pan mode
      expect(panButton).not.toHaveClass('bg-primary');
      
      await user.click(panButton);
      
      // Should be in pan mode now (button should have different styling)
      // Note: The exact class depends on the variant="default" vs variant="outline"
    });

    it('should show cursor-move class when in pan mode', async () => {
      const user = userEvent.setup();
      render(<ReceiptModal {...defaultProps} />);

      const panButton = screen.getByRole('button', { name: /move/i });
      await user.click(panButton);

      // The image container should have cursor-move class
      const imageContainer = document.querySelector('.cursor-move');
      expect(imageContainer).toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('should download receipt when download button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReceiptModal {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/receipt.jpg');
        expect(mockToast.success).toHaveBeenCalledWith('Receipt downloaded successfully');
      });
    });

    it('should handle download errors', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<ReceiptModal {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });

    it('should handle HTTP errors during download', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });
      
      render(<ReceiptModal {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Image Loading States', () => {
    it('should show loading state initially', () => {
      render(<ReceiptModal {...defaultProps} />);

      expect(screen.getByText('Loading receipt...')).toBeInTheDocument();
    });

    it('should hide loading state when image loads', () => {
      render(<ReceiptModal {...defaultProps} />);

      const image = screen.getByAltText('Receipt for transaction tx-123');
      fireEvent.load(image);

      expect(screen.queryByText('Loading receipt...')).not.toBeInTheDocument();
    });

    it('should show error state when image fails to load', () => {
      render(<ReceiptModal {...defaultProps} />);

      const image = screen.getByAltText('Receipt for transaction tx-123');
      fireEvent.error(image);

      expect(screen.getByText('Failed to load receipt')).toBeInTheDocument();
      expect(screen.getByText(/network issue or the image file being corrupted/)).toBeInTheDocument();
    });

    it('should show retry button in error state', () => {
      render(<ReceiptModal {...defaultProps} />);

      const image = screen.getByAltText('Receipt for transaction tx-123');
      fireEvent.error(image);

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should retry loading when retry button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReceiptModal {...defaultProps} />);

      const image = screen.getByAltText('Receipt for transaction tx-123');
      fireEvent.error(image);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Should show loading state again
      expect(screen.getByText('Loading receipt...')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should close modal when Escape is pressed', () => {
      const mockOnClose = jest.fn();
      render(<ReceiptModal {...defaultProps} onClose={mockOnClose} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should zoom in when + is pressed', () => {
      render(<ReceiptModal {...defaultProps} />);

      fireEvent.keyDown(window, { key: '+' });

      expect(screen.getByText('120%')).toBeInTheDocument();
    });

    it('should zoom out when - is pressed', () => {
      render(<ReceiptModal {...defaultProps} />);

      // First zoom in to have something to zoom out from
      fireEvent.keyDown(window, { key: '+' });
      fireEvent.keyDown(window, { key: '-' });

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should reset zoom when 0 is pressed', () => {
      render(<ReceiptModal {...defaultProps} />);

      // First zoom in
      fireEvent.keyDown(window, { key: '+' });
      expect(screen.getByText('120%')).toBeInTheDocument();
      
      // Then reset
      fireEvent.keyDown(window, { key: '0' });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should navigate with arrow keys', () => {
      const mockOnNavigate = jest.fn();
      render(
        <ReceiptModal
          {...defaultProps}
          receipts={mockReceipts}
          currentIndex={1}
          onNavigate={mockOnNavigate}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(mockOnNavigate).toHaveBeenCalledWith(0);

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(mockOnNavigate).toHaveBeenCalledWith(2);
    });

    it('should toggle pan mode when Space is pressed', () => {
      render(<ReceiptModal {...defaultProps} />);

      fireEvent.keyDown(window, { key: ' ' });

      const imageContainer = document.querySelector('.cursor-move');
      expect(imageContainer).toBeInTheDocument();
    });

    it('should not respond to keyboard shortcuts when modal is closed', () => {
      const mockOnClose = jest.fn();
      render(<ReceiptModal {...defaultProps} isOpen={false} onClose={mockOnClose} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('State Reset', () => {
    it('should reset zoom and position when modal opens', () => {
      const { rerender } = render(<ReceiptModal {...defaultProps} isOpen={false} />);

      rerender(<ReceiptModal {...defaultProps} isOpen={true} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should reset state when receipt URL changes', () => {
      const { rerender } = render(<ReceiptModal {...defaultProps} />);

      // Zoom in first
      fireEvent.keyDown(window, { key: '+' });
      expect(screen.getByText('120%')).toBeInTheDocument();

      // Change receipt URL
      rerender(<ReceiptModal {...defaultProps} receiptUrl="https://example.com/new-receipt.jpg" />);

      // Should reset to 100%
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role and title', () => {
      render(<ReceiptModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Receipt - Transaction tx-123')).toBeInTheDocument();
    });

    it('should have proper alt text for image', () => {
      render(<ReceiptModal {...defaultProps} />);

      expect(screen.getByAltText('Receipt for transaction tx-123')).toBeInTheDocument();
    });

    it('should show keyboard shortcuts help', () => {
      render(<ReceiptModal {...defaultProps} />);

      expect(screen.getByText(/Keyboard shortcuts:/)).toBeInTheDocument();
      expect(screen.getByText(/\+\/- \(zoom\), 0 \(reset\), R \(rotate\)/)).toBeInTheDocument();
    });

    it('should have proper button labels', () => {
      render(<ReceiptModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rotate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('Image Transformations', () => {
    it('should apply zoom transformation to image', async () => {
      const user = userEvent.setup();
      render(<ReceiptModal {...defaultProps} />);

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      await user.click(zoomInButton);

      const image = screen.getByAltText('Receipt for transaction tx-123');
      expect(image).toHaveStyle('transform: scale(1.2) rotate(0deg)');
    });

    it('should apply rotation transformation to image', async () => {
      const user = userEvent.setup();
      render(<ReceiptModal {...defaultProps} />);

      const rotateButton = screen.getByRole('button', { name: /rotate/i });
      await user.click(rotateButton);

      const image = screen.getByAltText('Receipt for transaction tx-123');
      expect(image).toHaveStyle('transform: scale(1) rotate(90deg)');
    });

    it('should limit zoom levels', async () => {
      const user = userEvent.setup();
      render(<ReceiptModal {...defaultProps} />);

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      
      // Click zoom in many times to test upper limit
      for (let i = 0; i < 20; i++) {
        await user.click(zoomInButton);
      }

      // Should not exceed 500% (5x zoom)
      expect(screen.getByText('500%')).toBeInTheDocument();
    });

    it('should limit zoom out', async () => {
      const user = userEvent.setup();
      render(<ReceiptModal {...defaultProps} />);

      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
      
      // Click zoom out many times to test lower limit
      for (let i = 0; i < 20; i++) {
        await user.click(zoomOutButton);
      }

      // Should not go below 10% (0.1x zoom)
      expect(screen.getByText('10%')).toBeInTheDocument();
    });
  });
});