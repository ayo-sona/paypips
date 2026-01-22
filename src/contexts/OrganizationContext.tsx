// "use client";

// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   ReactNode,
// } from "react";
// import { useRouter } from "next/navigation";

// interface Organization {
//   id: string;
//   name: string;
//   role: string;
//   // Add other organization fields as needed
// }

// interface OrganizationContextType {
//   currentOrg: Organization | null;
//   setCurrentOrg: (org: Organization) => void;
//   organizations: Organization[];
//   loading: boolean;
//   refreshOrganizations: () => Promise<void>;
// }

// const OrganizationContext = createContext<OrganizationContextType | undefined>(
//   undefined,
// );

// export function OrganizationProvider({ children }: { children: ReactNode }) {
//   const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
//   const [organizations, setOrganizations] = useState<Organization[]>([]);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   const fetchOrganizations = async () => {
//     try {
//       setLoading(true);
//       // Replace with your actual API call
//       // const response = await apiClient.get('/user/organizations');
//       // setOrganizations(response.data);

//       // Mock data
//       const mockOrgs: Organization[] = [
//         { id: "1", name: "Acme Corp", role: "Owner" },
//         { id: "2", name: "Tech Solutions", role: "Admin" },
//       ];
//       setOrganizations(mockOrgs);

//       // Set current org from localStorage or select first org
//       const savedOrgId = localStorage.getItem("selectedOrganizationId");
//       const orgToSet = savedOrgId
//         ? mockOrgs.find((org) => org.id === savedOrgId) || mockOrgs[0]
//         : mockOrgs[0];

//       if (orgToSet) {
//         setCurrentOrg(orgToSet);
//         localStorage.setItem("selectedOrganizationId", orgToSet.id);
//       }
//     } catch (error) {
//       console.error("Failed to fetch organizations:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOrganizations();
//   }, []);

//   const handleSetCurrentOrg = (org: Organization) => {
//     setCurrentOrg(org);
//     localStorage.setItem("selectedOrganizationId", org.id);
//   };

//   return (
//     <OrganizationContext.Provider
//       value={{
//         currentOrg,
//         setCurrentOrg: handleSetCurrentOrg,
//         organizations,
//         loading,
//         refreshOrganizations: fetchOrganizations,
//       }}
//     >
//       {children}
//     </OrganizationContext.Provider>
//   );
// }

// export const useOrganization = () => {
//   const context = useContext(OrganizationContext);
//   if (context === undefined) {
//     throw new Error(
//       "useOrganization must be used within an OrganizationProvider",
//     );
//   }
//   return context;
// };
