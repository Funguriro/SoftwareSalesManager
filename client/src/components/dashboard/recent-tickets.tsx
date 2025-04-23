import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ChevronRight, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Ticket {
  id: number;
  title: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedToName: string;
  createdAgo: string;
  description: string;
}

interface RecentTicketsProps {
  tickets: Ticket[];
}

export function RecentTickets({ tickets }: RecentTicketsProps) {
  const getPriorityBadge = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-neutral-100 text-neutral-600">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-neutral-100 text-neutral-600">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-error-100 text-error-600">High</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-error-100 text-error-600">Critical</Badge>;
    }
  };

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-primary-100 text-primary-600">New</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning-100 text-warning-600">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-success-100 text-success-600">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-neutral-100 text-neutral-600">Closed</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Recent Support Tickets</CardTitle>
        <Link href="/tickets" className="text-sm text-primary-500 hover:text-primary-600 flex items-center">
          <span>View All</span>
          <ChevronRight size={16} className="ml-1" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <p className="text-sm text-neutral-500 py-6 text-center">No tickets found</p>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="border-b border-neutral-200 pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">#{ticket.id} - {ticket.title}</span>
                      <span className="ml-2">{getPriorityBadge(ticket.priority)}</span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">
                      {ticket.description.length > 60 
                        ? `${ticket.description.substring(0, 60)}...` 
                        : ticket.description}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {formatDistanceToNow(new Date(ticket.createdAgo), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center mt-2">
                  {getStatusBadge(ticket.status)}
                  <span className="flex items-center ml-4 text-xs text-neutral-500">
                    <User size={12} className="mr-1" />
                    {ticket.assignedToName}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
