"use client";

import React, { useState } from 'react';
import { ReceiptModal } from './ReceiptModal';
import GCashTransactionTable from './GCashTransactionTable';
import { GCashTransaction } from '@/types/gcash-verification';

interface ReceiptModalExampleProps {
  transactions: GCashTransaction[];
  onVerify: (transactionId: string) => Promise<void>;
  onReject: (transactionId: string, reason: string) => Promise<void>;
}

export function ReceiptModalExample({ 
  transactions, 
  onVerify, 
  onReject 
}: ReceiptModalExampleProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    url: string;
    transactionId: string;
  } | null>(null);
  const [currentReceiptIndex, setCurrentReceiptIndex] = useState(0);

  // Create array of all receipts for navigation
  const allReceipts = transactions
    .filter(t => t.receiptUrl)
    .map(t => ({
      url: t.receiptUrl,
      transactionId: t.id
    }));

  const handleReceiptClick = (receiptUrl: string, transactionId: string) => {
    const receiptIndex = allReceipts.findIndex(r => r.transactionId === transactionId);
    setCurrentReceiptIndex(receiptIndex >= 0 ? receiptIndex : 0);
    setSelectedReceipt({ url: receiptUrl, transactionId });
    setModalOpen(true);
  };

  const handleNavigate = (index: number) => {
    if (index >= 0 && index < allReceipts.length) {
      setCurrentReceiptIndex(index);
      setSelectedReceipt(allReceipts[index]);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedReceipt(null);
  };

  return (
    <>
      <GCashTransactionTable
        transactions={transactions}
        onVerify={onVerify}
        onReject={onReject}
        onReceiptClick={handleReceiptClick}
      />

      {selectedReceipt && (
        <ReceiptModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          receiptUrl={selectedReceipt.url}
          transactionId={selectedReceipt.transactionId}
          receipts={allReceipts}
          currentIndex={currentReceiptIndex}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
}