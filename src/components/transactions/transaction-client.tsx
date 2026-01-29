"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Transaction } from '@/lib/types';
import TransactionList from './transaction-list';
import TransactionForm from './transaction-form';
import FileUpload from './file-upload';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function TransactionClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('https://financial-control-9s01.onrender.com/list-transaction', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (transactionId: string) => {
    try {
      const response = await fetch(`https://financial-control-9s01.onrender.com/delte-transaction/${transactionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete transaction');
      toast({ title: 'Success', description: 'Transaction deleted.' });
      fetchTransactions();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className='text-lg font-semibold'>Add New Transaction</AccordionTrigger>
          <AccordionContent>
            <div className="pt-4 grid gap-6 md:grid-cols-2">
              <TransactionForm onTransactionAdded={fetchTransactions} />
              <FileUpload onUploadSuccess={fetchTransactions} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <TransactionList transactions={transactions} onDelete={handleDelete} loading={loading} />
    </div>
  );
}
