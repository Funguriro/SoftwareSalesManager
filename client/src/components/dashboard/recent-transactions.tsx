import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronRight, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Transaction {
  id: number;
  clientName: string;
  productName: string;
  amount: number;
  transactionDate: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  subscriptionType: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
        <Link href="/invoices" className="text-sm text-primary-500 hover:text-primary-600 flex items-center">
          <span>View All</span>
          <ChevronRight size={16} className="ml-1" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-sm text-neutral-500 py-6 text-center">No transactions found</p>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b border-neutral-200 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center">
                  <div className={`bg-${transaction.status === 'completed' ? 'success' : 'warning'}-100 p-2 rounded-full`}>
                    {transaction.status === 'completed' ? (
                      <CheckCircle className="text-success-500" size={20} />
                    ) : (
                      <Clock className="text-warning-500" size={20} />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">
                      {transaction.productName} - {transaction.subscriptionType}
                    </p>
                    <p className="text-xs text-neutral-500">{transaction.clientName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(transaction.amount)}</p>
                  <p className="text-xs text-neutral-500">
                    {format(new Date(transaction.transactionDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
