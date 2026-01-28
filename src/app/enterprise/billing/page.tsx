"use client";

import { useEffect, useState } from "react";
import { Card, Button, Chip } from "@heroui/react";
import apiClient from "@/lib/apiClient";

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [subRes, invRes] = await Promise.all([
      apiClient.get("/subscriptions/organizations"),
      apiClient.get("/invoices/organization"),
    ]);

    setSubscription(subRes.data.data);
    setInvoices(invRes.data.data);
  };

  const handleCancel = async () => {
    if (!confirm("Cancel subscription? You can use it until expiry.")) return;

    try {
      await apiClient.post(`/subscriptions/organizations/cancel`);
      alert("Subscription canceled");
      loadData();
    } catch (error) {
      alert("Failed to cancel");
    }
  };

  const handleReactivate = async () => {
    try {
      await apiClient.post(`/subscriptions/organizations/reactivate`);
      alert("Subscription reactivated");
      loadData();
    } catch (error) {
      alert("Failed to reactivate");
    }
  };

  return (
    <div className="container mx-auto py-12">
      {/* Current Subscription */}
      <Card className="mb-6">
        <h2>Current Subscription</h2>
        {subscription && (
          <>
            <p className="text-2xl font-bold">{subscription.plan.name}</p>
            <p>
              ₦{subscription.plan.price}/{subscription.plan.interval}
            </p>
            <Chip
              color={subscription.status === "active" ? "success" : "warning"}
            >
              {subscription.status}
            </Chip>
            <p className="text-sm mt-2">
              {subscription.auto_renew
                ? `Next billing: ${new Date(subscription.expires_at).toLocaleDateString()}`
                : `Expires: ${new Date(subscription.expires_at).toLocaleDateString()}`}
            </p>

            {/* Saved Card Info */}
            {subscription.paystack_card_last4 && (
              <div className="mt-4">
                <p className="text-sm">Payment method:</p>
                <p>
                  {subscription.paystack_card_brand} ••••{" "}
                  {subscription.paystack_card_last4}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              {subscription.auto_renew ? (
                <Button color="danger" variant="light" onPress={handleCancel}>
                  Cancel Subscription
                </Button>
              ) : (
                <Button color="primary" onPress={handleReactivate}>
                  Reactivate
                </Button>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Invoices */}
      <Card>
        <h3>Billing History</h3>
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex justify-between items-center p-3 border rounded"
            >
              <div>
                <p className="font-semibold">{invoice.invoice_number}</p>
                <p className="text-sm text-gray-600">
                  {new Date(invoice.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">₦{invoice.amount}</p>
                <Chip
                  size="sm"
                  color={invoice.status === "paid" ? "success" : "warning"}
                >
                  {invoice.status}
                </Chip>
              </div>
              {invoice.status === "pending" && (
                <Button
                  size="sm"
                  color="primary"
                  onPress={() =>
                    (window.location.href = `/invoices/${invoice.id}/pay`)
                  }
                >
                  Pay Now
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
