import { Currency, PaymentGateway } from '../types/common';
import { PlanId, Plan } from '../types/subscription';

export const PRICING_PLANS: Record<PlanId, Omit<Plan, 'currency' | 'billingCycle'>> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    members: 50,
    price: 45000,
    pricePerMember: 900,
    features: [
      { name: 'Up to 50 members', included: true, limit: 50 },
      { name: 'Basic dashboard', included: true },
      { name: 'Email notifications', included: true },
      { name: 'Member management', included: true },
      { name: 'Export to CSV', included: false },
      { name: 'SMS notifications', included: false },
      { name: 'WhatsApp notifications', included: false },
      { name: 'API access', included: false },
      { name: 'Priority support', included: false },
    ],
    limits: {
      members: 50,
      apiAccess: false,
      smsNotifications: false,
      whatsappNotifications: false,
      emailNotifications: true,
      exportFeatures: false,
      prioritySupport: false,
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    members: 100,
    price: 80000,
    pricePerMember: 800,
    popular: true,
    features: [
      { name: 'Up to 100 members', included: true, limit: 100 },
      { name: 'Advanced analytics', included: true },
      { name: 'Email notifications', included: true },
      { name: 'SMS notifications', included: true },
      { name: 'Export to CSV', included: true },
      { name: 'Member management', included: true },
      { name: 'WhatsApp notifications', included: false },
      { name: 'API access', included: false },
      { name: 'Priority support', included: false },
    ],
    limits: {
      members: 100,
      apiAccess: false,
      smsNotifications: true,
      whatsappNotifications: false,
      emailNotifications: true,
      exportFeatures: true,
      prioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    members: 200,
    price: 150000,
    pricePerMember: 750,
    features: [
      { name: 'Up to 200 members', included: true, limit: 200 },
      { name: 'Advanced analytics', included: true },
      { name: 'Email notifications', included: true },
      { name: 'SMS notifications', included: true },
      { name: 'WhatsApp notifications', included: true },
      { name: 'Export to CSV', included: true },
      { name: 'API access', included: true },
      { name: 'Automation tools', included: true },
      { name: 'Priority support', included: false },
    ],
    limits: {
      members: 200,
      apiAccess: true,
      smsNotifications: true,
      whatsappNotifications: true,
      emailNotifications: true,
      exportFeatures: true,
      prioritySupport: false,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    members: 999999,
    price: 0, // Custom pricing
    pricePerMember: 0,
    features: [
      { name: 'Unlimited members', included: true },
      { name: 'Custom analytics', included: true },
      { name: 'All notification channels', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'API access', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Priority support 24/7', included: true },
      { name: 'SLA guarantee', included: true },
    ],
    limits: {
      members: 999999,
      apiAccess: true,
      smsNotifications: true,
      whatsappNotifications: true,
      emailNotifications: true,
      exportFeatures: true,
      prioritySupport: true,
    },
  },
};

export const ANNUAL_DISCOUNT = 0.17; // 17% discount (2 months free)

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
};

export const CURRENCY_RATES: Record<Currency, number> = {
  NGN: 1,
  USD: 0.0013, // Approximate rate
  GBP: 0.001,
  EUR: 0.0012,
};

export const GATEWAY_BY_COUNTRY: Record<string, PaymentGateway> = {
  NG: 'paystack',
  US: 'stripe',
  GB: 'stripe',
  CA: 'stripe',
  // Add more countries as needed
};

export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to willow',
    description: 'Let\'s get you set up in just a few steps',
  },
  {
    id: 'business-info',
    title: 'Business Information',
    description: 'Tell us about your business',
  },
  {
    id: 'select-plan',
    title: 'Choose Your Plan',
    description: 'Select a plan that fits your needs',
  },
  {
    id: 'payment-setup',
    title: 'Payment Setup',
    description: 'Set up your payment method',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start managing your subscriptions',
  },
];