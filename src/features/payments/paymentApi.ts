import apiClient from '../../lib/apiClient';
import { Payment, PaymentIntent } from '../../types/payment';

export const paymentAPI = {
  async getHistory(page: number = 1, limit: number = 10): Promise<Payment[]> {
    try {
      const response = await apiClient.get('/payments', {
        params: { page, limit }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      return [];
    }
  },

  async createIntent(intent: PaymentIntent): Promise<{ reference: string; authorization_url?: string }> {
    try {
      const response = await apiClient.post('/payments/initialize', intent);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  },

  async verifyPayment(reference: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/payments/verify/${reference}`);
      return response.data.data?.verified || false;
    } catch (error) {
      console.error('Failed to verify payment:', error);
      return false;
    }
  },

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      const response = await apiClient.get(`/payments/${paymentId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch payment:', error);
      return null;
    }
  },

  async downloadInvoice(paymentId: string): Promise<Blob> {
    try {
      // TODO: Implement when backend has invoice download endpoint
      console.log('Download invoice:', paymentId);
      const blob = new Blob(['Mock PDF Invoice'], { type: 'application/pdf' });
      return blob;
    } catch (error) {
      console.error('Failed to download invoice:', error);
      throw error;
    }
  },

  async exportHistory(format: 'csv' | 'pdf'): Promise<Blob> {
    try {
      console.log('Export format:', format);
      const payments = await this.getHistory(1, 1000);
      
      if (format === 'csv') {
        // ✅ FIXED: Use only safe properties
        const csvContent = [
          'ID,Date,Amount,Status,Gateway',
          ...payments.map(p => 
            `${p.id || ''},${p.createdAt || ''},${p.amount || 0},${p.status || ''},${p.gateway || ''}`
          )
        ].join('\n');
        
        return new Blob([csvContent], { type: 'text/csv' });
      } else {
        return new Blob(['Mock PDF Export'], { type: 'application/pdf' });
      }
    } catch (error) {
      console.error('Failed to export payment history:', error);
      throw error;
    }
  },
};