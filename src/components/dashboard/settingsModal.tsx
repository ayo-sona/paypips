'use client';

import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../features/auth/authContext';
import { Currency, PaymentGateway } from '../../types/common';
import { CURRENCY_SYMBOLS } from '../../lib/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    businessName: user?.businessName || '',
    phone: user?.phone || '',
    currency: user?.currency || 'NGN',
    preferredGateway: user?.preferredGateway || 'paystack',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateUser(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const currencyOptions = Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => ({
    value: code,
    label: `${symbol} ${code}`,
  }));

  const gatewayOptions: Array<{ value: PaymentGateway; label: string }> = [
    { value: 'paystack', label: 'Paystack (Recommended for Nigeria)' },
    { value: 'stripe', label: 'Stripe (International)' },
    { value: 'kora', label: 'Kora' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>

        <Input
          label="Business Name"
          value={formData.businessName}
          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
        />

        <Input
          label="Phone Number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <Select
          label="Preferred Currency"
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
          options={currencyOptions}
        />

        <Select
          label="Payment Gateway"
          value={formData.preferredGateway}
          onChange={(e) => setFormData({ ...formData, preferredGateway: e.target.value as PaymentGateway })}
          options={gatewayOptions}
        />

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}