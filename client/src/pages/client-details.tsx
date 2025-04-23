import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Building, Mail, Phone, MapPin, Globe, ArrowLeft, PlusCircle } from "lucide-react";

interface Client {
  id: number;
  userId: number;
  companyName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  website: string;
  notes: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  phone: string;
}

interface Subscription {
  id: number;
  clientId: number;
  productId: number;
  subscriptionType: string;
  startDate: string;
  endDate: string;
  price: number;
  autoRenew: boolean;
  productName?: string;
}

interface License {
  id: number;
  subscriptionId: number;
  licenseKey: string;
  status: string;
  activationDate: string;
  expirationDate: string;
}

interface Invoice {
  id: number;
  clientId: number;
  invoiceNumber: string;
  amount: number;
  tax: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  isPaid: boolean;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const parsedId = id ? parseInt(id) : NaN;
  const clientId = !isNaN(parsedId) ? parsedId : 0;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch client details
  const { data: client, isLoading: isClientLoading, error: clientError } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: clientId > 0,
    staleTime: 0, // Force refresh
  });

  // Fetch user associated with client
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: [`/api/users/${client?.userId}`],
    enabled: !!client?.userId,
  });

  // Fetch client's subscriptions
  const { data: subscriptions, isLoading: isSubscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: [`/api/subscriptions?clientId=${clientId}`],
    enabled: !!clientId,
  });

  // Fetch client's licenses
  const { data: licenses, isLoading: isLicensesLoading } = useQuery<License[]>({
    queryKey: [`/api/licenses?clientId=${clientId}`],
    enabled: !!clientId,
  });

  // Fetch client's invoices
  const { data: invoices, isLoading: isInvoicesLoading } = useQuery<Invoice[]>({
    queryKey: [`/api/invoices?clientId=${clientId}`],
    enabled: !!clientId,
  });

  // Fetch client's tickets
  const { data: tickets, isLoading: isTicketsLoading } = useQuery<Ticket[]>({
    queryKey: [`/api/tickets?clientId=${clientId}`],
    enabled: !!clientId,
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'revoked':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  // Get ticket priority badge class
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get ticket status badge class
  const getTicketStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isClientLoading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
        <Sidebar />
        <main className="flex-1 p-6 md:ml-64">
          <div className="flex items-center mb-6">
            <Link href="/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Button>
            </Link>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Handle invalid client ID (NaN or 0)
  if (isNaN(parsedId) || clientId === 0) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
        <Sidebar />
        <main className="flex-1 p-6 md:ml-64">
          <div className="flex items-center mb-6">
            <Link href="/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-2xl font-semibold mb-2">Invalid Client ID</h2>
              <p className="text-neutral-500 mb-6">
                The client ID is invalid. Please return to the clients list and select a valid client.
              </p>
              <Button asChild>
                <Link href="/clients">Return to Clients</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Handle API errors
  if (clientError) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
        <Sidebar />
        <main className="flex-1 p-6 md:ml-64">
          <div className="flex items-center mb-6">
            <Link href="/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-2xl font-semibold mb-2">Error Loading Client</h2>
              <p className="text-neutral-500 mb-6">
                {clientError instanceof Error ? clientError.message : "An unknown error occurred while loading client data."}
              </p>
              <Button asChild>
                <Link href="/clients">Return to Clients</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Client data not found
  if (!client) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
        <Sidebar />
        <main className="flex-1 p-6 md:ml-64">
          <div className="flex items-center mb-6">
            <Link href="/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-2xl font-semibold mb-2">Client Not Found</h2>
              <p className="text-neutral-500 mb-6">The client you're looking for doesn't exist or you don't have permission to view it.</p>
              <Button asChild>
                <Link href="/clients">Return to Clients</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
      <Sidebar />
      <main className="flex-1 p-6 md:ml-64">
        <div className="flex items-center mb-6">
          <Link href="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center">
            <UserAvatar user={{ fullName: client.companyName }} size="lg" />
            <div className="ml-4">
              <h1 className="text-2xl font-semibold">{client.companyName}</h1>
              <div className="flex items-center text-neutral-500 mt-1">
                <Building className="h-4 w-4 mr-1" />
                <span>Client ID: {client.id}</span>
              </div>
            </div>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link href={`/clients/${client.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="licenses">Licenses</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Company Name</h3>
                      <p className="mt-1">{client.companyName}</p>
                    </div>
                    {client.website && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Website</h3>
                        <p className="mt-1 flex items-center">
                          <Globe className="h-4 w-4 mr-1 text-neutral-400" />
                          <a 
                            href={client.website.startsWith('http') ? client.website : `http://${client.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {client.website}
                          </a>
                        </p>
                      </div>
                    )}
                    {client.phoneNumber && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Phone Number</h3>
                        <p className="mt-1 flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-neutral-400" />
                          {client.phoneNumber}
                        </p>
                      </div>
                    )}
                    {(client.address || client.city || client.state || client.postalCode || client.country) && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Address</h3>
                        <p className="mt-1 flex items-start">
                          <MapPin className="h-4 w-4 mr-1 text-neutral-400 mt-1" />
                          <span>
                            {client.address && <>{client.address}<br /></>}
                            {client.city && client.city}{client.city && client.state && ', '}{client.state} {client.postalCode}<br />
                            {client.country}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  {client.notes && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Notes</h3>
                      <p className="text-neutral-700 whitespace-pre-line">{client.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Account Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {isUserLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : user ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Full Name</h3>
                        <p className="mt-1">{user.fullName}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Email</h3>
                        <p className="mt-1 flex items-center">
                          <Mail className="h-4 w-4 mr-1 text-neutral-400" />
                          <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                            {user.email}
                          </a>
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Phone</h3>
                        <p className="mt-1 flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-neutral-400" />
                          {user.phone || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Username</h3>
                        <p className="mt-1">{user.username}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-neutral-500">No account information available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Subscriptions</h3>
                    <p className="text-3xl font-semibold mt-2">{isSubscriptionsLoading ? '...' : subscriptions?.length || 0}</p>
                    <Button asChild className="mt-4" variant="outline">
                      <Link href={`/subscriptions?clientId=${clientId}`}>View All</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Active Licenses</h3>
                    <p className="text-3xl font-semibold mt-2">
                      {isLicensesLoading ? '...' : licenses?.filter(l => l.status === 'active').length || 0}
                    </p>
                    <Button asChild className="mt-4" variant="outline">
                      <Link href={`/licenses?clientId=${clientId}`}>View All</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Open Tickets</h3>
                    <p className="text-3xl font-semibold mt-2">
                      {isTicketsLoading ? '...' : tickets?.filter(t => t.status === 'new' || t.status === 'in_progress').length || 0}
                    </p>
                    <Button asChild className="mt-4" variant="outline">
                      <Link href={`/tickets?clientId=${clientId}`}>View All</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Subscriptions</CardTitle>
                <Button asChild>
                  <Link href={`/subscriptions/new?clientId=${clientId}`}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Subscription
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isSubscriptionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="border rounded-md p-4">
                        <Skeleton className="h-5 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-1/4 mb-1" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : subscriptions?.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-neutral-900">No Subscriptions</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      This client doesn't have any subscriptions yet.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href={`/subscriptions/new?clientId=${clientId}`}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Subscription
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions?.map((subscription) => (
                      <div key={subscription.id} className="border rounded-md p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div>
                            <h3 className="font-medium">{subscription.productName || 'Unknown Product'}</h3>
                            <p className="text-sm text-neutral-500 mt-1 capitalize">
                              {subscription.subscriptionType} Subscription
                            </p>
                            <div className="flex flex-wrap gap-x-4 mt-2 text-sm">
                              <span>From: {formatDate(subscription.startDate)}</span>
                              <span>To: {formatDate(subscription.endDate)}</span>
                              <span>Price: {formatCurrency(subscription.price)}</span>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 flex space-x-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/subscriptions/${subscription.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Licenses Tab */}
          <TabsContent value="licenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Licenses</CardTitle>
                <Button asChild>
                  <Link href={`/licenses/new?clientId=${clientId}`}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add License
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLicensesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="border rounded-md p-4">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-1" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : licenses?.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-neutral-900">No Licenses</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      This client doesn't have any licenses yet.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href={`/licenses/new?clientId=${clientId}`}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add License
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {licenses?.map((license) => (
                      <div key={license.id} className="border rounded-md p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium font-mono">{license.licenseKey}</h3>
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(license.status)}`}>
                                {license.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 mt-2 text-sm">
                              <span>Activated: {formatDate(license.activationDate)}</span>
                              <span>Expires: {formatDate(license.expirationDate)}</span>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 flex space-x-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/licenses/${license.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Invoices</CardTitle>
                <Button asChild>
                  <Link href={`/invoices/new?clientId=${clientId}`}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isInvoicesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="border rounded-md p-4">
                        <Skeleton className="h-5 w-1/4 mb-2" />
                        <Skeleton className="h-4 w-1/3 mb-1" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : invoices?.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-neutral-900">No Invoices</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      This client doesn't have any invoices yet.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href={`/invoices/new?clientId=${clientId}`}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Invoice
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices?.map((invoice) => (
                      <div key={invoice.id} className="border rounded-md p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{invoice.invoiceNumber}</h3>
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${invoice.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {invoice.isPaid ? 'Paid' : 'Unpaid'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 mt-2 text-sm">
                              <span>Amount: {formatCurrency(invoice.totalAmount)}</span>
                              <span>Issued: {formatDate(invoice.issueDate)}</span>
                              <span>Due: {formatDate(invoice.dueDate)}</span>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 flex space-x-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/invoices/${invoice.id}`}>View Invoice</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Support Tickets</CardTitle>
                <Button asChild>
                  <Link href={`/tickets/new?clientId=${clientId}`}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isTicketsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="border rounded-md p-4">
                        <Skeleton className="h-5 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : tickets?.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-neutral-900">No Support Tickets</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      This client doesn't have any support tickets yet.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href={`/tickets/new?clientId=${clientId}`}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Ticket
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets?.map((ticket) => (
                      <div key={ticket.id} className="border rounded-md p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div>
                            <div className="flex items-center flex-wrap gap-2">
                              <h3 className="font-medium">#{ticket.id} - {ticket.title}</h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getTicketStatusBadgeClass(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityBadgeClass(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500 mt-2">
                              {ticket.description.length > 100 
                                ? `${ticket.description.substring(0, 100)}...` 
                                : ticket.description}
                            </p>
                            <p className="text-xs text-neutral-400 mt-1">
                              Created: {formatDate(ticket.createdAt)}
                            </p>
                          </div>
                          <div className="mt-4 md:mt-0 flex space-x-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/tickets/${ticket.id}`}>View Ticket</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
