import { useState, useCallback } from "react";

export function usePaystack() {
  const [paystack, setPaystack] = useState<any>(null);

  const initializePaystack = useCallback(async () => {
    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      setPaystack(new PaystackPop());
    } catch (error) {
      console.error("Failed to load Paystack:", error);
    }
  }, []);

  return { paystack, initializePaystack };
}
