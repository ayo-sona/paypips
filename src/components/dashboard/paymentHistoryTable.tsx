'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/button';
import { Payment } from '../../types/payment';
import { formatCurrency,formatDate  } from '../../lib/formatters';

interface PaymentHistoryTableProps {
  payments: Payment[];
  onDownloadInvoice: (paymentId: string) => void;
  onExport: (format: 'csv' | 'pdf') => void;
}

export function PaymentHistoryTable({ payments, onDownloadInvoice, onExport }: PaymentHistoryTableProps) {
  const statusVariants = {
    succeeded: 'success',
    pending: 'warning',
    failed: 'danger',
    refunded: 'info',
  } as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View all your transactions</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onExport('csv')}>
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      {payments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No payments yet
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.createdAt)}</TableCell>
                <TableCell>{payment.description}</TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(payment.amount, payment.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[payment.status]}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{payment.gateway}</TableCell>
                <TableCell>
                  {payment.invoiceUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownloadInvoice(payment.id)}
                    >
                      Invoice
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}