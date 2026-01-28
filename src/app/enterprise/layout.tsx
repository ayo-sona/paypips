import { EnterpriseSidebar } from "../../components/enterprise/EnterpriseSideBar";
import { EnterpriseHeader } from "../../components/enterprise/EnterpriseHeader";

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <EnterpriseSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <EnterpriseHeader />
        <main className="flex-1 hide-scrollbar overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
