import DashboardLayout from "@/components/dashboard-layout";
import AccountsClient from "@/components/accounts/client";

export default function AccountsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-headline">Contas Bancárias</h1>
            <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
              Gerencie seus bancos, corretoras e carteiras digitais em um só lugar.
            </p>
        </div>
        <AccountsClient />
      </div>
    </DashboardLayout>
  );
}
