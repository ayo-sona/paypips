# Stripe Integration - Usage Guide (Payment-Only)

This guide shows how to integrate Stripe for payment processing while using your own subscription management system.

---

## 🏗️ Architecture Overview

```
Your Subscription Engine → Creates Invoice → Stripe Processes Payment → Webhook Updates Status
```

**What Stripe Handles:**

- ✅ Payment processing
- ✅ Customer management
- ✅ Card storage (PCI compliant)
- ✅ Disputes & chargebacks
- ✅ Refunds
- ✅ 3D Secure authentication
- ✅ Payment history

**What You Handle:**

- ✅ Subscription plans
- ✅ Subscription lifecycle
- ✅ Invoice generation
- ✅ Billing periods
- ✅ Pricing logic

---

## 📦 Setup Steps

### 1. Database Migrations

Add to your Organization entity:

```typescript
@Column({ nullable: true })
stripe_customer_id: string;

@Column({ nullable: true })
stripe_default_payment_method: string;
```

Run migration:

```bash
npm run migration:generate -- src/database/migrations/AddStripeToOrganization
npm run migration:run
```

### 2. Environment Variables

```env
# Stripe Keys
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Module Setup

```typescript
// stripe.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { StripeWebhooksService } from './webhooks.service';
import { StripeController } from './stripe.controller';
import { Organization, Payment, Invoice, User } from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      Payment,
      Invoice,
      User,
      MemberSubscription,
      OrganizationSubscription,
    ]),
  ],
  controllers: [StripeController],
  providers: [StripeService, StripeWebhooksService],
  exports: [StripeService],
})
export class StripeModule {}
```

---

## 🔄 Payment Flow Examples

### Scenario 1: Manual Invoice Payment (User Initiates)

```typescript
// 1. Your subscription engine creates an invoice
const invoice = await invoiceRepository.save({
  issuer_org_id: organizationId,
  billed_user_id: userId,
  billed_type: 'member',
  amount: 99.0,
  currency: 'USD',
  status: InvoiceStatus.PENDING,
  due_date: new Date(),
  invoice_number: 'INV-001',
  description: 'Monthly subscription',
  member_subscription_id: subscriptionId,
});

// 2. Frontend requests payment intent
const { data } = await apiClient.post(
  `/stripe/payment-intent/invoice/${invoice.id}`,
);

// 3. Frontend uses Stripe.js to collect payment
const stripe = await loadStripe(PUBLISHABLE_KEY);
const { error } = await stripe.confirmCardPayment(data.clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'John Doe' },
  },
});

// 4. Webhook receives payment_intent.succeeded
// 5. Your webhook handler:
//    - Marks payment as SUCCESS
//    - Marks invoice as PAID
//    - Extends subscription period
//    - Sends confirmation email
```

### Scenario 2: Auto-Charge Saved Card (Subscription Renewal)

```typescript
// 1. Your cron job detects expiring subscription
const expiringSubscriptions = await memberSubscriptionRepository.find({
  where: {
    expires_at: LessThan(addDays(new Date(), 3)),
    auto_renew: true,
  },
});

// 2. Create invoice for renewal
const invoice = await invoiceRepository.save({
  issuer_org_id: subscription.organization_id,
  billed_user_id: subscription.member.user_id,
  amount: subscription.plan.price,
  currency: subscription.plan.currency,
  status: InvoiceStatus.PENDING,
  member_subscription_id: subscription.id,
});

