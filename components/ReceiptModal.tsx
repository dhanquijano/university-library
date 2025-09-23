"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  RotateCw, 
  Move, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getUserFriendlyErrorMessage } from '@/lib/retry-utils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string;
  transactionId: string;
  receipts?: Array<{ url: string; transactionId: string; }>;
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export function ReceiptModal({ 
  isOpen, 
  onClose, 
  receiptUrl, 
  transactionId,
  receipts = [],
  currentIndex = 0,
  onNavigate
}: ReceiptModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Reset state when modal opens/closes or receipt changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setImageLoading(true);
      setImageError(false);
      setIsPanMode(false);
    }
  }, [isOpen, receiptUrl]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Rotation function
  const rotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // Pan functions
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isPanMode) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [isPanMode, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !isPanMode) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, isPanMode, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Navigation functions
  const canNavigate = receipts.length > 1;
  const canGoPrevious = canNavigate && currentIndex > 0;
  const canGoNext = canNavigate && currentIndex < receipts.length - 1;

  const goToPrevious = useCallback(() => {
    if (canGoPrevious && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  }, [canGoPrevious, currentIndex, onNavigate]);

  const goToNext = useCallback(() => {
    if (canGoNext && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  }, [canGoNext, currentIndex, onNavigate]);

  // Download function with error handling
  const downloadReceipt = useCallback(async () => {
    setDownloadError(null);
    
    try {
      const response = await fetch(receiptUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${transactionId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      const errorMessage = error instanceof Error ? getUserFriendlyErrorMessage(error) : 'Failed to download receipt';
      setDownloadError(errorMessage);
      toast.error(errorMessage);
    }
  }, [receiptUrl, transactionId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          rotate();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          setIsPanMode(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, zoomIn, zoomOut, resetZoom, rotate, goToPrevious, goToNext]);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const retryImageLoad = useCallback(() => {
    setImageError(false);
    setImageLoading(true);
    // Force reload by adding timestamp to URL
    const img = new Image();
    img.onload = handleImageLoad;
    img.onerror = handleImageError;
    img.src = `${receiptUrl}?t=${Date.now()}`;
  }, [receiptUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b bg-white">
          <DialogTitle className="text-lg font-semibold">
            Receipt - Transaction {transactionId}
            {canNavigate && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({currentIndex + 1} of {receipts.length})
              </span>
            )}
          </DialogTitle>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Navigation */}
            {canNavigate && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={!canGoPrevious}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={!canGoNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
            
            {/* Zoom Controls */}
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-mono min-w-[4rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            {/* Other Controls */}
            <Button variant="outline" size="sm" onClick={rotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button 
              variant={isPanMode ? "default" : "outline"} 
              size="sm" 
              onClick={() => setIsPanMode(!isPanMode)}
            >
              <Move className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={downloadReceipt}>
              <Download className="w-4 h-4" />
            </Button>
            
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Image Container */}
        <div 
          className={cn(
            "flex-1 overflow-hidden bg-gray-100 relative",
            isPanMode && "cursor-move"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Loading receipt...</span>
              </div>
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <AlertCircle className="w-16 h-16 text-red-400" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">Failed to load receipt</p>
                  <p className="text-sm text-gray-500 mb-4">
                    The receipt image could not be loaded. This might be due to a network issue or the image file being corrupted.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={retryImageLoad}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadReceipt}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
                {downloadError && (
                  <p className="text-xs text-red-500 mt-2">{downloadError}</p>
                )}
              </div>
            </div>
          )}

          {!imageError && (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`
              }}
            >
              <img
                src={receiptUrl}
                alt={`Receipt for transaction ${transactionId}`}
                className="max-w-none select-none"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
              />
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts */}
        <div className="p-2 bg-gray-50 border-t text-xs text-gray-500 text-center">
          <span>
            Keyboard shortcuts: +/- (zoom), 0 (reset), R (rotate), ←/→ (navigate), Space (pan mode), Esc (close)
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}