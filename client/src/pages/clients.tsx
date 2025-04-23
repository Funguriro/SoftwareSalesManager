import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { PlusCircle, Search, Users, ChevronRight, Building, Phone, MapPin } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  id: number;
  companyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phoneNumber: string;
  website: string;
  userId: number;
}

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const filteredClients = clients?.filter(client => 
    client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
      <Sidebar />
      
      <main className="flex-1 p-6 md:ml-64">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 mr-2 text-primary-500" />
            <h1 className="text-2xl font-semibold text-neutral-800">Clients</h1>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button asChild>
              <Link href="/clients/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Client
              </Link>
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search clients..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              ))
            ) : filteredClients?.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-neutral-900">No clients found</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Try adjusting your search or add a new client.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/clients/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Client
                  </Link>
                </Button>
              </div>
            ) : (
              filteredClients?.map((client) => (
                <div 
                  key={client.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-4">
                    <UserAvatar user={{ fullName: client.companyName }} />
                    <div>
                      <h3 className="text-base font-medium text-neutral-900">{client.companyName}</h3>
                      <div className="flex flex-wrap gap-x-4 mt-1">
                        {client.phoneNumber && (
                          <span className="text-sm text-neutral-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {client.phoneNumber}
                          </span>
                        )}
                        {(client.city || client.state || client.country) && (
                          <span className="text-sm text-neutral-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {[client.city, client.state, client.country].filter(Boolean).join(", ")}
                          </span>
                        )}
                        {client.website && (
                          <span className="text-sm text-neutral-500 flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            <a href={client.website.startsWith('http') ? client.website : `http://${client.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-500 hover:underline"
                            >
                              Website
                            </a>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link href={`/clients/${client.id}`} className="mt-2 sm:mt-0">
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