// 3. Auto-charge saved payment method
try {
  const result = await stripeService.chargePaymentMethod(
    subscription.organization_id,
    invoice.id,
  );

  if (result.success) {
    // Payment succeeded
    subscription.expires_at = addMonths(subscription.expires_at, 1);
    await subscriptionRepository.save(subscription);
  }
} catch (error) {
  // Payment failed - send notification to user
  await notificationsService.sendPaymentFailedNotification({
    email: user.email,
    amount: invoice.amount,
    invoiceNumber: invoice.invoice_number,
  });
}
```

### Scenario 3: First-Time Payment Method Setup

```typescript
// Frontend: Add payment method page
const SetupPaymentMethod = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Get setup intent from backend
    const { data } = await apiClient.post('/stripe/setup-intent');

    // 2. Confirm card setup
    const { error } = await stripe.confirmCardSetup(
      data.clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: 'John Doe' },
        },
      }
    );

    if (!error) {
      alert('Payment method added!');
      // Now this card can be used for auto-charges
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit">Add Card</button>
    </form>
  );
};
```

---

## 🎯 Common Use Cases

### Use Case 1: Member Signs Up for Subscription

```typescript
// 1. Create member subscription in your system
const subscription = await memberSubscriptionRepository.save({
  member_id: memberId,
  plan_id: planId,
  status: SubscriptionStatus.ACTIVE,
  started_at: new Date(),
  expires_at: addMonths(new Date(), 1),
  auto_renew: true,
});

// 2. Create initial invoice
const invoice = await invoiceRepository.save({
  issuer_org_id: organizationId,
  billed_user_id: userId,
  amount: plan.price,
  currency: plan.currency,
  status: InvoiceStatus.PENDING,
  member_subscription_id: subscription.id,
});

// 3. Redirect to payment page
// Frontend collects payment via Stripe.js
// Webhook marks invoice as paid
// Subscription becomes active
```

### Use Case 2: Subscription Renewal (Automated)

```typescript
// Cron job runs daily
@Cron('0 0 * * *') // Every day at midnight
async checkExpiringSubscriptions() {
  const expiring = await memberSubscriptionRepository.find({
    where: {
      expires_at: Between(new Date(), addDays(new Date(), 1)),
      auto_renew: true,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  for (const subscription of expiring) {
    await this.renewSubscription(subscription);
  }
}

async renewSubscription(subscription: MemberSubscription) {
  // 1. Create renewal invoice
  const invoice = await this.createRenewalInvoice(subscription);

  // 2. Auto-charge
  try {
    const result = await this.stripeService.chargePaymentMethod(
      subscription.organization_id,
      invoice.id,
    );

    if (!result.success) {
      // Retry logic or notification
      await this.notifyPaymentFailed(subscription);
    }
  } catch (error) {
    // Handle failed auto-charge
    subscription.status = SubscriptionStatus.PAUSED;
    await this.subscriptionRepository.save(subscription);
  }
}
```

### Use Case 3: Handle Failed Payment

```typescript
// Webhook handler already does this, but you can add retry logic

private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const payment = await this.paymentRepository.findOne({
    where: { provider_reference: paymentIntent.id },
    relations: ['invoice', 'invoice.member_subscription'],
  });

  if (payment?.invoice?.member_subscription) {
    const subscription = payment.invoice.member_subscription;

    // Retry 3 times over 7 days
    if (!subscription.payment_retry_count) {
      subscription.payment_retry_count = 0;
    }

    subscription.payment_retry_count++;

    if (subscription.payment_retry_count >= 3) {
      // Give up - pause subscription
      subscription.status = SubscriptionStatus.PAUSED;
      subscription.auto_renew = false;
    } else {
      // Schedule retry
      // Implement your retry logic here
    }

    await this.subscriptionRepository.save(subscription);
  }
}
```

---

## 💳 Frontend Integration Examples

### Payment Page (Next.js + HeroUI)

```typescript
"use client";

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Card, CardBody } from '@heroui/react';
import apiClient from '@/lib/apiClient';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm({ invoiceId, amount, currency }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Create payment intent
      const { data } = await apiClient.post(
        `/stripe/payment-intent/invoice/${invoiceId}`
      );

      // 2. Confirm payment
      const { error: stripeError } = await stripe.confirmCardPayment(
        data.data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else {
        // Success!
        alert('Payment successful!');
        window.location.href = '/dashboard?payment=success';
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardBody>
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2">Payment Details</h3>
            <p className="text-2xl">
              {amount} {currency}
            </p>
          </div>

          <div className="mb-4 p-3 border rounded">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
              {error}
            </div>
          )}

          <Button
            color="primary"
            type="submit"
            isLoading={loading}
            isDisabled={!stripe || loading}
            className="w-full"
          >
            Pay Now
          </Button>
        </CardBody>
      </Card>
    </form>
  );
}

