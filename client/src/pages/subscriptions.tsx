import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { PlusCircle, Search, CreditCard, ChevronRight, Filter, Clock, Calendar } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isFuture, isToday, differenceInDays } from "date-fns";

interface Subscription {
  id: number;
  clientId: number;
  clientName?: string;
  productId: number;
  productName?: string;
  subscriptionType: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  price: number;
  autoRenew: boolean;
}

export default function Subscriptions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const { data: subscriptions, isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const filteredSubscriptions = subscriptions?.filter(subscription => {
    const matchesSearch = 
      (subscription.clientName && subscription.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (subscription.productName && subscription.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = 
      typeFilter === "all" || 
      subscription.subscriptionType === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getSubscriptionStatus = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isFuture(start)) {
      return { status: 'upcoming', label: 'Upcoming' };
    } else if (isPast(end)) {
      return { status: 'expired', label: 'Expired' };
    } else if (differenceInDays(end, new Date()) <= 14) {
      return { status: 'expiring', label: 'Expiring Soon' };
    } else {
      return { status: 'active', label: 'Active' };
    }
  };

  const getStatusBadge = (startDate: string, endDate: string) => {
    const { status, label } = getSubscriptionStatus(startDate, endDate);
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">{label}</Badge>;
      case 'expiring':
        return <Badge className="bg-yellow-100 text-yellow-800">{label}</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">{label}</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">{label}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
      <Sidebar />
      
      <main className="flex-1 p-6 md:ml-64">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 mr-2 text-primary-500" />
            <h1 className="text-2xl font-semibold text-neutral-800">Subscriptions</h1>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button asChild>
              <Link href="/subscriptions/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Subscription
              </Link>
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Search subscriptions..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-neutral-500" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b last:border-b-0">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              ))
            ) : filteredSubscriptions?.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900">No subscriptions found</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Try adjusting your search or add a new subscription.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/subscriptions/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Subscription
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredSubscriptions?.map((subscription) => (
                  <div key={subscription.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-start">
                      <div className="bg-primary-50 p-2 rounded-full">
                        <CreditCard className="h-5 w-5 text-primary-500" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-medium">
                            {subscription.productName || `Product ID: ${subscription.productId}`}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 capitalize">
                            {subscription.subscriptionType}
                          </span>
                          {getStatusBadge(subscription.startDate, subscription.endDate)}
                          {subscription.autoRenew && (
                            <Badge variant="outline" className="bg-neutral-50">Auto-renew</Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                          {subscription.clientName || `Client ID: ${subscription.clientId}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 flex flex-col items-end">
                      <p className="font-medium">{formatCurrency(subscription.price)}</p>
                      <div className="flex items-center text-sm text-neutral-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}</span>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/subscriptions/${subscription.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
