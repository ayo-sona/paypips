"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Divider,
  Switch,
  Badge,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Spinner,
  Image,
} from "@heroui/react";
import {
  Check,
  CheckCircle,
  HelpCircle,
  Zap,
  Shield,
  Users,
  Clock,
  Mail,
  Globe,
  Lock,
  ArrowRight,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { usePaystack } from "@/hooks/usePaystack";

type BillingCycle = "monthly" | "annually";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  priceSuffix: string;
  features: string[];
  mostPopular: boolean;
}

const features = [
  { name: "Users", icon: Users },
  { name: "Storage", icon: Shield },
  { name: "Support", icon: Clock },
  { name: "Email", icon: Mail },
  { name: "Domains", icon: Globe },
  { name: "Security", icon: Lock },
];

const includedFeatures = [
  "Secure data encryption",
  "99.9% uptime SLA",
  "Regular updates & improvements",
  "Mobile apps",
  "Single sign-on (SSO)",
  "Audit logs",
];

export default function EnterprisePlansPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const { paystack, initializePaystack } = usePaystack();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const plans = await apiClient.get("/plans/organization");
      console.log(plans.data.data);
      setPlans(plans.data.data);
      setLoading(false);
    })();
    initializePaystack();
  }, []);

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    onOpen();
  };

  const handlePaymentMethodSelect = async (method: "paystack" | "kora") => {
    // Handle the selected payment method
    console.log(
      `Processing payment with ${method} for plan:`,
      selectedPlan?.name,
    );
    // You can add your payment processing logic here
    // await handleSubscribe();
    onClose();
  };

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      // 1. Create subscription in your system
      const {
        data: { invoice },
      } = await apiClient.post("/subscriptions/organizations", {
        planId: selectedPlan?.id,
      });

      // 2. Initialize Paystack payment
      const { data: payment } = await apiClient.post(
        "/payments/organization/initialize",
        {
          invoiceId: invoice.id,
        },
      );

      // 3. Redirect to Paystack
      if (!paystack) return;
      paystack.resumeTransaction(payment.access_code);
      //   window.location.href = payment.authorization_url;
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to start subscription");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner size="lg" color="success" />;
  }

  return (
    <div className="w-full h-full overflow-y-auto hide-scrollbar">
      <div className="min-h-full pb-12">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge color="primary" variant="flat" className="mb-4">
              Pricing Plans
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-base md:text-lg text-foreground-600 mb-6 max-w-2xl mx-auto">
              Choose the perfect plan for your organization. Start with a free
              trial and upgrade as you grow.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="text-sm font-medium">Billed Monthly</span>
              <Switch
                isSelected={billingCycle === "annually"}
                onValueChange={(isSelected) =>
                  setBillingCycle(isSelected ? "annually" : "monthly")
                }
                color="success"
                size="lg"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Billed Annually</span>
                {billingCycle === "annually" && (
                  <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                    Save 15%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-8 w-full">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col ${
                  plan.mostPopular ? "ring-2 ring-primary" : ""
                }`}
              >
                {plan.mostPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-lg z-10">
                    Most Popular
                  </div>
                )}
                <CardHeader className="pb-4 shrink-0">
                  <h3 className="text-xl md:text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-foreground-500">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-3xl md:text-4xl font-bold">
                      {plan.price}
                    </span>
                    {billingCycle === "annually" &&
                      plan.id !== "enterprise" && (
                        <span className="block text-sm text-foreground-500 mt-1">
                          Billed annually
                        </span>
                      )}
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4 grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-success-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
                <CardFooter className="shrink-0">
                  <Button
                    color="success"
                    variant="solid"
                    className="w-full"
                    size="lg"
                    onPress={() => handlePlanSelect(plan)}
                    endContent={<ArrowRight size={18} />}
                  >
                    Subscribe
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-12 bg-default-50 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Compare plans
              </h2>
              <p className="text-sm md:text-base text-foreground-600 max-w-2xl mx-auto">
                See how our plans stack up against each other to find the
                perfect fit for your organization.
              </p>
            </div>

            <div className="overflow-x-auto -mx-4 px-4">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-default-200">
                  <thead>
                    <tr>
                      <th className="text-left pb-6 pr-4 min-w-[200px]">
                        <span className="text-sm font-medium">Features</span>
                      </th>
                      {plans.map((plan) => (
                        <th
                          key={plan.id}
                          className="text-center pb-6 px-4 min-w-[120px]"
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-base md:text-lg font-semibold">
                              {plan.name}
                            </span>
                            <span className="text-base md:text-lg font-semibold">
                              {plan.price}
                            </span>
                            {plan.mostPopular && (
                              <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full mt-1">
                                Most Popular
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default-200">
                    {includedFeatures.map((feature, index) => (
                      <tr key={index}>
                        <td className="py-4 pr-4 text-sm text-foreground-600">
                          <div className="flex items-center">
                            <Check className="w-4 h-4 text-success-500 mr-2 shrink-0" />
                            <span>{feature}</span>
                          </div>
                        </td>
                        {plans.map((plan) => (
                          <td
                            key={`${plan.id}-${index}`}
                            className="py-4 px-4 text-center"
                          >
                            {plan.id === "enterprise" || index < 4 ? (
                              <Check className="w-5 h-5 text-success-500 mx-auto" />
                            ) : (
                              <span className="text-foreground-400">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
          <ModalContent className="bg-white">
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex justify-center items-center">
                    <h3 className="text-lg font-semibold">
                      Complete Your Subscription
                    </h3>
                  </div>
                </ModalHeader>
                <ModalBody className="flex justify-center py-4">
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-foreground-600 mb-2">
                        You're subscribing to{" "}
                        <span className="font-semibold">
                          {selectedPlan?.name}
                        </span>{" "}
                        plan
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedPlan?.price}
                        <span className="text-base font-normal text-foreground-500">
                          {selectedPlan?.priceSuffix}
                        </span>
                      </p>
                      {billingCycle === "annually" &&
                        selectedPlan?.id !== "enterprise" && (
                          <p className="text-sm text-foreground-500 mt-1">
                            Billed annually at {selectedPlan?.price}
                          </p>
                        )}
                    </div>
                    <div className="space-y-3 pt-4">
                      <Button
                        fullWidth
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onPress={() => handlePaymentMethodSelect("paystack")}
                        startContent={
                          <Image
                            src="/paystack-logo.jpeg"
                            alt="Paystack"
                            width={80}
                            height={24}
                            className="h-6 w-auto"
                          />
                        }
                      >
                        Pay with Paystack
                      </Button>
                      <Button
                        fullWidth
                        size="lg"
                        variant="bordered"
                        className="border-2 border-gray-200 hover:border-gray-300"
                        onPress={() => handlePaymentMethodSelect("kora")}
                        startContent={
                          <Image
                            src="/kora-logo.jpeg"
                            alt="Kora"
                            width={80}
                            height={40}
                            className="h-6 w-auto"
                          />
                        }
                      >
                        Pay with Kora
                      </Button>
                    </div>
                    <div className="pt-2 text-xs text-foreground-500 text-center">
                      <p>
                        Secure payment processing powered by our trusted
                        partners
                      </p>
                    </div>
                  </div>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
