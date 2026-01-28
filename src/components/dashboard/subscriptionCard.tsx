'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/button';
import { Subscription } from '../../types/subscription';
import { PRICING_PLANS } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/formatters';

interface SubscriptionCardProps {
  subscription: Subscription;
  onUpgrade: () => void;
  onCancel: () => void;
}

export function SubscriptionCard({ subscription, onUpgrade, onCancel }: SubscriptionCardProps) {
  const plan = PRICING_PLANS[subscription.planId];
  
  const statusVariants = {
    active: 'success',
    trial: 'info',
    past_due: 'warning',
    cancelled: 'danger',
    expired: 'danger',
    paused: 'warning',
  } as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Manage your subscription</CardDescription>
          </div>
          <Badge variant={statusVariants[subscription.status]}>
            {subscription.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <div className="space-y-4">
        <div>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
            {plan.name} Plan
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatCurrency(plan.price)} / {subscription.billingCycle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Renewal Date</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Members</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {subscription.memberCount} / {plan.members === 999999 ? '∞' : plan.members}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onUpgrade} className="flex-1">
            Upgrade Plan
          </Button>
          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          )}
        </div>

        {subscription.cancelAtPeriodEnd && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Your subscription will cancel on {formatDate(subscription.currentPeriodEnd)}
          </p>
        )}
      </div>
    </Card>
  );
}