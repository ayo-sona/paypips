"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Input,
  Chip,
  Skeleton,
  Avatar,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  Building2,
  Plus,
  ArrowRight,
  Search,
  Users,
  Crown,
} from "lucide-react";
import { useToast } from "@/features/notifications/useToast";

interface Organization {
  id: string;
  name: string;
  role: string;
  logo?: string;
  memberCount: number;
  plan: string;
  lastActive?: string;
}

export default function OrganizationSelectPage() {
  const router = useRouter();
  const { addToast } = useToast();
  // const { isOpen, onOpen, onClose } = useDisclosure();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        // Replace with actual API call
        // const response = await apiClient.get('/user/organizations');
        // setOrganizations(response.data);

        // Mock data
        setTimeout(() => {
          setOrganizations([
            {
              id: "1",
              name: "Acme Corp",
              role: "Owner",
              memberCount: 24,
              plan: "Pro",
              lastActive: "2 hours ago",
            },
            {
              id: "2",
              name: "Tech Solutions",
              role: "Admin",
              memberCount: 8,
              plan: "Starter",
            },
            {
              id: "3",
              name: "Design Studio",
              role: "Member",
              memberCount: 15,
              plan: "Pro",
              lastActive: "1 day ago",
            },
          ]);
          setLoading(false);
        }, 800);
      } catch (error) {
        addToast("error", "Error", "Failed to load organizations");
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [addToast]);

  const handleSelectOrganization = async (orgId: string) => {
    setSelectedOrg(orgId);

    try {
      // Store selected org and redirect
      localStorage.setItem("selectedOrgId", orgId);

      // Simulate API call to switch organization context
      await new Promise((resolve) => setTimeout(resolve, 500));

      addToast("success", "Success", "Switched organization successfully");
      router.push("/enterprise/dashboard");
    } catch (error) {
      addToast("error", "Error", "Failed to switch organization");
      setSelectedOrg(null);
    }
  };

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "warning";
      case "admin":
        return "primary";
      case "staff":
        return "secondary";
      default:
        return "default";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "pro":
        return "secondary";
      case "enterprise":
        return "primary";
      default:
        return "success";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent mb-3">
            Select an Organization
          </h1>
          <p className="text-default-600 text-lg">
            Choose an organization to continue to your dashboard
          </p>
        </header>

        {/* Search Bar */}
        <div className="mb-8 max-w-xl mx-auto">
          <Input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Search className="text-default-400" size={20} />}
            size="lg"
            variant="bordered"
            classNames={{
              input: "text-base",
              inputWrapper: "h-12",
            }}
          />
        </div>

        {/* Organizations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="w-full space-y-3 p-4" radius="lg">
                <Skeleton className="rounded-lg">
                  <div className="h-32 rounded-lg bg-default-300"></div>
                </Skeleton>
                <div className="space-y-3">
                  <Skeleton className="w-3/5 rounded-lg">
                    <div className="h-4 w-3/5 rounded-lg bg-default-200"></div>
                  </Skeleton>
                  <Skeleton className="w-4/5 rounded-lg">
                    <div className="h-4 w-4/5 rounded-lg bg-default-200"></div>
                  </Skeleton>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrgs.map((org) => (
              <div key={org.id}>
                <Card
                  isPressable
                  isHoverable
                  className={`w-full transition-all ${
                    selectedOrg === org.id ? "ring-2 ring-primary" : ""
                  }`}
                  shadow="sm"
                  radius="lg"
                >
                  <CardHeader className="flex gap-3 pb-3">
                    <Avatar
                      icon={<Building2 size={20} />}
                      classNames={{
                        base: "bg-gradient-to-br from-primary to-secondary",
                        icon: "text-white",
                      }}
                      size="md"
                    />
                    <div className="flex flex-col flex-1">
                      <p className="text-lg font-semibold">{org.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Chip
                          size="sm"
                          color={getRoleColor(org.role)}
                          variant="flat"
                          startContent={
                            org.role === "Owner" ? <Crown size={14} /> : null
                          }
                        >
                          {org.role}
                        </Chip>
                        <Chip
                          size="sm"
                          color={getPlanColor(org.plan)}
                          variant="flat"
                        >
                          {org.plan}
                        </Chip>
                      </div>
                    </div>
                  </CardHeader>

                  <Divider />

                  <CardBody className="py-4">
                    <div className="space-y-2 text-small">
                      <div className="flex items-center gap-2 text-default-600">
                        <Users size={16} className="text-default-400" />
                        <span className="font-medium">{org.memberCount}</span>
                        <span>members</span>
                      </div>
                      {org.lastActive && (
                        <p className="text-tiny text-default-500">
                          Last active: {org.lastActive}
                        </p>
                      )}
                    </div>
                  </CardBody>
                </Card>

                <Divider />

                <Button
                  color="default"
                  variant={selectedOrg === org.id ? "solid" : "bordered"}
                  className="w-full pt-4"
                  size="lg"
                  isLoading={selectedOrg === org.id}
                  endContent={
                    selectedOrg !== org.id && <ArrowRight size={18} />
                  }
                  onPress={() => handleSelectOrganization(org.id)}
                >
                  {selectedOrg === org.id
                    ? "Loading..."
                    : "Select Organization"}
                </Button>
              </div>
            ))}

            {/* Create New Organization Card */}
            <div className="flex flex-col gap-4">
              <Card
                isPressable
                isHoverable
                className="w-full border-2 border-dashed border-default-300 bg-default-50/50"
                shadow="none"
                radius="lg"
                onPress={() => router.push("/auth/org/register")}
              >
                <CardBody className="h-full flex flex-col items-center justify-center p-8 gap-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Plus className="text-primary" size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-1">
                      Create New Organization
                    </h3>
                    <p className="text-small text-default-500">
                      Start a new organization and invite team members
                    </p>
                  </div>
                </CardBody>
              </Card>
              <Button
                color="primary"
                variant="flat"
                size="lg"
                startContent={<Plus size={18} />}
                className="mt-2"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrgs.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-default-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="text-default-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No organizations found
            </h3>
            <p className="text-default-500 mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "You don't have access to any organizations yet"}
            </p>
            <Button
              color="primary"
              onPress={() => router.push("/auth/register")}
              startContent={<Plus />}
            >
              Create Organization
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-small text-default-500">
            Need help or looking for a different organization?{" "}
            <Button
              variant="light"
              color="primary"
              size="sm"
              className="p-0 h-auto min-w-0"
            >
              Contact support
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
