'use client';

import { useState } from 'react';
import { PaymentsTable } from '../../../components/enterprise/PaymentsTable';
import { PaymentFilters } from '../../../components/enterprise/PaymentFilters';
import { MOCK_PAYMENTS } from '../../../lib/mockData/enterpriseMockdata';
// import { Payment } from '../../../types/enterprise';
import { DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react';

export default function PaymentsPage() {
  // Only show successful payments by default
  const successfulPayments = MOCK_PAYMENTS.filter(p => p.status === 'success');
  
  // Filter state managed in parent
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Apply filters
  const filteredPayments = successfulPayments.filter(payment => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        payment.memberName.toLowerCase().includes(search) ||
        (payment.memberEmail && payment.memberEmail.toLowerCase().includes(search)) ||
        new Date(payment.createdAt).toLocaleDateString().includes(search);
      if (!matchesSearch) return false;
    }

    // Date filters
    if (dateFrom && new Date(payment.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(payment.createdAt) > new Date(dateTo + 'T23:59:59')) return false;

    // Gateway filter
    if (selectedSource !== 'all') {
      if (selectedSource === 'manual' && payment.gateway) return false;
      if (selectedSource !== 'manual' && payment.gateway !== selectedSource) return false;
    }

    // Method filter
    if (selectedMethod !== 'all' && payment.method !== selectedMethod) return false;

    // Status filter
    if (selectedStatus !== 'all' && payment.status !== selectedStatus) return false;

    return true;
  });

  // Calculate stats from successful payments only
  const totalRevenue = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paymentsThisMonth = successfulPayments.filter(payment => {
    const paymentDate = new Date(payment.paidAt || payment.createdAt);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && 
           paymentDate.getFullYear() === now.getFullYear();
  });
  const monthlyRevenue = paymentsThisMonth.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Platform payments = payments that have a gateway defined
  const throughPlatform = successfulPayments.filter(p => p.gateway).length;
  
  // Manual logs = payments without a gateway
  const loggedManually = successfulPayments.filter(p => !p.gateway).length;

  const stats = [
    {
      title: 'Total Revenue',
      value: `₦${(totalRevenue / 1000).toFixed(1)}K`,
      icon: DollarSign,
      color: 'bg-green-500',
      subtext: 'All time'
    },
    {
      title: 'This Month',
      value: `₦${(monthlyRevenue / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      color: 'bg-blue-500',
      subtext: `${paymentsThisMonth.length} payments`
    },
    {
      title: 'Platform Payments',
      value: throughPlatform,
      icon: CreditCard,
      color: 'bg-purple-500',
      subtext: 'Online payments'
    },
    {
      title: 'Manual Logs',
      value: loggedManually,
      icon: Users,
      color: 'bg-orange-500',
      subtext: 'Logged by admin'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Payment History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View all successful payments and transaction history
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stat.subtext}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <PaymentFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        selectedMethod={selectedMethod}
        setSelectedMethod={setSelectedMethod}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        filteredCount={filteredPayments.length}
      />

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <PaymentsTable payments={filteredPayments} />
      </div>
    </div>
  );
}