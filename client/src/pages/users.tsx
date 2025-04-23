import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { 
  PlusCircle, 
  Search, 
  UserCog, 
  ChevronRight, 
  Filter, 
  Mail, 
  Shield, 
  Clock,
  MoreHorizontal,
  Pencil,
  Lock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'sales' | 'support' | 'client';
  createdAt: string;
  lastLogin?: string;
}

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const { toast } = useToast();
  
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = 
      roleFilter === "all" || 
      user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Mutations
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { userId: number; password: string }) => {
      return apiRequest("POST", `/api/users/${data.userId}/reset-password`, { password: data.password });
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "The user's password has been reset successfully.",
      });
      setIsResetPasswordOpen(false);
      setPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast({
        title: "Failed to reset password",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const toggleUserActivationMutation = useMutation({
    mutationFn: async (data: { userId: number; active: boolean }) => {
      return apiRequest("PATCH", `/api/users/${data.userId}`, { isActive: data.active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User updated",
        description: "The user's status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update user",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleResetPassword = () => {
    if (!selectedUser) return;
    
    if (password !== confirmPassword) {
      setPasswordsMatch(false);
      return;
    }
    
    resetPasswordMutation.mutate({
      userId: selectedUser.id,
      password,
    });
  };

  const handleToggleActivation = (user: User, active: boolean) => {
    toggleUserActivationMutation.mutate({
      userId: user.id,
      active,
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case 'sales':
        return <Badge className="bg-blue-100 text-blue-800">Sales</Badge>;
      case 'support':
        return <Badge className="bg-green-100 text-green-800">Support</Badge>;
      case 'client':
        return <Badge className="bg-neutral-100 text-neutral-600">Client</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
      <Sidebar />
      
      <main className="flex-1 p-6 md:ml-64">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            <UserCog className="h-6 w-6 mr-2 text-primary-500" />
            <h1 className="text-2xl font-semibold text-neutral-800">User Management</h1>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button asChild>
              <Link href="/users/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create User
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
                  placeholder="Search users..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-neutral-500" />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Administrators</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="client">Clients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            ) : filteredUsers?.length === 0 ? (
              <div className="text-center py-8">
                <UserCog className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900">No users found</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Try adjusting your search or create a new user.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/users/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create User
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers?.map((user) => (
                  <div key={user.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center">
                      <UserAvatar user={user} />
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="font-medium">{user.fullName}</h3>
                          {getRoleBadge(user.role)}
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">{user.username}</p>
                      </div>
                    </div>
                    <div className="mt-3 md:mt-0 md:ml-4 flex-1 md:flex md:flex-row md:items-center md:justify-end space-y-1 md:space-y-0 md:space-x-4">
                      <span className="text-sm text-neutral-500 flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-neutral-400" />
                        {user.email}
                      </span>
                      {user.lastLogin && (
                        <span className="text-sm text-neutral-500 flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-neutral-400" />
                          Last login: {formatDate(user.lastLogin)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 md:mt-0 flex">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/users/${user.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit User
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setIsResetPasswordOpen(true);
                            }}
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActivation(user, false)}
                            className="text-red-600"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Deactivate User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/users/${user.id}`}>
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

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordsMatch(true);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordsMatch(true);
                }}
                className={!passwordsMatch ? "border-red-500" : ""}
              />
              {!passwordsMatch && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={!password || !confirmPassword || password !== confirmPassword || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
