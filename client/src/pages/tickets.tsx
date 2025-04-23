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
  Headset, 
  ChevronRight, 
  Filter, 
  User,
  MessageSquare
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
import { format, formatDistanceToNow } from "date-fns";

interface Ticket {
  id: number;
  clientId: number;
  clientName?: string;
  title: string;
  description: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: number;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Tickets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.clientName && ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" || 
      ticket.status === statusFilter;
    
    const matchesPriority = 
      priorityFilter === "all" || 
      ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      case 'medium':
        return <Badge className="bg-neutral-100 text-neutral-600">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-neutral-100 text-neutral-600">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
      <Sidebar />
      
      <main className="flex-1 p-6 md:ml-64">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            <Headset className="h-6 w-6 mr-2 text-primary-500" />
            <h1 className="text-2xl font-semibold text-neutral-800">Support Tickets</h1>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button asChild>
              <Link href="/tickets/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Ticket
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
                  placeholder="Search tickets..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-neutral-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-neutral-500" />
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
            ) : filteredTickets?.length === 0 ? (
              <div className="text-center py-8">
                <Headset className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900">No tickets found</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Try adjusting your search or create a new support ticket.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/tickets/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTickets?.map((ticket) => (
                  <div key={ticket.id} className="py-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full ${
                          ticket.status === 'new' ? 'bg-blue-50' : 
                          ticket.status === 'in_progress' ? 'bg-yellow-50' :
                          ticket.status === 'resolved' ? 'bg-green-50' : 'bg-neutral-50'
                        }`}>
                          <MessageSquare className={`h-5 w-5 ${
                            ticket.status === 'new' ? 'text-blue-500' : 
                            ticket.status === 'in_progress' ? 'text-yellow-500' :
                            ticket.status === 'resolved' ? 'text-green-500' : 'text-neutral-500'
                          }`} />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center flex-wrap gap-2">
                            <h3 className="font-medium">#{ticket.id} - {ticket.title}</h3>
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                            {ticket.description}
                          </p>
                          <div className="flex flex-wrap gap-x-4 mt-2">
                            <span className="text-xs text-neutral-500">
                              {ticket.clientName || `Client ID: ${ticket.clientId}`}
                            </span>
                            <span className="text-xs text-neutral-500 flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {ticket.assignedToName || "Unassigned"}
                            </span>
                            <span className="text-xs text-neutral-500">
                              Created {formatDate(ticket.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 md:mt-0">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/tickets/${ticket.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
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
