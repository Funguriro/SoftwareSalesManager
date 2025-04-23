import { useEffect, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/dashboard/stat-card";
import { LicenseAlert } from "@/components/dashboard/license-alert";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Users, Key, Headset, DollarSign, Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedLicenses, setSelectedLicenses] = useState<number[]>([]);

  // Fetch dashboard stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch expiring licenses
  const { data: expiringLicenses, isLoading: isLicensesLoading } = useQuery({
    queryKey: ["/api/dashboard/expiring-licenses"],
  });

  // Fetch recent tickets
  const { data: recentTickets, isLoading: isTicketsLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-tickets"],
  });

  // Fetch recent transactions
  const { data: recentTransactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-transactions"],
  });

  const handleLicenseRenew = (id: number) => {
    setSelectedLicenses(prev => [...prev, id]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
      <Sidebar />
      
      <main className="flex-1 p-6 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell size={20} className="text-neutral-600" />
            </Button>
            <Button variant="ghost" size="icon">
              <HelpCircle size={20} className="text-neutral-600" />
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {isStatsLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-20 mb-4" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="Total Clients"
                value={stats?.totalClients || 0}
                icon={<Users size={24} />}
                iconBgClass="bg-primary-50"
                iconColor="text-primary-500"
                trend={{ value: 12, isPositive: true, label: "from last month" }}
              />
              <StatCard
                title="Active Licenses"
                value={stats?.activeSubscriptions || 0}
                icon={<Key size={24} />}
                iconBgClass="bg-success-50"
                iconColor="text-success-500"
                trend={{ value: 8, isPositive: true, label: "from last month" }}
              />
              <StatCard
                title="Open Tickets"
                value={stats?.openTickets || 0}
                icon={<Headset size={24} />}
                iconBgClass="bg-warning-50"
                iconColor="text-warning-500"
                trend={{ value: 5, isPositive: false, label: "from last week" }}
              />
              <StatCard
                title="Monthly Revenue"
                value={formatCurrency(stats?.monthlyRevenue || 0)}
                icon={<DollarSign size={24} />}
                iconBgClass="bg-primary-50"
                iconColor="text-primary-500"
                trend={{ value: 18, isPositive: true, label: "from last month" }}
              />
            </>
          )}
        </div>

        {/* License Expiration Alerts */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">License Expiration Alerts</h2>
            <Button variant="link" className="text-primary-500 p-0" asChild>
              <a href="/licenses">View All</a>
            </Button>
          </div>
          
          {isLicensesLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="border-l-4 border-neutral-300 bg-neutral-50 p-4 mb-3 rounded-r-md">
                <Skeleton className="h-5 w-40 mb-2" />
                <div className="flex items-center">
                  <Skeleton className="h-4 w-24 mr-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))
          ) : expiringLicenses?.length === 0 ? (
            <p className="text-neutral-500 py-6 text-center">No licenses expiring soon</p>
          ) : (
            expiringLicenses
              ?.filter(license => !selectedLicenses.includes(license.id))
              .slice(0, 3)
              .map(license => (
                <LicenseAlert
                  key={license.id}
                  id={license.id}
                  company={license.company}
                  expiresIn={license.expiresIn}
                  licenseKey={license.licenseKey}
                  onRenew={handleLicenseRenew}
                />
              ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Support Tickets */}
          <RecentTickets tickets={recentTickets || []} />

          {/* Recent Transactions */}
          <RecentTransactions transactions={recentTransactions || []} />
        </div>
      </main>
    </div>
  );
}
