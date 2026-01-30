import DashboardLayout from "@/components/dashboard-layout";
import AccountsPayableClient from "@/components/accounts-payable/client";

export default function AccountsPayablePage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Contas a Pagar</h1>
        </div>
        <AccountsPayableClient />
      </div>
    </DashboardLayout>
  );
}
