import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { PlusCircle, Search, Receipt, ChevronRight, FileText, Download, Filter } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Invoice {
  id: number;
  clientId: number;
  clientName?: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  isPaid: boolean;
}

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.clientName && invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "paid" && invoice.isPaid) || 
      (statusFilter === "unpaid" && !invoice.isPaid);
    
    return matchesSearch && matchesStatus;
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

  const isPastDue = (dueDate: string, isPaid: boolean) => {
    return !isPaid && new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
      <Sidebar />
      
      <main className="flex-1 p-6 md:ml-64">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 mr-2 text-primary-500" />
            <h1 className="text-2xl font-semibold text-neutral-800">Invoices</h1>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button asChild>
              <Link href="/invoices/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Invoice
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
                  placeholder="Search invoices..."
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
                    <SelectItem value="all">All Invoices</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
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
            ) : filteredInvoices?.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900">No invoices found</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Try adjusting your search or create a new invoice.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/invoices/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredInvoices?.map((invoice) => (
                  <div key={invoice.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-start">
                      <div className="bg-primary-50 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary-500" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="font-medium">{invoice.invoiceNumber}</h3>
                          {isPastDue(invoice.dueDate, invoice.isPaid) ? (
                            <Badge variant="destructive" className="ml-2">Past Due</Badge>
                          ) : invoice.isPaid ? (
                            <Badge className="bg-green-100 text-green-800 ml-2">Paid</Badge>
                          ) : (
                            <Badge variant="outline" className="ml-2">Unpaid</Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                          {invoice.clientName || `Client ID: ${invoice.clientId}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 flex flex-col items-end">
                      <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
                      <p className="text-xs text-neutral-500">
                        {isPastDue(invoice.dueDate, invoice.isPaid) ? (
                          <span className="text-red-500">Due {formatDate(invoice.dueDate)}</span>
                        ) : (
                          <span>Due {formatDate(invoice.dueDate)}</span>
                        )}
                      </p>
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center space-x-2">
                      <Button variant="outline" size="icon" asChild>
                        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/invoices/${invoice.id}`}>
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
