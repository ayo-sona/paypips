'use client';

import { PaymentReminder } from '../../types/enterprise';
import { Mail, MessageSquare, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface RemindersTableProps {
  reminders: PaymentReminder[];
}

export function RemindersTable({ reminders }: RemindersTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      payment_due: 'Payment Due',
      subscription_expiring: 'Expiring Soon',
      payment_failed: 'Payment Failed',
      welcome: 'Welcome',
    };
    return labels[type] || type;
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'sms':
        return <Phone className="h-3 w-3" />;
      case 'whatsapp':
        return <MessageSquare className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Channels
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Scheduled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {reminders.map((reminder) => (
              <tr key={reminder.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {reminder.memberName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {reminder.memberEmail}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {getTypeLabel(reminder.type)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {reminder.channels.map((channel) => (
                      <span
                        key={channel}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/20 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-400"
                      >
                        {getChannelIcon(channel)}
                        <span className="capitalize">{channel}</span>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(reminder.scheduledFor)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(reminder.status)}
                    <span
                      className={clsx(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                        getStatusColor(reminder.status)
                      )}
                    >
                      {reminder.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}