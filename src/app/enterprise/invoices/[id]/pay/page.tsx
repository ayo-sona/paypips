"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@heroui/react";
import apiClient from "@/lib/apiClient";
import PaystackPop from "@paystack/inline-js";

export default function PayInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, []);

  const loadInvoice = async () => {
    const { data } = await apiClient.get(`/invoices/${params.id}`);
    setInvoice(data.data);
  };

  const handlePay = async () => {
    setLoading(true);

    try {
      const { data } = await apiClient.post("/payments/initialize", {
        invoiceId: params.id,
      });
      const popup = new PaystackPop();
      popup.resumeTransaction(data.data.access_code);
      // window.location.href = data.data.authorization_url;
    } catch (error) {
      alert("Failed to initialize payment");
      setLoading(false);
    }
  };

  if (!invoice) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card>
        <h2>Invoice Payment</h2>
        <div className="my-4">
          <p className="text-sm text-gray-600">Invoice Number</p>
          <p className="font-semibold">{invoice.invoice_number}</p>
        </div>
        <div className="my-4">
          <p className="text-sm text-gray-600">Amount Due</p>
          <p className="text-3xl font-bold">₦{invoice.amount}</p>
        </div>
        <div className="my-4">
          <p className="text-sm text-gray-600">Description</p>
          <p>{invoice.description}</p>
        </div>
        <Button
          color="primary"
          className="w-full"
          size="lg"
          isLoading={loading}
          onPress={handlePay}
        >
          Pay ₦{invoice.amount}
        </Button>
      </Card>
    </div>
  );
}
