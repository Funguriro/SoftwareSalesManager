import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { 
  PlusCircle, 
  Search, 
  Key, 
  ChevronRight, 
  Filter, 
  Clock, 
  AlertTriangle,
  Copy
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface License {
  id: number;
  subscriptionId: number;
  clientName?: string;
  productName?: string;
  licenseKey: string;
  status: 'active' | 'expired' | 'pending' | 'revoked';
  activationDate: string;
  expirationDate: string;
  lastChecked?: string;
}

export default function Licenses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  
  const { data: licenses, isLoading } = useQuery<License[]>({
    queryKey: ["/api/licenses"],
  });

  const filteredLicenses = licenses?.filter(license => {
    const matchesSearch = 
      license.licenseKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (license.clientName && license.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (license.productName && license.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" || 
      license.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const days = differenceInDays(new Date(expirationDate), new Date());
    return days;
  };

  const getStatusBadge = (status: string, expirationDate: string) => {
    const daysUntilExpiration = getDaysUntilExpiration(expirationDate);

    if (status === 'active' && daysUntilExpiration <= 14 && daysUntilExpiration > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
    }

    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      case 'revoked':
        return <Badge className="bg-gray-100 text-gray-800">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "License key copied",
        description: "The license key has been copied to your clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Could not copy the license key to clipboard.",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
      <Sidebar />
      
      <main className="flex-1 p-6 md:ml-64">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            <Key className="h-6 w-6 mr-2 text-primary-500" />
            <h1 className="text-2xl font-semibold text-neutral-800">Licenses</h1>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button asChild>
              <Link href="/licenses/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Generate License
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
                  placeholder="Search licenses..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-neutral-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Licenses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
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
                    <Skeleton className="h-4 w-60" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              ))
            ) : filteredLicenses?.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900">No licenses found</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Try adjusting your search or generate a new license.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/licenses/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Generate License
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredLicenses?.map((license) => {
                  const daysUntilExpiration = getDaysUntilExpiration(license.expirationDate);
                  const isExpiringSoon = license.status === 'active' && daysUntilExpiration <= 14 && daysUntilExpiration > 0;
                  
                  return (
                    <div key={license.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full ${
                          license.status === 'active' 
                            ? isExpiringSoon ? 'bg-yellow-50' : 'bg-green-50'
                            : license.status === 'expired' ? 'bg-red-50' : 'bg-blue-50'
                        }`}>
                          {license.status === 'active' && isExpiringSoon ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <Key className={`h-5 w-5 ${
                              license.status === 'active' ? 'text-green-500' : 
                              license.status === 'expired' ? 'text-red-500' : 'text-blue-500'
                            }`} />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="font-medium font-mono">{license.licenseKey}</h3>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="ml-1 h-6 w-6" 
                              onClick={() => copyToClipboard(license.licenseKey)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            {getStatusBadge(license.status, license.expirationDate)}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-neutral-500 mt-1 space-y-1 sm:space-y-0 sm:space-x-3">
                            <span>{license.clientName || `Subscription ID: ${license.subscriptionId}`}</span>
                            {license.productName && <span>Product: {license.productName}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-0 flex flex-col items-end">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-neutral-500" />
                          <p className={`text-sm ${
                            isExpiringSoon ? 'text-yellow-600' : 
                            license.status === 'expired' ? 'text-red-500' : 'text-neutral-600'
                          }`}>
                            {license.status === 'active' ? (
                              daysUntilExpiration <= 0 
                                ? 'Expired' 
                                : `Expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}`
                            ) : license.status === 'expired' ? (
                              'Expired'
                            ) : (
                              formatDate(license.expirationDate)
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-0">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/licenses/${license.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
