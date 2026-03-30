import DashboardLayout from "@/components/dashboard-layout";
import TransactionClient from "@/components/transactions/transaction-client";

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Transações</h1>
        <TransactionClient />
      </div>
    </DashboardLayout>
  );
}