export default function PaymentPage({ params }: { params: { invoiceId: string } }) {
  return (
    <div className="container mx-auto py-12">
      <Elements stripe={stripePromise}>
        <PaymentForm invoiceId={params.invoiceId} amount={99} currency="USD" />
      </Elements>
    </div>
  );
}
```

### Saved Cards Management

```typescript
"use client";

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import { CreditCard, Trash2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function PaymentMethodsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    const { data } = await apiClient.get('/stripe/payment-methods');
    setCards(data.data);
    setLoading(false);
  };

  const removeCard = async (cardId: string) => {
    if (confirm('Remove this payment method?')) {
      await apiClient.delete(`/stripe/payment-methods/${cardId}`);
      loadCards();
    }
  };

  const setDefault = async (cardId: string) => {
    await apiClient.post(`/stripe/payment-methods/${cardId}/default`);
    loadCards();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Payment Methods</h1>

      <div className="grid gap-4">
        {cards.map((card: any) => (
          <Card key={card.id}>
            <CardBody className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <CreditCard size={24} />
                <div>
                  <p className="font-semibold">
                    {card.brand.toUpperCase()} •••• {card.last4}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expires {card.exp_month}/{card.exp_year}
                  </p>
                </div>
                {card.isDefault && (
                  <Chip color="primary" size="sm">Default</Chip>
                )}
              </div>

              <div className="flex gap-2">
                {!card.isDefault && (
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setDefault(card.id)}
                  >
                    Set Default
                  </Button>
                )}
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  isIconOnly
                  onPress={() => removeCard(card.id)}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Button color="primary" className="mt-6">
        Add New Card
      </Button>
    </div>
  );
}
```

---

## 🔔 Webhook Events to Handle

Your webhook service handles these events:

| Event                            | What It Does                                 |
| -------------------------------- | -------------------------------------------- |
| `payment_intent.succeeded`       | Marks payment as successful, updates invoice |
| `payment_intent.payment_failed`  | Marks payment as failed, sends notification  |
| `payment_intent.requires_action` | Notifies user to complete 3D Secure          |
| `charge.refunded`                | Updates payment status to refunded           |
| `charge.dispute.created`         | Logs dispute, alerts support team            |
| `charge.dispute.closed`          | Updates dispute status                       |
| `payment_method.attached`        | Logs new payment method                      |
| `payment_method.detached`        | Logs removed payment method                  |

---

## 🧪 Testing

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
Insufficient Funds: 4000 0000 0000 9995
```

### Test Workflow

```bash
# 1. Start webhook listener
stripe listen --forward-to localhost:4000/api/v1/stripe/webhook

# 2. Create test invoice in your system
# 3. Make test payment
# 4. Check webhook logs
# 5. Verify database updates
```

---

## ✅ Checklist

- [ ] Added `stripe_customer_id` to Organization entity
- [ ] Added `stripe_default_payment_method` to Organization entity
- [ ] Configured environment variables
- [ ] Set up webhook endpoint
- [ ] Tested payment flow
- [ ] Tested auto-charge flow
- [ ] Tested webhook handling
- [ ] Implemented retry logic for failed payments
- [ ] Added payment notifications
- [ ] Set up dispute alerts

---

## 🚀 Go Live

1. Switch to live API keys
2. Update webhook endpoint in Stripe Dashboard
3. Test with real card (small amount)
4. Monitor first few transactions closely
5. Set up alerts for disputes/failures
