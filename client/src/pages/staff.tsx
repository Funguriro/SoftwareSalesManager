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
  ScrollText, 
  ChevronRight, 
  Mail, 
  Phone, 
  Calendar, 
  BadgeCheck 
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
import { UserAvatar } from "@/components/ui/user-avatar";
import { format } from "date-fns";

interface Staff {
  id: number;
  userId: number;
  user?: {
    fullName: string;
    email: string;
    phone: string;
    username: string;
  };
  department: string;
  position: string;
  hireDate: string;
  isActive: boolean;
  ticketCount?: number;
}

export default function Staff() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  
  const { data: staffMembers, isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const filteredStaff = staffMembers?.filter(staff => {
    const matchesSearch = 
      (staff.user?.fullName && staff.user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      staff.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.user?.email && staff.user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDepartment = 
      departmentFilter === "all" || 
      staff.department.toLowerCase() === departmentFilter.toLowerCase();
    
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments for filter
  const departments = staffMembers 
    ? Array.from(new Set(staffMembers.map(staff => staff.department)))
    : [];

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
      <Sidebar />
      
      <main className="flex-1 p-6 md:ml-64">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            <ScrollText className="h-6 w-6 mr-2 text-primary-500" />
            <h1 className="text-2xl font-semibold text-neutral-800">Support Staff</h1>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button asChild>
              <Link href="/users/new?role=support">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Staff Member
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
                  placeholder="Search staff..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {departments.length > 0 && (
                <div className="flex items-center">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept.toLowerCase()}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b last:border-b-0">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              ))
            ) : filteredStaff?.length === 0 ? (
              <div className="text-center py-8">
                <ScrollText className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900">No staff members found</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Try adjusting your search or add a new staff member.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/users/new?role=support">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredStaff?.map((staff) => (
                  <div key={staff.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center">
                      <UserAvatar user={staff.user || { fullName: 'Unknown' }} />
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="font-medium">{staff.user?.fullName || 'Unknown'}</h3>
                          {!staff.isActive && (
                            <Badge variant="outline" className="ml-2">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                          {staff.position} • {staff.department}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 md:mt-0 md:ml-4 flex-1 md:flex md:flex-row md:items-center md:justify-end space-y-1 md:space-y-0 md:space-x-4">
                      {staff.user?.email && (
                        <span className="text-sm text-neutral-500 flex items-center">
                          <Mail className="h-4 w-4 mr-1 text-neutral-400" />
                          <a href={`mailto:${staff.user.email}`} className="hover:text-primary-500">
                            {staff.user.email}
                          </a>
                        </span>
                      )}
                      {staff.user?.phone && (
                        <span className="text-sm text-neutral-500 flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-neutral-400" />
                          {staff.user.phone}
                        </span>
                      )}
                      <span className="text-sm text-neutral-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-neutral-400" />
                        Since {formatDate(staff.hireDate)}
                      </span>
                      {staff.ticketCount !== undefined && (
                        <Badge className="bg-primary-100 text-primary-800">
                          {staff.ticketCount} Tickets
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 md:mt-0">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/staff/${staff.id}`}>
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
